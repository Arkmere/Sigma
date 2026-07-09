# Sigma Roadmap

This roadmap preserves the seven-ticket strategic plan from the original `state.md`. Future tickets are not complete.

## Target outcome
A genuinely usable local-first Sigma demo that runs in a phone-oriented environment and a desktop development environment. It should eventually support personal profiles, physical measurements, clothing and wearable sizes, brand-specific fit facts, conversions, history, provenance, Family, managed children, mutual-consent adult sharing, explicit sharing controls, free-versus-paid boundaries, just-in-time permission flows, and seams for future external sources and camera measurement.

Out of scope for the demo roadmap: real payments, real cloud sync, real multi-device sharing, real health-platform or smart-scale integrations, real body scanning, camera-derived measurement, full legal/regulatory child-account implementation, and production-grade cryptography or backend infrastructure.

## Ticket 1 — Project foundation, product constitution and application shell
Create the repository foundation, formal product rules, application shell, navigation, design system, local shell configuration, architectural boundaries, test infrastructure, and documentation. Do not implement substantive measurement, conversion, Family, sharing, payment, cloud, health, device or camera systems.

## Ticket 2 — Canonical profile, measurement, size-record, brand-fit, history and persistence system
Build the local record-keeping engine: independent and managed profiles, manual measurement records, standardised sizes, brand/product fit records, provenance fields, history, search/browse, local persistence, and structured backup/export if practical.

## Ticket 3 — International units and sizing conversion engine
Add deterministic unit conversion and supported standard-equivalent lookup conversion while preserving the original recorded fact. Conversion data must be isolated from UI code and must not become recommendation logic.

## Ticket 4 — Family, managed children, consent, sharing and entitlement model
Implement Family/trusted-group concepts, managed children, simulated mutual-consent adult connections, granular sharing, revocation, visibility review, and demo entitlement boundaries without real payment processing.

## Ticket 5 — External data sources, permissions, allowlists and future acquisition architecture
Create the source and permission architecture for future manual, health-platform, device, camera-assisted, body-scan and third-party acquisition. Demonstrate just-in-time permission UX and strict data allowlists without implementing expensive integrations.

## Ticket 6 — Integrated UX, visual polish and complete demo journeys
Turn the completed systems into coherent end-to-end journeys for personal use, history, conversion, Family, permissions and privacy. Polish the app toward the restrained premium clinical design direction.

## Ticket 7 — Independent whole-project audit and demo release
Audit product fidelity, privacy, permissions, data integrity, UX, monetisation and code quality. Produce `AUDIT_REPORT.md`, `KNOWN_LIMITATIONS.md`, `DEMO_GUIDE.md`, `NEXT_PHASE_PLAN.md`, and update `STATE.md` and `README.md`.
