Sigma demo development plan
Target outcome

At the end of the plan, there should be a genuinely usable local-first demo of Sigma that can be run on a phone or desktop development environment and demonstrates the complete product concept.

The demo should allow a user to:

Create their own profile.
Record physical measurements.
Record general clothing and wearable sizes.
Record brand-specific sizes.
Convert between supported international sizing systems.
View measurement history and provenance.
Create or unlock a Family.
Add managed child profiles.
Simulate or demonstrate mutual-consent adult sharing.
Control exactly which data is shared.
See the intended free-versus-paid product boundary.
See just-in-time permission flows.
See how future external data import and camera measurement will fit into the architecture.
Use the app with no unnecessary account, cloud, telemetry, permission, or background-data requirements.

I would not attempt these things in the first demo:

Real payments.
Real cloud sync.
Real multi-device sharing.
Real Apple Health or Health Connect integration.
Real smart-scale integrations.
Real body scanning.
Real camera-derived measurement.
Full legal/regulatory implementation for child accounts.
Production-grade cryptography or backend infrastructure.

However, the architecture should explicitly accommodate them.

Ticket 1 — Project foundation, product constitution and application shell
Objective

Create the repository, development foundation, formal product rules, core app shell, navigation system, design system, and architectural boundaries before implementing substantive features.

This ticket exists to stop Codex from making arbitrary assumptions later.

Required deliverables

Codex should create the application and repository structure, plus these documents:

README.md
AGENTS.md
PRODUCT_SPEC.md
PRIVACY_PRINCIPLES.md
PERMISSIONS_POLICY.md
DATA_MODEL.md
SHARING_AND_CONSENT.md
MONETISATION.md
DESIGN_SYSTEM.md
ARCHITECTURE.md
ROADMAP.md
STATE.md

The documentation must encode everything we have established.

Product principles

Sigma is:

A personal and family measurement vault.
Equally intended for individuals and families.
Local-first.
Record keeping only.
Not a recommendation engine.
Not a fitness tracker.
Not a health-analysis application.
Not a social network.
Data principles
The user owns their data.
Sigma only accesses information directly relevant to size, physical measurements, clothing, wearables, equipment fit, or closely related records.
External data access is allowlist-based.
No speculative data access.
No telemetry unless deliberately approved later.
No unnecessary cloud dependency.
Users control sharing at all times.
Permission principles
No blanket first-run permission requests.
Permissions requested only when a user explicitly invokes a feature requiring them.
Sigma explains why access is needed before the OS permission dialogue.
Declining a permission must not break unrelated functionality.
No permission is requested merely because a future feature might use it.
Commercial principles
Useful personal profile available free.
Full product unlocked through a fair one-time payment where practical.
No contrived subscription.
One complete paid unlock rather than multiple irritating micro-paywalls.
Possible separate one-time extended-family upgrade.
Application shell

Create:

Sigma branding.
Light and dark visual themes.
Core navigation.
Empty-state screens.
Reusable component system.
Local app configuration.
No cloud service dependency.
No analytics.
No account requirement for basic demo usage.

Suggested main navigation:

Profiles
Measurements / Sizes
Family
Privacy
Settings

The exact implementation can be adjusted if a better information architecture becomes apparent, but the app must remain person-first.

Acceptance criteria

At the end of Ticket 1:

The application runs.
Navigation works.
Light and dark themes work.
Sigma has a coherent premium, restrained visual identity.
All architectural and product documents exist.
Codex has documented every significant technical decision.
No substantive measurement functionality needs to exist yet.
No external permissions are requested.
No cloud services are required.
Codex instruction

Do not begin implementing the full feature set. This ticket is for project foundations, product rules, architecture, navigation, visual system, and documentation. Read all project documentation before making architectural decisions. Do not invent product behaviour contrary to those documents.

Ticket 2 — Canonical profile, measurement and size record system

This is the largest and most important ticket.

Objective

Build the complete local record-keeping engine that makes Sigma useful as a personal application before Family or sharing functionality exists.

Profile system

Support:

Independent profile

The user's own profile.

Managed profile

A profile maintained on behalf of another person, such as a child or dependant.

The demo does not yet need real accounts or remote ownership.

Measurement records

Each measurement must support:

