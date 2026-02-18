# LOTO Point Bulk Search & Add

## Overview

Allows users to add multiple LOTO points to a LOTO standard at once by pasting tag numbers (text) or uploading an image of equipment labels. The system detects tag numbers, searches for matching LOTO points, and presents categorized results for selection.

---

## Architecture

### 1. TagNumberDetector Utility

**File**: [`TagNumberDetector.java`](../../../src/main/java/com/dk_power/power_plant_java/util/TagNumberDetector.java)

Spring `@Component` that extracts tag numbers from arbitrary text using ordered regex patterns with consumed-position tracking to prevent overlapping matches.

**Regex patterns** (applied in order, most specific first):
1. **Unit-prefixed with dashes**: `\d{2}-[A-Z][A-Z0-9]*(?:-[A-Z0-9]+){0,4}` - covers `01-ACC-HEX-01B`, `01-VBFW131`, `01-PCV-AXS713`, `01-HPL-1312-19`, `00-V-SWS001-JG`
2. **KKS format** (no dash after unit): `\d{2}[A-Z]{2,5}[A-Z0-9]{2,}...` - covers `01MAM30AA101-H01`, `02LCA14AA707`
3. **Fragments** (no unit prefix, marked PARTIAL): `[A-Z]{2,4}-\d{2,4}[A-Z]?` - covers `MPM-02B`, `CPL-06`

**Classification**: tags >= 8 chars = `FULL`, shorter = `PARTIAL`

**Noise filtering**: pure numbers, pure letters, known words (`NODATA`, `NO`), strings < 3 chars

**Output**: `List<DetectedTag>` where `DetectedTag(String rawText, String normalized, TagMatchType matchType)`

Tag number reference data (~11,910 samples): [`tag numbers.txt`](./tag%20numbers.txt)

### 2. Bulk Search Service

**File**: [`NgLotoPointService.java`](../../../src/main/java/com/dk_power/power_plant_java/sevice/angular/loto/NgLotoPointService.java) - `bulkSearchByText(String rawText)`

**Flow**:
1. Calls `TagNumberDetector.detectTagNumbers(rawText)` to get detected tags
2. Separates FULL vs PARTIAL detected tags
3. Batch queries FULL tags via `LotoPointRepo.findByTagNumberUpperIn()` (single query)
4. Groups results per tag:
   - 0 matches -> fallback to `findByTagNumberContaining` (LIKE query) -> if still 0: `notFound`
   - 1 match -> `exactMatches`
   - 2+ matches -> `duplicateMatches`
5. For PARTIAL tags: individual `findByTagNumberContaining` queries -> `partialMatches` or `notFound`
6. Returns `BulkSearchResultDto`

### 3. Image Text Extractor (standalone reusable component)

Separated into `shared/` for reuse across features. Handles: image upload -> OCR -> editable text -> submit.

**Backend endpoint**: `POST /images-api/extract-text` (multipart)
- **File**: [`ImageRestController.java`](../../../src/main/java/com/dk_power/power_plant_java/controller/image/ImageRestController.java)
- Saves uploaded file to temp, calls existing `OCRService.extractTextFromImage()`, deletes temp, returns plain text

**Frontend service**: [`image-text-extractor.service.ts`](../../../frontend/src/app/shared/image-text-extractor/image-text-extractor.service.ts)
- `extractText(imageFile: File): Observable<string>` - calls the OCR endpoint with `FormData`

**Frontend component**: [`image-text-extractor.component.ts`](../../../frontend/src/app/shared/image-text-extractor/image-text-extractor.component.ts)
- Standalone Angular component with signals
- **Output**: `textSubmitted` - emits user-edited text when submitted
- **UI flow**: file input -> image thumbnail preview -> loading spinner during OCR -> editable `<textarea>` with extracted text -> "Use This Text" button
- Does NOT know about tag numbers or LOTO - purely image -> editable text -> submit

### 4. Bulk Search Dialog Component

**Files**: [`bulk-search-dialog/`](../../../frontend/src/app/features/loto-points/refactored/bulk-search-dialog/)

Standalone Angular dialog following the `CounterpartStandardDialog` pattern (overlay + container).

**Outputs**: `pointsSelected: LotoPointDtoLight[]`, `dialogClosed: void`

**Two input tabs**:
- **Text tab**: `<textarea>` for pasting tag numbers + "Search" button
- **Image tab**: embeds `<app-image-text-extractor>`. When user submits extracted text, it auto-populates the textarea and triggers search.

