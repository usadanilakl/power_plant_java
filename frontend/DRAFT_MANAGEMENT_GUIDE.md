# Draft Management System - Implementation Guide

## Overview

The enhanced draft management system now supports:
- ✅ Storing drafts for both **new** and **existing** loto points
- ✅ Maintaining up to **20 most recent drafts**
- ✅ **Side-by-side comparison** of current vs draft versions for existing items
- ✅ **Auto-save** drafts on form changes (with debouncing)
- ✅ **Automatic draft cleanup** on successful form submission

## Architecture

### 1. Base Draft Service (`BaseDraftService<T>`)

Located at: [base-draft.service.ts](src/app/shared/draft/base-draft.service.ts)

**Purpose:** Generic, reusable draft management logic for any entity type

**Key Features:**
- Type-safe generic implementation with `<T>`
- Stores drafts with metadata (timestamp, entityId, isNewItem)
- Maintains FIFO queue of max 20 drafts
- Unique draft per entity (updates existing draft if found)
- Helper methods for draft age calculation
- Abstract class - must be extended by entity-specific services

**Generic Interface:**
```typescript
export interface DraftMetadata<T = any> {
  id: string;                    // Unique draft ID
  entityId: number | null;       // null for new items, ID for existing
  timestamp: string;             // ISO timestamp
  formData: Partial<T>;          // Generic form data
  isNewItem: boolean;
}
```

**Abstract Methods (must implement):**
- `protected abstract readonly DRAFTS_KEY: string` - LocalStorage key
- `protected abstract getEntityId(draft: Partial<T>): number | null` - Extract ID

**Public Methods (inherited):**
- `saveDraft(draft)` - Save/update draft
- `loadDraft(entityId)` - Load draft for specific item
- `getAllDrafts()` - Get all drafts (sorted by timestamp)
- `clearDraft(entityId)` - Clear specific draft
- `clearAllDrafts()` - Clear all drafts
- `hasDraft(entityId)` - Check if draft exists
- `getDraftAge(draft)` - Get human-readable age ("5 minutes ago")

### 2. Entity-Specific Services

#### LotoPointLocalStorageService

Located at: [rf-loto-point-local-storage.service.ts](src/app/features/loto-points/refactored/services/rf-loto-point-local-storage.service.ts)

**Implementation:**
```typescript
@Injectable({ providedIn: 'root' })
export class LotoPointLocalStorageService extends BaseDraftService<LotoPointModel> {
  protected readonly DRAFTS_KEY = 'loto-point-drafts';

  constructor(localStorageService: LocalStorageService) {
    super();
    this.localStorageService = localStorageService;
  }

  protected getEntityId(draft: Partial<LotoPointModel>): number | null {
    return draft.id || null;
  }
}
```

#### FileLocalStorageService

Located at: [rf-file-local-storage.service.ts](src/app/features/files/refactored/services/rf-file-local-storage.service.ts)

**Implementation:**
```typescript
@Injectable({ providedIn: 'root' })
export class FileLocalStorageService extends BaseDraftService<FileModel> {
  protected readonly DRAFTS_KEY = 'file-drafts';

  constructor(localStorageService: LocalStorageService) {
    super();
    this.localStorageService = localStorageService;
  }

  protected getEntityId(draft: Partial<FileModel>): number | null {
    return draft.id || null;
  }
}
```

**Adding draft support to new entities:**
1. Extend `BaseDraftService<YourEntityModel>`
2. Define `DRAFTS_KEY` (unique per entity)
3. Implement `getEntityId()` method
4. Done! All draft methods available

### 2. State Service (`RfLotoPointStateService`)

Located at: [rf-loto-point-state.service.ts](src/app/features/loto-points/refactored/services/rf-loto-point-state.service.ts)

**New Methods:**
- `loadDraftForItem(lotoPointId)` - Load draft metadata
- `hasDraftForItem(lotoPointId)` - Check draft existence
- `clearDraftForItem(lotoPointId)` - Remove draft

### 3. Draft Comparison Dialog

Located at: [draft-comparison-dialog](src/app/features/loto-points/refactored/draft-comparison-dialog/)

**Purpose:** Shows side-by-side comparison for existing items with drafts

