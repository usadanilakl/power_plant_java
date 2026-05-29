# Confined Space checkbox crops

One PNG per checkbox row (Hazards, Precautions, PPE) for the Confined Space form,
captured at normal zoom. Each crop starts at the checkbox; `ConfinedSpaceBuildFlow`
ticks at `match.x + 22, match.y + match.h/2` (same offset as Safe Work — measured
to be consistent on the Red Tag UI).

## Keys → pojo field

### Hazards (`ConfinedSpaceHazards`)
| crop | field |
|------|-------|
| haz-oxygen | oxygenDeficiency |
| haz-flammable | flammableGas |
| haz-combustible | combustibleDust |
| haz-toxic | toxicGas |
| haz-rotating | rotatingEquipment |
| haz-electrical | electricalShock |
| haz-entrapment | entrapment |
| haz-engulfment | engulfment |
| haz-heat-stress | heatStress |
| haz-other | other |

### Precautions (`ConfinedSpacePrecautions`)
| crop | field |
|------|-------|
| prec-ventilation | ventilation |
| prec-blank-flanged | blankFlanged |
| prec-double-block-bleed | doubleBlockAndBleed |
| prec-barriers | barriers |
| prec-other | other |

Plus two label+field anchors at `../`:
- `prec-lockout-tagout-label.png` — filled with `cs.getLotoNum()` (auto-set from
  the package's LOTO permit).
- `prec-hot-work-permit-label.png` — filled with `cs.getHotWorkNum()`.

### PPE (`ConfinedSpacePpe`)
| crop | field |
|------|-------|
| ppe-face-shield | faceShield |
| ppe-gcfi | fcfi |
| ppe-low-voltage | lovVoltageTools |
| ppe-explosion-proof | explosionProofTools |
| ppe-non-sparking | nonSparkingTools |
| ppe-fall-protection | fallProtection |
| ppe-retrieval | retrievalSystem |
| ppe-lifeline | lifeline |
| ppe-personal-meter | personalAtmosphericMeter |
| ppe-tripod | tripod |
| ppe-other | other |

## Deferred / not yet wired

- **Initial Test Results** section (meter readings) — only one section overview
  was captured; needs individual field-label crops to wire fully.
- **"Other" free-text descriptions** for hazards/precautions/PPE — the checkbox
  is ticked but the adjacent text field is not yet filled. Same pattern as the
  SW Other handling once a few measurements are taken.
- The CS tab crops (`../tab-permit-required.png`, `../tab-reclassified.png`)
  were cropped from the upper-bar screenshot; minor bleed at the boundaries but
  the distinctive text is intact — should match. Re-crop tighter if needed.
