# Sigma

Sigma is a private, local-first personal and family measurement vault. It is intended to help people record, preserve and retrieve physical measurements, clothing and footwear sizes, wearable/equipment sizes, brand-specific fit facts, product-specific fit facts, history and provenance.

Sigma records what the user knows. It does not tell the user what should fit.

## Development data safety

Manual development and acceptance may use the product owner's genuine primary profile only in browser-local storage or an explicit local backup. Personal names, measurements, dates, notes and product records must never enter source, fixtures, documentation, publishable screenshots or diagnostic output. Automated tests, examples and demo-source payloads use invented data. Sigma does not alter an existing local profile merely because the application is upgraded.

## What Sigma is not

Sigma is not a fitness tracker, health-analysis app, weight-loss app, medical diagnosis system, fashion recommendation engine, fit recommendation engine or social network.

## Current implementation status

Tickets 1–6 are implemented. Sigma presents local profiles, record history, deterministic conversions, Family management, explicit read-only sharing, and allowlisted source demonstrations as one guided journey. A context bar distinguishes the viewed person from the same-device acting adult; record creation uses progressive disclosure; Family and Sources are staged; significant actions use an accessible transient notice.

Sigma still has no real accounts, authentication, payments, cloud sync, remote sharing, external integrations, production permissions, telemetry, recommendations, or camera measurement.

## Commands

- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Run tests: `npm test`
- Run type checks: `npm run typecheck`
- Build production assets: `npm run build`

There is currently no `npm run lint` command. Linting is deliberately recorded as a limitation until an actual linter is added; the project must not use a misleading lint script that only repeats type checking.

## Development workflow

`npm run dev` is cross-platform. It runs the production build first, then serves the freshly generated `dist/` directory on `http://localhost:5173` by default. Set `PORT` to use a different port. The command does not currently watch files; re-run it after source changes.

## Local data

Canonical Ticket 2 data is stored in this browser through a versioned localStorage repository. Settings and Privacy provide a structured JSON backup download. Local browser data and backups are not encrypted by Sigma; clearing browser storage removes the canonical local copy.

Stored schema version 1 data is validated at runtime, including record-to-profile ownership. Corrupt or unsupported-version data is never treated as an ordinary empty database, deleted, or overwritten automatically. Sigma shows a warning and blocks record changes until the user explicitly confirms reset. Import, restore, and recovery export are not implemented.

## Development targets

The current target is a desktop browser development environment with responsive phone-sized layout support. Future phone deployment can be added through a native wrapper after the core local data model is established.

## Documentation

- `STATE.md` — factual current project state.
- `ROADMAP.md` — complete seven-ticket master plan.
- `PRODUCT_SPEC.md` — durable product definition.
- `PRIVACY_PRINCIPLES.md` — privacy doctrine.
- `PERMISSIONS_POLICY.md` — just-in-time permission rules.
- `DATA_MODEL.md` — future domain model direction.
- `SHARING_AND_CONSENT.md` — consent and visibility model.
- `MONETISATION.md` — commercial philosophy.
- `DESIGN_SYSTEM.md` — visual and interaction system.
- `ARCHITECTURE.md` — technical architecture and decision log.
- `AGENTS.md` — instructions for future coding agents.
- `src/assets/ANATOMY.md` — anatomy model provenance, semantics, accessibility and replacement contract.
- `MANUAL_ACCEPTANCE_6E.md` — Ticket 6E responsive, theme and accessibility review journeys.
