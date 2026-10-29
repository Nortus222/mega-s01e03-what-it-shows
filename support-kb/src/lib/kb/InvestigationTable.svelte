<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { causeOf, type Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { investigate } from '#lib/kb/investigation';

  let { ticket }: { ticket: number } = $props();
  const analysis = $derived(investigate(reports as Report[], tenantOf, notes.oneDayMove, ticket));
  const timing = $derived(analysis.groups.find((group) => group.cause === 'unresolved-timing')?.reports ?? []);
  const tags = (reports: Report[]) => {
    const counts: Record<string, number> = {};
    for (const report of reports) counts[report.meta.intakeTag] = (counts[report.meta.intakeTag] ?? 0) + 1;
    return Object.entries(counts).sort().map(([tag, count]) => `${tag} ×${count}`).join(' · ');
  };
</script>

<p>
  <strong>{analysis.rawRows}</strong> raw rows for #{ticket},
  <strong>{analysis.uniqueReports}</strong> unique report IDs,
  <strong>{analysis.overlaps}</strong> overlapping rows removed.
  Each report ID counts once.
</p>

<h2>Original tenant model</h2>
<p>
  The exported classifier uses tenant locale, channel and booking form. It ignores report bodies.
  Its groups are model assignments, not independently verified production root causes.
</p>
<table aria-label="Original tenant model">
  <thead><tr><th>Model group</th><th>Reports</th><th>Intake tags</th></tr></thead>
  <tbody>
    {#each analysis.original as group (group.cause)}
      <tr><td>{group.cause}</td><td>{group.reports.length}</td><td>{tags(group.reports)}</td></tr>
    {/each}
  </tbody>
</table>

<h2>Investigation split</h2>
<p>
  Hold the {timing.length} desk-noted timing reports apart from the parser work.
  The remaining parser and hint groups follow the export's tenant/form model.
  This is a provisional investigation split, not proof that all remaining reports share a cause.
</p>
<table aria-label="Provisional investigation split">
  <thead><tr><th>Investigation group</th><th>Reports</th><th>Intake tags</th></tr></thead>
  <tbody>
    {#each analysis.groups as group (group.cause)}
      <tr><td>{group.cause}</td><td>{group.reports.length}</td><td>{tags(group.reports)}</td></tr>
    {/each}
  </tbody>
</table>

<h3>Booking form evidence</h3>
<p>
  Booking-v3 prints <code>MM/DD/YYYY</code>. For day-first tenants the exported model says
  the form reads dates in tenant order. App/email reports and booking-v2 forms take the parser path.
  Browser locale and intake tags cannot establish either cause.
</p>
<table aria-label="Hint group tenant evidence">
  <thead><tr><th>Tenant</th><th>Tenant locale</th><th>Form</th><th>Form reports</th></tr></thead>
  <tbody>
    {#each Object.entries(analysis.hintTenants) as [handle, count] (handle)}
      {@const tenant = tenantOf({ tenant: handle })}
      <tr><td>{handle}</td><td>{tenant?.locale}</td><td>{tenant?.form}</td><td>{count}</td></tr>
    {/each}
  </tbody>
</table>

<h3>Unresolved timing evidence</h3>
<p>
  These {timing.length} IDs come directly from <code>desk-notes.json</code>.
  Their bodies do not establish month/day reversal. No timezone, DST or delivery-order cause is proven.
  Collect intended local dates, original timestamps and offsets, calendar payloads and delivery logs.
  Split this investigation further if those records show different causes.
</p>
<div class="evidence">
  {#each timing as report (report.id)}
    {@const tenant = tenantOf(report)}
    <article>
      <h4>{report.id} · {report.tenant} · {report.channel}</h4>
      <p>Tenant {tenant?.locale}, {tenant?.form}; original model {causeOf(report, tenant)}.</p>
      <blockquote>{report.body}</blockquote>
    </article>
  {/each}
</div>

<style>
  .evidence article { border-left: 3px solid var(--warn); padding-left: 1rem; margin: 1.5rem 0; }
  h4 { margin-bottom: 0.25rem; }
  article p { font-size: 0.85rem; color: var(--muted); }
  blockquote { margin: 0.5rem 0; }
</style>
