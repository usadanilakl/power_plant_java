# Safe Work label crops

One PNG per checkbox label on the SW form, captured at the form's **normal zoom**
(the zoom the automation now runs at — it scrolls to each section instead of
zooming out). `SafeWorkBuildFlow` finds each by SikuliX image match and clicks
the checkbox at `match.x + 22, match.y + match.h/2` (offset measured from these
crops — the checkbox spans ~x=0..44 of each crop).

## Source

Hand-captured by the operator (2026-05-28) and identified/renamed from the
originals in `project/features/red-tag-automation/safe work/{hazards,permits,ppe}/`.
58 checkbox crops + 5 special crops below.

## Special crops (free-text fields, not checkboxes)

These accompany a checkbox and feed the free-text fill logic:

- `respirator-type-combined.png`, `gloves-type-combined.png` — reference captures
  showing the "Type" field under Respirator/Dust Mask and Protective Gloves.
  Used to measure the field offset (`FIELD_BELOW_DX/DY` in SafeWorkBuildFlow);
  the runtime ticks the checkbox crop then clicks the field at that offset.
- `arc-flash-class-field.png` — the "Class/Cal Rating" field under Arc Flash.
- `fall-clearance-field.png` — the "Fall Clearance" field under Fall Protection.
- `voltage-field.png` — the "Voltage" field under Testing/Troubleshooting.

`voltage-field`, `arc-flash-class-field` and `fall-clearance-field` ARE matched
directly at runtime (`fillAnchoredField`): each crop shows the label + an EMPTY
field, which matches the empty runtime field; we then click near the crop's right
edge to land in the box and paste. The two Respirator/Gloves "Type" combined crops
are NOT matched directly (the gloves one has prefilled sample text) — those use a
measured offset down-right from the checkbox crop instead.

## Free-text field wiring (SafeWorkBuildFlow)

- `fillFieldBelow(checkbox, text)` — Type (respirator, gloves), Class/Cal Rating,
  Fall Clearance, Voltage. Clicks `+120,+80` from the checkbox-crop match.
- `fillFieldRight(checkbox, text)` — permit "#" descriptions (LOTO/Hot Work/
  Confined Space/Energized WP/Venting), Weather Hazard desc, and the three
  "Other" descriptions. Clicks near the crop's right edge (the crop includes the
  input box).

Both no-op when the box wasn't ticked or the text is blank.

## Section headers (../)

`../hazards-header.png`, `../permits-header.png`, `../ppe-header.png` were
re-cropped at normal zoom from the whole-section screenshots; used as
scroll-to-section targets and region bounds.

## Header / footer field labels (../) — done at normal zoom

`../date-issued-label.png`, `../location-label.png`, `../description-label.png`,
`../special-instructions-label.png`, `../requestor-label.png` were re-cropped at
normal zoom from `safe work/header.png` and `safe work/footer.png`. The
label→field offset constants in SafeWorkBuildFlow (DATE_FIELD_DY=55,
LOCATION_FIELD_DX=310, DESCRIPTION_FIELD_DX=420, SPECIAL_INSTR_DY=76,
REQUESTOR_FIELD_DX=106/DY=40) were measured from the detected field rectangles in
those screenshots. Verify at runtime; nudge a constant if a paste lands off-field.

## Regenerate / verify

To stitch all crops into one mosaic for visual review:
`mvn -Dtest=InspectSwLabelsIT -DskipTests=false -DfailIfNoTests=false test`
→ `target/sw-inspect/labels-mosaic.png`.
