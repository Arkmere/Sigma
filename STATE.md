# Sigma State

## Current Phase

Ticket 6D canonical measurement guidance is implemented. MI-20 interactive anatomy navigation remains deferred. Tickets 6E and 6F, and Ticket 7, have not started.

## Completed

- Ticket 6D adds structured, static guidance for 35 priority canonical physical measurements. Creation and saved-record views resolve the same content from `canonicalFactId`; guidance is not persisted or exported.
- Canonical measurement creation prioritises “Record this measurement” fields and uses each definition’s declared default unit. “How to measure” follows as a closed disclosure with preparation and mistakes nested inside it.
- Guidance distinguishes location, ordered method, preparation, common errors, tool, assistance, posture, clothing and placeholder illustration/tutorial references without medical interpretation or recommendation.
- Canonical physical semantics now resolve from declared registry metadata, preventing newer canonical names from falling through to custom/unknown conversion behaviour.
- Anatomy illustration consistency requirement: Sigma must use one coherent anatomical illustration system across the future body-region navigator and measurement-guidance views. Whole-body, regional and close-up illustrations must derive from the same model family, with consistent proportions, line style, orientation logic and highlight treatment. This visual requirement is not complete in Ticket 6D.
- Ticket boundaries remain explicit: 6D is structured guidance content and UI; 6E is the anatomy model and illustration system; 6F is anatomy-based canonical-fact discovery. Video tutorials remain future work and are not implemented.

- Schema 4 persists optional stable canonical fact identifiers without reclassifying uncertain legacy records.
- A dependency-free 118-definition registry drives physical measurements, standard sizes and underlying brand/product facts across eleven canonical categories; the twelfth established category, Custom, remains the deliberate escape hatch.
- Primary creation derives label, category, measurement type or size context, and permitted units/systems. Custom creation remains a separate secondary path.
- Canonical physical facts have one ongoing record per profile; standard-size and brand/product contexts may coexist and are never silently merged.
- Search includes canonical labels and aliases while legacy/custom labels remain retrievable. Anatomy paths are metadata only.
- Real-profile manual testing remains browser-local; repository examples, tests and demo sources remain synthetic.

- Refined warm-light/charcoal-dark visual system with restrained teal active states, semantic primary/secondary/disabled controls and minimal dark-mode shadow.
- Local gender-neutral anatomical line art for first-use and physical-measurement empty states; no interactive anatomy or body-shape inference.
- Deterministic notice lifecycle: actions replace notices and unrelated route/Family-stage navigation clears stale messages.
- Coherent responsive measurement-history blocks, compact profile totals, one-sentence Family framing and structured source-candidate provenance.
- Open record disclosures span the full action grid at desktop and intermediate widths while collapsed actions retain their compact row and mobile actions retain single-column stacking.
- Sources now prioritise manual entry and the named Sigma demo device, disclose import filtering later, and label future actions as previews or planned capabilities.

- Mobile-first operational hierarchy with compact context, shorter Records navigation, staged creation, collapsed record detail and safe-area-aware bottom navigation.
- One-stage-at-a-time Family overview for Families/members, managed people, connections and explicit sharing; the shell is the single acting/viewed context surface.
- Non-destructive measurement-value correction under schema 3. Incorrect entries remain in audit history but cannot become current or feed conversions.
- Equal measured dates resolve to the most recently recorded valid entry; the UI explains the tie only when it occurs.
- Record search restores focus and selection after each render, with a sequential-input interaction test.

- Persistent application context bar for viewed profile, same-device acting adult, and service-derived editable/read-only state.
- Account-free first-use guidance, authorised profile summaries and direct record/Family cross-navigation.
- Retrieval-first Measurements & Sizes with explicit fact-type switching, filters, progressive entry, recorded/current/history hierarchy and transient conversion labelling.
- Guided Family overview, membership, managed-person, connection and explicit read-only sharing sections.
- Ordinary person-first discovery of service-authorised shared profiles and granular read-only facts; revocation removes them on rerender.
- Staged Sources hierarchy for live manual entry, the local measurement-device demonstration and compact future integrations.
- Typed transient notices with an accessible live region and controlled expected-error presentation.
- Dominant corrupt/unsupported storage state that suppresses ordinary page content and export until confirmed reset.
- Responsive six-destination mobile navigation, wrapping context controls, one-column forms and reduced-motion-aware interactions.
- Actor-relative viewed-profile reconciliation retains an authorised view or persists a safe own/editable/read-only fallback.
- Shared-profile visibility derives from active grants even when the granted scope currently contains no matching records.
- Actor-authorised grant history and owner-relative, scope-sensitive sharing composition prevent unrelated audit or record disclosure.
- Sharing previews describe the actual owner, recipient and scope; specific-record controls use only the selected owner's eligible records.

