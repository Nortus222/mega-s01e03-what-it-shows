"""Exercise the Stop gate against a local server; no course credentials required."""
import hashlib
import http.server
import json
import os
from pathlib import Path
import subprocess
import tempfile
import threading
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "check-sources.py"


class SourceGateTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.state_path = Path(self.tmp.name) / "private" / "evidence-state.json"
        self.state_path.parent.mkdir()
        self.sources = {"guide.md": b"accepted evidence\n"}
        self.broken = False
        self.malformed = False
        self.off_origin = False
        self.redirect = False
        self.requests = []
        test = self

        class Handler(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                test.requests.append(self.path)
                if test.broken:
                    self.send_error(503)
                    return
                if self.path == "/index?secret=private-token":
                    body = b"not JSON" if test.malformed else json.dumps({"files": [
                        {"name": name, "url": (test.base.replace("127.0.0.1", "localhost")
                         if test.off_origin else test.base) + "/" + name}
                        for name in test.sources
                    ]}).encode()
                else:
                    if test.redirect and self.headers.get("Host", "").startswith("127.0.0.1"):
                        self.send_response(302)
                        self.send_header("Location", test.base.replace("127.0.0.1", "localhost") + self.path)
                        self.end_headers()
                        return
                    body = test.sources.get(self.path.lstrip("/"))
                if body is None:
                    self.send_error(404)
                    return
                self.send_response(200)
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *args):
                pass

        self.server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.addCleanup(self.server.server_close)
        thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        thread.start()
        self.addCleanup(self.server.shutdown)
        self.base = "http://127.0.0.1:" + str(self.server.server_port)
        self.write_state({"indexUrl": self.base + "/index?secret=private-token",
                          "baseline": {"guide.md": {"sha256": hashlib.sha256(
                              self.sources["guide.md"]).hexdigest()}}})

    def write_state(self, state):
        self.state_path.write_text(json.dumps(state))

    def read_state(self):
        return json.loads(self.state_path.read_text())

    def run_gate(self, active=False, acknowledge=False, session="test-session"):
        self.assertTrue(SCRIPT.exists(), "The source-freshness gate is missing")
        result = subprocess.run(
            ["python3", str(SCRIPT)] + (["--acknowledge"] if acknowledge else []),
            input=json.dumps({"session_id": session, "stop_hook_active": active}),
            text=True, capture_output=True, timeout=10,
            env={**os.environ, "STOCK5_EVIDENCE_STATE": str(self.state_path)})
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "")
        self.assertNotIn("private-token", result.stdout)
        self.assertNotIn(self.base, result.stdout)
        return json.loads(result.stdout)

    def test_unchanged_sources_pass_and_preserve_private_downloads(self):
        self.assertEqual(self.run_gate(), {})
        checks = self.state_path.parent / "source-checks"
        files = [p for p in checks.rglob("*") if p.is_file()]
        self.assertTrue(any(p.read_bytes() == self.sources["guide.md"] for p in files))
        self.assertTrue(any("private-token" in p.read_text(errors="replace") for p in files))
        self.assertTrue(all(p.stat().st_mode & 0o077 == 0 for p in files))

    def test_changed_source_blocks_without_acknowledging(self):
        before = self.read_state()["baseline"]
        self.sources["guide.md"] = b"changed evidence"
        result = self.run_gate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("guide.md", result["reason"])
        self.assertEqual(self.read_state()["baseline"], before)

    def test_new_source_blocks(self):
        self.sources["new.md"] = b"new evidence"
        result = self.run_gate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("new.md", result["reason"])

    def test_identical_change_passes_only_on_hook_continuation(self):
        self.sources["guide.md"] = b"changed evidence"
        self.assertEqual(self.run_gate()["decision"], "block")
        self.assertEqual(self.run_gate()["decision"], "block")
        self.assertEqual(self.run_gate(active=True), {})
        self.assertEqual(self.run_gate(session="different")["decision"], "block")

    def test_each_session_blocks_at_most_three_times(self):
        for number in range(4):
            self.sources["guide.md"] = str(number).encode()
            result = self.run_gate(active=number > 0)
            if number < 3:
                self.assertEqual(result["decision"], "block")
            else:
                self.assertEqual(result, {})

    def test_explicit_acknowledge_updates_baseline(self):
        self.sources["guide.md"] = b"changed evidence"
        self.sources["new.md"] = b"new evidence"
        self.assertEqual(self.run_gate(acknowledge=True), {})
        self.assertEqual(set(self.read_state()["baseline"]), {"guide.md", "new.md"})
        self.assertEqual(self.run_gate(), {})

    def test_missing_baseline_requires_explicit_acknowledgement(self):
        state = self.read_state()
        del state["baseline"]
        self.write_state(state)
        result = self.run_gate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("--acknowledge", result["reason"])
        self.assertNotIn("baseline", self.read_state())

    def test_removed_source_blocks(self):
        self.sources = {"replacement.md": b"new evidence"}
        result = self.run_gate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("guide.md", result["reason"])

    def test_source_named_trace_does_not_overwrite_its_download(self):
        self.sources = {"guide.trace": b"evidence, not a curl trace"}
        self.run_gate(acknowledge=True)
        baseline = self.read_state()["baseline"]
        self.assertEqual(baseline["guide.trace"]["sha256"], hashlib.sha256(
            b"evidence, not a curl trace").hexdigest())

    def test_parse_error_cannot_acknowledge_and_blocks_once(self):
        before = self.read_state()["baseline"]
        self.malformed = True
        self.assertEqual(self.run_gate(acknowledge=True)["decision"], "block")
        self.assertEqual(self.run_gate(), {})
        self.assertEqual(self.read_state()["baseline"], before)
        self.assertEqual(self.read_state()["lastCheck"]["status"], "unverified")

    def test_off_origin_sources_are_rejected_before_download(self):
        self.off_origin = True
        self.assertEqual(self.run_gate().get("decision"), "block")
        self.assertEqual(self.requests, ["/index?secret=private-token"])
        self.assertEqual(self.read_state()["lastCheck"]["status"], "unverified")

    def test_redirect_cannot_leave_the_archive_origin(self):
        self.redirect = True
        before = self.read_state()["baseline"]
        self.assertEqual(self.run_gate().get("decision"), "block")
        self.assertEqual(self.requests, ["/index?secret=private-token", "/guide.md"])
        self.assertEqual(self.read_state()["baseline"], before)
        self.assertEqual(self.read_state()["lastCheck"]["status"], "unverified")

    def test_network_error_blocks_once_and_records_unverified_status(self):
        before = self.read_state()["baseline"]
        self.broken = True
        result = self.run_gate()
        self.assertEqual(result["decision"], "block")
        self.assertIn("unverified", result["reason"].lower())
        self.assertEqual(self.run_gate(active=True), {})
        state = self.read_state()
        self.assertEqual(state["baseline"], before)
        self.assertEqual(state["lastCheck"]["status"], "unverified")


if __name__ == "__main__":
    unittest.main()
