# Data Model

Ticket 2 defines schema version 1 for Sigma's canonical single-device local data.

## Profiles

Profiles are either `independent` or `managed`. They contain `id`, `displayName`, optional relationship/date-of-birth/notes fields, and created/updated timestamps. A managed profile is a local record maintained for another person; it has no account, remote ownership, sharing, or hard-coded age-transfer rule.

## Physical measurements

A physical measurement groups immutable value entries under a profile, type, category, and label. Each value preserves its numeric value, unit, original value/unit, measured and recorded timestamps, source type/name, acquisition method, optional confidence/notes, and creation timestamp. The current value is the entry with the latest measured date (then recorded date); older entries remain visible as history.

Only manual acquisition is active. The source vocabulary anticipates `imported_health_platform`, `imported_device`, `camera_assisted`, `body_scan`, and `third_party_service` without accessing those sources.

## Recorded sizes and fit facts

- Standard size: profile, category, label, recorded sizing system/value, date, provenance and notes.
- Brand fit: profile, category, brand, optional product/product-line, recorded sizing system/value, fit notes, date and provenance.

These are recorded facts. Ticket 3 may derive transient standard equivalents for explicitly supported footwear rows, but never changes these records, converts between brands, or makes a recommendation.

## Derived conversions (not persisted)

`ConversionResult` is a typed runtime view with exact-unit or standard-equivalent kind, recorded input, derived output, exactness and source/version metadata. Results are computed through `SigmaService` and do not form part of `SigmaData`.

Exact conversions support length (`mm`, `cm`, `m`, `in`, `ft`) and mass (`g`, `kg`, `oz`, `lb`, `st`). Aliases resolve centrally; unknown units remain valid facts but produce no conversion. Known measurement types constrain dimensional meaning and categorical sizes are not treated as lengths.

Footwear lookup is separate. The adult-simplified ISO 19407:2023 subset contains only the ticket-supplied `UK 9`, `EU 43`, `US Men's 10` row. Adult/child and US Men's/US Women's contexts remain distinct. Generic `US`, unencoded rows and ambiguity return no result.

Ring helpers cover inner circumference and diameter in millimetres and ISO size explicitly represented by circumference. Regional commercial sizes are not inferred.

## Ownership and visibility

Every record has a `profileId` and `visibility: private`. Visibility is a forward-compatible field only; Ticket 2 has no Family, connections, grants or remote sharing.

## Persistence and backup

`LocalStorageRepository` isolates persistence behind a typed repository boundary at key `sigma.data.v1`. Stored data includes `schemaVersion`, active profile, profiles, measurements, standard sizes, and brand-fit records. JSON export adds product and export timestamp metadata. LocalStorage was chosen for the dependency-free static demo; it is synchronous, browser-scoped, capacity-limited and not encrypted by Sigma.

## Validation and migration boundary

`migrateStoredData` validates schema version 1 at runtime rather than trusting a TypeScript assertion. It checks root collections, required and optional fields, source vocabularies, finite numeric values, record kinds/visibility, and referential integrity between every record and its profile.

Repository loads distinguish `empty`, `ok`, `corrupt`, and `unsupported_version`. Invalid JSON and invalid version-1 structure are corrupt; unknown versions are unsupported. Unsafe raw storage is retained unchanged. The service exposes this status and rejects mutations until user-confirmed reset clears the key. No automatic migration is currently needed because version 1 is the only supported schema, but all future versions enter through this boundary.
