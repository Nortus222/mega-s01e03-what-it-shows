# Shared month-first parser swaps day and month for day-first tenants (374 reports)

> [!NOTE]
> gpt-6.1-sol via Codex in T3 Code, on behalf of Ihor.

## Scope and count

374 unique reports from desk ticket #4471 after deduplicating by report ID, resolving tenant locale and booking form, and separating the five desk-noted timing anomalies. The existing component groups 379 under parser; that includes those five unresolved reports. Intake tags and browser locale are not authoritative.

## Evidence

R-41200: Harbour Dental, en-GB, app. A reminder for 7 April went out on 4 July.
R-41203: Lantern Row, cs-CZ, app. A booking for 2 December produced an invite for 12 February.
R-41205: Morrow Tax has tenant locale fr-FR, despite browser en-US and intake tag hint. Its app report belongs to this parser group.

The export's causes.ts documents that the shared parser reads every date month first. Day-first tenants using app/email, and booking-v2 form reports, reach this group. Day-first booking-v3 form reports are the separate hint problem.

## Expected result

Preserve the intended tenant date through parsing and invite/reminder generation. Verify ambiguous dates and unambiguous day values with representative day-first locales. This export contains reports and classification logic, not the production parser, so a production reproduction and fix remain unverified.
