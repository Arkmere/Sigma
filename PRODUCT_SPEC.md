# Product Specification

## Integrated demonstration experience

Ticket 6 begins with an account-free, local personal-profile path. The shell distinguishes the viewed person from the independent adult acting in the same-device demonstration. Retrieval precedes creation; recorded facts, transient conversions, history and provenance remain separately labelled.

Ticket 6B makes this an operational mobile-first journey: creation stays behind explicit actions, record cards default to one scannable fact layer, Family exposes one stage at a time, and Sources separates live, demo and future capabilities. Incorrect measurement entries are retained as corrected audit history and no longer affect current values or conversions.

Ticket 6B1 refines that accepted structure without returning to a landing-page hierarchy. Active controls, disabled controls, notices, history entries, profile summaries and source previews must remain visually and semantically distinct. A small local anatomical outline establishes a future visual language only; it is not an anatomy navigator and does not classify or judge body shape.

Family is organised as overview, membership, managed people, adult connections and explicit sharing. Membership and connection visibly grant zero access. Sources distinguish live manual entry, the local measurement-device demo and non-operational future integrations. Unsafe storage replaces ordinary route content until explicitly reset.

Sigma is a private, local-first personal and family measurement vault. It records what the user knows; it does not tell the user what should fit.

## In scope product concepts
- Personal memory: body measurements, clothing sizes, footwear sizes, wearable sizes, jewellery sizes, equipment sizes, specialist sizing, brand-specific fit facts, product-specific fit facts, history and provenance.
- Family/trusted-person use: independent profiles, managed profiles for children/dependants, connected independent adults, trusted groups and future explicit sharing.
- Records: physical measurements, standardised size records, brand/product-specific fit records and historical values.
- Conversions: exact mathematical conversions and recognised standard-equivalent lookup conversions may be shown while preserving the original recorded value.

## Non-goals
Sigma is not a fitness tracker, health-analysis app, weight-loss app, medical diagnosis system, fashion or fit recommendation engine, or social network.

## Current demo scope
Tickets 1–2 provide the app shell and a single-device local record-keeping engine: independent and managed profiles, physical measurement history, standard sizes, brand/product fit facts, search, provenance and JSON backup. They do not implement conversions, Family relationships or sharing, payments, cloud sync, external integrations or permissions.

## Durable rules
- Local data is authoritative for the demo.
- No account, cloud, telemetry, analytics or advertising is required for normal use.
- User-entered data belongs to the user and must remain exportable/deletable by future design.
- Family membership or adult connection must never imply automatic visibility.
- Recorded facts and converted display values must never be silently collapsed.

## Canonical fact creation (Ticket 6C)

Ordinary creation begins with a canonical fact picker for physical measurements, standard sizes, or the underlying fact of a brand/product record. Selection fixes its stable identifier, label, category, measurement type or size context, and permitted units/systems. A secondary custom path remains for uncommon facts; custom facts have no canonical identifier and may have fewer conversion and discovery conveniences.

Physical canonical facts form one ongoing history per profile. Standard sizes and brand/product facts may coexist where context differs and are never silently merged. Anatomy paths prepare later discovery but are not an interactive navigator.

Manual acceptance may use a genuine local primary profile. Such data remains browser-local or in an explicit local backup and never enters repository files, fixtures, documentation, published screenshots or diagnostic output. Tests and demo payloads remain synthetic.

## Canonical measurement guidance (Ticket 6D)

Priority canonical physical measurements resolve concise static guidance from their canonical definition. Guidance states where and how to measure, preparation, common mistakes, equipment and whether assistance is useful. It supports consistent record keeping only: it does not assess a body, set targets, offer medical advice, predict fit or adapt to a recorded value.

Creation and saved-record views reuse the same local guidance. Custom facts, sizes, brand/product facts and ambiguous legacy measurements do not inherit guidance by label. Guidance evolves as product content and is not copied into user records or backups.

Ticket 6E will define one coherent anatomy model and illustration family. Ticket 6F will add anatomy-based discovery. Future video tutorials may reference the same model family but no media feature is implemented by Ticket 6D.
