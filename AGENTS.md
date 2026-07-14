# Agent Instructions

Read `README.md`, `STATE.md`, `ROADMAP.md`, `PRODUCT_SPEC.md`, `ARCHITECTURE.md`, `PRIVACY_PRINCIPLES.md`, `PERMISSIONS_POLICY.md`, `DATA_MODEL.md`, `SHARING_AND_CONSENT.md`, `MONETISATION.md` and `DESIGN_SYSTEM.md` before making product decisions.

Rules:
- Preserve local-first architecture.
- Do not introduce telemetry, analytics, advertising, mandatory accounts, hosted auth, hosted databases or mandatory cloud dependencies without explicit approval.
- Do not request speculative permissions or add blanket onboarding permission prompts.
- Do not make Family membership imply sharing.
- Do not implement recommendation logic.
- Do not silently collapse recorded values and converted values.
- Do not hard-code irreversible age boundaries for child/dependant transition.
- Keep `STATE.md` accurate and update docs when architecture changes.
- Run relevant checks before completion and report limitations honestly.
- Avoid drive-by refactors unrelated to the active ticket.
- Commit completed work with a clear commit message.

Commands:
- Install: `npm install`
- Run: `npm run dev`
- Test: `npm test`
- Lint: no lint command exists yet; add a real linter before documenting `npm run lint`.
- Type-check: `npm run typecheck`
- Build: `npm run build`
