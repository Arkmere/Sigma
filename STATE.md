# Sigma State

## Current Phase

Ticket 3 international units and sizing conversion engine completed. Ready for Ticket 4.

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
- Runtime schema-version-1 validation, referential-integrity checks and an explicit migration boundary.
- Distinct empty, valid, corrupt and unsupported-version repository states.
- Preservation of unreadable raw storage with mutations blocked until user-confirmed reset.
- Visible data-safety warning for corrupt or unsupported local data.
- Ticket 2 UI split into shell, profile, record, status, action and shared-HTML modules.
- Expanded practical starter catalogue across all twelve taxonomy categories.
- Typed dynamically derived conversion results with source/version provenance; converted values are not persisted.
- Exact length (`mm`, `cm`, `m`, `in`, `ft`) and mass (`g`, `kg`, `oz`, `lb`, `st`) conversions through canonical bases.
- Controlled unit entry for known measurements and a limited ISO 19407:2023 adult footwear subset (`UK 9`, `EU 43`, `US Men's 10`).
- Conservative ring circumference/diameter and explicit ISO circumference-size helpers; no regional lookup.

## Current Repository State

- Framework: dependency-free TypeScript static application.
- Domain: `src/domain` owns the schema, taxonomy, history rules and record service.
- Persistence: `src/data/repository.ts` owns explicit load states; `src/data/migrations.ts` validates and dispatches schema versions.
- UI: `src/app/app.ts` orchestrates state/events while focused modules under `src/app/ui` render screens and translate forms.
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
- The expanded taxonomy remains a starter catalogue rather than exhaustive; custom labels remain available.
- Corrupt/unsupported storage has no recovery, raw export, import or restore path; only confirmed reset is available.
- Tests use a lightweight DOM harness, not a full browser or native mobile runtime.
- The development server builds once and does not watch files.
- No real linter is configured.
- The public ISO catalogue does not expose footwear table contents, so only the specification-supplied adult row is encoded; other rows and child conversions return no result.
- Clothing, hat, glove, regional ring and specialist/equipment conversions are deliberately unsupported rather than guessed.
- No Family/sharing, entitlements/payments, cloud sync, accounts, external integrations, OS permissions, camera measurement or production cryptography.

## Important Decisions Made

- LocalStorage is isolated behind `DataRepository`, allowing a later IndexedDB adapter without coupling UI/domain code to storage calls.
- Measurement values are immutable child entries; current value is derived rather than overwriting history.
- `originalValue` and `originalUnit` remain explicit even before Ticket 3 introduces converted display values.
- Every record is tied to one profile and marked private; visibility has no sharing effect in Ticket 2.
- Structured JSON export is available, while import is deferred to avoid unsafe restore semantics.
- Ticket 2 adds no recommendation, conversion, Family, permission, cloud or payment behaviour.
- Invalid JSON, invalid version-1 structures and broken profile references are surfaced as corrupt without modifying raw storage.
- Unknown schema versions are surfaced as unsupported and routed through a dedicated migration boundary.
- Unsafe repository states are read-only until reset so creating a profile cannot overwrite unreadable personal data.
- Schema version remains 1. Conversion results are transient views over canonical recorded fields and never enter storage or backups.

## Next Planned Work

Ticket 4: Family, managed children, consent and granular sharing.
