# Refactored Form Designer System

This directory contains the refactored version of the form designer system with improved organization and maintainability.

## Overview

The original form designer system had two major components:
- **Designer**: 873 lines with mixed concerns
- **Renderer**: 571 lines with mixed concerns

The refactored version separates business logic into dedicated services, resulting in:
- **Designer**: ~550 lines (37% reduction)
- **Renderer**: ~130 lines (77% reduction)

Both are easier to understand, test, and maintain.

## Architecture

### Service Layer (`services/`)

All business logic has been extracted into focused, testable services:

#### Designer Services (4 services)

##### 1. **FormDesignerStateService**
Manages all designer interaction state:
- **Zoom controls**: zoom in/out, fit to panel, scale management
- **Drag operations**: start, track delta, get initial positions, end
- **Resize operations**: start, track delta, get initial sizes, end
- **Marquee selection**: lasso selection with box calculation
- **Container intersection**: determines which containers are in selection box

**Key Methods:**
- `zoomIn()`, `zoomOut()`, `setScale(scale)`, `resetScale()`
- `startDrag(event, containers)`, `getDragDelta(event)`, `endDrag()`
- `startResize(event, containers, containerId)`, `getResizeDelta(event)`, `endResize()`
- `startSelection(point)`, `updateSelection(point)`, `endSelection()`
- `getContainersInSelectionBox(containers)`

##### 2. **FormContainerOperationsService**
Handles all container manipulation operations:
- **Alignment**: left, right, top, bottom, h-center, v-center
- **Size matching**: width, height, both
- **Distribution**: horizontal/vertical with equal spacing
- **Sequential arrangement**: with configurable gap
- **Swapping**: swap positions of two containers
- **Grouping**: group/ungroup containers

**Key Methods:**
- `alignContainers(containers, alignment)`
- `matchSize(containers, dimension)`
- `distributeContainers(containers, direction)`
- `arrangeSequentially(containers, direction, gap)`
- `swapContainers(containers)`
- `groupContainers(containers)`, `ungroupContainers(containers, allContainers)`

##### 3. **FormCoordinateService**
Manages all coordinate calculations and transformations:
- **Unit conversions**: inches ↔ pixels
- **Scaled coordinates**: mouse events to canvas coordinates
- **Position constraints**: keep containers within bounds
- **Size constraints**: enforce minimum dimensions
- **Drag calculations**: new positions during drag
- **Resize calculations**: new sizes during resize
- **Fit-to-panel**: calculate scale to fit form in viewport
- **Style generation**: CSS styles for containers
- **Keyboard movement**: arrow key position updates

**Key Methods:**
- `inchesToPixels(inches)`, `pixelsToInches(pixels)`
- `getScaledCoordinates(event, element, scale)`
- `constrainPosition(container, boundsWidth, boundsHeight)`
- `calculateDraggedPosition(initialPos, delta, size, bounds)`
- `calculateResizedSize(initialSize, delta, minWidth, minHeight)`
- `calculateFitToPanel(panelWidth, panelHeight, formWidth, formHeight)`
- `getContainerPositionStyle(container)`, `getContentStyle(container)`
- `moveContainersByKeyboard(containers, direction, amount)`

##### 4. **FormEntityLoaderService**
Loads entity DTOs and their corresponding form fields:
- **Entity loading**: creates instances of form entities (SafeWork, HotWork, etc.)
- **Field generation**: generates form fields for each entity type
- **Combined loading**: loads both entity and fields together
- **Type validation**: checks if a form type is supported

**Key Methods:**
- `loadEntityDto(formType)` - Returns entity instance
- `loadEntityFields(formType)` - Returns FormField[]
- `loadEntityWithFields(formType)` - Returns { entity, fields }
- `getSupportedFormTypes()` - Returns string[]
- `isFormTypeSupported(formType)` - Returns boolean

**Supported Form Types:**
- `SafeWork`
- `HotWork`
- `ConfinedSpace`
- `Loto`
- `Jha`
- `JobStep`
- `WorkRequest`

#### Renderer Services (2 services)

##### 5. **FormArrayProcessingService**
Handles form array processing and pagination logic for repeating sections:
- **Form array processing**: processes all form arrays with pagination
- **Pagination calculation**: calculates page breaks for repeating sections
- **Container grouping**: groups containers by page number
- **Index range filtering**: filters array items by container index range

**Key Methods:**
- `processFormArrays(formDefinition, formData, formValue)` - Processes all form arrays
- `processFormArray(container, formData, formValue, formSize)` - Handles single array
- `calculatePagination(container, nestedFormHeight, arrayLength, pageHeight)` - Calculates breaks
- `groupContainersByPage(containers)` - Groups by page
- `getArrayItemsForContainer(container, arrayData)` - Filters items

##### 6. **FormRenderingService**
Handles form generation from form definitions:
- **Dynamic form creation**: creates FormGroups from form definitions
- **FormArray support**: creates and manages FormArrays
- **Nested objects**: converts objects to FormGroups recursively
- **Deep merge**: merges form values with entity data
- **Style generation**: generates container and content styles
- **Validation**: applies validation rules (required, min, max, pattern, etc.)

