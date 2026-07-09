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
