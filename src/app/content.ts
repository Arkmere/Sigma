export type RouteId = 'profiles' | 'measurements' | 'family' | 'sources' | 'privacy' | 'settings';

export const navigationItems: ReadonlyArray<{
  id: RouteId;
  label: string;
  shortLabel: string;
  icon: string;
}> = [
  { id: 'profiles', label: 'Profiles', shortLabel: 'Profiles', icon: '◌' },
  { id: 'measurements', label: 'Measurements & Sizes', shortLabel: 'Records', icon: '⌁' },
  { id: 'family', label: 'Family', shortLabel: 'Family', icon: '⌂' },
  { id: 'sources', label: 'Sources', shortLabel: 'Sources', icon: '⊕' },
  { id: 'privacy', label: 'Privacy', shortLabel: 'Privacy', icon: '◇' },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: '⚙' },
];