**Key Methods:**
- `createFormFromDefinition(formDefinition, formData, existingForm)` - Creates form
- `createFormArray(field, arrayData)` - Creates FormArray
- `createArrayItem(fields, data)` - Creates array item
- `convertToFormGroup(obj)` - Converts objects to FormGroups
- `getAllFormFields(formDefinition)` - Extracts all fields
- `deepMerge(target, source)` - Merges data
- `getContainerStyles(container)`, `getContentStyles(container)` - Style generation

## Component Structure

### Designer Components

#### PrintableFormDesignerRefactoredComponent

**Responsibilities (UI Only):**
- Render the designer canvas
- Handle user interactions (mouse, keyboard)
- Delegate logic to services
- Update UI based on service state

**Code Organization:**
```typescript
// Services injected via DI
stateService = inject(FormDesignerStateService);
operationsService = inject(FormContainerOperationsService);
coordinateService = inject(FormCoordinateService);
entityLoaderService = inject(FormEntityLoaderService);

// Component delegates to services
zoomIn(): void {
  this.stateService.zoomIn(); // Service handles the logic
}

alignContainers(alignment): void {
  const selected = this.currentFormService.selectedContainers();
  const aligned = this.operationsService.alignContainers(selected, alignment);
  this.currentFormService.updateContainers(aligned);
}
```

### Renderer Components

#### FormRendererRefactoredComponent

**Responsibilities (UI Only):**
- Render the form based on definition
- Handle form submission
- Delegate logic to services
- Manage form arrays and pagination

**Code Organization:**
```typescript
// Services injected via DI
private arrayProcessingService = inject(FormArrayProcessingService);
private renderingService = inject(FormRenderingService);

// Computed properties
processedFormDefinition = computed(() => {
  const def = this.formDefinition();
  const formValue = this.form?.value || this.formData();
  return this.arrayProcessingService.processFormArrays(def, this.formData(), formValue);
});

pages = computed(() => {
  const processed = this.processedFormDefinition();
  return this.arrayProcessingService.groupContainersByPage(processed.formContainers);
});

// Form creation effect
constructor() {
  effect(() => {
    const def = this.formDefinition();
    const data = this.formData();
    if (def) {
      this.form = this.renderingService.createFormFromDefinition(def, data, this.form);
    }
  });
}

// Submission
onSubmit(): void {
  const mergedData = this.renderingService.deepMerge(this.formData(), this.form.value);
  this.formSubmit.emit(mergedData);
}
```

#### FormContainerRendererRefactoredComponent

**Responsibilities:**
- Render individual containers based on type
- Handle form controls for each field type
- Delegate styling to services
- Bubble array events to parent

**Supported Field Types:**
- text, textarea, number, date
- select, multi-select
- checkbox, radio
- form-array (nested repeating sections)

## Key Improvements

### Before (Original)
```typescript
// 873 lines with mixed concerns
private isDragging = false;
private dragStartX = 0;
private dragStartY = 0;
private initialPositions = new Map<string, { x: number; y: number }>();

onDragStart(event: MouseEvent, container: FormContainerDto) {
  // State management mixed with business logic
  this.isDragging = true;
  this.dragStartX = event.clientX;
  this.dragStartY = event.clientY;
  // ... 30+ lines of logic
}
```

### After (Refactored)
```typescript
// ~430 lines, clean separation
onDragStart(event: MouseEvent, container: FormContainerDto): void {
  const selectedContainers = this.currentFormService.selectedContainers();
  this.stateService.startDrag(event, selectedContainers); // Delegated to service

  document.addEventListener('mousemove', this.onDragMove);
  document.addEventListener('mouseup', this.onDragEnd);
}
```

## Benefits

### 1. **Single Responsibility Principle**
Each service has one clear purpose:
- `FormDesignerStateService` → State management only
- `FormContainerOperationsService` → Container operations only
- `FormCoordinateService` → Coordinate calculations only
- `FormEntityLoaderService` → Entity loading only

### 2. **Testability**
Services can be unit tested independently:
```typescript
// Easy to test
it('should align containers to the left', () => {
  const containers = [container1, container2];
  const result = operationsService.alignContainers(containers, 'left');
  expect(result[1].position.x).toBe(result[0].position.x);
});
```

### 3. **Reusability**
Services can be used across different components:
```typescript
// FormDesignerStateService can be used in:
// - PrintableFormDesignerComponent
// - FormBuilderComponent
// - Any other designer component
```

### 4. **Maintainability**
Changes are isolated to specific services:
- Need to change alignment logic? → Edit `FormContainerOperationsService`
- Need to fix coordinate calculations? → Edit `FormCoordinateService`
- Component code remains untouched

