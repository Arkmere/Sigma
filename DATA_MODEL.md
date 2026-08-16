# Data Model

Ticket 6C defines schema version 4 for Sigma's canonical single-device local data; Ticket 9 adds real deletion and moves the current schema to version 5 (see "Deletion" below). Valid version-1 through version-4 data is deterministically migrated under the unchanged `sigma.data.v1` key.

## Canonical fact definitions

`src/domain/canonical-facts.ts` is a static, dependency-free registry separate from user records. Its 118 definitions provide stable IDs, labels, aliases, categories, record kinds, semantics, permitted units or sizing systems, and controlled anatomy paths. Records may persist `canonicalFactId`; custom and uncertain legacy records omit it. Validation rejects unknown IDs and metadata drift. Canonical physical measurements are unique by profile and fact ID; standard sizes and brand/product facts remain context-specific and may coexist.

Measurement guidance is version-controlled product content referenced by canonical physical definitions. It is not a field on `PhysicalMeasurement`, `MeasurementValue`, `SigmaData` or `SigmaBackup`. Reload and backup restore resolve current guidance through the stable canonical ID; custom and ambiguous legacy records resolve none. Ticket 6D retains schema version 4.

Ticket 6E anatomy illustrations are static domain metadata. Canonical IDs resolve through `sigma-neutral-v1` to controlled regions, orientations, overlays and reusable landmarks. Asset paths, illustration IDs and anchors are never stored in user records or backups; schema version 4 and migrations are unchanged.

Ticket 5/5A retains schema 2. `MeasurementValue` and `StandardSize` share optional `sourceId`, `sourceItemId`, `sourceDevice`, confidence and structured `derivation` (`direct` or `derived`, with optional method/input description). These fields change no required collection, required field or existing meaning. Confidence is finite and constrained to 0–1. Runtime loading rejects unknown source IDs, empty source identifiers/devices and malformed provenance. Legacy records remain lossless and need no fabricated metadata.

## Profiles

Profiles are either `independent` or `managed`. Independent profiles may act as simulated local adult authorities. `activeActorProfileId` is separate from viewed `activeProfileId`. Managed profiles use explicit manager IDs and a child/dependant kind. New managed profiles require a manager and Family; migrated legacy managed profiles remain unassigned rather than fabricating authority.

## Physical measurements

A physical measurement groups immutable value entries under a profile, type, category, and label. Each value preserves its numeric value, unit, original value/unit, measured and recorded timestamps, source type/name, acquisition method, optional confidence/notes, and creation timestamp. Schema 3 may add correction metadata (`voided`, correction actor/time and optional reason). Correction is non-destructive: the entry remains in history but is excluded from current-value selection and conversions. The current valid value is the entry with the latest measured date, then latest recorded timestamp.

Only manual acquisition is active. The source vocabulary anticipates `imported_health_platform`, `imported_device`, `camera_assisted`, `body_scan`, and `third_party_service` without accessing those sources.

## Deletion

Ticket 9 adds genuine removal alongside correction: a single measurement value, a whole physical-measurement/standard-size/brand-fit record, or a whole profile can be deleted, not merely voided or reset. Deleting a record's only remaining value is rejected — delete the whole record instead. Deleting a profile cascades to remove its own records, its Family memberships, its adult connections, any sharing grant where it is owner or recipient, and its ID from any other profile's manager list (falling back to the same "legacy unassigned" state a migrated profile without a manager already uses — no new state is introduced). Deleting a record cascades to remove any sharing grant scoped to exactly that record. These are the only true array removals in the data layer; every other "undo" (revocation, disconnection, correction) remains a non-destructive status change that preserves history, and stays that way — deletion is reserved for cases the user explicitly asked to remove.

Schema 5 distinguishes two kinds of profile-ID reference for validation purposes: subject/party fields (who owns or receives something — a record's `profileId`, a grant's owner/recipient, a connection's two parties, a membership's `profileId`, a profile's manager list) must always resolve to an existing profile, exactly as in schema 4. Purely historical "who did this" attribution fields (`grantedByProfileId`, `revokedByProfileId`, a Family's `createdByProfileId`, a membership's `addedByProfileId`, a correction's `correctedByProfileId`) may now reference a profile that has since been deleted; the record or grant they're attached to can still be perfectly valid, owned by someone who still exists.

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

`migrateStoredData` validates all supported versions at runtime rather than trusting a TypeScript assertion. Schema-3 validation includes schema-2 authority checks and also requires correction actors to be existing independent profiles with valid correction metadata.

Repository loads distinguish `empty`, `ok`, `corrupt`, and `unsupported_version`. The version discriminator must be a finite number; malformed discriminators are corrupt, while unknown finite versions are unsupported. Valid schema-1 through schema-4 data migrates losslessly to the current schema (5). Schema 3's automatic canonical mapping is limited to exact allowlisted Height, Weight, Waist circumference, Foot length, Shoe size and Ring size combinations whose stored units/systems are permitted. Multiple physical records for the same profile and candidate canonical fact remain uncatalogued, while standard-size records may coexist. Labels are never rewritten. IDs, history, corrections, provenance and grants are preserved. Invalid or authority-impossible data is corrupt. Unsafe raw storage is retained unchanged and mutations and backup export remain blocked until explicit reset.

Runtime validation requires IDs to be unique within profiles, each record-kind collection, Families, memberships, connections and grants. Measurement-value IDs are unique within their containing measurement; reuse across measurements and reuse of a record ID across different record kinds remain valid. Record-scoped grants must resolve to a record owned by the grant owner. Canonical physical measurements and standard sizes must retain the registry label as well as their other canonical metadata; uncatalogued custom records remain flexible.

External raw data is not canonical data. A typed explicit field allowlist maps stable IDs to measurement or standard-size concepts and permitted units/systems; unknown fields and malformed provenance fail closed before candidate creation. A separate source-policy check requires that the resolved registry source is operational, declares the field, and supports its mapped record kind. Individual confirmation defensively repeats this evaluation before the existing owner/manager authorization check. For standard sizes, the candidate source date maps to `StandardSize.recordedAt`; it is not described as a physical measurement date. Re-import is rejected only when source ID and source item ID match within that record kind; equal values from distinct source items remain valid. Historical canonical provenance validates by stable vocabulary rather than current source availability. Brand-fit import is not implemented.

Ticket 7A makes the external-field mapping explicitly reference canonical IDs. Candidate label, category, record kind and measurement semantics resolve from the canonical registry, while field/source unit and system restrictions remain an additional narrower policy that must also pass. Confirmed candidates persist `canonicalFactId`; an imported canonical physical value joins the existing profile/fact measurement history rather than creating a parallel record. Canonical size and brand/product updates cannot persist category or sizing-system metadata that contradicts their canonical definition. Schema remains version 4, and existing historical records without canonical IDs are deliberately left unchanged because their identity cannot always be proven safely.
