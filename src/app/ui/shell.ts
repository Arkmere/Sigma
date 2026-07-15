import { navigationItems, type RouteId } from '../content.js';
import type { SigmaService } from '../../domain/service.js';
export function renderShell(route: RouteId, service: SigmaService, content: string): string {
  const data = service.snapshot();
  return `<div class="app-shell"><aside class="sidebar" aria-label="Primary"><div class="brand"><div class="brand-mark" aria-hidden="true">Σ</div><div><p>Sigma</p><span>Private measurement vault</span></div></div><nav><ul>${navigationItems.map((item) => `<li><button data-route="${item.id}" class="${route === item.id ? 'active' : ''}" ${route === item.id ? 'aria-current="page"' : ''}><span aria-hidden="true">${item.icon}</span><span class="nav-label">${item.label}</span><span class="nav-short">${item.shortLabel}</span></button></li>`).join('')}</ul></nav><div class="sidebar-note"><strong>${data.profiles.length} local profile${data.profiles.length === 1 ? '' : 's'}</strong><span>No account, cloud, analytics, telemetry or runtime permissions.</span></div></aside><main class="content" tabindex="-1">${renderStorageWarning(service)}${content}</main></div>`;
}
export function renderStorageWarning(service: SigmaService): string {
  const status = service.storageStatus();
  if (status.status !== 'corrupt' && status.status !== 'unsupported_version') return '';
  const detail = status.status === 'corrupt' ? 'The stored value is corrupt or does not match Sigma schema version 1.' : `The stored value uses unsupported schema version ${String(status.version)}.`;
  return `<section class="data-warning" role="alert"><p class="eyebrow">Local data safety warning</p><h2>Sigma found stored local data it could not read safely.</h2><p>${detail} It has not been deleted or overwritten. Export/import recovery is not implemented yet. Reset local data only if you decide to start again.</p><button id="reset-data" class="danger">Reset local data</button></section>`;
}
