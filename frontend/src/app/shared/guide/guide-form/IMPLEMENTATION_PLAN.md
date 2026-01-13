# Guided Form Dialog - Implementation Plan

## Overview
A wizard-style dialog that guides users through operations with step-by-step instructions, hints, and inline helpers. Built incrementally - each phase builds on the previous.

---

## Real-World Flow (Implementation Order)

| Phase | Action | Builds On | Complexity |
|-------|--------|-----------|------------|
| 1 | **Upload File** | Nothing | Low |
| 2 | **Add LOTO Point** | Phase 1 (file selection) | Medium |
| 3 | **Edit LOTO Point** | Phase 2 (same components) | Medium |
| 4 | **Create Standard** | Phase 1-3 (all pieces) | Medium |

---

## Phase 1: Upload File (Foundation)

### 1.1 Core Infrastructure

**Types** (`guide-form.types.ts`):
```typescript
export type GuideAction =
  | 'upload-file'
  | 'add-loto-point'
  | 'edit-loto-point'
  | 'create-standard';

export interface GuideFormStep {
  id: string;
  title: string;
  description: string;
  component: 'form' | 'confirm' | 'review' | 'selector';
  hints?: GuideHint[];
  formFields?: string[];  // Field names from mapper
  validation?: (data: any) => boolean;
}

export interface GuideFlow {
  action: GuideAction;
  name: string;
  description: string;
  icon: string;
  steps: GuideFormStep[];
}

export interface GuideFormState {
  action: GuideAction;
  currentStepIndex: number;
  collectedData: Record<string, any>;
  file?: File;
  startedAt: Date;
}
```

**Service** (`guide-form.service.ts`):
- `isActive: Signal<boolean>`
- `currentFlow: Signal<GuideFlow | null>`
- `currentStep: Signal<GuideFormStep | null>`
- `state: Signal<GuideFormState | null>`
- `progress: Signal<number>` (percentage)
- Methods: `start(action)`, `next(data)`, `back()`, `cancel()`, `complete()`

**Dialog Component** (`guide-form-dialog.component.ts`):
- Standalone, draggable (reuse GuideStepDialogComponent pattern)
- Progress bar
- Dynamic step rendering
- Navigation buttons

### 1.2 File Upload Flow

**Steps:**
1. **Welcome** - "Let's upload a file" with brief explanation
2. **Select File** - File input with drag-drop
3. **File Details** - Name, fileType, fileNumber, vendor (auto-fill from filename)
4. **Review** - Summary of what will be created
5. **Complete** - Success message with "What's next?" options

**File Form Fields (from mapper):**
- `name` (text, required) - auto-filled from filename
- `fileType` (value-select, required)
- `fileNumber` (multi-input, required) - auto-filled from filename
- `vendor` (value-select, optional)
- `file` (file input)
- `overrideFile` (radio: revise/override)
- `isVerified` (select: yes/no)

**Hints Examples:**
- Step 2: "Supported formats: PDF, DWG, PNG. Max size: 50MB"
- Step 3: "File numbers help you find this file later. Use drawing numbers or P&ID numbers."

---

## Phase 2: Add LOTO Point

### Flow:
1. **Welcome** - "Let's add a LOTO point"
2. **Find/Upload File** - Reuse Phase 1 file selector OR upload new
3. **Open File** - Display file with drawing capability
4. **Draw on File** - Mark the LOTO point location
5. **LOTO Point Details** - Tag number, description, equipment, etc.
6. **Counterpart** - "Create counterpart for other unit?" (dual form handles this)
7. **Review & Submit**

### New Components Needed:
- File selector step (table or upload)
- File viewer with drawing tools
- LOTO point form step

---

## Phase 3: Edit LOTO Point

### Flow:
1. **Find File** - Search/select file
2. **Open File** - Display file
3. **Find LOTO Point** - Select from file's points or search
4. **Edit Details** - Primary LOTO point form
5. **Edit Counterpart** - If exists
6. **Review & Submit**

### Reuses:
- File selector from Phase 2
- File viewer from Phase 2
- LOTO point form from Phase 2

---

## Phase 4: Create Standard

### Flow:
1. **Welcome** - "Let's create a LOTO Standard"
2. **Standard Details** - Name, description
3. **Add LOTO Points Loop**:
   - Find/Upload File (Phase 1-2)
   - Find/Create LOTO Point (Phase 2-3)
   - Confirm addition
   - "Add another?" → loop back or continue
4. **Review Standard** - All points listed
5. **Submit**

### Reuses:
- Everything from Phase 1-3
- Loop/repeat capability in service

---

## File Structure

```
frontend/src/app/shared/guide/guide-form/
├── guide-form.types.ts           # Type definitions
├── guide-form.service.ts         # State management
├── guide-form-dialog.component.ts # Main container
├── steps/
│   ├── guide-welcome-step.component.ts
│   ├── guide-form-step.component.ts    # Generic form renderer
│   ├── guide-confirm-step.component.ts
│   └── guide-review-step.component.ts
└── flows/
    ├── upload-file.flow.ts
    ├── add-loto-point.flow.ts
    ├── edit-loto-point.flow.ts
    └── create-standard.flow.ts
```

---

## Services Available (No Changes Needed)

| Service | Usage |
|---------|-------|
| `RfFileApiService` | File CRUD, upload |
| `RfFileStateService` | File state, drafts |
| `FileMapperService` | Form fields for file |
| `RfLotoPointApiService` | LOTO point CRUD |
| `RfLotoPointStateService` | LOTO point state |
| `RfLotoPointMapperService` | Form fields for LOTO point |
| `RfLotoStandardApiService` | Standard CRUD |

---

## Implementation Checklist

### Phase 1: Upload File
- [ ] Create `guide-form.types.ts`
- [ ] Create `guide-form.service.ts`
- [ ] Create `guide-form-dialog.component.ts` (container)
- [ ] Create `guide-welcome-step.component.ts`
- [ ] Create `guide-form-step.component.ts` (renders RfReactiveForm)
- [ ] Create `guide-review-step.component.ts`
- [ ] Create `upload-file.flow.ts`
- [ ] Add entry point (FAB or toolbar button)
- [ ] Test complete flow

### Phase 2: Add LOTO Point
- [ ] Create file selector step
- [ ] Integrate file viewer
- [ ] Create drawing step
- [ ] Create LOTO point form step
- [ ] Create `add-loto-point.flow.ts`
- [ ] Test complete flow

### Phase 3: Edit LOTO Point
- [ ] Create LOTO point selector step
- [ ] Create `edit-loto-point.flow.ts`
- [ ] Test complete flow

### Phase 4: Create Standard
- [ ] Add loop capability to service
- [ ] Create standard form step
- [ ] Create `create-standard.flow.ts`
- [ ] Test complete flow

---

## Notes

- Each step should be self-contained and testable
- Use existing `RfReactiveFormComponent` for all forms
- Reuse existing table components for selection
- Auto-save to localStorage between steps
- ESC minimizes, doesn't close
