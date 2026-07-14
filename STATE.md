# Sigma State

## Current Phase

Ticket 2 completed. Ready for Ticket 3.

## Completed

- Ticket 1/Ticket 1A TypeScript shell, cross-platform Node scripts, local TypeScript, themes and product constitution.
- Independent and managed local profiles with selection and basic editing.
- Physical measurements grouped by profile/type/category with immutable value history.
- Current measurement selection by latest measured date, while preserving original value/unit and per-value provenance.
- Standardised size records that retain the recorded sizing system and value without conversion.
- Brand/product fit facts kept distinct by brand/product and never generalised into recommendations.
- Practical twelve-category taxonomy, category filtering and text search.
- Versioned canonical localStorage repository (`sigma.data.v1`) behind a typed boundary.
- Structured JSON backup containing schema, timestamps, profiles and every record type.
- Truthful local-only Privacy and Settings controls, including confirmed destructive reset.
- Domain, persistence and lightweight UI interaction tests for Ticket 2 journeys.

## Current Repository State

- Framework: dependency-free TypeScript static application.
- Domain: `src/domain` owns the schema, taxonomy, history rules and record service.
- Persistence: `src/data/repository.ts` owns synchronous versioned localStorage access; local data is authoritative.
- UI: profile-aware screens in `src/app`, semantic responsive CSS, accessible labelled forms and keyboard-operable controls.
- Data scope: local profiles, physical measurements, standard sizes and brand/product fit records only.
- Source scope: manual entry is active; future source types are schema vocabulary only.
- Privacy: no account, cloud, telemetry, analytics, advertising, external service or permission request.
- Testing: Node built-in test runner with domain, reload/persistence and lightweight DOM interaction coverage.
- Linting: no real lint command exists yet.

## Known Limitations

- localStorage is synchronous, browser-scoped, capacity-limited and not encrypted by Sigma.
- JSON backup download is export-only; import/restore is not implemented.
- Physical values support append-only history, but the UI does not yet correct/delete individual history entries.
- Standard-size and brand-fit records can be edited, but those edits do not yet create a separate audit history.
- The initial taxonomy is practical rather than exhaustive; custom labels remain available.
- Tests use a lightweight DOM harness, not a full browser or native mobile runtime.
- The development server builds once and does not watch files.
- No real linter is configured.
- No conversion engine, Family/sharing, entitlements/payments, cloud sync, accounts, external integrations, OS permissions, camera measurement or production cryptography.

## Important Decisions Made

- LocalStorage is isolated behind `DataRepository`, allowing a later IndexedDB adapter without coupling UI/domain code to storage calls.
- Measurement values are immutable child entries; current value is derived rather than overwriting history.
- `originalValue` and `originalUnit` remain explicit even before Ticket 3 introduces converted display values.
- Every record is tied to one profile and marked private; visibility has no sharing effect in Ticket 2.
- Structured JSON export is available, while import is deferred to avoid unsafe restore semantics.
- Ticket 2 adds no recommendation, conversion, Family, permission, cloud or payment behaviour.

## Next Planned Work

Ticket 3: International units and sizing conversion engine, preserving recorded facts separately from converted display values.
