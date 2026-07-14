# Architecture

## Stack selection

Sigma uses a TypeScript static application. TypeScript provides explicit boundaries without introducing a framework dependency before the product model exists. The app builds to static browser assets that can be served locally and later wrapped by Capacitor or another native shell for phone deployment.

TypeScript is a project-local development dependency pinned in `package-lock.json`; the npm workflow does not rely on a globally installed `tsc`.

Alternatives considered: React Native/Expo offers stronger native deployment but adds mobile build complexity before the data model exists; React/Vite remains a reasonable later choice when the product requires richer component composition; Next.js would add server concepts Sigma does not need for a local-first demo.

## Layers and structure

- `src/app/content.ts`: route identifiers, navigation metadata and page copy for the Ticket 1 shell.
- `src/app/app.ts`: shell rendering, route event binding and settings/theme controls.
- `src/lib/preferences.ts`: framework-neutral local preference utilities.
- `src/styles.css`: semantic design tokens, responsive layout and component styles.
- `scripts/build.mjs`: cross-platform static asset preparation after TypeScript compilation.
- `scripts/dev.mjs`: cross-platform build-then-serve development command.
- `test`: Node test files for deterministic utilities, DOM-like shell interaction and source-level guardrails.

## State and routing

Ticket 1 uses a small TypeScript shell controller for route selection. No URL router is introduced yet because the demo has five top-level destinations and no nested data routes. A router can be added when records require deep links.

The shell was split into content metadata and rendering code during Ticket 1A. This is a small maintainability improvement that avoids one monolithic controller without prematurely creating a large framework-style folder hierarchy.

## Local persistence direction

Theme preference is stored locally in `localStorage` through `src/lib/preferences.ts`. This is shell configuration only, not the canonical measurement database. Ticket 2 should introduce a deliberate local persistence layer, likely IndexedDB via a typed adapter, with structured export capability.

## Theme architecture

The app stores a user preference of `system`, `light` or `dark`, resolves it against `prefers-color-scheme`, and applies `data-theme` to the document. CSS semantic tokens implement the visual system.

## Build and development architecture

`npm run build` runs local TypeScript compilation and then executes `scripts/build.mjs`, which uses Node built-in filesystem APIs to create `dist/`, copy static assets and write production `index.html`. It does not use Unix `cp`, Bash or Python.

`npm run dev` executes `scripts/dev.mjs`. The script builds first, then serves the freshly generated `dist/` directory with Node's built-in HTTP module. It does not currently watch files.

## Testing architecture

Node built-in tests cover deterministic theme utilities and DOM-like application shell interaction. The behavioural shell tests mount the compiled app against a lightweight test DOM harness, navigate to every primary destination, exercise theme controls and verify local preference persistence. A supplementary source-contract test checks that the shell still contains required destinations and guardrail text.

## Linting status

No lint command exists after Ticket 1A because the previous command was misleading: it duplicated type checking. A real linter should be added later before documenting `npm run lint` again.

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
5. Build: local `tsc` plus Node build script. Reason: reproducible and cross-platform. Trade-off: no bundling/minification yet.
6. Development: build-then-serve Node dev script. Reason: works from a clean checkout. Trade-off: no watch mode yet.
7. Testing: Node built-in test runner with a lightweight DOM harness. Reason: no browser dependency while still testing behaviour. Trade-off: not a full browser or native-device test.
8. Linting: remove misleading lint script. Reason: `npm run lint` must mean real linting. Trade-off: linting remains a known limitation until a real linter is added.
