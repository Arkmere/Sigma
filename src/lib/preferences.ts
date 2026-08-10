export type ThemePreference = 'system' | 'light' | 'dark';
export type AnatomyFamilyPreference = 'neutral' | 'masculine' | 'feminine';

const THEME_KEY = 'sigma.themePreference';
export const ANATOMY_FAMILY_KEY = 'sigma.anatomyFamily';

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
