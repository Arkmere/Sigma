import type { SigmaService } from '../../domain/service.js';
import { currentMeasurementValue, type Profile } from '../../domain/model.js';
import { escapeHtml as e, unitSpan } from './html.js';

// The working home screen for whichever profile is currently active: quick actions, what was
// recorded most recently, and a category breakdown — no trend lines, deltas, or "vs last week"
// framing, since Sigma records change without judging it. Deliberately not a family-avatar strip:
// single-profile use should read as completely normal, so switching/managing profiles stays in the
// existing People list just below this, not baked into the dashboard itself.
export function renderDashboard(service: SigmaService, profile: Profile, access: 'editable' | 'read_only'): string {
  const records = service.authorisedRecords(profile.id);
  type Item = { label: string; display: string; category: string; when: string };
  const items: Item[] = [
    ...records.measurements.map((record) => {
      const current = currentMeasurementValue(record);
      return { label: record.label, category: record.category, when: current?.recordedAt ?? record.updatedAt, display: current ? `${e(String(current.originalValue))}${unitSpan(current.originalUnit)}` : 'No current value' };
    }),
    ...records.standardSizes.map((record) => ({ label: record.label, category: record.category, when: record.recordedAt, display: `${unitSpan(record.sizingSystem)} ${e(record.sizeValue)}` })),
    ...records.brandFits.map((record) => ({ label: `${record.brand}${record.productName ? ` · ${record.productName}` : ''}`, category: record.category, when: record.recordedAt, display: `${unitSpan(record.sizingSystem)} ${e(record.sizeValue)}` })),
  ];
  const recent = [...items].sort((a, b) => b.when.localeCompare(a.when)).slice(0, 5);
  const total = items.length;
  const categoryCounts = new Map<string, number>();
  for (const item of items) categoryCounts.set(item.category, (categoryCounts.get(item.category) ?? 0) + 1);
  const categories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);

  const editable = access === 'editable';
  const actions = editable
    ? `<button class="primary" data-dashboard-action="record">Record measurement</button><button class="secondary" data-dashboard-action="browse">Browse by body</button><button class="secondary" data-dashboard-action="sizes">Sizes</button><button class="secondary" data-dashboard-action="history">History</button>`
    : `<button class="secondary" data-dashboard-action="history">View records</button>`;

  const recentHtml = recent.length
    ? `<ul class="dashboard-list">${recent.map((item) => `<li><span>${e(item.label)}</span><strong>${item.display}</strong></li>`).join('')}</ul>`
    : '<p class="metadata">No records yet.</p>';

  const categoriesHtml = categories.length
    ? `<ul class="dashboard-list dashboard-categories">${categories.map(([category, count]) => `<li><span>${e(category)}</span><strong>${count}</strong></li>`).join('')}</ul>`
    : '';

  return `<section class="dashboard"><div class="dashboard-actions" role="group" aria-label="Quick actions">${actions}</div><div class="dashboard-grid"><section><h3>Recent</h3>${recentHtml}</section>${categories.length ? `<section><h3>Categories</h3>${categoriesHtml}</section>` : ''}</div>${total ? '' : '<p class="metadata">Nothing recorded yet — use Record measurement above to add the first one.</p>'}</section>`;
}
