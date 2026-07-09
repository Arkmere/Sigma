export type ThemePreference = 'system' | 'light' | 'dark';
const THEME_KEY = 'sigma.themePreference';
export function readThemePreference(): ThemePreference { const value = globalThis.localStorage?.getItem(THEME_KEY); return value === 'light' || value === 'dark' || value === 'system' ? value : 'system'; }
export function writeThemePreference(value: ThemePreference) { globalThis.localStorage?.setItem(THEME_KEY, value); }
export function resolveTheme(preference: ThemePreference, prefersDark: boolean): 'light' | 'dark' { return preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference; }
