# Sigma

Sigma is a private, local-first personal and family measurement vault. It is intended to help people record, preserve and retrieve physical measurements, clothing and footwear sizes, wearable/equipment sizes, brand-specific fit facts, product-specific fit facts, history and provenance.

Sigma records what the user knows. It does not tell the user what should fit.

## What Sigma is not

Sigma is not a fitness tracker, health-analysis app, weight-loss app, medical diagnosis system, fashion recommendation engine, fit recommendation engine or social network.

## Current implementation status

Ticket 1 and the Ticket 1A correction pass are complete. The repository contains a TypeScript static application shell, person-first navigation, light/dark/system theme support, local shell preference persistence, behavioural shell tests, cross-platform Node build/dev scripts and product constitution documents.

It does not yet contain profile persistence, measurement records, conversions, Family logic, sharing, payments, cloud sync, external integrations or camera measurement.

## Commands

- Install dependencies: `npm install`
- Run development server: `npm run dev`
- Run tests: `npm test`
- Run type checks: `npm run typecheck`
- Build production assets: `npm run build`

There is currently no `npm run lint` command. Linting is deliberately recorded as a limitation until an actual linter is added; the project must not use a misleading lint script that only repeats type checking.

## Development workflow

`npm run dev` is cross-platform. It runs the production build first, then serves the freshly generated `dist/` directory on `http://localhost:5173` by default. Set `PORT` to use a different port. The command does not currently watch files; re-run it after source changes.

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
