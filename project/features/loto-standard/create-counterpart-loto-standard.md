# Generate Counterpart LOTO Standard

## Functionality

User selects an existing LOTO Standard and initiates counterpart generation. The system finds the matching counterpart LOTO point for each point in the source standard and presents a categorized preview for user review before saving.

### Counterpart Resolution Logic (Backend)

For each LOTO point in the source standard:
1. **Tag doesn't start with 01 or 02** - classified as `non-counterpart`, kept as-is
2. **counterpartId is set** - fetch the counterpart entity, classified as `confirmed`
3. **counterpartId not set** - swap unit prefix in tag (01<->02) and search by tag number:
   - 1 match found - classified as `suggested`
   - Multiple matches - classified as `suggested` with `hasMultipleMatches=true`, all matches available for selection
   - No match - classified as `original`, source point kept as-is

### Preview Dialog Sections

Items are displayed in 4 color-coded sections:
- **Confirmed** (green) - counterpart ID was set on the source point
- **Suggested** (yellow) - found by tag number lookup; multiple matches shown as selectable options
- **No Counterpart Found** (orange) - tag starts with 01/02 but no match found; shows original point
- **Non-Unit Items** (gray) - tag doesn't start with 01/02; included unchanged

### Item Actions

| Category         | Use Original | Remove |
|------------------|:----------:|:------:|
| confirmed        | Yes        | Yes    |
| suggested        | Yes        | Yes    |
| original         | No         | Yes    |
| non-counterpart  | No         | Yes    |

- **Remove** - deletes the item from the list
- **Use Original** - reverts the item to the source LOTO point (moves it to "original" category)
- **Select Match** (suggested with duplicates) - pick which match to use from a dropdown

### Accept Flow

User edits the name/description, reviews the list, then clicks "Accept & Create Standard":
1. New standard created via `POST /ng/loto-standards` with collected loto point IDs and source groups
2. Points reordered via `PUT /ng/loto-standards/{id}/reorder-loto-points` to preserve user ordering
3. Full standard reloaded and emitted to parent

### Access Points

- **Table context menu**: right-click a standard -> "Generate Counterpart"
- **Form**: "Generate Counterpart" button in the General Info slide (only for saved standards)

---

## Implementation

### Backend

| File | Description |
|------|-------------|
| `dto/permits/loto_standard/CounterpartStandardPreviewDto.java` | Preview DTO with nested `CounterpartItemDto` |
| `sevice/angular/loto/NgLotoStandardService.generateCounterpartPreview()` | Resolution logic - categorizes each point |
| `controller/angular/loto/NgLotoStandardController` | `GET /{id}/counterpart-preview` endpoint |

### Frontend

| File | Description |
|------|-------------|
| `models/loto/counterpart-standard-preview.model.ts` | TypeScript interfaces |
| `services/rf-loto-standard-api.service.ts` | `generateCounterpartPreview()` API call |
| `counterpart-standard-dialog/` | Dialog component (ts + html + css) |
| `services/loto-standard-context-menu.service.ts` | "Generate Counterpart" menu action + `counterpartDialogSourceId` signal |
| `rf-loto-standard-page/` | Hosts dialog, handles `standardCreated` event |
| `rf-loto-standard-form/` | "Generate Counterpart" button in extra-buttons slot + dialog |
