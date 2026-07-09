# Product Specification

Sigma is a private, local-first personal and family measurement vault. It records what the user knows; it does not tell the user what should fit.

## In scope product concepts
- Personal memory: body measurements, clothing sizes, footwear sizes, wearable sizes, jewellery sizes, equipment sizes, specialist sizing, brand-specific fit facts, product-specific fit facts, history and provenance.
- Family/trusted-person use: independent profiles, managed profiles for children/dependants, connected independent adults, trusted groups and future explicit sharing.
- Records: physical measurements, standardised size records, brand/product-specific fit records and historical values.
- Conversions: exact mathematical conversions and recognised standard-equivalent lookup conversions may be shown while preserving the original recorded value.

## Non-goals
Sigma is not a fitness tracker, health-analysis app, weight-loss app, medical diagnosis system, fashion or fit recommendation engine, or social network.

## Current demo scope
Ticket 1 provides only the app shell, navigation, theme preference and constitutional documentation. It does not implement profile persistence, measurement records, conversions, Family logic, sharing, payments, sync or integrations.

## Durable rules
- Local data is authoritative for the demo.
- No account, cloud, telemetry, analytics or advertising is required for normal use.
- User-entered data belongs to the user and must remain exportable/deletable by future design.
- Family membership or adult connection must never imply automatic visibility.
- Recorded facts and converted display values must never be silently collapsed.