id
profile_id
measurement_type
value
unit
measured_at
recorded_at
source_type
source_name
original_value
original_unit
confidence_if_applicable
notes
visibility
created_at
updated_at

Source types should anticipate:

manual
imported_health_platform
imported_device
camera_assisted
body_scan
third_party_service

Only manual needs to function fully in the initial demo.

Measurement categories

The system should support a comprehensive taxonomy, including:

General body dimensions.
Upper body.
Lower body.
Head and neck.
Hands.
Feet.
Jewellery.
Clothing.
Footwear.
Sports equipment.
Specialist wearables.
Custom measurements.

The UI should not overwhelm the user with every field at once.

The hierarchy should be searchable and category-based.

Practical size records

Support three distinct data concepts.

Physical measurements

Example:

Collar circumference
41 cm
Standardised size records

Example:

Shoe size
UK 9
Brand/product-specific fit records

Example:

Nike Air Max 90
UK 9

Globe Tilt
UK 10

Bauer Vapor X5 Pro ice skate
US 12

The user should be able to record:

Brand.
Product name.
Product category.
Recorded size.
Sizing system.
Notes.
Date recorded.
History

Measurements must not be destructively overwritten.

Example:

Waist
96 cm — 9 July 2026
98 cm — 12 April 2026
101 cm — 3 January 2026

The current record should be clearly identifiable while previous records remain available.

Local persistence

All records must survive app restart.

The local database should be treated as the authoritative store for the demo.

Acceptance criteria

A user can:

Create their personal profile.
Add physical measurements.
Edit measurements.
Record multiple historical values.
Record general clothing sizes.
Record brand-specific fit records.
Search and browse measurements.
See where a measurement came from.
Use the app entirely locally.
Export a structured backup of their data if practical within the selected stack.

At this stage Sigma should already be genuinely useful to a single user.

Ticket 3 — International units and sizing conversion engine
Objective

Build Sigma's conversion system as a first-class capability, without turning Sigma into a recommendation engine.

This distinction must be explicit.

Sigma may say:

Nike Air Max 90 — recorded as UK 9
Equivalent display: EU 44 / US Men's 10

Sigma must not say:

Based on your foot length, we recommend a Nike size 9.

Conversion types

Support sensible initial conversion categories such as:

Metric and imperial body dimensions.
Shoe size systems.
Ring sizes.
Hat sizes.
Other deterministic or established conversions selected for the demo.

The system must distinguish:

Deterministic conversion

A true mathematical conversion.

Example:

41 cm = 16.14 in
Standard equivalent lookup

A recognised table-based correspondence.

Example:

UK shoe 9 ≈ EU 43/44 depending on applicable standard
Brand-specific recorded fact

No conversion should overwrite what the user actually recorded.

Example:

Nike Air Max 90: UK 9
Globe Tilt: UK 10

Those remain separate facts.

Provenance requirement

The UI must distinguish:

Recorded directly

from:

Converted from recorded UK 9
Architecture requirement

Conversion data must be isolated from UI code.

The system should support future additions without rewriting application components.

Prefer:

conversion registry
conversion definitions
source metadata
conversion confidence/type
versioned conversion tables

rather than hard-coded conditional statements scattered throughout the app.

Acceptance criteria

The user can:

Enter a measurement in one supported unit.
Display it in another.
Enter a supported international standard size.
Switch display system where a valid conversion exists.
Always see which value was actually recorded.
Never receive a clothing recommendation.
Ticket 4 — Family, managed children, consent and granular sharing
Objective

Implement the complete Family concept in demo form.

This is where Sigma becomes more than a personal notebook.

Family model

The app must support a Family or trusted personal group containing:

Independent adults.
Connected adults.
Managed children or dependants.

For demo purposes, real remote account synchronisation is not required. Adult-to-adult connections may be simulated locally, but the consent model must be real in the application logic.

Adult connection model

The intended process is:

Person A initiates connection
↓
Person B explicitly accepts
↓
Connection exists
↓
No data is automatically shared
↓
Each owner explicitly chooses what the other person may access

Joining a Family must never expose all measurements automatically.

Sharing granularity

The application should allow sharing at sensible levels such as:

Entire profile.
Measurement category.
Specific measurement.
Size records without raw body dimensions.
Specific brand/product fit records.

The UI must always make it obvious:

Who can see this?
What can they see?
Who granted access?
Can access be revoked?
Child profiles

