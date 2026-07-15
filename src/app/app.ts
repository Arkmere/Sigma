import { type RouteId } from './content.js';
import { LocalStorageRepository } from '../data/repository.js';
import { SigmaService } from '../domain/service.js';
import { readThemePreference, resolveTheme, type ThemePreference, writeThemePreference } from '../lib/preferences.js';
import { addHistory, downloadBackup, saveProfile, saveRecord } from './ui/actions.js';
import { field } from './ui/html.js';
import { renderProfiles } from './ui/profiles.js';
import { renderRecords, type RecordMode } from './ui/records.js';
import { renderShell } from './ui/shell.js';
import { renderFamily, renderPrivacy, renderSettings } from './ui/status.js';
import { unitsForDimension, type Dimension } from '../conversion/registry.js';

export function mountApp(root: HTMLElement, service = new SigmaService(new LocalStorageRepository(globalThis.localStorage))): void {
  let route: RouteId = 'profiles'; let theme = readThemePreference(); let mode: RecordMode = 'measurement'; let search = ''; let category = ''; let editingProfileId = '';
  const render = () => {
    const resolved = resolveTheme(theme, globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false);
    document.documentElement.dataset.theme = resolved; document.documentElement.dataset.themePreference = theme; writeThemePreference(theme);
    const content = route === 'profiles' ? renderProfiles(service, editingProfileId) : route === 'measurements' ? renderRecords(service, mode, search, category) : route === 'privacy' ? renderPrivacy(service) : route === 'settings' ? renderSettings(service, theme, resolved) : renderFamily();
    root.innerHTML = renderShell(route, service, content);
    bind(root, '[data-route]', 'click', (element) => { route = element.dataset.route as RouteId; render(); });
    bind(root, '[data-select-profile]', 'click', (element) => { service.selectProfile(element.dataset.selectProfile!); route = 'measurements'; render(); });
    bind(root, '[data-edit-profile]', 'click', (element) => { editingProfileId = element.dataset.editProfile!; render(); });
    bind(root, '[data-record-mode]', 'click', (element) => { mode = element.dataset.recordMode as RecordMode; render(); });
    root.querySelectorAll<HTMLInputElement>('input[name="theme"]').forEach((input) => input.addEventListener('change', () => { theme = input.value as ThemePreference; render(); }));
    onForm(root, '#profile-form', (form) => { saveProfile(service, new FormData(form), editingProfileId); editingProfileId = ''; render(); });
    onForm(root, '#record-form', (form) => { saveRecord(service, mode, new FormData(form)); render(); });
    forms(root, '[data-history-form]', (form, data) => addHistory(service, form.dataset.historyForm!, data), render);
    forms(root, '[data-edit-measurement-form]', (form, data) => service.updateMeasurement(form.dataset.editMeasurementForm!, { label: field(data, 'label'), measurementType: field(data, 'measurementType'), category: field(data, 'category') }), render);
    forms(root, '[data-edit-size-form]', (form, data) => service.updateStandardSize(form.dataset.editSizeForm!, { label: field(data, 'label'), category: field(data, 'category'), sizingSystem: field(data, 'sizingSystem'), sizeValue: field(data, 'sizeValue'), notes: field(data, 'notes') || undefined }), render);
    forms(root, '[data-edit-brand-form]', (form, data) => service.updateBrandFit(form.dataset.editBrandForm!, { category: field(data, 'category'), brand: field(data, 'brand'), productName: field(data, 'productName') || undefined, productLine: field(data, 'productLine') || undefined, sizingSystem: field(data, 'sizingSystem'), sizeValue: field(data, 'sizeValue'), fitNotes: field(data, 'fitNotes') || undefined }), render);
    root.querySelector<HTMLInputElement>('#record-search')?.addEventListener('input', (event) => { search = (event.currentTarget as HTMLInputElement).value; render(); });
    root.querySelector<HTMLSelectElement>('#category-filter')?.addEventListener('change', (event) => { category = (event.currentTarget as HTMLSelectElement).value; render(); });
    root.querySelector<HTMLSelectElement>('#measurement-type')?.addEventListener('change', (event) => { const option = (event.currentTarget as HTMLSelectElement).selectedOptions[0]; const unit = root.querySelector<HTMLSelectElement>('#measurement-unit'); if (unit) unit.innerHTML = unitChoices(option?.dataset.dimension as Dimension | undefined); });
    bind(root, '#export-data', 'click', () => downloadBackup(service));
    bind(root, '#reset-data', 'click', () => { if (globalThis.confirm('Delete all Sigma profiles and records stored in this browser?')) { service.reset(); route = 'profiles'; render(); } });
  };
  render();
}

function bind(root: HTMLElement, selector: string, event: string, action: (element: HTMLElement) => void): void { root.querySelectorAll<HTMLElement>(selector).forEach((element) => element.addEventListener(event, () => action(element))); }
function onForm(root: HTMLElement, selector: string, action: (form: HTMLFormElement) => void): void { root.querySelector<HTMLFormElement>(selector)?.addEventListener('submit', (event) => { event.preventDefault(); action(event.currentTarget as HTMLFormElement); }); }
function forms(root: HTMLElement, selector: string, action: (form: HTMLFormElement, data: FormData) => void, done: () => void): void { root.querySelectorAll<HTMLFormElement>(selector).forEach((form) => form.addEventListener('submit', (event) => { event.preventDefault(); action(form, new FormData(event.currentTarget as HTMLFormElement)); done(); })); }
function unitChoices(dimension?: Dimension): string { const choices = dimension ? unitsForDimension(dimension).map((unit) => `<option value="${unit.symbol}">${unit.symbol} · ${unit.label}</option>`).join('') : ''; return `${choices}<option value="custom">Custom recorded unit</option>`; }
