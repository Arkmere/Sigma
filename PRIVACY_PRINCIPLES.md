# Privacy Principles

## Current guarantees in Ticket 1
- No telemetry, analytics, advertising trackers, hosted authentication, cloud database or runtime OS permission requests are present.
- Theme preference is stored locally in browser storage.
- No measurement, profile, health, contact, camera, Bluetooth, location or notification data is collected.

## Architectural intentions
- User data belongs to the user.
- Local storage is authoritative before any optional future sync or backup.
- Export, correction, deletion, selective sharing and revocation must be feasible.
- External source imports must use explicit allowlists and collect only measurement/fit-relevant data.

## Future requirements
Future data systems must distinguish current guarantees from planned security. Production concerns include local sensitive-data protection, encrypted backup, key management, remote sharing, authentication, revocation and auditability.

## Prohibitions
No speculative collection, hidden background collection, unrelated health/lifestyle access, blanket Family sharing, recommendation use of records, sale of user-entered personal data, or artificial barriers to export/deletion.
