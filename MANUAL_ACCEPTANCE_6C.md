# Ticket 6C manual acceptance

Use a local browser profile. Genuine primary-profile data may be used, but must remain in browser storage or an explicit private local backup. Do not attach or publish screenshots containing it.

Test at 360, 768, 1024 and 1440 CSS pixels in both light and dark themes. Confirm there is no horizontal scrolling, forms remain usable, and bottom navigation does not cover save controls. Repeat with reduced motion; transitions should be suppressed. Complete picker and cancellation using Tab, Shift+Tab, arrows, Enter and Space, confirming visible focus and return focus to Add record.

## Journeys

1. Existing real profile: reopen schema-3 data and confirm profiles, labels, values, history, corrections, provenance and sharing remain. Ambiguous records remain visible without relabelling.
2. Collar: Add record, choose Standard size, search `collar`, select Collar size, confirm category and label are derived, choose an offered system, save and retrieve. Repeat with Neck circumference under Physical measurement when appropriate.
3. Existing measurement: select a canonical physical fact already present. Confirm Sigma reports that it exists; use Update value and confirm history remains.
4. Shoe size: select Shoe size, confirm footwear systems only, save, and confirm approximate equivalents remain separate from the recorded fact.
5. Brand/product: choose Shoe size as underlying fact, enter synthetic brand/product data, and confirm derived context with no recommendation.
6. Custom: open Create custom fact, save an uncommon invented fact, and confirm no unsupported conversion is fabricated.
7. Sharing: share one canonical record with a connected synthetic profile, confirm only that read-only record is visible, revoke, and confirm access disappears.

Before committing, inspect the diff and staged content for real personal data.
