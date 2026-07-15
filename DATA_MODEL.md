# Data Model

Ticket 4 defines schema version 2 for Sigma's canonical single-device local data. Valid version-1 data is deterministically migrated under the unchanged `sigma.data.v1` key.

## Profiles

Profiles are either `independent` or `managed`. Independent profiles may act as simulated local adult authorities. `activeActorProfileId` is separate from viewed `activeProfileId`. Managed profiles use explicit manager IDs and a child/dependant kind. New managed profiles require a manager and Family; migrated legacy managed profiles remain unassigned rather than fabricating authority.

## Physical measurements

A physical measurement groups immutable value entries under a profile, type, category, and label. Each value preserves its numeric value, unit, original value/unit, measured and recorded timestamps, source type/name, acquisition method, optional confidence/notes, and creation timestamp. The current value is the entry with the latest measured date (then recorded date); older entries remain visible as history.

Only manual acquisition is active. The source vocabulary anticipates `imported_health_platform`, `imported_device`, `camera_assisted`, `body_scan`, and `third_party_service` without accessing those sources.

## Recorded sizes and fit facts

- Standard size: profile, category, label, recorded sizing system/value, date, provenance and notes.
- Brand fit: profile, category, brand, optional product/product-line, recorded sizing system/value, fit notes, date and provenance.

These are recorded facts. Ticket 3 may derive transient standard equivalents for explicitly supported footwear rows, but never changes these records, converts between brands, or makes a recommendation.

## Derived conversions (not persisted)

`ConversionResult` is a typed runtime view with exact-unit or standard-equivalent kind, recorded input, derived output, exactness and source/version metadata. Results are computed through `SigmaService` and do not form part of `SigmaData`.

Exact conversions support length (`mm`, `cm`, `m`, `in`, `ft`) and mass (`g`, `kg`, `oz`, `lb`, `st`). Aliases resolve centrally; unknown units remain valid facts but produce no conversion. Measurement semantics explicitly distinguish known dimensional, known categorical, and custom/unknown types. Categorical records never receive mathematical unit conversions, while custom/unknown records may use an explicitly recognised recorded unit as dimensional context.

Footwear lookup is separate. The adult-simplified ISO 19407:2023 subset contains only the ticket-supplied `UK 9`, `EU 43`, `US Men's 10` row. Adult/child and US Men's/US Women's contexts remain distinct. Generic `US`, unencoded rows and ambiguity return no result.

Ring helpers cover inner circumference and diameter in millimetres and ISO size explicitly represented by circumference. Regional commercial sizes are not inferred.

## Family, consent and sharing

Schema 2 adds Families, memberships, adult connections and typed grants. Membership grants zero access. Connection acceptance creates no grants. Scopes cover whole profile, category, all standard sizes, all brand fits, or a specific canonical record. Revocation preserves actor/time history.

Profile management is separate from viewing: an independent actor manages only itself; a managed profile is mutable only by an explicitly listed manager. Connections, memberships, creator status and sharing grants never confer edit authority. Ordinary metadata editing cannot change profile type. Existing managers authorize additional eligible independent managers; a legacy unassigned profile can be explicitly claimed only by an acting adult already sharing an existing Family with it.

## Ownership and visibility

Every record retains its original owner and private visibility; access is represented separately. Shared facts are read-only. Supported conversions may be derived after access evaluation and are never persisted.

## Persistence and backup

`LocalStorageRepository` isolates persistence behind a typed repository boundary at key `sigma.data.v1`. Stored data includes `schemaVersion`, active profile, profiles, measurements, standard sizes, and brand-fit records. JSON export adds product and export timestamp metadata. LocalStorage was chosen for the dependency-free static demo; it is synchronous, browser-scoped, capacity-limited and not encrypted by Sigma.

## Validation and migration boundary

`migrateStoredData` validates schema version 1 at runtime rather than trusting a TypeScript assertion. Schema-2 validation additionally checks grant/revocation authority, active child Family eligibility, manager independence, and connection status-specific metadata before persisted relationships enter the domain.

Repository loads distinguish `empty`, `ok`, `corrupt`, and `unsupported_version`. Valid schema-1 data migrates losslessly to schema 2; invalid or authority-impossible data is corrupt and unknown future versions are unsupported. Unsafe raw storage is retained unchanged and mutations remain blocked until explicit reset.
