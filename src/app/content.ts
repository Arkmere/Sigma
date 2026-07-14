export type RouteId = 'profiles' | 'measurements' | 'family' | 'privacy' | 'settings';

export type PageContent = {
  kicker: string;
  title: string;
  description: string;
  eyebrow: string;
  emptyTitle: string;
  body: string;
  bullets: string[];
};

export const navigationItems: ReadonlyArray<{
  id: RouteId;
  label: string;
  shortLabel: string;
  icon: string;
}> = [
  { id: 'profiles', label: 'Profiles', shortLabel: 'Profiles', icon: '◌' },
  { id: 'measurements', label: 'Measurements & Sizes', shortLabel: 'Sizes', icon: '⌁' },
  { id: 'family', label: 'Family', shortLabel: 'Family', icon: '⌂' },
  { id: 'privacy', label: 'Privacy', shortLabel: 'Privacy', icon: '◇' },
  { id: 'settings', label: 'Settings', shortLabel: 'Settings', icon: '⚙' },
];

export const pages: Record<Exclude<RouteId, 'settings'>, PageContent> = {
  profiles: {
    kicker: 'Person first',
    title: 'Profiles',
    description: 'A future home for your own record, managed dependant records and connected independent adults.',
    eyebrow: 'Profiles',
    emptyTitle: 'Start with people, not accounts.',
    body: 'Sigma will treat individual, managed and connected profiles as first-class concepts. Ticket 1 does not create stored profiles yet, so there is no fake account setup or cloud sign-in.',
    bullets: [],
  },
  measurements: {
    kicker: 'Record keeping',
    title: 'Measurements & Sizes',
    description: 'The future catalogue for physical measurements, standard sizes, brand fit facts and history.',
    eyebrow: 'Measurements',
    emptyTitle: 'Keep the sizes you rarely need but never want to forget.',
    body: 'This shell deliberately stops before the measurement engine. It establishes the destination without pretending records already exist.',
    bullets: [
      'Physical measurements and standard sizes will arrive in Ticket 2.',
      'Recorded facts will remain distinct from converted display values.',
      'No recommendation logic is implemented or implied.',
    ],
  },
  family: {
    kicker: 'Explicit consent',
    title: 'Family',
    description: 'A future space for trusted groups, managed children and connected adults.',
    eyebrow: 'Family',
    emptyTitle: 'Connection will never mean automatic access.',
    body: 'Sigma is designed for personal and family use equally, but Ticket 1 does not simulate sharing or blanket visibility.',
    bullets: [
      'Future adult connections require mutual consent.',
      'Family membership must not reveal measurements by default.',
      'Managed child policy remains deliberately unresolved until later product work.',
    ],
  },
  privacy: {
    kicker: 'Ownership',
    title: 'Privacy',
    description: 'The future control room for visibility, consent, export, deletion and permission status.',
    eyebrow: 'Privacy',
    emptyTitle: 'Private by foundation, not by theatre.',
    body: 'This screen communicates the privacy model without claiming production security features that do not yet exist.',
    bullets: [
      'No telemetry, analytics or advertising trackers are present.',
      'No runtime permissions are requested by this shell.',
      'Export and deletion are product requirements for later data tickets.',
    ],
  },
};