- Sixth Sources destination with a typed nine-source registry; manual is live, measurement device is a local demo, and every other integration is a truthful future state.
- Explicit stable external-field allowlist, fail-closed unknown fields, mixed demo filtering, individual confirmation and Ticket 4A-authorized targets.
- Contextual explanation contracts for contacts, camera, health data, nearby devices and files with no real browser or OS permission calls.
- Simulated decisions stored separately at `sigma.permissionDemo.v1`, resettable without deleting records and excluded from backup.
- Optional source ID, source item, device and direct/derived provenance retained under backward-compatible schema 2, with confidence constrained to 0–1.
- Duplicate detection limited to identical source ID plus source item ID.
- Allowlisted standard-size candidates now dispatch to canonical `StandardSize` records with the same optional structured external provenance as measurement values.
- Raw source item, device, confidence and derivation fields are treated as untrusted and fail closed with `invalid_provenance` before candidate creation.
- Duplicate identity is source ID plus source item ID for both supported imported record kinds; brand-fit import remains deliberately unsupported.
- The registry is an enforced import-policy boundary: global allowlist, source field capability, source record-kind capability and demo availability must all pass.
- `measurement_device` is the sole external demo source and supports height, weight, waist circumference, foot length, shoe size and ring size across measurement and standard-size records.
- Future sources remain explanatory only; simulated permission never makes them operational. Persisted provenance remains historical and is not reinterpreted through current availability.

- Ticket 1/Ticket 1A TypeScript shell, cross-platform Node scripts, local TypeScript, themes and product constitution.
- Independent and managed local profiles with selection and basic editing.
- Physical measurements grouped by profile/type/category with immutable value history.
- Current measurement selection by latest measured date, while preserving original value/unit and per-value provenance.
- Standardised size records that retain the recorded sizing system and value without conversion.
- Brand/product fit facts kept distinct by brand/product and never generalised into recommendations.
- Practical twelve-category taxonomy, category filtering and text search.
- Versioned canonical localStorage repository (`sigma.data.v1`) behind a typed boundary.
- Structured JSON backup containing schema, timestamps, profiles and every record type.
- Truthful local-only Privacy and Settings controls, including confirmed destructive reset.
- Domain, persistence and lightweight UI interaction tests for Ticket 2 journeys.
- Runtime schema-version-1 validation, referential-integrity checks and an explicit migration boundary.
- Distinct empty, valid, corrupt and unsupported-version repository states.
- Preservation of unreadable raw storage with mutations blocked until user-confirmed reset.
- Visible data-safety warning for corrupt or unsupported local data.
- Ticket 2 UI split into shell, profile, record, status, action and shared-HTML modules.
- Expanded practical starter catalogue across all twelve taxonomy categories.
- Typed dynamically derived conversion results with source/version provenance; converted values are not persisted.
- Exact length (`mm`, `cm`, `m`, `in`, `ft`) and mass (`g`, `kg`, `oz`, `lb`, `st`) conversions through canonical bases.
- Controlled unit entry for known measurements and a limited ISO 19407:2023 adult footwear subset (`UK 9`, `EU 43`, `US Men's 10`).
- Complete current-taxonomy dimensional semantics distinguish physical, categorical and custom/unknown measurements; categorical records never receive exact unit conversion even when recorded with a physical-unit string.
- Conservative ring circumference/diameter and explicit ISO circumference-size helpers; no regional lookup.
- Schema version 2 with safe version-1 migration and no fabricated legacy managers.
- Separate viewed profile and clearly labelled independent simulated acting adult.
- Multiple Families, zero-access memberships, recipient-only adult connection acceptance and retained terminal history.
- Explicit managed child/dependant authority with multiple-manager-capable schema and Family-restricted child sharing.
- Typed profile/category/record-kind/specific-record grants, dedicated access evaluation and auditable revocation.
- Read-only shared-with-me/privacy views and access-checked transient conversions.
- Separate free/full/extended local demo entitlement with no payments or canonical-data restrictions.
- Central record-mutation authority: independent owners manage themselves and only explicit managers mutate managed profiles.
- Ordinary profile editing cannot change profile type; shared/connected/Family views expose no edit authority.
- Existing-manager authorization and constrained same-existing-Family legacy manager assignment.
- Schema-2 validation rejects impossible grantors, revokers, child recipients and connection lifecycle metadata.

