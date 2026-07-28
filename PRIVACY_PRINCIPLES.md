# Privacy Principles

## Current guarantees through Ticket 2
- No telemetry, analytics, advertising trackers, hosted authentication, cloud database or runtime OS permission requests are present.
- Theme preference, profiles and user-entered records are stored locally in browser storage.
- User data is transmitted nowhere by Sigma. A deliberate JSON download exports a local backup.
- No health platform, contact, camera, Bluetooth, location or notification data is accessed.
- Ticket 5 permission controls are local simulations only. No external service or browser/OS permission API is contacted, and no permission is requested at startup.
- Local browser storage and exported JSON are not encrypted by Sigma; no production security claim is made.
- Corrupt or unsupported local data is not automatically deleted or overwritten. Mutations and ordinary backup export are blocked until the user explicitly resets it.

## Architectural intentions
- User data belongs to the user.
- Local storage is authoritative before any optional future sync or backup.
- Export, correction, deletion, selective sharing and revocation must be feasible.
- External source imports must use explicit allowlists and collect only measurement/fit-relevant data.
- Unknown, health, activity, sleep, location and medical fields fail closed before an import preview. Every accepted demo fact still requires individual confirmation.
- External source item IDs, devices, confidence and derivation metadata are runtime-validated before either a measurement or standard size can become canonical.
- A globally allowed fact is still rejected unless the selected operational source explicitly declares that field and record kind. Future-source permission simulations cannot activate canonical import.

## Future requirements
Future data systems must distinguish current guarantees from planned security. Production concerns include local sensitive-data protection, encrypted backup, key management, remote sharing, authentication, revocation and auditability.

## Prohibitions
No speculative collection, hidden background collection, unrelated health/lifestyle access, blanket Family sharing, recommendation use of records, sale of user-entered personal data, or artificial barriers to export/deletion.
