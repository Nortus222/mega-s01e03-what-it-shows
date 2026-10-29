# booking-v3 prints a month-first hint for day-first tenants (33 reports)

> [!NOTE]
> gpt-6.1-sol via Codex in T3 Code, on behalf of Ihor.

## Reported outcome

The [course desk update](https://hq.mega.dev/challenges/what-it-shows) dated 5 October 2026 reports
#4471 closed and hint WON'T FIX because the booking-v3 form was retired. This is desk-reported
production status, not our production test. The hint ticket is not planned; the hint was not fixed.
The evidence below preserves the 4 October snapshot.

## Scope and count

33 unique reports merged into desk ticket #4471: form submissions for booking-v3 tenants Alder Physio (12), Copper Studio (11), and Pale Harbour (10). Their configured locales are de-DE, es-ES, and pt-PT. All are day first.

## Evidence

causes.ts declares booking-v3's date hint as MM/DD/YYYY but documents that this form interprets dates according to tenant locale. Users following the hint enter month first, then the form reads day first.

R-41230: Copper Studio form, browser en-GB, intake tag parser. Its tenant runs booking-v3, so the runtime classifies it as hint.
R-41241: Alder Physio form. Two people arrived on 8 June rather than 6 August.

15 of these reports were tagged parser and 18 hint. Browser/intake guesses therefore miss this distinct cause.

## Original expected result

Make the date hint match the tenant format used by the form. Verify day-first booking-v3 form submissions separately from the shared parser fix. This was the requested correction before the desk reported the form's retirement. No production form is included in this export, and we have not independently tested the retirement.
