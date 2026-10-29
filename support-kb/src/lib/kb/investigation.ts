import { causeOf, groupByCause, uniqueById, type Cause, type Report, type Tenant } from './causes';

export type InvestigationCause = Cause | 'unresolved-timing' | 'unplaced';

// Separate desk-noted anomalies without changing the export's tenant-based model.
export function investigate(
  reports: Report[],
  tenantOf: (report: Report) => Tenant | undefined,
  timingIds: readonly string[],
  ticket: number,
) {
  const raw = reports.filter((report) => report.mergedInto === ticket);
  const unique = uniqueById(raw);
  const timing = new Set(timingIds);
  const byCause = new Map<InvestigationCause, Report[]>();
  for (const report of unique) {
    const cause = timing.has(report.id) ? 'unresolved-timing' : causeOf(report, tenantOf(report)) ?? 'unplaced';
    const group = byCause.get(cause) ?? [];
    group.push(report);
    byCause.set(cause, group);
  }
  const order: InvestigationCause[] = ['parser', 'hint', 'unresolved-timing', 'unplaced'];
  const groups = order.flatMap((cause) => {
    const reports = byCause.get(cause);
    return reports ? [{ cause, reports }] : [];
  });
  const hints = byCause.get('hint') ?? [];
  const hintTenants = Object.fromEntries(
    [...new Set(hints.map((r) => r.tenant))].sort()
      .map((tenant) => [tenant, hints.filter((r) => r.tenant === tenant).length]),
  );
  return {
    rawRows: raw.length,
    uniqueReports: unique.length,
    overlaps: raw.length - unique.length,
    original: groupByCause(unique, tenantOf),
    groups,
    hintTenants,
  };
}
