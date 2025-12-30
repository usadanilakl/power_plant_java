# Adding Draft Support to New Entities

This guide shows you how to add draft management to any entity in just a few minutes.

## Step 1: Create Entity Draft Service (5 minutes)

Create a new service that extends `BaseDraftService<T>`:

```typescript
// Example: src/app/features/equipment/services/equipment-draft.service.ts
import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../../services/refactored/local-storage.service';
import { EquipmentModel } from '../../../models/equipment/equipment.model';
import { BaseDraftService } from '../../../shared/draft/base-draft.service';

@Injectable({ providedIn: 'root' })
export class EquipmentDraftService extends BaseDraftService<EquipmentModel> {
  protected readonly DRAFTS_KEY = 'equipment-drafts'; // Unique key!

  constructor(localStorageService: LocalStorageService) {
    super();
    this.localStorageService = localStorageService;
  }

  protected getEntityId(draft: Partial<EquipmentModel>): number | null {
    return draft.id || null; // How to extract ID from your entity
  }
}
```

**That's it!** Your service now has all these methods:
- `saveDraft(draft)`
- `loadDraft(entityId)`
- `getAllDrafts()`
- `clearDraft(entityId)`
- `clearAllDrafts()`
- `hasDraft(entityId)`
- `getDraftAge(draft)`

## Step 2: Integrate with State Service (5 minutes)

Update your state service to use the draft service:

```typescript
// src/app/features/equipment/services/equipment-state.service.ts
import { Injectable, inject } from '@angular/core';
import { EquipmentDraftService } from './equipment-draft.service';

@Injectable({ providedIn: 'root' })
export class EquipmentStateService {
  private draftService = inject(EquipmentDraftService);

  saveDraft(item: EquipmentDto) {
    this.draftService.saveDraft(item);
  }

  loadDraftForItem(equipmentId: number | null = null) {
    return this.draftService.loadDraft(equipmentId);
  }

  hasDraftForItem(equipmentId: number | null = null): boolean {
    return this.draftService.hasDraft(equipmentId);
  }

  clearDraftForItem(equipmentId: number | null = null): void {
    this.draftService.clearDraft(equipmentId);
  }
}
```

## Step 3: Add Draft Detection to Form Component (10 minutes)

```typescript
// src/app/features/equipment/equipment-form/equipment-form.component.ts
import { Component, computed, effect, signal } from '@angular/core';
import { DraftMetadata } from '../../../shared/draft/base-draft.service';
import { EquipmentModel } from '../../../models/equipment/equipment.model';

export class EquipmentFormComponent {
  // Draft management
  showDraftDialog = signal<boolean>(false);
  pendingDraft = signal<DraftMetadata<EquipmentModel> | null>(null);
  currentServerVersion = signal<EquipmentDto | null>(null);

  // Check for drafts when entity changes
  private checkForDrafts = effect(() => {
    const currentEntity = this.entity();

    if (currentEntity && (currentEntity.id || this.isNewItem(currentEntity))) {
      const equipmentId = currentEntity.id || null;
      const draft = this.stateService.loadDraftForItem(equipmentId);

      if (draft) {
        if (equipmentId !== null) {
          // Existing item - show comparison dialog
          this.currentServerVersion.set(currentEntity);
          this.pendingDraft.set(draft);
          this.showDraftDialog.set(true);
        } else {
          // New item - auto-load draft
          this.stateService.setSelectedItem(new EquipmentDto(draft.formData));
        }
      }
    }
  }, { allowSignalWrites: true });

  private isNewItem(entity: EquipmentDto): boolean {
    return !entity.id && (!!entity.name || !!entity.description);
  }

  onAnyValueChange(item: EquipmentDto) {
    this.stateService.saveDraft(item); // Auto-save on changes
  }

  onSubmit(item: EquipmentDto) {
    const equipmentId = item.id || null;
    this.stateService.clearDraftForItem(equipmentId); // Clear on submit
    this.stateService.submitForm(item);
  }

  // Draft dialog handlers
  onUseCurrent(): void {
    const equipmentId = this.currentServerVersion()?.id || null;
    this.stateService.clearDraftForItem(equipmentId);
    this.stateService.setSelectedItem(this.currentServerVersion());
    this.closeDraftDialog();
  }

  onUseDraft(): void {
    const draft = this.pendingDraft();
    if (draft) {
      this.stateService.setSelectedItem(new EquipmentDto(draft.formData));
    }
    this.closeDraftDialog();
  }

  onCancelDraftDialog(): void {
    this.closeDraftDialog(); // Keeps draft in localStorage
  }

  private closeDraftDialog(): void {
    this.showDraftDialog.set(false);
    this.pendingDraft.set(null);
    this.currentServerVersion.set(null);
  }
}
```