## Current Repository State

- Framework: dependency-free TypeScript static application.
- Domain: `src/domain` owns the schema, taxonomy, history rules and record service.
- Persistence: `src/data/repository.ts` owns explicit load states; `src/data/migrations.ts` validates and dispatches schema versions.
- UI: `src/app/app.ts` orchestrates state/events while focused modules under `src/app/ui` render screens and translate forms.
- Data scope: schema-4 local records, optional canonical identifiers, correction metadata, Families, memberships, adult connections and sharing grants.
- Source scope: manual entry is active; future source types are schema vocabulary only.
- Privacy: no account, cloud, telemetry, analytics, advertising, external service or permission request.
- Testing: Node built-in test runner with domain, reload/persistence and lightweight DOM interaction coverage.
- Linting: no real lint command exists yet.

## Known Limitations

- localStorage is synchronous, browser-scoped, capacity-limited and not encrypted by Sigma.
- JSON backup download is export-only; import/restore is not implemented.
- Physical values support append-only history and non-destructive correction; irreversible deletion of individual entries is deliberately unavailable.
- Standard-size and brand-fit records can be edited, but those edits do not yet create a separate audit history.
- The expanded taxonomy remains a starter catalogue rather than exhaustive; custom labels remain available.
- Corrupt/unsupported storage has no recovery, raw export, import or restore path; only confirmed reset is available.
- Tests use a lightweight DOM harness, not a full browser or native mobile runtime.
- The development server builds once and does not watch files.
- No real linter is configured.
- Browser visual verification is limited to the viewports and themes recorded below; there has been no formal accessibility or WCAG audit.
- The public ISO catalogue does not expose footwear table contents, so only the specification-supplied adult row is encoded; other rows and child conversions return no result.
- Clothing, hat, glove, regional ring and specialist/equipment conversions are deliberately unsupported rather than guessed.
- Consent is a same-device simulation, not authenticated remote consent; there is no cloud sync, real accounts/payments, external integration, production child-law policy or cryptography.

## Important Decisions Made

- LocalStorage is isolated behind `DataRepository`, allowing a later IndexedDB adapter without coupling UI/domain code to storage calls.
- Measurement values are immutable child entries; current value is derived rather than overwriting history.
- `originalValue` and `originalUnit` remain explicit even before Ticket 3 introduces converted display values.
- Every record is tied to one profile and marked private; visibility has no sharing effect in Ticket 2.
- Structured JSON export is available, while import is deferred to avoid unsafe restore semantics.
- Ticket 2 adds no recommendation, conversion, Family, permission, cloud or payment behaviour.
- Invalid JSON, invalid version-1 structures and broken profile references are surfaced as corrupt without modifying raw storage.
- Unknown schema versions are surfaced as unsupported and routed through a dedicated migration boundary.
- Unsafe repository states are read-only until reset so creating a profile cannot overwrite unreadable personal data.
- Schema version is 3. Version-1 and version-2 facts migrate unchanged; legacy managed profiles remain unassigned. Conversion results remain transient and never enter storage or backups.

## Next Planned Work

Ticket 6F: anatomy-based canonical-fact discovery using the Ticket 6E registry. No interactive region navigation is present yet.

## Ticket 6E anatomy illustration system

- Permanent presentation family IDs are `neutral`, `masculine`, and `feminine`, with asset version recorded separately in static registry metadata. Canonical fact semantics do not contain family or asset details.
- Masculine and Feminine V1 standalone assets map Height, Waist circumference, and Shoulder width. Feminine head front/side assets are registered but not mapped to facts. Unsupported family/fact combinations retain the Neutral prototype.
- Localhost query parameters (`?anatomyFamily=neutral`, `masculine`, or `feminine`) provide development-only comparison. Family choice is presentation-only and is absent from schema 4, records, backups, imports, sharing, profiles, and preferences. Production model selection and Ticket 6F remain deferred.

