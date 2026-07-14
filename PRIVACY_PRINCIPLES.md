# Privacy Principles

## Current guarantees through Ticket 2
- No telemetry, analytics, advertising trackers, hosted authentication, cloud database or runtime OS permission requests are present.
- Theme preference, profiles and user-entered records are stored locally in browser storage.
- User data is transmitted nowhere by Sigma. A deliberate JSON download exports a local backup.
- No health platform, contact, camera, Bluetooth, location or notification data is accessed.
- Local browser storage and exported JSON are not encrypted by Sigma; no production security claim is made.

## Architectural intentions
- User data belongs to the user.
- Local storage is authoritative before any optional future sync or backup.
- Export, correction, deletion, selective sharing and revocation must be feasible.
- External source imports must use explicit allowlists and collect only measurement/fit-relevant data.

## Future requirements
Future data systems must distinguish current guarantees from planned security. Production concerns include local sensitive-data protection, encrypted backup, key management, remote sharing, authentication, revocation and auditability.

## Prohibitions
No speculative collection, hidden background collection, unrelated health/lifestyle access, blanket Family sharing, recommendation use of records, sale of user-entered personal data, or artificial barriers to export/deletion.
