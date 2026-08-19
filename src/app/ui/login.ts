import type { SigmaService } from '../../domain/service.js';
import { escapeHtml as e } from './html.js';

// The pre-login landing screen. Deliberately rendered outside the normal app shell (no sidebar/nav) so
// it reads as a real account gate, matching the reference screenshots this was modelled on — but the
// copy stays honest about what it actually is: selecting a name, not authenticating against anything.
export function renderLogin(service: SigmaService, createFormOpen: boolean, error?: string): string {
  const accounts = service.snapshot().profiles.filter((profile) => profile.profileType === 'independent');
  const options = accounts.map((profile) => `<option value="${profile.id}">${e(profile.displayName)}</option>`).join('');
  const picker = accounts.length
    ? `<form id="login-form" class="stacked-form"><label>Account<select name="profileId" id="login-account-select">${options}<option value="__admin__">Admin (test mode — sees and edits every account)</option></select></label><button type="submit" class="primary">Log in</button></form>`
    : '<p class="metadata">No accounts exist on this device yet. Create the first one below.</p>';
  const createForm = `<form id="login-create-form" class="stacked-form"><label>Display name<input name="displayName" required autofocus></label><button type="submit" class="primary">Create account</button>${accounts.length ? '<button type="button" class="quiet" id="login-cancel-create">Cancel</button>' : ''}</form>`;
  return `<div class="login-screen"><div class="login-card"><div class="brand"><div class="brand-mark" aria-hidden="true">Σ</div><div><p>Sigma</p><span>Private measurement vault</span></div></div><h1>${accounts.length ? 'Welcome back' : 'Get started'}</h1><p class="metadata">Choose an account on this device, or create a new one. This is local only: there is no password, and anyone with this device can select any account listed here.</p><div class="app-notice ${error?'error':''}" aria-live="polite" role="${error?'alert':'status'}">${e(error??'')}</div>${accounts.length && !createFormOpen ? picker : createForm}${accounts.length && !createFormOpen ? '<button type="button" class="quiet" id="login-open-create">Create a new account</button>' : ''}</div></div>`;
}