- `neutral` V1 is one original, repository-owned SVG family with whole-body and related head/neck, torso, limb, hand/finger and foot views.
- All 35 rich-guidance physical facts resolve by canonical ID to typed region, orientation, anchors, overlay semantics and accessible text. Custom and ambiguous legacy records resolve no illustration.
- Creation and saved-record disclosures reuse the same static registry. Illustrations remain absent from schema-4 records and backups.
- Semantic CSS bounds figures responsively and distinguishes paths with line patterns and marker shapes, not colour alone. Manual browser review remains required using `MANUAL_ACCEPTANCE_6E.md`.
- Anchor IDs now drive rendering through per-symbol coordinate maps. All 35 facts have distinct geometry definitions, and front/back/side/top/palm/sole assets are deliberate drawings rather than compressed or rotated substitutes. Overlay legends contain only active semantics.

## Ticket 6B manual-inspection findings

- MI-01 — canonical fact creation is insufficiently constrained: **deferred**. A canonical hierarchical picker and optional anatomy discovery need a separate product/data-design ticket.
- MI-02 — Brand/product terminology inconsistency: **resolved** as “Brand & product facts” in operational Records UI.
- MI-03 — filter persistence needs deliberate treatment: **resolved**. Filters persist across record-type and route renders in the current session, clear explicitly, and reset when the acting adult changes.
- MI-04 — technical conversion metadata density: **resolved** through one quick conversion and collapsed conversion/source details.
- MI-05 — equal-date current-value rule: **resolved** with recorded-time tie-breaking and contextual explanation.
- MI-06 — update-value action hidden under history: **resolved** with a prominent per-record “Update value” disclosure.
- MI-07 — intermediate-width compression: **resolved** with the 820 px navigation breakpoint, narrower desktop rail and single-column forms.
- MI-08 — individual measurement entries cannot be corrected: **resolved** by schema-3 non-destructive correction.
- MI-09 — search loses focus after each character: **resolved** with focus/caret restoration and sequential-input coverage.
- MI-10 — launch interface too busy for a phone-first product: **resolved** with compact first-use and hidden creation forms.
- MI-11 — mobile record-type selector wrapping: **resolved** with one compact select at narrow widths.
- MI-12 — excessive default record-card detail: **resolved** with value/date/one conversion as the default layer.
- MI-13 — oversized context presentation: **resolved** with an adaptive single-row context bar.
- MI-14 — repeated profile context: **resolved**; Family no longer repeats an actor card.
- MI-15 — bottom-navigation content competition: **resolved** with compact labels and safe-area/content clearance.
- MI-16 — misleading mobile `Sizes` label: **resolved** as `Records`.
- MI-17 — marketing-style hierarchy overwhelms operational UI: **resolved** with smaller typography, tighter spacing and action-first copy.
- MI-18 — remaining Brand/product terminology inconsistency: **resolved**. Operational modes, headings, empty states and sharing controls use “Brand & product facts”; `brand_fit` remains the internal identifier.
- MI-19 — success notices persist across unrelated navigation: **resolved** with deterministic route/stage clearing and action replacement tests.
- MI-20 — interactive anatomy navigator: **deferred** with MI-01. Ticket 6B1 adds only a small local, gender-neutral line-art vocabulary for future extension.
- MI-21 — expanded record disclosures remain constrained to a narrow desktop action column: **resolved in implementation** by spanning open semantic disclosures across the complete record-action grid; final browser confirmation remains required.
- The previously accepted active/disabled button-state correction remains resolved with semantic primary, secondary and genuine disabled states.
- MI-22 — desktop measurement history becomes malformed: **resolved** with coherent value/status blocks, labelled metadata and an attached correction form.
- MI-23 — mobile profile header and record totals wrap poorly: **resolved** with separated People/count/action structure and concise total-record wording.
- MI-24 — Family overview retains redundant framing: **resolved** with one privacy statement, status counts and four focused actions.
- MI-25 — Sources policy precedes routine actions and future cards are too large: **resolved** by prioritising manual/demo sources, moving policy into a disclosure and using a denser future list/grid.
- MI-26 — future-source actions and device naming imply operations or overlap: **resolved** with preview/planned wording and source-specific Sigma demo versus planned smart-scale names.
- MI-27 — candidate provenance is difficult to scan: **resolved** with labelled Recorded, Source, Device, Confidence and Method fields.
- MI-28 — mobile navigation active state and safe-area treatment need refinement: **resolved in implementation** with teal semantic active state, six labels and retained safe-area clearance; final visual confirmation remains pending.
- MI-29 — light theme controls lack sufficient operational distinction: **resolved in implementation** with warm surfaces, charcoal text and distinct teal active controls; final visual confirmation remains pending.

