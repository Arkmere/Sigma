# Data Model Direction

Ticket 1 does not define the final persistence schema. Ticket 2 owns the canonical local database.

## Domain concepts
- Profile: a person represented in Sigma.
- Independent profile: a person controls their own record.
- Managed profile: a parent, guardian or carer maintains the record for a child/dependant.
- Connected profile: an independent adult connected by mutual consent.
- Physical measurement record: measurement type, value, unit, measured date, recorded/imported dates, provenance, notes, visibility and owner.
- Standardised size record: a recorded size in a named sizing system.
- Brand/product fit record: user-recorded fact for a brand/product/category.
- Measurement history: non-destructive timeline of values.
- Provenance/source/acquisition method: manual, imported health platform, imported device, camera assisted, body scan or third-party service.
- Original versus converted value: original user fact remains separate from displayed conversions.
- Visibility and sharing grant: explicit revocable grants; no default exposure.
- Family/trusted group: relationship container, not blanket access.
- Entitlement: local/demo representation of free/full/extended capability boundaries.

## Candidate fields for future records
`id`, `profile_id`, `measurement_type`, `value`, `unit`, `measured_at`, `recorded_at`, `imported_at`, `source_type`, `source_name`, `original_value`, `original_unit`, `acquisition_method`, `confidence`, `device`, `notes`, `visibility`, `created_at`, `updated_at`.
