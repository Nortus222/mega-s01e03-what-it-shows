import { describe, expect, it } from 'vitest';
import reports from '../support-kb/src/lib/data/reports-4471.json';
import notes from '../support-kb/src/lib/data/desk-notes.json';
import { causeOf, groupByCause, uniqueById, type Report } from '../support-kb/src/lib/kb/causes';
import { tenantOf } from '../support-kb/src/lib/kb/locales';
import { investigate } from '../support-kb/src/lib/kb/investigation';

const raw = reports as Report[];

describe('export evidence', () => {
  it('counts overlapping export pages only once per report ID', () => {
    expect(raw).toHaveLength(427);
    const unique = uniqueById(raw);
    expect(unique).toHaveLength(412);
    expect(uniqueById([...unique, unique[0], unique[0]])).toHaveLength(412);
    expect(raw.length - unique.length).toBe(15);
  });

  it('uses tenant locale and channel despite misleading intake metadata', () => {
    const report = raw.find((r) => r.id === 'R-41205')!;
    expect(report.meta).toEqual({ browserLocale: 'en-US', intakeTag: 'hint' });
    expect(tenantOf(report)?.locale).toBe('fr-FR');
    expect(causeOf(report, tenantOf(report))).toBe('parser');
  });

  it('separates booking-v3 form hints from the same tenant app reports', () => {
    const tenant = tenantOf({ tenant: 'alder.physio' })!;
    expect(causeOf({ channel: 'form' }, tenant)).toBe('hint');
    expect(causeOf({ channel: 'app' }, tenant)).toBe('parser');
    expect(causeOf({ channel: 'form' }, { ...tenant, form: 'booking-v2' })).toBe('parser');
    expect(causeOf({ channel: 'form' }, { ...tenant, locale: 'en-US' })).toBeNull();
    expect(causeOf({ channel: 'email' }, undefined)).toBeNull();
  });

  it('preserves the original tenant model and tag disagreement', () => {
    const groups = groupByCause(uniqueById(raw), tenantOf);
    expect(groups.map((g) => [g.cause, g.reports.length, g.taggedAs])).toEqual([
      ['parser', 379, { parser: 356, hint: 23 }],
      ['hint', 33, { parser: 15, hint: 18 }],
    ]);
  });
});

describe('provisional investigation split', () => {
  it('keeps the desk-noted timing reports unresolved instead of proving parser by tenant', () => {
    const result = investigate(raw, tenantOf, notes.oneDayMove, 4471);
    expect(result.groups.map((g) => [g.cause, g.reports.length])).toEqual([
      ['parser', 374], ['hint', 33], ['unresolved-timing', 5],
    ]);
    const timing = result.groups.find((g) => g.cause === 'unresolved-timing')!;
    expect(timing.reports.map((r) => r.id).sort()).toEqual([
      'R-41202', 'R-41209', 'R-41236', 'R-41344', 'R-41620',
    ]);
    expect(timing.reports.every((r) => causeOf(r, tenantOf(r)) === 'parser')).toBe(true);
    expect(result.rawRows).toBe(427);
    expect(result.uniqueReports).toBe(412);
    expect(result.overlaps).toBe(15);
    expect(result.hintTenants).toEqual({ 'alder.physio': 12, 'copper.studio': 11, 'pale.harbour': 10 });
  });

  it('retains unknown tenants and filters other tickets without losing timing exceptions', () => {
    const unknown = { ...raw[0], id: 'unknown', tenant: 'unknown.sender' };
    const other = { ...raw[1], id: 'other-ticket', mergedInto: 9999 };
    const result = investigate([unknown, other, raw[0], raw[0]], tenantOf, [raw[0].id], 4471);
    expect(result.rawRows).toBe(3);
    expect(result.uniqueReports).toBe(2);
    expect(result.overlaps).toBe(1);
    expect(result.groups.map((g) => [g.cause, g.reports.map((r) => r.id)])).toEqual([
      ['unresolved-timing', [raw[0].id]], ['unplaced', ['unknown']],
    ]);
  });
});
