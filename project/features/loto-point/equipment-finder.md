# Equipment Finder (PWA)

Find a LOTO point or a piece of equipment from what you can remember about it, then open its P&ID
with that item highlighted. Lives under the Plant section at `/plant/equipment-finder`.

The page has two entry tabs:

- **Filters** — the five-field server search described below.
- **Map** — select a Work Area, then browse the LOTO points associated through that area's Location
  Values. Selecting a point opens the same drawing flow as a Filters result.

## Filters

Five boxes, each a **bucket of words** with its own AND/OR mode:

| Box | LOTO point field | Equipment field |
| --- | --- | --- |
| Location | `location.name` **or** `generalLocation` | `location.name` |
| Equipment type | `eqType.name` | `eqType.name` |
| Specific location | `specificLocation` | `specificLocation` |
| Tag number | `tagNumber` | `tagNumber` |
| Description | `description` | `description` |

- **A typed phrase splits into words** on whitespace and commas. This is the whole point of a bucket:
  typing `455 cnd` searches for two fragments, which finds the tag `1CND455`. Treating it as one
  literal string finds nothing, since no tag contains a space followed by `cnd`.
- **Within a box**: words combine by that box's mode — `all` (AND, the **default**) or `any` (OR).
  AND is the default because typing more words is how people narrow a search; `455 cnd` only finds
  1CND455 if both fragments must appear.
- **Across boxes**: always AND. Words narrow within a field, boxes narrow across fields.
- Each word matches as a **case-insensitive substring**. Typed `%` and `_` are literals, not wildcards.
- A word picked from a dropdown is added **verbatim, unsplit** — "Boiler Building" stays one term
  rather than becoming two fragments to hunt separately.
- An empty box is ignored, not treated as "match everything". A request with no words anywhere returns
  nothing rather than the whole plant.

Location is the one asymmetric field: a LOTO point also matches its free-text `generalLocation`,
because the plant records a location there on older rows and in the `location` Value on newer ones.

## Dropdowns

**Location** and **Equipment type** stay free text, with a suggestion list that appears as you type —
a shortcut to a known name, never a constraint, because plenty of rows have a location that was typed
rather than picked.

Options come from the Value lists the LOTO walkdown already serves
(`GET /api/pwa/secured/loto-standards/positions`, categories `location` and `eqType`) — same audience,
same Values, no new endpoint. Those are the very Values these columns point at: `NgEquipmentService`
copies `location`/`eqType` onto equipment straight from its LOTO point, so a suggested name can always
match. If the list fails to load, the boxes are still free text and the search is unaffected.

The list is bound to `pointerdown`, not `click`: a click is preceded by blur, which would close the
list and cancel the tap.

## What comes back

LOTO points first (by tag), then equipment. **Equipment appears only when no LOTO point references
it** — a referenced equipment row *is* the LOTO point's occurrence on a drawing, so listing both would
show one physical thing twice under two names.

That check is an explicit `NOT EXISTS` over `LotoPoint`, not `isEmpty(lotoPoints)`: the subquery root
applies LotoPoint's `@Where` soft-delete filter, so equipment whose only references are deleted points
correctly reads as unreferenced. The collection form would still count the stale join rows.

Capped at 200 rows (max 500 on request), but the counts returned are of the **full** match set, so the
list says "showing first 200" instead of silently truncating. `hasDrawing` is resolved in one query per
type rather than per row — walking each point's equipment collection would drag every Equipment and its
eager `mainFile` into memory just to render a badge.

## Map equipment picker

The shared equipment picker used by Field List items, Work Requests, and the Finder Map tab opens as
a browser modal in the top layer. It therefore stays in the current viewport even when its trigger is
inside a scrolled or transformed form component.

For a selected Work Area it shows equipment grouped by Equipment Type. When that area contains more
than one Location Value, a horizontal tab row narrows the groups to **All** or one Location. Common
leading words are removed from the visible tab labels (`HRSG Lower West/East/North` becomes
`West / East / North`); the full Value name remains available as the tab title.

Both the area list and the **Search all equipment** view use two independent word buckets:

- Tag number
- Description

Words inside either bucket default to AND (`all`) and can be switched to OR (`any`). If both buckets
are populated they combine with AND, matching the main Finder semantics. Area/location filtering is
applied before these word buckets.

## Opening a row

Rows resolve by **type + id**, never by tag: a row can be equipment whose tag *also* belongs to a LOTO
point, and a tag lookup would open the point instead of the thing that was tapped.

```
tap row → GET /api/pwa/secured/qr/item/{type}/{id}   → QrMatchDto (drawings)
        → QrDrawingHostComponent                     → viewer + connectors + back stack
```

Everything from "here are the drawings" onward is shared with the scanned-label flow — see
[qr-scan-flow.md](qr-scan-flow.md). `QrDrawingHostComponent` was extracted from the QR page for exactly
this: two entry points, one implementation of connector-hopping and the back stack.

## Files

| Layer | File |
| --- | --- |
| API | `controller/pwa/PwaEquipmentFinderController.java` (`POST /api/pwa/secured/equipment-finder/search`) |
| Search | `sevice/pwa/PwaEquipmentFinderService.java` |
| Item → drawings | `sevice/pwa/PwaQrService.resolveItem` |
| Authz | `config/SecurityConfigSpring.java` — `/api/pwa/secured/equipment-finder/**` → PLANT/ADMIN |
| PWA page | `browser/ng-ui/src/app/features/equipment-finder/` |
| Shared viewer host | `browser/ng-ui/src/app/features/qr/qr-drawing-host.component.ts` |
| Nav | `models/menu/nav.model.ts` — Plant section, `access: 'plant'`, `hubOnly` |

POST rather than GET because five word-buckets with per-box modes do not fit a query string without
inventing an encoding. It is read-only; nothing here writes.

## Notes

- The nav tile is `hubOnly`: this is a live query with no offline cache. The **drawings** it opens do
  cache, through `QrApiService` and `LotoDrawingService`.
- The filter inputs deliberately do **not** commit on blur. Committing turns a word into a chip, which
  adds a row above the buttons, and blur fires before the click that caused it — so tapping Search with
  a half-typed word would move the button out from under the finger. `search()` folds uncommitted text
  in instead, so nothing is lost.
