# Ticket 6E manual acceptance

Use synthetic data only. Run `npm run dev`, then exercise Waist circumference, Shoulder width, Inseam, Finger circumference and Foot length in creation and saved-record guidance. Confirm entry precedes the initially closed disclosure; closing and reopening it preserves value, unit, date, source and notes. Confirm circumference, point-to-point, vertical/curved, endpoint and landmark conventions match the adjacent text.

Share one synthetic canonical measurement read-only, verify only its authorised record and guidance are visible, revoke it, and verify both disappear. Custom and non-canonical legacy facts must show no canonical art.

Review light, dark and system themes at 360, 768, 1024 and 1440 CSS pixels. Check bounded figures, no page overflow or clipping, readable markers, and no white asset rectangle. At 200% zoom and with forced colours, paths must remain distinguishable by dashes, shapes and labels as well as colour.

Using keyboard only, open and close both guidance disclosures. Focus must remain predictable and no SVG child may enter the tab order. Inspect the accessibility tree: each meaningful SVG is named by its fact-specific title and description, while complete instructions remain ordinary adjacent text.

Automated structure checks accompany this checklist. Record real-browser results honestly; automated checks alone are not visual acceptance.

## Limited masculine standalone test

Use synthetic data and confirm each “How to measure” disclosure starts collapsed. For Height, open guidance and verify the masculine side figure appears with a vertical path from floor to crown; no prototype figure or floating overlay may appear. For Waist circumference, confirm `cm` remains the default, enter synthetic form data, open guidance, and verify the masculine front figure and natural-waist circumference appear without clearing any field. For Shoulder width, open guidance and verify the masculine back figure has a shoulder-point-to-shoulder-point line.

Repeat all three in light and dark themes at 360 CSS pixels and desktop width. Confirm tight useful framing, no horizontal overflow, readable paths and no white asset background. With the development server, also force an asset request failure and confirm the written guidance remains, the overlay is absent, and a development failure message is visible.

Overlay correction review: Height uses crown and floor leaders to a beside-body vertical guide; Waist remains centred on the illustrated natural waist; Shoulder width uses the outer acromion points below the neck/trapezius line. Standalone markers and strokes are reduced without changing prototype diagrams.

Browser review completed 2026-08-05 in light and dark themes at desktop width and 360 CSS pixels. All three assets rendered inline without overflow; Height spanned crown to floor beside the body, Waist crossed the natural waist, and Shoulder width joined the outer shoulder points below the trapezius. Markers remained legible without obscuring the artwork.

## Ticket 6E1 family comparison

On localhost, compare `?anatomyFamily=feminine`, `?anatomyFamily=masculine`, and `?anatomyFamily=neutral`; an absent or unknown value must use Neutral. For Feminine Height, verify the side figure and right-side crown-to-floor guide. For Waist circumference, retain synthetic form input and `cm` while opening guidance, then verify the loop crosses the natural waist. For Shoulder width, verify the back-view line joins the outer acromion points below the trapezius. Repeat at desktop and 360 CSS pixels in light and dark themes. Confirm Masculine remains aligned, Neutral still uses its prototype symbols, unrelated facts fall back to Neutral, and no selection appears in Settings, storage, or backup output.

Browser review completed 2026-08-06 in light and dark themes at desktop width and 360 CSS pixels. Feminine Height, Waist circumference and Shoulder width rendered their inline V1 assets without horizontal overflow or external sprite references; the height guide sat to the right from crown to floor, the waist loop crossed the natural waist, and the shoulder line joined the outer acromion points. Guidance remained collapsed by default, and opening or closing it preserved synthetic form input and the `cm` unit. The masculine localhost query continued to load its standalone side asset, while an absent query used the Neutral prototype symbol. Asset-request failure remains covered by the focused validator tests rather than a forced browser-network failure in this review.

## Ticket 6E2 Neutral standalone comparison

On localhost, open `?anatomyFamily=neutral` and test Height, Waist circumference and Shoulder width with synthetic data. Confirm each disclosure starts collapsed and opens an inline Neutral V1 asset without `/anatomy-model.svg#...`: Height uses a beside-body crown-to-floor guide, Waist crosses the narrow natural waist while retaining entered fields and the default `cm` unit, and Shoulder width joins the outer acromion points below the neck/trapezius area. Repeat at desktop and 360 CSS pixels in light and dark themes, checking framing, overflow, marker scale and transparent/current-theme rendering. Regression-check the same facts with `?anatomyFamily=masculine` and `?anatomyFamily=feminine`. Confirm an unrelated Neutral fact still uses the transitional prototype sprite, unknown query values safely use Neutral, and no family selection appears in settings, persistence or backup output.

Browser review completed 2026-08-06 in light and dark themes at desktop width and 360 CSS pixels. All three Neutral V1 assets hydrated inline without external sprite references or horizontal overflow. Height aligned crown and floor to a left-side guide, Waist crossed the narrow torso between ribs and hips while preserving synthetic input and `cm`, and Shoulder width joined the outer shoulder points below the neck. Masculine and Feminine remained hydrated and aligned for all three representative facts; Foot length retained the Neutral prototype sprite, and an unknown query value resolved to the standalone Neutral Height asset.
