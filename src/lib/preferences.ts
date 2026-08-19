export type ThemePreference = 'system' | 'light' | 'dark';
export type AnatomyFamilyPreference = 'neutral' | 'masculine' | 'feminine';

const THEME_KEY = 'sigma.themePreference';
export const ANATOMY_FAMILY_KEY = 'sigma.anatomyFamily';
// Whether the last session was logged in as the local testing-only Admin identity. Kept entirely
// separate from SigmaData/activeActorProfileId (which must always resolve to a real, schema-validated
// profile) so admin mode can never be mistaken for stored account data or leak into a backup export.
const ADMIN_MODE_KEY = 'sigma.adminMode';

export function readAdminModePreference(): boolean {
  return globalThis.localStorage?.getItem(ADMIN_MODE_KEY) === 'true';
}

export function writeAdminModePreference(value: boolean): void {
  if (value) globalThis.localStorage?.setItem(ADMIN_MODE_KEY, 'true');
  else globalThis.localStorage?.removeItem(ADMIN_MODE_KEY);
}

export function readThemePreference(): ThemePreference {
  const value = globalThis.localStorage?.getItem(THEME_KEY);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function writeThemePreference(value: ThemePreference): void {
  globalThis.localStorage?.setItem(THEME_KEY, value);
}

export function readAnatomyFamilyPreference(storage: Pick<Storage, 'getItem'> | undefined = globalThis.localStorage): AnatomyFamilyPreference {
  const value = storage?.getItem(ANATOMY_FAMILY_KEY);
  return value === 'masculine' || value === 'feminine' || value === 'neutral' ? value : 'neutral';
}

export function writeAnatomyFamilyPreference(value: AnatomyFamilyPreference, storage: Pick<Storage, 'setItem'> | undefined = globalThis.localStorage): void {
  storage?.setItem(ANATOMY_FAMILY_KEY, value);
}

export function resolveTheme(
  preference: ThemePreference,
  prefersDark: boolean,
): 'light' | 'dark' {
  return preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
}