**Features:**
- Highlights modified fields
- Shows draft age
- Three actions:
  - **Use Current (Discard Draft)** - Load server version, delete draft
  - **Continue with Draft** - Load draft version, keep in localStorage
  - **Cancel** - Close dialog without action (keeps draft)

### 4. Form Component Integration

Located at: [rf-loto-point-form.component.ts](src/app/features/loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component.ts)

**Workflow:**

```typescript
// On form open (effect triggered when entity changes):
1. Check if draft exists for this loto point
2. If NEW item with draft → Auto-load draft
3. If EXISTING item with draft → Show comparison dialog
4. User chooses: Current, Draft, or Cancel

// On form value change:
1. Auto-save to localStorage (debounced)
2. Updates existing draft or creates new one

// On form submit:
1. Clear draft from localStorage
2. Submit form data to server
```

## User Experience Flows

### Flow 1: Creating New Loto Point

```
1. User opens form to create new loto point
2. User starts filling fields → Draft auto-saves
3. User closes form without submitting
4. User reopens form later
   → Draft auto-loads (no dialog)
5. User submits → Draft cleared
```

### Flow 2: Editing Existing Loto Point

```
1. User opens existing loto point (ID: 123)
2. User makes changes → Draft auto-saves
3. User closes form without submitting
4. User reopens same loto point
   → Comparison dialog appears
   → Shows current vs draft side-by-side
5. User chooses:
   - "Use Current" → Draft deleted, current loaded
   - "Continue with Draft" → Draft loaded, can continue editing
   - "Cancel" → Dialog closes, draft kept in storage
```

### Flow 3: Draft Auto-Cleanup

```
- Maximum 20 drafts stored
- Oldest drafts automatically removed (FIFO)
- Drafts cleared on successful submit
- One draft per loto point (updates if exists)
```

## Code Examples

### Saving a Draft

```typescript
// Automatically called on form changes
onAnyValueChange(item: LotoPointDto) {
  this.stateService.saveDraft(item);
  // Saves to localStorage with metadata
}
```

### Checking for Draft

```typescript
// In component effect
const lotoPointId = currentEntity.id || null;
const draft = this.stateService.loadDraftForItem(lotoPointId);

if (draft) {
  if (lotoPointId !== null) {
    // Existing item - show comparison
    this.showDraftDialog.set(true);
  } else {
    // New item - auto-load
    this.stateService.setSelectedItem(new LotoPointDto(draft.formData));
  }
}
```

### Clearing Draft on Submit

```typescript
onSubmit(item: LotoPointDto) {
  const lotoPointId = item.id || null;
  this.stateService.clearDraftForItem(lotoPointId);
  this.stateService.submitForm(item);
}
```

## LocalStorage Structure

```json
{
  "loto-point-drafts": [
    {
      "id": "existing-123-1735559876543",
      "lotoPointId": 123,
      "timestamp": "2025-12-30T12:34:56.789Z",
      "isNewItem": false,
      "formData": {
        "id": 123,
        "tagNumber": "VP-101",
        "description": "Main Valve",
        "unit": "Unit 1",
        ...
      }
    },
    {
      "id": "new-1735559123456",
      "lotoPointId": null,
      "timestamp": "2025-12-30T11:22:33.456Z",
      "isNewItem": true,
      "formData": {
        "tagNumber": "VP-102",
        "description": "Secondary Valve",
        ...
      }
    }
  ]
}
```

## Migration Notes

### From Old System:

**Old:**
```typescript
// Single draft key
private readonly DRAFT_KEY = 'loto-point-draft';

saveDraft(draft: Partial<LotoPointModel>): void {
  this.localStorageService.setItem(this.DRAFT_KEY, draft);
}
```

**New:**
```typescript
// Array of drafts with metadata
private readonly DRAFTS_KEY = 'loto-point-drafts';

saveDraft(draft: Partial<LotoPointModel>): void {
  const drafts = this.getAllDrafts();
  // Updates existing or adds new draft
  // Maintains max 20 drafts
}
```

