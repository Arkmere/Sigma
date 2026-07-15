# Architecture

## Stack selection

Sigma uses a TypeScript static application. TypeScript provides explicit boundaries without introducing a framework dependency before the product model exists. The app builds to static browser assets that can be served locally and later wrapped by Capacitor or another native shell for phone deployment.

TypeScript is a project-local development dependency pinned in `package-lock.json`; the npm workflow does not rely on a globally installed `tsc`.

Alternatives considered: React Native/Expo offers stronger native deployment but adds mobile build complexity before the data model exists; React/Vite remains a reasonable later choice when the product requires richer component composition; Next.js would add server concepts Sigma does not need for a local-first demo.

## Layers and structure

- `src/app/content.ts`: route identifiers, navigation metadata and page copy for the Ticket 1 shell.
- `src/app/app.ts`: top-level route/theme state, render selection and event-binding orchestration.
- `src/app/ui`: focused shell, profile, record, status, form-action and shared HTML modules.
- `src/domain/model.ts`: canonical schema and current-measurement selection.
- `src/domain/service.ts`: profile, record, history, search and export operations.
- `src/domain/taxonomy.ts`: initial browse taxonomy.
- `src/data/repository.ts`: explicit load-status and versioned persistence boundary.
- `src/data/migrations.ts`: runtime schema validation, referential integrity and migration dispatch.
- `src/lib/preferences.ts`: framework-neutral local preference utilities.
- `src/styles.css`: semantic design tokens, responsive layout and component styles.
- `scripts/build.mjs`: cross-platform static asset preparation after TypeScript compilation.
- `scripts/dev.mjs`: cross-platform build-then-serve development command.
- `test`: Node test files for deterministic utilities, DOM-like shell interaction and source-level guardrails.

## State and routing

Ticket 1 uses a small TypeScript shell controller for route selection. No URL router is introduced yet because the demo has five top-level destinations and no nested data routes. A router can be added when records require deep links.

The shell was split into content metadata and rendering code during Ticket 1A. This is a small maintainability improvement that avoids one monolithic controller without prematurely creating a large framework-style folder hierarchy.

## Local persistence

Theme preference is stored separately through `src/lib/preferences.ts`. Canonical Ticket 2 data uses `LocalStorageRepository`, a typed versioned adapter over browser localStorage. Domain and UI code do not access the storage key directly. The service saves after each mutation and can export a complete versioned JSON snapshot.

Loads produce `empty`, `ok`, `corrupt`, or `unsupported_version`. Version 1 is runtime-validated before entering the domain, including profile references. Corrupt/unsupported raw storage is preserved; the service exposes the state and blocks mutations until explicit reset. `migrateStoredData` is the single boundary for future schema versions.

LocalStorage keeps the static foundation dependency-free and makes deterministic persistence tests straightforward. Its trade-offs are synchronous access, browser-specific capacity/retention and no Sigma-provided encryption. The repository interface allows a future IndexedDB adapter without changing domain operations.

## Theme architecture

The app stores a user preference of `system`, `light` or `dark`, resolves it against `prefers-color-scheme`, and applies `data-theme` to the document. CSS semantic tokens implement the visual system.

## Build and development architecture

`npm run build` runs local TypeScript compilation and then executes `scripts/build.mjs`, which uses Node built-in filesystem APIs to create `dist/`, copy static assets and write production `index.html`. It does not use Unix `cp`, Bash or Python.

`npm run dev` executes `scripts/dev.mjs`. The script builds first, then serves the freshly generated `dist/` directory with Node's built-in HTTP module. It does not currently watch files.

## Testing architecture

Node built-in tests cover profile and record creation, measurement history/current-value rules, provenance, profile isolation, search, export shape, persistence reload and DOM-like route/record rendering. The UI harness is deliberately lightweight and is not a full browser engine.

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
9. Ticket 2 persistence: versioned localStorage repository. Reason: isolated, dependency-free local authority suitable for this static demo. Trade-off: synchronous, capacity-limited and not encrypted by Sigma.
10. Measurement history: immutable child values with derived current selection. Reason: provenance and earlier facts cannot be accidentally overwritten. Trade-off: editing metadata and richer correction workflows remain future work.
11. Ticket 2A data safety: runtime validation and explicit load status. Reason: unreadable personal records must never masquerade as first-run emptiness. Trade-off: recovery/import tooling remains unavailable.
12. Ticket 2A UI split: orchestration remains in `app.ts`; rendering and form translation live under `src/app/ui`. Reason: Ticket 3 can add display semantics without expanding one monolithic file.
