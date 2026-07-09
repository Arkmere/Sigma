# Design System

Sigma should feel like an upmarket private healthcare clinic translated into software: minimal, precise, restrained and quiet.

## Tokens
Implemented in `src/styles.css` as semantic CSS custom properties: background (`--bg`, `--bg-subtle`), surfaces (`--surface`, `--surface-elevated`), text (`--text`, `--text-muted`), accent (`--accent`, `--accent-strong`), border, focus, success, error, shadow, radii and spacing.

Light theme uses off-white surfaces, charcoal text and muted teal accents. Dark theme uses deep charcoal surfaces, warm light text and softened teal. Components consume semantic tokens rather than raw colours.

## Patterns
- Page heading: small uppercase kicker, large precise title, concise descriptive copy.
- Card: rounded surface, fine border, subtle shadow and generous spacing.
- Empty state: truthful purpose statement, no lorem ipsum, no fake functionality, no manipulative upsell.
- Navigation: person-first primary destinations: Profiles, Measurements & Sizes, Family, Privacy, Settings. Desktop uses a side rail; phone view uses bottom navigation.

## Interaction and accessibility
Visible focus states, semantic buttons/inputs, keyboard-operable navigation, touch-friendly controls, contrast-aware themes, no information conveyed only by colour, and reduced-motion respect for transitions. Hover/pressed states are restrained; disabled/error/success states should use semantic tokens when later forms arrive.
