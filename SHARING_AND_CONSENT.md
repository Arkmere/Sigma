# Sharing and Consent

Implemented local demo flow: Person A initiates, then the simulated actor must switch to Person B before B accepts or declines. Acceptance creates an active connection and exactly zero grants. Declined/disconnected history remains canonical.

Sharing may be granted for an entire profile, category, specific measurement, size records without raw measurements, or specific brand/product fit records. The UI must always answer who can see this, what can they see, who granted access, and can it be revoked.

Revocation must be explicit, reliable and auditable. Ownership remains with the profile/data owner.

Managed children require explicit independent managers and Family membership. Membership itself is neither access nor management authority. Only a manager grants/revokes child access, and recipients must be independent adults sharing a Family with the child. There are no public links, anonymous links or hard-coded age transition.

Revocation is immediate and records who revoked and when. Re-granting creates a new record. Shared facts remain read-only and owned by the original profile.

Read access is never edit authority. Independent profiles may mutate only their own records; managed records may be mutated only by listed managers. Existing managers authorize additions, while initial assignment of a migrated unassigned profile requires an explicit same-existing-Family action. Runtime loading rejects impossible grantors, revokers, active child recipients, and connection lifecycle metadata, while revoked grants do not require current Family membership to recreate historical context.
