# Functionality

1. User clicks the ? icon in the header to enable QA/Help mode globally.
2. When Help mode is enabled, all components with associated QA content show a ? icon next to them.
3. User clicks a component-level ? icon to open a dialog with text, images, video, or file links.
4. User clicks the header ? icon again to disable Help mode; all component-level ? icons disappear and any open dialog closes.

Acceptance Criteria:
1. Header toggle enables/disables QA mode across the entire application.
2. Only components with QA content attached show the ? icon.
3. Dialog displays text (supports HTML), inline images, embedded video player, and downloadable file links.
4. Disabling QA mode cleans up all visible ? icons and closes the dialog.
5. Developers can attach QA content to any element using either the `[appQa]` directive or the `question` input on form components.

# Architecture

Uses a centralized service + directive + dialog pattern with Angular Signals for state management.

Components:
- **QaService** (`services/qa/qa.service.ts`) - singleton managing global state
  - `isQaMode: Signal<boolean>` - whether help mode is active
  - `isDialogVisible: Signal<boolean>` - whether the dialog is open
  - `activeContent: Signal<QaContent | null>` - content shown in the dialog
  - `toggleQaMode()` - toggle help mode on/off
  - `openDialog(content: QaContent)` - open dialog with specific content
  - `closeDialog()` - close the dialog
  - Handles backward compatibility: normalizes legacy formats to unified `media` array:
    - Old `{ type, content, files }` format
    - Legacy `{ images: [], videoUrl: '' }` format
    - Converts to new `{ media: [{ type, url, caption }] }` format

- **QaToggleComponent** (`shared/qa/qa-toggle/`) - header button using `mat-icon-button`
  - Placed in `main-layout.component.html` header-actions section
  - Shows `help_outline` when inactive, `help` when active with highlighted background

- **QaDialogComponent** (`shared/qa/qa-dialog/`) - root-level dialog
  - Placed in `app.component.html` (same pattern as CommentsDialog, WizardDialog)
  - Uses `PopupProjectionComponent` for the modal wrapper
  - Renders text (HTML), media items (images/videos with captions), and file links
  - Each media item displays in a card with optional caption below

- **QaDirective** (`shared/qa/qa.directive.ts`) - attaches QA to any element
  - Selector: `[appQa]`
  - Uses `effect()` to react to QA mode changes
  - Injects/removes ? icon next to host element via `Renderer2`

Data Model (`models/ui/question.model.ts`):
```typescript
// Media item with optional caption
interface QaMediaItem {
  type: 'image' | 'video';
  url: string;
  caption?: string;    // Optional HTML caption for this specific media
}

interface QaContent {
  text?: string;           // Introduction/general text (HTML supported)
  media?: QaMediaItem[];   // Ordered array of images and videos with captions
  files?: string[];        // Downloadable file links

  // DEPRECATED: Use media array instead
  images?: string[];       // Legacy: Image URLs without captions
  videoUrl?: string;       // Legacy: Single video URL
}
type Question = QaContent; // Backward compatibility alias
```

# Implementation

### Enabling/Disabling QA Mode
1. User clicks ? button in header (`QaToggleComponent`)
2. Component calls `QaService.toggleQaMode()`
3. `_isQaMode` signal flips to `true`/`false`
4. All form components check `qaService.isQaMode()` in their templates via `@if (question() && qaService.isQaMode())`
5. QaDirective reacts via `effect()` and injects/removes icons using `Renderer2`
6. When disabling, `toggleQaMode()` also calls `closeDialog()` to dismiss any open dialog

### Opening QA Content (Form Component Path)
1. Form component (e.g., FormInputComponent) receives `question` via input from `FormField.question` config
2. When QA mode is on, template shows `<span class="qa-icon">` with click handler
3. User clicks icon, component calls `qaService.openDialog(question())`
4. QaService normalizes content (handles old `{ type, content }` format) and sets `_activeContent` + `_isDialogVisible`
5. `QaDialogComponent` (mounted in `app.component.html`) renders via `@if (qaService.isDialogVisible())`
6. Dialog shows text, images, video, and file links based on what's provided in QaContent

### Opening QA Content (Directive Path)
1. Developer adds `[appQa]="{text: 'Help text', images: ['url.png']}"` to any element
2. QaDirective's `effect()` detects `isQaMode()` change, calls `showIcon()` via `Renderer2`
3. Icon is inserted as a sibling after the host element
4. User clicks icon, directive calls `qaService.openDialog(content)`
5. Same dialog flow as above

### Developer Usage

**Option A: FormField configuration (for form-driven UIs)**
```typescript
const fields: FormField[] = [
  {
    name: 'location',
    label: 'Location',
    type: 'select',
    question: { text: 'This is the general location description' },
  }
];
```

**Option B: Directive with multiple media items and captions (recommended)**
```html
<div [appQa]="{
  text: '<p>Introduction to the PID Editing System.</p>',
  media: [
    { type: 'image', url: 'qa-data/step1.png', caption: '<strong>Step 1:</strong> Select file type.' },
    { type: 'video', url: 'qa-data/tutorial.mp4', caption: 'Watch this video for a complete walkthrough.' },
    { type: 'image', url: 'qa-data/step2.png', caption: '<strong>Step 2:</strong> Upload your files.' }
  ]
}">
  Complex Component
</div>
```

**Option C: Directive with simple media (no captions)**
```html
<label [appQa]="{
  text: 'Help text',
  media: [
    { type: 'image', url: 'assets/help/img.png' },
    { type: 'video', url: 'assets/help/tutorial.mp4' }
  ]
}">My Field</label>
```

**Option D: Legacy format (still supported for backward compatibility)**
```html
<label [appQa]="{text: 'Help text', images: ['assets/help/img.png']}">My Field</label>
<div [appQa]="{text: 'Watch this tutorial', videoUrl: 'assets/help/tutorial.mp4'}">Content</div>
```

### Form Components Using QA
These form components accept `question` input and delegate to QaService:
- `FormInputComponent` (`shared/form-input/`)
- `RadioGroupComponent` (`shared/radio-group/`)
- `CheckboxGroupComponent` (`shared/checkbox-group/`)
- `MultiInputComponent` (`shared/multi-input/`)
- `SearchableDropdownComponent` (`shared/searchable-dropdown/`)
- `MultiSelectSearchableDropdownComponent` (`shared/multi-select-searchable-dropdown/`) - delegates to SearchableDropdownComponent

### Global CSS
`.qa-icon` styles are defined in `styles.css` and apply globally. Uses theme CSS variables (`--accent-color`, `--accent-color-hover`) for consistent theming.