## Step 4: Create Comparison Dialog (Optional - 30 minutes)

If you want side-by-side comparison for existing items:

1. Copy `draft-comparison-dialog` component from loto-points
2. Update field comparisons for your entity
3. Replace `LotoPointDto` with `EquipmentDto`
4. Update `fieldsToCompare` array with your entity's fields

```typescript
fieldsToCompare = [
  { key: 'name', label: 'Equipment Name' },
  { key: 'description', label: 'Description' },
  { key: 'location', label: 'Location' },
  // ... your entity's fields
];
```

## Quick Reference

### Adding Auto-Save
```typescript
// In form component
onAnyValueChange(item: YourEntityDto) {
  this.stateService.saveDraft(item);
}
```

### Clearing Draft on Submit
```typescript
onSubmit(item: YourEntityDto) {
  const entityId = item.id || null;
  this.stateService.clearDraftForItem(entityId);
  this.stateService.submitForm(item);
}
```

### Checking for Drafts
```typescript
const draft = this.stateService.loadDraftForItem(entityId);
if (draft) {
  // Handle draft...
}
```

### Getting Draft Age
```typescript
const age = this.draftService.getDraftAge(draft);
// Returns: "5 minutes ago", "2 hours ago", etc.
```

## Common Patterns

### Custom ID Extraction
If your entity uses a different ID field:

```typescript
protected getEntityId(draft: Partial<CustomModel>): number | null {
  return draft.customId || draft.uuid || null;
}
```

### Composite Keys
If your entity uses composite keys:

```typescript
protected getEntityId(draft: Partial<CustomModel>): number | null {
  // Use one part of composite key, or create hash
  return draft.primaryId || null;
}
```

### Different Storage Limits
```typescript
export class CustomDraftService extends BaseDraftService<CustomModel> {
  protected readonly MAX_DRAFTS = 50; // Override default (20)
  protected readonly DRAFTS_KEY = 'custom-drafts';
  // ...
}
```

## Testing Your Implementation

1. ✅ Create new item, type some data, close form, reopen → Draft auto-loads
2. ✅ Edit existing item, make changes, close form, reopen → Comparison dialog shows
3. ✅ Create 25 items → Verify only last 20 drafts kept
4. ✅ Submit form → Verify draft cleared
5. ✅ Comparison: "Use Current" → Verify draft deleted
6. ✅ Comparison: "Continue with Draft" → Verify draft loads
7. ✅ Check localStorage → Verify proper structure

## Troubleshooting

**Draft not saving?**
- Check `onAnyValueChange` is connected to form changes
- Verify `saveDraft()` is called
- Check browser console for errors

**Draft not loading?**
- Ensure effect runs when entity changes
- Check `DRAFTS_KEY` is unique and correct
- Verify localStorage has data

**TypeScript errors?**
- Import `DraftMetadata` from `shared/draft/base-draft.service`
- Use generic type: `DraftMetadata<YourEntityModel>`
- Ensure `getEntityId()` returns `number | null`

---

**Total Time:** ~20 minutes to add full draft support to any entity!
