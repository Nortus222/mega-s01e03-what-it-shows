#!/usr/bin/env python3
"""Stop gate. Private state: {"indexUrl": "...", "baseline": {"name": {"sha256": "..."}}}.

Index: {"files": [{"name": "guide.md", "url": "...", "bytes": 123}]} (bytes optional).
Only --acknowledge replaces baseline. Session guards never acknowledge evidence.
Sources must share indexUrl's origin. Redirects are refused. Private downloads,
curl request/reply traces, and guard state live in source-checks/.
An empty hook reply after a guard allows stopping; lastCheck still records unverified
or changed evidence. This example must be trusted before installing as a root hook.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
import time
from urllib.parse import urljoin, urlsplit


def save(path, value):
    temporary = path.with_suffix(".tmp")
    temporary.write_text(json.dumps(value, indent=2) + "\n")
    temporary.chmod(0o600)
    temporary.replace(path)


def fetch(url, destination, deadline):
    if urlsplit(url).scheme not in {"http", "https"}:
        raise ValueError("unsupported source URL")
    remaining = deadline - time.monotonic()
    if remaining <= 0:
        raise TimeoutError("source check timed out")
    with Path(str(destination) + ".stderr").open("wb") as errors:
        reply = subprocess.run(["curl", "--silent", "--show-error", "--fail",
                        "--proto", "=http,https", "--write-out", "%{http_code}",
                        "--connect-timeout", "3", "--max-time", str(min(10, remaining)),
                        "--trace", str(destination) + ".trace",
                        "--output", str(destination), "--url", url],
                       stdout=subprocess.PIPE, stderr=errors, check=True,
                       timeout=remaining + 1)
    if not reply.stdout.startswith(b"2"):
        raise ValueError("source redirect refused")
    return destination.read_bytes()


def refresh(state, folder):
    deadline = time.monotonic() + 35
    index_url = state["indexUrl"]
    index = json.loads(fetch(index_url, folder / "index.json", deadline))
    if not isinstance(index["files"], list) or not index["files"]:
        raise ValueError("empty source index")
    current = {}
    for number, item in enumerate(index["files"]):
        name = item["name"]
        if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._ /-]{0,199}", name):
            raise ValueError("invalid source name")
        if ".." in name.split("/") or name in current:
            raise ValueError("duplicate or unsafe source name")
        source_url = urljoin(index_url, item["url"])
        if urlsplit(source_url)[:2] != urlsplit(index_url)[:2]:
            raise ValueError("source outside archive origin")
        body = fetch(source_url, folder / (str(number) + "-" + Path(name).name), deadline)
        current[name] = {"sha256": hashlib.sha256(body).hexdigest()}
    return current


def main():
    os.umask(0o077)
    state_path = Path(os.environ.get("STOCK5_EVIDENCE_STATE", str(
        Path(__file__).resolve().parents[2] / ".superpowers/s02e01/private/evidence-state.json")))
    checks = state_path.parent / "source-checks"
    checks.mkdir(parents=True, exist_ok=True, mode=0o700)
    guard_path = checks / "guards.json"
    try:
        guards = json.loads(guard_path.read_text())
    except (OSError, ValueError):
        guards = {}
    try:
        hook = json.loads(sys.stdin.read() or "{}")
    except ValueError:
        hook = {}
    session = str(hook.get("session_id") or "unknown")
    guard = guards.setdefault(session, {"blocks": 0, "seen": [], "errorBlocked": False})
    folder = Path(tempfile.mkdtemp(prefix="check-", dir=checks))
    state = None
    status, reason, signature = "unverified", "Source freshness unverified; check private source-checks logs.", "error"
    try:
        state = json.loads(state_path.read_text())
        current = refresh(state, folder)
        baseline = state.get("baseline")
        if "--acknowledge" in sys.argv:
            state["baseline"] = current
            status, reason = "acknowledged", ""
        elif baseline is None:
            status, reason = "unacknowledged", "Source baseline missing; reconcile evidence, then run --acknowledge."
        else:
            changed = sorted(name for name in current.keys() | baseline.keys() if current.get(name) != baseline.get(name))
            status, reason = ("changed", "Sources changed: " + ", ".join(changed)) if changed else ("fresh", "")
        signature = hashlib.sha256(json.dumps(current, sort_keys=True).encode()).hexdigest()
    except Exception as error:
        # Exception text and curl traces may include credentials; keep them private.
        (folder / "failure.txt").write_text(type(error).__name__ + ": " + str(error))
    result = {}
    repeated = signature in guard["seen"] and hook.get("stop_hook_active") is True
    if reason and guard["blocks"] < 3 and not repeated and not (status == "unverified" and guard["errorBlocked"]):
        result = {"decision": "block", "reason": reason}
        guard["blocks"] += 1
        guard["seen"].append(signature)
        guard["errorBlocked"] |= status == "unverified"
    last_check = {"status": status, "blocked": bool(result), "logs": str(folder)}
    guards[session] = guard
    save(guard_path, guards)
    save(folder / "result.json", last_check)
    if isinstance(state, dict):
        state["lastCheck"] = last_check
        save(state_path, state)
    print(json.dumps(result))


if __name__ == "__main__":
    main()
