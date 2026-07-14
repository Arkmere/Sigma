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

These are recorded facts. No size conversion, cross-brand inference, or recommendation exists.

## Ownership and visibility

Every record has a `profileId` and `visibility: private`. Visibility is a forward-compatible field only; Ticket 2 has no Family, connections, grants or remote sharing.

## Persistence and backup

`LocalStorageRepository` isolates persistence behind a typed repository boundary at key `sigma.data.v1`. Stored data includes `schemaVersion`, active profile, profiles, measurements, standard sizes, and brand-fit records. JSON export adds product and export timestamp metadata. LocalStorage was chosen for the dependency-free static demo; it is synchronous, browser-scoped, capacity-limited and not encrypted by Sigma.
