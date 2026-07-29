# Architecture

## Stack selection

Sigma uses a TypeScript static application. TypeScript provides explicit boundaries without introducing a framework dependency before the product model exists. The app builds to static browser assets that can be served locally and later wrapped by Capacitor or another native shell for phone deployment.

TypeScript is a project-local development dependency pinned in `package-lock.json`; the npm workflow does not rely on a globally installed `tsc`.

Alternatives considered: React Native/Expo offers stronger native deployment but adds mobile build complexity before the data model exists; React/Vite remains a reasonable later choice when the product requires richer component composition; Next.js would add server concepts Sigma does not need for a local-first demo.

## Layers and structure

- `src/app/content.ts`: route identifiers, navigation metadata and page copy for the Ticket 1 shell.
- `src/app/app.ts`: top-level route/theme state, render selection and event-binding orchestration.
- `src/app/ui`: focused shell, profile, record, status, form-action and shared HTML modules.
- `src/domain/model.ts`: schema-3 canonical entities, non-destructive correction and current-measurement selection.
- `src/domain/sharing.ts`: deterministic sharing scopes, access and grant authority.
- `src/domain/service.ts`: profile, record, history, search and export operations.
- `src/domain/taxonomy.ts`: initial browse taxonomy.
- `src/conversion`: typed results, central units/aliases, dimensional semantics, discrete sizing tables, conservative ring helpers and isolated source metadata.
- `src/data/repository.ts`: explicit load-status and versioned persistence boundary.
- `src/data/migrations.ts`: runtime schema validation, referential integrity and migration dispatch.
- `src/lib/preferences.ts` and `src/lib/entitlement.ts`: separate local UI/demo preferences.
- `src/styles.css`: semantic design tokens, responsive layout and component styles.
- `scripts/build.mjs`: cross-platform static asset preparation after TypeScript compilation.
- `scripts/dev.mjs`: cross-platform build-then-serve development command.
- `test`: Node test files for deterministic utilities, DOM-like shell interaction and source-level guardrails.

## State and routing

The shell controller has six top-level destinations. Profile/record creation and Family stages are transient disclosures rather than routes. Family renders only the selected operational stage. Record search restores focus and caret after the dependency-free full render.

## Sources and contextual permissions

`src/sources` owns the typed nine-source registry, explicit stable external-field allowlist, mixed local demo adapter, fail-closed evaluation and confirmed import translation for physical measurements and standard sizes. Candidate creation requires both global field allowlisting and the resolved source's field and record-kind capabilities. Only `demo` sources use the external import boundary; `future` sources return `source_not_available`, while live manual entry continues through its dedicated service workflow. Raw source identity, item ID, device, confidence and derivation remain untrusted until runtime evaluation produces a canonical-ready candidate. The measurement-and-sizing device is the sole operational external demo and permits height, weight, waist circumference, foot length, shoe size and ring size. Brand-fit import remains unsupported.

`src/permissions` owns five permission kinds and the complete explanation contract. Decisions are simulated (`not_requested`, `demo_granted`, `demo_denied`) and stored separately at `sigma.permissionDemo.v1`; they never enter `SigmaData` or backup exports. No real platform API is called. Canonical import mutation still passes through `SigmaService` and its Ticket 4A owner/manager rule.

The shell was split into content metadata and rendering code during Ticket 1A. This is a small maintainability improvement that avoids one monolithic controller without prematurely creating a large framework-style folder hierarchy.

## Local persistence

Theme preference is stored separately through `src/lib/preferences.ts`. Canonical schema-3 data uses `LocalStorageRepository`, a typed versioned adapter over browser localStorage. Domain and UI code do not access the storage key directly. The service saves after each authorized mutation and can export a complete versioned JSON snapshot. Conversion operations are read-only service methods derived from the current valid value at render time and are never persisted.

Loads produce `empty`, `ok`, `corrupt`, or `unsupported_version`. Versions 1 and 2 are validated and migrated; schema 3 validates referential and authorization invariants plus correction metadata. Corrupt/unsupported raw storage is preserved and mutations remain blocked until explicit reset.

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
- Conversion expansion: add permitted, versioned table rows or categories through registries without moving formulas or tables into UI code.
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
13. Ticket 3 conversion boundary: exact units, table lookup, source metadata and formatting live under `src/conversion`; UI consumes typed service results.
14. Ticket 3 ambiguity policy: unsupported units, generic US footwear, missing rows, categorical clothing and regional ring sizes return no result.
15. Ticket 3 footwear scope: the ISO public catalogue does not publish table rows, so only the ticket-supplied adult simplified UK 9/EU 43/US Men's 10 subset is encoded and labelled as guidance.
16. Ticket 4 identity: independent profiles simulate local adult actors; acting and viewed profiles are separate and this is not authentication.
17. Ticket 4 consent: Family membership and adult connection create zero access; access uses typed, revocable grants with retained history.
18. Ticket 4 entitlement: free/full/extended is a separate local demo preference with no payment integration or canonical-data effect.
19. Ticket 4A authorization: record mutation uses a central owner/explicit-manager rule; read grants, connection and membership never confer editing.
20. Ticket 4A integrity: persisted grant, revocation and connection authority/state invariants are runtime validated before data enters the domain.
21. Ticket 5 schema: retain schema 2 because structured provenance is optional and backward-compatible; validate it at runtime.
22. Ticket 5 imports: explicit IDs fail closed, preview precedes individual confirmation, and source-item duplicate checks never compare numeric value alone.
23. Ticket 5A completeness: measurements and standard sizes share optional structured external provenance. Duplicate identity is source ID plus source item ID within the imported record kind; malformed raw provenance never reaches canonical mutation.
24. Ticket 5B policy: the source registry is enforced at candidate creation and defensive confirmation. Current source capability is import-time policy; stored source provenance remains historical fact and does not become invalid if registry availability later changes.
25. Ticket 6/6A authorised views: `SigmaService.activeVisibleProfile`, `visibleProfiles`, `profileAccess`, and `authorisedRecords` supply UI-safe views. Actor changes reconcile and persist the viewed profile using own, editable, then read-only fallback order. Read-only profile visibility derives from active grants, while record visibility remains scope-specific.
26. Ticket 6/6A UI state: route, record-entry disclosure, source stage, filters, typed notices, and owner/recipient/scope/category/record sharing-composer selections remain transient in `app.ts` and never enter canonical persistence.
27. Ticket 6 layout: the dependency-free render modules remain screen-focused; the shell context bar and compact component vocabulary support desktop and six-item mobile navigation without a framework.
28. Ticket 6A sharing reads: `authorisedGrantHistory` limits audit history to owner, recipient, grantor, or current manager relationships and returns revoke authority with each view. `grantableOwners`, `eligibleGrantRecipients`, and `grantableRecords` provide owner-relative composer data without bypassing final scope validation.
29. Ticket 6B correction: schema 3 records an authorised actor/time/reason marker instead of deleting a measurement value. Current-value and conversion selectors ignore corrected entries.
30. Ticket 6B operational UI: compact default layers, explicit disclosures, adaptive context and one Family stage at a time remain dependency-free transient presentation state.
