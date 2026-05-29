# Hot Work checklist crops

One PNG per checklist row of the Hot Work form, captured at normal zoom. Each crop
starts at the **Y** checkbox and includes the **NA** checkbox + the row text.
`HotWorkBuildFlow.tickMeasure` matches the crop, then clicks:

- **Y** at `match.x + 25` when the `HotWorkMeasures` boolean is `true`
- **NA** at `match.x + 117` when it is `false`

(every row gets exactly one of the two — matching the legacy behaviour).

## Keys → HotWorkMeasures field

| crop | measure |
|------|---------|
| area-clean | areaIsClean |
| flammables-secured | flammablesAreSecured |
| no-combustible-dust | noCombustibleDustOrDebrisPresent |
| radiative-heat | radiativeHeatPreventiveMeasuresAreTaken |
| vessels-purged | vesselsArePurged |
| openings-covered | openingsAreCovered |
| duct-ventilation | ductVentilationIsSecured |
| lockout-completed | lockOutIsCompleted |
| communication | communicationIsEstablished |
| fire-watch-aware | fireWatchIsAwareOfDuties |
| fire-extinguisher | fireExtinguisherPresent |
| fire-protection | fireProtectionIsInService |

Source captures: `project/features/red-tag-automation/hot work/`.

Field labels (Location, Date, Person Performing Work, Name of Fire Watch, Test
Equipment Model #, Serial #, Cal Date, Fire Watch Required, Special Instructions)
and the section header live one level up in `../`.

## STILL NEEDED — Hot Work tab crop

`../tab.png` (the **Hot Work** tab in Red Tag's top bar) is not captured yet.
Until it's added, `openHotWorkForm` fails at the first click. The NEW PERMIT,
Issue-with-NO-Template, Save, and Permit-# patterns are shared with Safe Work and
reused as-is.
