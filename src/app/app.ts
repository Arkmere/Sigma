import { pages, navigationItems, type PageContent, type RouteId } from './content.js';
import {
  readThemePreference,
  resolveTheme,
  type ThemePreference,
  writeThemePreference,
} from '../lib/preferences.js';

function prefersDark(): boolean {
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

export function mountApp(root: HTMLElement): void {
  let route: RouteId = 'profiles';
  let themePreference = readThemePreference();

  const render = () => {
    const resolvedTheme = resolveTheme(themePreference, prefersDark());

    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themePreference = themePreference;
    writeThemePreference(themePreference);

    root.innerHTML = renderShell(route, themePreference, resolvedTheme);

    root.querySelectorAll<HTMLButtonElement>('[data-route]').forEach((button) => {
      button.addEventListener('click', () => {
        route = button.dataset.route as RouteId;
        render();
      });
    });

    root.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => {
      input.addEventListener('change', () => {
        themePreference = input.value as ThemePreference;
        render();
      });
    });
  };

  render();
}

function renderShell(
  route: RouteId,
  themePreference: ThemePreference,
  resolvedTheme: 'light' | 'dark',
): string {
  return `<div class="app-shell">
    <aside class="sidebar" aria-label="Primary">
      <div class="brand">
        <div class="brand-mark" aria-hidden="true">Σ</div>
        <div>
          <p>Sigma</p>
          <span>Private measurement vault</span>
        </div>
      </div>
      <nav>
        <ul>${navigationItems.map((item) => renderNavigationItem(item, route)).join('')}</ul>
      </nav>
      <div class="sidebar-note">
        <strong>Local-first shell</strong>
        <span>No account, cloud, analytics, telemetry or runtime permissions.</span>
      </div>
    </aside>
    <main class="content" tabindex="-1">
      ${route === 'settings' ? renderSettings(themePreference, resolvedTheme) : renderPage(pages[route])}
    </main>
  </div>`;
}

function renderNavigationItem(
  item: (typeof navigationItems)[number],
  activeRoute: RouteId,
): string {
  const isActive = item.id === activeRoute;
  const current = isActive ? 'aria-current="page"' : '';

  return `<li>
    <button data-route="${item.id}" class="${isActive ? 'active' : ''}" ${current}>
      <span aria-hidden="true">${item.icon}</span>
      <span class="nav-label">${item.label}</span>
      <span class="nav-short">${item.shortLabel}</span>
    </button>
  </li>`;
}

function renderPage(page: PageContent): string {
  const bullets = page.bullets.length > 0
    ? `<ul>${page.bullets.map((bullet) => `<li>${bullet}</li>`).join('')}</ul>`
    : '';

  return `<header class="page-header">
    <p class="kicker">${page.kicker}</p>
    <h1>${page.title}</h1>
    <p>${page.description}</p>
  </header>
  <section class="empty-state" aria-labelledby="${page.eyebrow}-title">
    <p class="eyebrow">${page.eyebrow}</p>
    <h2 id="${page.eyebrow}-title">${page.emptyTitle}</h2>
    <div class="empty-copy"><p>${page.body}</p></div>
    ${bullets}
  </section>`;
}

function renderSettings(pref: ThemePreference, resolvedTheme: 'light' | 'dark'): string {
  const options: ThemePreference[] = ['system', 'light', 'dark'];
  const controls = options.map((option) => {
    const checked = pref === option ? 'checked' : '';
    const label = option[0].toUpperCase() + option.slice(1);

    return `<label>
      <input type="radio" name="theme" value="${option}" ${checked} />
      <span>${label}</span>
    </label>`;
  }).join('');

  return `<header class="page-header">
    <p class="kicker">Local preferences</p>
    <h1>Settings</h1>
    <p>Shell-level preferences stored locally on this device, without an account or cloud service.</p>
  </header>
  <section class="settings-card" aria-labelledby="theme-heading">
    <div>
      <p class="eyebrow">Appearance</p>
      <h2 id="theme-heading">Theme preference</h2>
      <p>Choose light, dark or system. The preference is saved locally in this browser for the demo shell.</p>
    </div>
    <fieldset class="theme-options">
      <legend class="sr-only">Theme preference</legend>
      ${controls}
    </fieldset>
    <p class="metadata">Resolved theme: ${resolvedTheme}. Build: Ticket 1 shell.</p>
  </section>`;
}
