# Sigma anatomy illustration system

The `neutral` V1 family is original repository work created for Sigma. It has no external source, attribution requirement, or third-party licence dependency. The calm contour family deliberately avoids demographic, sexualised, medical, fitness, or user-specific detail.

The static TypeScript registry owns model, region, orientation, anchor, overlay and canonical-fact mappings. Each used symbol has its own typed anchor-coordinate map. Every fact declares a discriminated geometry definition—start/end, curved intermediate anchors, circumference centre and radii, landmark and rear-path semantics, or tool anchor—and rendering resolves coordinates only through that selected symbol. Missing coordinates fail rather than producing a floating generic path. User records and backups contain none of these values or asset paths.

The single local SVG supplies deliberate whole-body, head/neck, torso, upper-limb, hand/finger, lower-limb and foot drawings. Front, back and side views share contour language and proportions but are separately drawn. Foot top and sole use dorsal and plantar outlines; neither is a rotated side profile.

Orientation is explicit: front for bilateral/front landmarks, back for posterior landmarks, side for depth or body-following length, palm/top/sole for planar dimensions, and detail for small circumferences. Overlays use solid paths with different endpoint shapes for point-to-point measurements, repeated dashes for closed circumferences, lighter short dashes for hidden continuation, squares for landmarks, and arrows for direction. The compact visible key is generated from the active geometry and never lists absent semantics.

Every rendered SVG has a fact-specific title and instructional description; complete written guidance remains adjacent. SVG content has no controls or tab stops. The bounded responsive figure uses the same semantic CSS in light, dark, system and forced-colour modes.

Replacement requires preserving registry IDs, SVG symbol IDs, view boxes and instructional meaning. Art may be replaced without migration because canonical IDs and records never reference files. Ticket 6F may consume the same static regions and anchors for navigation, but no region in Ticket 6E is interactive. Future tutorial stills must remain in this model family or introduce a deliberately versioned replacement.

Canonical illustration definitions own measurement meaning, wording, region, orientation, and overlay semantics. Separate versioned family assets own paths, viewBoxes, anchors, optional guides, and coordinate-specific circumference dimensions. The permanent presentation IDs are `neutral`, `masculine`, and `feminine`; asset version is independent.

Masculine and Feminine standalone V1 assets map only Height, Waist circumference, and Shoulder width. Feminine head front/side assets are registered for future use without canonical mappings. Browser hydration fetches and parses each local file, namespaces internal SVG IDs, inserts its drawing into the fact SVG, and reveals the overlay only after validation. A failure keeps the overlay hidden and leaves adjacent written guidance available. Unsupported mappings use Neutral. Family selection is development-only presentation state and never enters records, backups, profiles, or preferences.