The supplied mood boards are recorded as visual-direction references for palette, typography, icon restraint, card treatment and anatomical line language. Their promotional compositions, hero hierarchy and feature panels are explicitly not the structure of Sigma’s operational application.

Deferred future work: canonical hierarchical fact picker; automatic category/default-label derivation; explicit custom-record path; optional anatomy navigator extending the Ticket 6B1 line-art language; search and category browsing over the same canonical taxonomy; accessible text and keyboard alternatives for anatomy navigation.

## Ticket 6 verification

- Ticket 6B2 automated verification: `pnpm run typecheck`, `pnpm run build`, `pnpm test` and `git diff --check` pass; the suite contains 91 passing tests. Coverage verifies semantic disclosures for every record kind, full-grid placement for open disclosures, coherent history/correction grouping, absence of fixed open-content widths and retained single-column mobile stacking.
- Ticket 6B2 browser evidence: pending. Final browser confirmation remains required; no visual acceptance claim is made by the implementation tests.
- Ticket 6B1 automated verification: `pnpm run typecheck`, `pnpm run build`, portable `pnpm test` and `git diff --check` pass; the suite contains 87 passing tests. Coverage includes notice clearing/replacement, semantic active/disabled states, coherent correction history, compact Profiles and Family framing, truthful Sources actions, structured provenance, six-destination navigation, local anatomical-asset output and reduced-motion CSS.
- Ticket 6B1 browser evidence: unavailable. The required browser-control runtime failed before page launch with `Cannot redefine property: process`; therefore no screenshot or visual claim is made for 360 × 800, 768, 1024 or 1440 px in light/dark mode.
- Ticket 6B1 keyboard evidence: automated markup and interaction checks confirm semantic controls, visible-focus CSS, multi-character search focus/caret restoration, correction-card focus restoration and absence of timer-driven notice removal. A real-browser keyboard-only traversal of navigation, forms, disclosures, confirmations, Family, Sources, Settings and backup could not be executed because the browser never initialised.
- Ticket 6B1 reduced-motion evidence: implementation and build output include an explicit `prefers-reduced-motion: reduce` rule that suppresses non-essential transition/animation duration, and an automated test verifies it. Real-browser emulation remains pending with the short product-owner visual review.
- Ticket 6B automated verification: `pnpm run typecheck` passed; `pnpm run build` passed; direct Node suite passed 78/78; `git diff --check` passed. The bundled runtime does not expose `npm`, so the package's `npm test` wrapper could not run there; its exact build and `node --test test/*.test.mjs` stages were run separately.
- Ticket 6B manual browser: pending. Browser control failed before page launch with `Cannot redefine property: process`, so responsive or visual acceptance is not claimed.
- Ticket 6B manual checklist: run `npm run dev`; inspect light and dark at 360, 768, 1024 and 1440 px; verify six-destination navigation and safe-area clearance, compact/adaptive context, hidden profile creation, the record-type selector, multi-character search, compact record disclosures, update and correction confirmation/history, equal-date note, each focused Family stage, sharing eligibility/revocation, staged Sources and long-content overflow. Repeat the core journey keyboard-only and with reduced motion.

- Automated Ticket 6A verification: `pnpm run typecheck` passed; `pnpm run build` passed; `pnpm test` passed 69/69; `git diff --check` passed. Generated output contains 35 local files, no source maps or new runtime dependencies, and only the existing static NIST/ISO conversion-reference URLs.
- Ticket 6A baseline before correction: type-check and build passed; 61/61 tests passed. Verification requires execution outside the restricted filesystem sandbox because the installed TypeScript binary otherwise returns `EPERM`.
- Manual browser: pending. The bundled browser-control runtime again failed to initialise (`Cannot redefine property: process`), so responsive or visual acceptance is not claimed.
- Manual verification steps: run `npm run dev`; check 360 px light and dark, then 768, 1024 and 1440 px; verify all six mobile destinations, context wrapping, actor/view selectors, progressive Records entry, long provenance, owner/scope composer changes, mobile record selectors, live grant preview, recipient read-only view, revocation fallback, Sources permission/candidate stages and corrupt-storage warning. Repeat the main route flow keyboard-only, then with reduced-motion emulation enabled.
