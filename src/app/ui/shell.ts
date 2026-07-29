import { navigationItems, type RouteId } from '../content.js';
import type { SigmaService } from '../../domain/service.js';
import { escapeHtml as e } from './html.js';
export interface AppNotice { kind: 'success' | 'error' | 'info'; message: string }
export function renderShell(route: RouteId, service: SigmaService, content: string, notice?: AppNotice): string {
  const data = service.snapshot();
  const unsafe=['corrupt','unsupported_version'].includes(service.storageStatus().status);
  const viewed=service.activeVisibleProfile(), actor=service.activeActor(), access=viewed?service.profileAccess(viewed.id):'hidden';
  const visible=service.visibleProfiles(), adults=data.profiles.filter((profile)=>profile.profileType==='independent');
  const profileKind=viewed?.profileType==='managed'?`Managed ${viewed.managedKind??'dependant'}`:'Personal profile';
  const context=`<section class="context-bar" aria-label="Current context"><div class="context-summary"><strong>${viewed?e(viewed.displayName):'No profile selected'}</strong><span>${access==='read_only'?'Shared read-only':access==='editable'?`${profileKind} · Editable`:'No record access'}</span></div>${visible.length>1?`<label>Person<select id="context-profile-select">${visible.map(p=>`<option value="${p.id}"${p.id===viewed?.id?' selected':''}>${e(p.displayName)}</option>`).join('')}</select></label>`:''}${adults.length>1?`<label>Acting adult<select id="context-actor-select">${adults.map(p=>`<option value="${p.id}"${p.id===actor?.id?' selected':''}>${e(p.displayName)}</option>`).join('')}</select></label>`:access==='read_only'&&actor?`<span class="context-actor">Acting as ${e(actor.displayName)}</span>`:''}</section>`;
  return `<div class="app-shell"><aside class="sidebar" aria-label="Primary"><div class="brand"><div class="brand-mark" aria-hidden="true">Σ</div><div><p>Sigma</p><span>Private measurement vault</span></div></div><nav><ul>${navigationItems.map((item) => `<li><button data-route="${item.id}" class="${route === item.id ? 'active' : ''}" ${route === item.id ? 'aria-current="page"' : ''}><span aria-hidden="true">${item.icon}</span><span class="nav-label">${item.label}</span><span class="nav-short">${item.shortLabel}</span></button></li>`).join('')}</ul></nav><div class="sidebar-note"><strong>${data.profiles.length} local profile${data.profiles.length === 1 ? '' : 's'}</strong><span>No account, cloud, analytics, telemetry or runtime permissions.</span></div></aside><main class="content" tabindex="-1">${renderStorageWarning(service)}${unsafe?'':`${context}<div class="app-notice ${notice?.kind??''}" aria-live="polite" role="${notice?.kind==='error'?'alert':'status'}">${notice?.message??''}</div>${content}`}</main></div>`;
}
export function renderStorageWarning(service: SigmaService): string {
  const status = service.storageStatus();
  if (status.status !== 'corrupt' && status.status !== 'unsupported_version') return '';
  const detail = status.status === 'corrupt' ? 'The stored value is corrupt or does not match a supported Sigma schema.' : `The stored value uses unsupported schema version ${String(status.version)}.`;
  return `<section class="data-warning" role="alert"><p class="eyebrow">Local data safety warning</p><h2>Sigma found local data it could not read safely or interpret.</h2><p>${detail} The raw stored value remains untouched. Recovery and import are not implemented. Ordinary changes and backup export are unavailable.</p><p>Reset starts again and permanently destroys the unreadable stored value.</p><button id="reset-data" class="danger">Reset unreadable local data</button></section>`;
}
