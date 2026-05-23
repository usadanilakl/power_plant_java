# Safe Work label crops

58 cropped PNGs — one per checkbox label on the **zoomed-out** SW form.
Used by `SafeWorkBuildFlow` to find each checkbox via SikuliX image match
(no runtime OCR). Click position = `match.x + 12, match.y + match.h/2`
(the crop includes ~25 px of pixels left of the label, where the checkbox lives).

## How they were generated

Hand-cropped from `project/features/red-tag-automation/screenshots/permits/zoomed out sw form view.png`
by the test `HandCropSwLabelsIT` using measured grid coordinates:

- **Hazards** (29 rows): `Y0 = 402`, pitch = 23, 3 columns at `x = {820, 1100, 1405}`, width 275.
- **Permits** (12 rows): `Y0 = 685`, pitch = 23, 3 columns at `x = {820, 1100, 1405}`, width 275.
- **PPE** (17 rows): `Y0 = 843`, 4 columns at `x = {820, 1020, 1250, 1480}`, width 200.
  PPE is **not** uniform — cols 2/3/4 have `Type [input]` sub-rows between checkboxes,
  so each row's y-offset is specified explicitly. See `HandCropSwLabelsIT.PPE_COL*`.

OCR-based auto-generation (`SwLabelPatternGenerator`) does **not** work on this
screenshot — Tesseract gives up on text ~9 px tall. Kept as code in case a
higher-zoom screenshot is captured later. Hand-crop is the source of truth.

## Why this approach (vs OCR at runtime)

The previous runtime OCR approach had two structural failure modes:

1. **Per-column bbox variance** — Tesseract returns slightly different bounding
   boxes for asterisked vs non-asterisked labels, so a single "column gap"
   constant clicks correctly in one column and misses in others.
2. **Adjacent column merging** — Tesseract sometimes joins text from two columns
   into one line, causing multiple checkboxes to map to the same Y.

Per-checkbox image matching avoids both — each crop is a unique 200-px-wide
slice that only matches its row.

## To regenerate / fix a specific crop

Edit coordinates in `src/test/java/.../HandCropSwLabelsIT.java`, then run:
```
mvn -Dtest=HandCropSwLabelsIT -DskipTests=false -DfailIfNoTests=false test
```

To verify visually, run:
```
mvn -Dtest=InspectSwLabelsIT -DskipTests=false -DfailIfNoTests=false test
```
This stitches all 58 crops into `target/sw-inspect/labels-mosaic.png` so you
can scroll through them next to their key names.

## Known caveats

- Hazards (29) and Permits (12) crops are visually verified — all show the
  expected label with checkbox visible at the left.
- PPE col 1 (Hardhat..Welding PPE) verified.
- PPE cols 2/3/4 use explicit y-offsets to skip sub-input rows; some entries
  may still be slightly off in the source screenshot. If a particular PPE
  checkbox isn't ticked at runtime, the log will show
  `[RedTag SW] label crop 'X' not found` — adjust the `yOffset` for that entry
  in `HandCropSwLabelsIT` and regenerate.
- Missing/wrong crops are non-fatal: `SafeWorkBuildFlow.tickLabel` logs a
  warning and continues. The operator can hand-tick anything the automation
  skips, then continue the build.
