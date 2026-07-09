# Architecture

## Stack selection
Sigma uses TypeScript static application. TypeScript provides explicit boundaries without introducing a framework dependency before the product model exists. The app builds to static browser assets that can be served locally and later wrapped by Capacitor or another native shell for phone deployment.

Alternatives considered: React Native/Expo offers stronger native deployment but adds mobile build complexity before the data model exists; React/Vite would be a reasonable later choice but package installation was unavailable in this environment; Next.js would add server concepts Sigma does not need for a local-first demo.

## Layers and structure
- `src/app`: shell controller, primary navigation, rendered destinations and reusable page/empty-state markup helpers.
- `src/lib`: framework-neutral utilities, currently local preferences.
- `src/styles.css`: semantic design tokens, responsive layout and component styles.
- `test`: Node test files for deterministic shell utilities and source-level shell contracts.

## State and routing
Ticket 1 uses a small TypeScript shell controller for route selection. No URL router is introduced yet because the demo has five top-level destinations and no nested data routes. A router can be added when records require deep links.

## Local persistence direction
Theme preference is stored locally in `localStorage` through `src/lib/preferences.ts`. This is shell configuration only, not the canonical measurement database. Ticket 2 should introduce a deliberate local persistence layer, likely IndexedDB via a typed adapter, with structured export capability.

## Theme architecture
The app stores a user preference of `system`, `light` or `dark`, resolves it against `prefers-color-scheme`, and applies `data-theme` to the document. CSS semantic tokens implement the visual system.

## Testing architecture
Node built-in tests cover deterministic shell utilities. TypeScript performs type checking; the lint command currently aliases type checking until a linter dependency is approved/available.

## Future seams
- Source adapters: health platforms, devices, camera and third-party sources must pass allowlisted measurement data into the future record engine.
- Permission service: future platform permissions must be mediated by a pre-permission explanation flow.
- Conversion engine: conversions must live outside UI components and preserve original recorded facts.
- Sharing/consent boundary: connections, grants, revocation and auditability must be independent of Family membership.
- Entitlements: future paid unlock state must not become a payment SDK dependency.

## Cloud and telemetry
No backend, hosted database, authentication provider, analytics, telemetry, advertising SDK or crash uploader is included.

## Decision log
1. Stack: TypeScript static application. Reason: fast, typed, local-first-friendly shell. Trade-off: phone deployment requires later wrapper/native work.
2. Navigation: five person-first top-level destinations. Reason: matches product constitution. Trade-off: no deep links yet.
3. Theme: CSS semantic tokens plus persisted preference. Reason: accessible light/dark system without a UI library. Trade-off: tokens are intentionally small.
4. Persistence: localStorage only for shell preferences. Reason: avoids accidental measurement schema. Trade-off: Ticket 2 must add the real database.
5. Testing: Node built-in test runner plus TypeScript checks. Reason: no runtime test dependency and enough coverage for deterministic shell utilities/source contracts. Trade-off: no jsdom browser interaction testing or native mobile testing in Ticket 1.
