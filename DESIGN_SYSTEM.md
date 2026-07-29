# Design System

Sigma should feel like a precise private utility: restrained, quiet and operational before promotional.

## Tokens
Implemented in `src/styles.css` as semantic CSS custom properties: background (`--bg`, `--bg-subtle`), surfaces (`--surface`, `--surface-elevated`), text (`--text`, `--text-muted`), accent (`--accent`, `--accent-strong`), border, focus, success, error, shadow, radii and spacing.

Light theme uses off-white surfaces, charcoal text and muted teal accents. Dark theme uses deep charcoal surfaces, warm light text and softened teal. Components consume semantic tokens rather than raw colours.

## Patterns
- Page heading: small uppercase kicker, compact title and one concise line of orientation.
- Card: rounded surface, fine border, subtle shadow and dense, scannable spacing.
- Empty state: truthful purpose statement, no lorem ipsum, no fake functionality, no manipulative upsell.
- Navigation: person-first primary destinations: Profiles, Measurements & Sizes, Family, Privacy, Settings. Desktop uses a side rail; phone view uses bottom navigation.
- Context bar: one adaptive strip for viewed profile, same-device acting adult and editable/read-only state; selectors appear only when a real choice exists.
- Form panel: record entry opens deliberately and can be cancelled without hiding retrieval.
- Notice: typed feedback appears in an `aria-live` region and never relies on colour alone.
- Status and metadata: concise wording distinguishes live/demo/future, current/history, recorded/converted and editable/read-only.
- Record hierarchy: default cards show the fact, date and at most one useful conversion. History, all conversions, source and editing live behind disclosures. Correction is labelled in text and retained in history.
- Family hierarchy: overview first, then one focused operational stage at a time.

## Interaction and accessibility
Visible focus states, semantic buttons/inputs, keyboard-operable navigation, touch-friendly controls, contrast-aware themes, no information conveyed only by colour, and reduced-motion respect for transitions. Hover/pressed states are restrained; disabled/error/success states should use semantic tokens when later forms arrive.

At narrow widths, forms and source grids collapse to one column, record types use one select, context controls wrap, long provenance breaks safely, and all six destinations remain available above the device safe area. At intermediate widths the bottom navigation starts at 820 px to avoid a compressed rail/content combination.
