# Sigma anatomy illustration system

`sigma-neutral-v1` is original repository work created for Sigma. It has no external source, attribution requirement, or third-party licence dependency. The calm, neutral contour family deliberately avoids demographic, sexualised, medical, fitness, or user-specific detail.

The static TypeScript registry owns model, region, orientation, anchor, overlay and canonical-fact mappings. User records and backups contain none of these values or asset paths. The single local SVG supplies related whole-body, head/neck, torso, upper-limb, hand/finger, lower-limb and foot symbols. Regional views reuse the same geometry, stroke construction and abstraction.

Orientation is explicit: front for bilateral/front landmarks, back for posterior landmarks, side for depth or body-following length, palm/top/sole for planar dimensions, and detail for small circumferences. Overlays use solid paths with different endpoint shapes for point-to-point measurements, repeated dashes for closed circumferences, lighter short dashes for hidden continuation, squares for landmarks, and arrows for direction. These distinctions supplement semantic theme tokens and remain visible without colour.

Every rendered SVG has a fact-specific title and instructional description; complete written guidance remains adjacent. SVG content has no controls or tab stops. The bounded responsive figure uses the same semantic CSS in light, dark, system and forced-colour modes.

Replacement requires preserving registry IDs, SVG symbol IDs, view boxes and instructional meaning. Art may be replaced without migration because canonical IDs and records never reference files. Ticket 6F may consume the same static regions and anchors for navigation, but no region in Ticket 6E is interactive. Future tutorial stills must remain in this model family or introduce a deliberately versioned replacement.