For the demo:

Child profiles must be managed under an adult profile.
They cannot exist independently.
Their sharing options must be more restrictive.
They should only be shareable within the Family structure.
The architecture should allow the eventual age policy to be finalised later.

Do not hard-code a legal conclusion about whether the transfer age is 16 or 18 unless formally specified later.

Family size and entitlement model

Demonstrate:

Free
1 personal profile
Core measurement functionality
Full unlock
Family creation
Managed child profiles
Adult connections
All measurements
All conversions
All sharing features
Standard profile allowance
Extended Family
Higher profile cap
Possible future one-time paid upgrade

No actual payment processing is needed.

The demo may use a developer-controlled entitlement toggle or demo purchase simulation.

Acceptance criteria

The user can:

Use Sigma personally for free.
See the boundary between free and paid functionality.
Simulate unlocking the full app.
Create a Family.
Add children.
Create adult connections.
Simulate mutual acceptance.
Share selected information.
Revoke access.
See clearly what every connected person can access.
Confirm that Family membership does not imply blanket sharing.
Ticket 5 — Data sources, just-in-time permissions and future measurement acquisition
Objective

Build the architecture and user experience for future external data sources and camera-based measurement without prematurely implementing expensive integrations.

This ticket is about making those later capabilities possible without a rewrite.

Source system

Create a Sources area that can conceptually represent:

Manual entry
Apple Health
Android Health Connect
Smart scale
Measurement device
Camera-assisted measurement
Full body scan
Third-party scanner

Only manual entry needs to be fully live.

Other integrations may be represented as:

Available in future
Not connected
Demo source
Explicit allowlist

The codebase must contain an explicit concept of permitted external measurement types.

Sigma may accept data related to:

Height.
Weight.
Body dimensions.
Clothing sizes.
Foot dimensions.
Relevant wearable sizes.
Relevant equipment sizes.
Body scans.
Other directly relevant fit and size information.

Sigma must not ingest unrelated information such as:

Heart rate.
Sleep.
Steps.
GPS.
Exercise.
Blood oxygen.
Medical diagnoses.
Medication.
Unrelated body-composition metrics such as lean mass unless deliberately added to product scope later.

The correct model is:

Nothing enters Sigma merely because a connected service makes it available.

Just-in-time permissions

Create the permission architecture and demo UX for:

Contacts

Request only after the user explicitly chooses something such as:

Choose someone from contacts
Camera

Request only after choosing:

Measure with camera
Health data

Request only after choosing:

Import measurement data
Bluetooth or nearby devices

Request only after choosing:

Connect measurement device

No speculative permission requests.

Pre-permission explanation

Before every operating-system request, Sigma should explain:

What access is needed.
Why it is needed.
What Sigma will access.
What it will not access.
What alternatives exist.
What happens if the user declines.
Future camera measurement

Create the architecture for:

Manual
Camera-assisted specific measurement
Full body scan
External scan import

Do not attempt to build actual body scanning in this ticket.

However, measurement records must already support:

acquisition method
source
confidence
device
original measurement
derived value
Acceptance criteria

The demo visibly demonstrates that:

Permissions are not requested at install.
Permissions are contextual.
Denial does not break unrelated features.
External source access is narrowly scoped.
Future camera measurement fits naturally into the data model.
No irrelevant health data is represented as available for import.
Ticket 6 — Integrated UX, visual polish and complete demo journey
Objective

Take everything built so far and turn it into one coherent application rather than a collection of completed technical features.

This ticket is deliberately separate because Codex should not be inventing the final UX while simultaneously implementing core data architecture.

Required user journeys
Journey A — Personal use
Open Sigma
Create personal profile
Add collar measurement
Add shoe size
Add Nike-specific shoe record
Close app
Reopen
Retrieve information immediately
Journey B — Historical measurements
Open profile
View existing waist measurement
Add newer measurement
See complete history
See current value
See provenance
Journey C — International size conversion
Open recorded footwear size
Switch between supported standards
Clearly distinguish recorded and converted value
Journey D — Family
Use free personal profile
Encounter premium Family feature
Simulate one-time unlock
Create Family
Add child
Add connected adult
Complete mutual consent process
Selectively share measurements
Verify that unshared information remains inaccessible
Journey E — Permissions
Use app normally without permissions
Choose contact-selection feature
See explanation
Choose whether to continue
Choose camera measurement
See separate explanation
Decline
Continue using rest of Sigma normally
Design direction