### Breaking Changes:
- Old drafts stored in `loto-point-draft` will NOT be migrated automatically
- To migrate, run:
```typescript
// One-time migration script (if needed)
const oldDraft = localStorage.getItem('loto-point-draft');
if (oldDraft) {
  const parsed = JSON.parse(oldDraft);
  lotoPointLocalStorageService.saveDraft(parsed);
  localStorage.removeItem('loto-point-draft');
}
```

## Testing Checklist

- [ ] Create new loto point with draft → Close → Reopen (should auto-load)
- [ ] Edit existing loto point → Close → Reopen (should show comparison dialog)
- [ ] Create 25 drafts → Verify only last 20 kept
- [ ] Submit form → Verify draft cleared
- [ ] Comparison dialog: "Use Current" → Verify draft deleted
- [ ] Comparison dialog: "Continue with Draft" → Verify draft loads
- [ ] Comparison dialog: "Cancel" → Verify draft kept
- [ ] Edit multiple loto points → Verify each has separate draft
- [ ] Draft age display (just now, 5 minutes ago, 2 hours ago, etc.)

## Refactoring Summary

### What Changed?

**Before (Entity-Specific):**
```typescript
// Duplicated code in each entity service
export class LotoPointLocalStorageService {
  saveDraft(draft: Partial<LotoPointModel>): void {
    // 100+ lines of logic
  }
  // ... other methods
}

export class FileLocalStorageService {
  saveDraft(draft: Partial<FileModel>): void {
    // Same 100+ lines of logic
  }
  // ... other methods
}
```

**After (Centralized + Reusable):**
```typescript
// Base service with all common logic (150+ lines)
export abstract class BaseDraftService<T> {
  saveDraft(draft: Partial<T>): void { /* ... */ }
  loadDraft(entityId: number | null): DraftMetadata<T> | null { /* ... */ }
  getAllDrafts(): DraftMetadata<T>[] { /* ... */ }
  // ... all methods
}

// Entity-specific services (only ~15 lines each!)
export class LotoPointLocalStorageService extends BaseDraftService<LotoPointModel> {
  protected readonly DRAFTS_KEY = 'loto-point-drafts';
  protected getEntityId(draft: Partial<LotoPointModel>): number | null {
    return draft.id || null;
  }
}

export class FileLocalStorageService extends BaseDraftService<FileModel> {
  protected readonly DRAFTS_KEY = 'file-drafts';
  protected getEntityId(draft: Partial<FileModel>): number | null {
    return draft.id || null;
  }
}
```

### Benefits

✅ **DRY (Don't Repeat Yourself)**
- Draft logic written once, reused everywhere
- Bug fixes in one place benefit all entities

✅ **Type Safety**
- Generic `<T>` ensures correct types
- TypeScript catches errors at compile time

✅ **Easy to Add**
- Only 15 lines to add draft support to new entity
- Just extend base class and implement `getEntityId()`

✅ **Consistency**
- All entities behave the same way
- Same API across all draft services

✅ **Maintainability**
- Changes to draft logic happen in one place
- Less code to test and maintain

## Future Enhancements

Potential improvements:
- [ ] Draft list view (show all 20 drafts)
- [ ] Named drafts ("Draft 1", "Draft 2")
- [ ] Draft export/import
- [ ] Sync drafts across devices (backend storage)
- [ ] Conflict resolution for concurrent edits
- [ ] Draft history/versioning
- [ ] Auto-cleanup old drafts (e.g., > 7 days)
- [ ] Generic comparison dialog component (currently LotoPoint-specific)

## Troubleshooting

### Draft not loading
- Check browser console for errors
- Verify localStorage quota not exceeded
- Check `loto-point-drafts` key exists in localStorage

### Comparison dialog not showing
- Verify item has ID (existing item)
- Check draft exists: `localStorage.getItem('loto-point-drafts')`
- Ensure `showDraftDialog` signal is true

### Drafts not clearing after submit
- Verify `clearDraftForItem()` called in `onSubmit()`
- Check server returned success response
- Inspect localStorage after submit

## Performance Considerations

- **LocalStorage limit:** ~5-10MB per domain
- **20 drafts estimate:** ~500KB (assuming 25KB per draft)
- **Debouncing:** Auto-save debounced (default 1000ms)

---

**Implemented:** 2025-12-30
**Last Updated:** 2025-12-30
