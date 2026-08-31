# Adding LOTO points to a standard or permit (PWA)

Three ways in, for the three things a walker might actually know. All of them end at the same attach
call; they differ only in how you find the point.

| You know… | Route | Data |
| --- | --- | --- |
| The tag on the device | **+ Add by tag** | live hub lookup |
| Where you are standing | **🗺 Add from map → Map tab** | published snapshot (works offline) |
| Roughly what it is | **🗺 Add from map → Filters tab** | live search |

The tag route existed already and is unchanged. The other two are new, and they exist because the tag
route asks for something a weathered or missing label cannot supply.

The panel's two tabs mirror Plant → Finder deliberately — same shape, same filter semantics, so there
is one thing to learn rather than two.

## Map route

```
work area (map)  →  equipment picker (multi-select)  →  attach each  →  host reloads
```

- `WorkAreaMapSelectComponent` and `EquipmentPickerComponent` are both pre-existing; the new
  `LotoPointAttachComponent` only joins them to the two attach endpoints and reports the outcome.
- Choosing an area opens the picker immediately — the extra tap taught nobody anything.
- Inside the picker: grouped by equipment type, filtered by Location tabs, with tag/description word
  buckets, and **Search all equipment** for when the point is not where it was expected.

### Filters tab

The same five-field search as the Finder (`FinderFiltersComponent`, extracted from the Finder page so
the chip handling, the word-splitting rule and the suggestion race fix exist once rather than twice),
with two differences:

- **`lotoPointsOnly`** — the server skips the unreferenced-equipment query outright rather than
  filtering after the fact. Equipment cannot be attached to a standard or permit, so those rows would
  be unselectable noise that also ate into the 200-row cap and skewed the "showing first N" count.
- **Results are multi-select**, ticked in a list, with one **Add N selected** action.

It is a *live* query, which covers the Map tab's blind spot: the picker reads the published snapshot,
so a point created minutes ago on a desktop is not in it yet, but the Filters tab will find it.

### Multi-select

`EquipmentPickerComponent` gained `multiple` + `pointsSelected`. In that mode rows toggle instead of
closing the dialog, and a footer bar confirms the batch.

It is **not** a form control in multi mode: the CVA value is a single entry, and widening it would
change the contract for every existing consumer (Field List, Work Request, Finder map tab). Hosts that
want a batch use the output. Single-select behaviour is untouched.

Attaches run **sequentially, not in parallel** — each one mutates the same parent row and the desktop
service re-saves the whole aggregate, so concurrent writes would race to overwrite each other's point
list. A failure does not abort the rest: the walker gets a count plus the first reason.

## Create-new route

**+ Create a new point** from inside the map panel carries the area along:

- `?areaId=` puts that area's Location Values at the top of the Location dropdown (marked ★), and
  selects one outright when the area maps to exactly one. It never *constrains* the list — an area
  boundary is not always where the point lives.
- The tag box now checks **as you type** (450ms debounce) across the **whole hub**, not the chosen
  area — a duplicate filed under the wrong location is exactly the kind worth catching. It warns and
  offers the existing point to attach; it never blocks.
- `?addToStandard=` attaches on save (server-side, via `savePoint`). `?addToLoto=` is the permit twin;
  since `savePoint` has no permit parameter, the attach is a second call after the point is created —
  a failure there reports "point created, but adding it to the permit failed" rather than pretending.

## Authorization — server decides, always

Nothing in the picker re-implements a rule:

| Target | Rule | Enforced by |
| --- | --- | --- |
| Standard | CONTROL_AUTHORITY; approved standards capture a *proposal* instead of mutating | `NgLotoStandardService.addLotoPointToStandard` |
| Permit | CONTROL_AUTHORITY + structurally editable (Building or Modification, **never Test**) | `NgLotoService.addLotoPointToLoto` |

The PWA controller (`PwaLotoController.addPointToPermit`) only translates refusals: `SecurityException`
→ 403, status refusal → 409, missing row → 404. The UI shows the message the server sent.

Both entry buttons still sit behind the existing client-side gates — the standard's authoring row is
Draft / New-Pending-Reapproval only, and the permit button appears only on a Building or Modification
permit — but those are conveniences, not the enforcement.

Duplicates are safe on both paths: the standard checks `contains` first, and the permit's point set is
keyed by `LotoPointIdDto.equals`, which is id-based.

## Notes

- The picker reads the **published offline snapshot** (`data/loto-points.json`), so a point created
  minutes ago on a desktop may not appear in it yet. That is why the tag route stays — it queries the
  hub live. Both are offered side by side, deliberately.
- The permit entry lives on the read-only permit view (`/loto/:id`), which is also new — see the LOTO
  list fix that made Building and Active permits visible at all.

## Files

| Layer | File |
| --- | --- |
| Attach panel (both tabs) | `browser/ng-ui/src/app/features/loto-standard/loto-point-attach.component.ts` |
| Shared filter form | `browser/ng-ui/src/app/features/equipment-finder/finder-filters.component.ts` |
| Multi-select | `browser/ng-ui/src/app/shared/forms/equipment-picker/equipment-picker.component.ts` |
| Create form | `browser/ng-ui/src/app/features/loto-standard/loto-point-create.component.ts` |
| Permit endpoint | `controller/pwa/PwaLotoController.addPointToPermit` |
| Standard endpoint | `controller/pwa/PwaLotoStandardController.addPointToStandard` (existing) |