The app should feel like:

An upmarket private healthcare clinic translated into software.

Meaning:

Minimal.
Controlled.
Precise.
Sterile but not hostile.
Premium but not ornate.
Quiet.
Low-key.
Distinctive through detail rather than decoration.

Avoid:

Gamification.
Fitness-app aesthetics.
Loud gradients.
Wellness clichés.
Excessive lock iconography.
Social-media-style profiles.
Cartoon body imagery.

Prefer:

Restrained teal.
Off-white.
Charcoal.
Strong typography.
Fine rules.
Generous space.
Anatomical line art.
Precise metadata.
Excellent empty states.
Calm motion.
Acceptance criteria

A new tester should be able to understand what Sigma is, use the principal features, and experience the intended privacy model without needing explanation from the developer.

Ticket 7 — Independent whole-project audit and demo release

I would absolutely include this, even though it is not an implementation ticket in the conventional sense.

This is where Codex stops building and starts trying to prove the project wrong.

Objective

Perform a full repository and product audit before calling the demo complete.

Codex should inspect:

Product fidelity
Has anything drifted from the specification?
Are there features that imply recommendation rather than record keeping?
Is individual use genuinely equal to family use?
Has Family been implemented as a real consent model?
Privacy
Are there unnecessary permissions?
Are any permissions requested prematurely?
Is any user data transmitted remotely?
Is any telemetry present?
Does membership imply unintended data exposure?
Are child profiles appropriately restricted?
Data integrity
Is history preserved?
Is provenance preserved?
Are recorded and converted values distinguishable?
Could data from one profile accidentally appear under another?
UX
Are empty states useful?
Are important actions discoverable?
Can a user retrieve a collar size quickly?
Can someone shopping for a partner reach the needed information quickly?
Are privacy controls comprehensible?
Monetisation
Is the free tier useful?
Does the simulated premium tier correspond to the intended one-time unlock?
Are there artificial restrictions inconsistent with the product philosophy?
Code quality
Dead code.
Duplicated logic.
Weak tests.
Fragile state management.
Hard-coded conversions.
Temporary mocks that have accidentally become production architecture.
Final deliverables

Codex should produce:

AUDIT_REPORT.md
KNOWN_LIMITATIONS.md
DEMO_GUIDE.md
NEXT_PHASE_PLAN.md

And update:

STATE.md
README.md
Why I think seven tickets is the correct number

The natural temptation is to turn this into 20 or 30 tickets:

Build profiles.
Build children.
Add collar size.
Add shoes.
Add conversions.
Add family.
Add permissions.

I think that would be wrong for Sigma at this stage.

Those are implementation details, not meaningful architectural units.

At the opposite extreme, telling Codex:

Build the Sigma demo according to this specification.

would force it to simultaneously solve:

App architecture.
Local database.
Data taxonomy.
Conversion engine.
Family relationships.
Consent model.
Permission model.
Entitlements.
UX.
Visual design.
Testing.

That is precisely where corners get cut.

The seven-ticket structure divides Sigma according to its actual architectural seams:

Ticket	Primary problem being solved
1	Foundation and immutable product rules
2	Personal records and local data model
3	Conversion logic
4	Family, consent and monetisation
5	Sources, permissions and future acquisition
6	Integrated UX and polish
7	Adversarial audit

I would not divide it more finely unless Codex encounters a genuinely difficult area during implementation.

The way I would actually work with Codex

Do not give Codex all seven tickets as an instruction to execute unsupervised.

Give it the full plan for context, but instruct it to implement one ticket at a time.

For each ticket:

Codex reads all project documentation.
Codex inspects the existing implementation.
Codex states its proposed approach.
It identifies ambiguities before coding.
It implements the complete ticket.
It runs tests.
It manually checks the relevant journeys where possible.
It updates STATE.md.
It commits the work.
Only then do you move to the next ticket.

The important point is that the plan is fixed globally, but execution is incremental.

My recommendation would be that our next step is to turn this into the actual repository foundation pack and Codex-ready ticket set, including the precise contents of AGENTS.md, the product specification, privacy doctrine, data model, design language, and seven copy-paste-ready implementation prompts.
