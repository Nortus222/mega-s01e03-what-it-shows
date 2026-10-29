# Investigate timing and one-day discrepancies hidden in #4471 (5 reports)

> [!NOTE]
> gpt-6.1-sol via Codex in T3 Code, on behalf of Ihor.

## Scope and count

5 unique reports listed in desk-notes.json under oneDayMove. Existing tenant-based logic assigns all five to parser, but their bodies do not establish day/month reversal. Keep them separate pending investigation; a timezone, DST, or delivery-order root cause is not proven by this export.

## Evidence

- R-41202, Kettle Books, email: invite says Tuesday 12 May; calendar says Monday 11 May.
- R-41209, Alder Physio, app: every June booking is one day off, reportedly only June.
- R-41236, Nine Lanterns, app: invite reportedly arrived before the booking was made. This needs event-order evidence and is weaker evidence of a one-day shift.
- R-41344, Pale Harbour, email: the same meeting showed Tuesday in Lisbon and Monday in Toronto.
- R-41620, Lantern Row, email: Tuesday 6 October showed as Monday.

## Next investigation

The [course desk update](https://hq.mega.dev/challenges/what-it-shows) dated 5 October 2026 reports
#4471 closed, the parser fixed and booking-v3 retired. It does not establish a cause or resolution
for these five timing reports, which remain provisional.

Collect original event timestamps, timezone/offset information, intended local dates, generated calendar payloads, and delivery logs. Separate this investigation further if those records reveal different causes. A parser or form-hint fix alone cannot yet be claimed to address these reports.