### 5. **Readability**
Component methods are self-documenting:
```typescript
// Clear intent
alignContainers(alignment: 'left'): void {
  const selected = this.currentFormService.selectedContainers();
  const aligned = this.operationsService.alignContainers(selected, alignment);
  this.currentFormService.updateContainers(aligned);
}
```

## File Structure

```
refactored/
├── services/
│   ├── form-designer-state.service.ts          (Designer: State management)
│   ├── form-container-operations.service.ts    (Designer: Alignment, distribution, etc.)
│   ├── form-coordinate.service.ts              (Designer: Coordinate transformations)
│   ├── form-entity-loader.service.ts           (Designer: Entity loading)
│   ├── form-array-processing.service.ts        (Renderer: Array pagination)
│   └── form-rendering.service.ts               (Renderer: Form creation)
│
├── printable-form-designer-refactored/         (Designer Component)
│   ├── printable-form-designer-refactored.component.ts
│   ├── printable-form-designer-refactored.component.html
│   └── printable-form-designer-refactored.component.css
│
├── form-renderer-refactored/                   (Renderer Component)
│   ├── form-renderer-refactored.component.ts
│   ├── form-renderer-refactored.component.html
│   ├── form-renderer-refactored.component.css
│   └── form-container-renderer-refactored/     (Container Renderer)
│       ├── form-container-renderer-refactored.component.ts
│       ├── form-container-renderer-refactored.component.html
│       └── form-container-renderer-refactored.component.css
│
├── README.md (this file)
├── IMPLEMENTATION_STATUS.md
├── FIXED_AND_READY.md (Designer documentation)
└── RENDERER_COMPLETE.md (Renderer documentation)
```

## Usage

### Using the Designer
```typescript
import { PrintableFormDesignerRefactoredComponent } from './refactored/printable-form-designer-refactored/printable-form-designer-refactored.component';

// Use in template
<app-printable-form-designer-refactored></app-printable-form-designer-refactored>
```

### Using the Renderer
```typescript
import { FormRendererRefactoredComponent } from './refactored/form-renderer-refactored/form-renderer-refactored.component';

// Use in template
<app-form-renderer-refactored
  [formDefinition]="formDef"
  [formData]="entityData"
  [readOnly]="false"
  (formSubmit)="onSubmit($event)">
</app-form-renderer-refactored>
```

### Using Services Independently
```typescript
import { FormContainerOperationsService } from './refactored/services/form-container-operations.service';

constructor(private operations: FormContainerOperationsService) {}

someMethod() {
  const aligned = this.operations.alignContainers(containers, 'left');
  // Use aligned containers
}
```

## Migration Guide

The refactored component is **fully compatible** with the original. You can:

1. **Side-by-side comparison**: Both components can coexist
2. **Gradual migration**: Test the refactored version alongside the original
3. **Drop-in replacement**: Same inputs/outputs as the original

### Migration Steps

1. Import the refactored component:
   ```typescript
   import { PrintableFormDesignerRefactoredComponent } from './refactored/...';
   ```

2. Replace the selector in your template:
   ```html
   <!-- Before -->
   <app-printable-form-designer></app-printable-form-designer>

   <!-- After -->
   <app-printable-form-designer-refactored></app-printable-form-designer-refactored>
   ```

3. No other changes needed - same API!

## Comparison

### Designer Component

| Metric | Original | Refactored | Improvement |
|--------|----------|------------|-------------|
| Component Lines | 873 | ~550 | 37% reduction |
| Business Logic | In Component | In Services | Separated |
| Testability | Difficult | Easy | Much better |
| Reusability | Low | High | Services reusable |
| Maintainability | Challenging | Straightforward | Much easier |

### Renderer Component

| Metric | Original | Refactored | Improvement |
|--------|----------|------------|-------------|
| Component Lines | 571 | ~130 | 77% reduction |
| Form Creation | In Component | FormRenderingService | Separated |
| Array Pagination | In Component | FormArrayProcessingService | Separated |
| Deep Merge | In Component | FormRenderingService | Separated |
| Testability | Difficult | Easy | Much better |
| Maintainability | Challenging | Straightforward | Much easier |

### Overall System

| Metric | Original | Refactored | Improvement |
|--------|----------|------------|-------------|
| Total Component Lines | 1,444 | ~680 | 53% reduction |
| Services Created | 0 | 6 | Organized |
| Code in Components | 100% | ~47% | Better separation |
| Code in Services | 0% | ~53% | Testable & reusable |

## Future Enhancements

The service architecture makes it easy to add new features:

1. **Undo/Redo**: Add `FormHistoryService` to track changes
2. **Snap to Grid**: Add grid logic to `FormCoordinateService`
3. **Copy/Paste**: Add `FormClipboardService` for clipboard operations
4. **Templates**: Add `FormTemplateService` for saving/loading templates
5. **Collaboration**: Add `FormCollaborationService` for real-time editing

## Support

For questions or issues with the refactored components:
1. Check this README
2. Review the service JSDoc comments
3. Compare with the original implementation
4. Open an issue in the project repository

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Status**: Production Ready