**Result sections** (color-coded):
- **Exact Matches** (green header): checkbox per item, auto-selected after search. Shows tag number + description + unit.
- **Duplicate Matches** (yellow header): detected tag shown, radio-button selection among matching points. Selecting one auto-adds it to the selection.
- **Partial Matches** (blue header): checkbox per item, tag fragment + matched full point.
- **Not Found** (grey header): informational list, no checkboxes.

**Summary line**: "X items selected" with Select All / Deselect All controls

**Footer**: Cancel + "Add Selected" (disabled when 0 selected)

### 5. Bulk Search REST Endpoint

**File**: [`NgLotoPointController.java`](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/loto/NgLotoPointController.java)

```
POST /ng/loto-points/bulk-search
Body: { "text": "01-ACC-HEX-01B 02-VHLS811 FAKE-TAG-999" }
Returns: NgApiResponse<BulkSearchResultDto>
```

---

## DTOs

**Backend**:
- [`BulkSearchResultDto.java`](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/BulkSearchResultDto.java) - `searchText`, `exactMatches`, `duplicateMatches`, `partialMatches`, `notFound`, `totalDetectedTags`
- [`BulkSearchMatchDto.java`](../../../src/main/java/com/dk_power/power_plant_java/dto/permits/loto_point/BulkSearchMatchDto.java) - `detectedTag`, `matchType` (FULL/PARTIAL), `matchingPoints` (List of `LotoPointDtoLight`)

**Frontend**: [`bulk-search-result.model.ts`](../../../frontend/src/app/models/loto/bulk-search-result.model.ts) - TypeScript interfaces mirroring backend DTOs

---

## Repository Addition

**File**: [`LotoPointRepo.java`](../../../src/main/java/com/dk_power/power_plant_java/repository/loto/LotoPointRepo.java)

```java
@Query("SELECT lp FROM LotoPoint lp WHERE UPPER(lp.tagNumber) IN :tagNumbers")
List<LotoPoint> findByTagNumberUpperIn(@Param("tagNumbers") Collection<String> tagNumbers);
```

Batch query for efficient exact matching of multiple tags in a single DB call.

---

## Integration Points

### RfLotoStandardFormComponent (carousel form)

**Files**: [`rf-loto-standard-form.component.ts`](../../../frontend/src/app/features/loto-standard/refactored/rf-loto-standard-form/rf-loto-standard-form.component.ts) / [`.html`](../../../frontend/src/app/features/loto-standard/refactored/rf-loto-standard-form/rf-loto-standard-form.component.html)

- "Bulk Add" button on Slide 2 (LOTO Points tab), visible when entity has an ID
- Opens `<app-bulk-search-dialog>` as overlay
- `onBulkPointsSelected(points)` converts `LotoPointDtoLight[]` to `LotoPointDto[]` and calls existing `onLotoPointAdded(dto)` for each point (which handles both local state update and API persistence)

### SimpleLotoFormComponent (builder form)

**Files**: [`simple-loto-form.component.ts`](../../../frontend/src/app/features/loto-standard/refactored/loto-builder/simple-loto-form/simple-loto-form.component.ts) / [`.html`](../../../frontend/src/app/features/loto-standard/refactored/loto-builder/simple-loto-form/simple-loto-form.component.html)

- "Bulk Add" button next to "LOTO Points" label
- Opens `<app-bulk-search-dialog>` as overlay
- `onBulkPointsSelected(points)` converts `LotoPointDtoLight[]` to `LotoPointDto[]` and emits `bulkAddPoints` output (parent handles API calls)

---

## File Index

| File | Type | Description |
|------|------|-------------|
| `util/TagNumberDetector.java` | New | Tag number detection utility |
| `dto/permits/loto_point/BulkSearchResultDto.java` | New | Result DTO |
| `dto/permits/loto_point/BulkSearchMatchDto.java` | New | Match DTO |
| `repository/loto/LotoPointRepo.java` | Modified | Added `findByTagNumberUpperIn` |
| `sevice/angular/loto/NgLotoPointService.java` | Modified | Added `bulkSearchByText` method |
| `controller/image/ImageRestController.java` | Modified | Added `POST /images-api/extract-text` |
| `controller/angular/loto/NgLotoPointController.java` | Modified | Added `POST /ng/loto-points/bulk-search` |
| `frontend/.../models/loto/bulk-search-result.model.ts` | New | TS interfaces |
| `frontend/.../shared/image-text-extractor/` (4 files) | New | Reusable OCR component + service |
| `frontend/.../bulk-search-dialog/` (3 files) | New | Dialog component |
| `frontend/.../rf-loto-standard-form.component.*` | Modified | Button + dialog + handler |
| `frontend/.../simple-loto-form.component.*` | Modified | Button + dialog + handler |
