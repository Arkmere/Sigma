# Permissions Policy

Sigma uses strict just-in-time permissions. First launch must not request Contacts, Camera, Photos/files, Health data, Bluetooth/nearby devices, Location or Notifications.

Before any OS prompt, Sigma must explain: requested access, why it is needed, what will be accessed, what will not be accessed, what happens if denied, and alternatives.

Denial must not break unrelated functionality. Permissions must be revisable where the platform allows.

## Future flows
- Contacts: only after an action such as “Choose someone from contacts”.
- Camera: only after “Measure with camera”.
- Health data: only after “Import measurement data”, and only for allowlisted measurement fields.
- Bluetooth/nearby devices: only after “Connect measurement device”.
- Photos/files: only after deliberate import/export or scan-file selection.
- Notifications: only if a future user-facing reminder feature is approved.

No speculative permission declarations or blanket onboarding prompts are allowed.

## Ticket 5 implementation
Sigma now models `contacts`, `camera`, `health_data`, `nearby_devices` and `files` with a complete pre-permission explanation contract: requested access, reason, will access, will not access, alternatives and denial effect. Explanations appear only after a deliberate Sources action. Browser and OS permission APIs are not called.

The static demo records only `not_requested`, `demo_granted` or `demo_denied` under `sigma.permissionDemo.v1`. These are explicitly simulated local decisions, may be reset in Settings, do not affect manual entry, and are not production permission status.
