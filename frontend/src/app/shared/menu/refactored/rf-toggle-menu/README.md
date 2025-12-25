# Refactored Toggle Menu Component

A modern, fully-featured menu component with advanced search capabilities and theme support.

## Features

### ✨ Core Features
- **Virtual Scrolling**: Handles large lists efficiently using `ToggleListVirtualScrollComponent`
- **Nested Items**: Full support for hierarchical menu structures
- **Theme Integration**: Seamlessly integrates with your light/dark theme system
- **Responsive Design**: Adapts to different screen sizes

### 🔍 Advanced Search
- **Real-time Filtering**: Instant search results as you type
- **Word-Bucket Approach**: Search uses space-separated keywords
- **AND/OR Logic Toggle**:
  - **AND mode** (default): Find items containing ALL search terms
  - **OR mode**: Find items containing ANY search term
- **Recursive Search**: Searches through all levels of nested items
- **Auto-Expand**: Automatically expands parent items when children match search
- **Clear Search**: Quick button to clear search and reset view

### 🎨 Styling
- Uses CSS custom properties for theming
- Smooth transitions and hover effects
- Visual feedback for search mode
- Empty state and no-results messaging

## Usage

### Basic Example
```typescript
import { RfToggleMenuComponent } from './shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

@Component({
  template: `
    <app-rf-toggle-menu
      [menuItems]="items"
      (itemClick)="onItemClick($event)"
      (itemDblClick)="onItemDoubleClick($event)">
    </app-rf-toggle-menu>
  `
})
export class MyComponent {
  items: NestedItem[] = [...];

  onItemClick(item: NestedItem) {
    console.log('Clicked:', item);
  }

  onItemDoubleClick(item: NestedItem) {
    console.log('Double-clicked:', item);
  }
}
```

### With Custom Search Placeholder
```html
<app-rf-toggle-menu
  [menuItems]="fileItems"
  [searchPlaceholder]="'Search files...'"
  (itemClick)="openFile($event)">
</app-rf-toggle-menu>
```

### Disable Search
```html
<app-rf-toggle-menu
  [menuItems]="simpleMenu"
  [enableSearch]="false"
  (itemClick)="handleClick($event)">
</app-rf-toggle-menu>
```

## API

### Inputs
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `menuItems` | `NestedItem[]` | `[]` | Array of menu items to display |
| `enableSearch` | `boolean` | `true` | Enable/disable search functionality |
| `searchPlaceholder` | `string` | `'Search...'` | Placeholder text for search input |

### Outputs
| Output | Type | Description |
|--------|------|-------------|
| `itemClick` | `NestedItem` | Emitted when an item is clicked |
| `itemDblClick` | `NestedItem` | Emitted when an item is double-clicked |
| `itemRightClick` | `{ event: MouseEvent; item: NestedItem }` | Emitted when an item is right-clicked |
| `itemMiddleClick` | `NestedItem` | Emitted when an item is middle-clicked |

## Search Behavior

### AND Mode (Default)
Finds items that contain **all** search terms.

**Example**: Searching for "pump main"
- ✅ "Main Pump System"
- ✅ "Pump for Main Building"
- ❌ "Main Building" (missing "pump")
- ❌ "Pump Station 2" (missing "main")

### OR Mode
Finds items that contain **any** search term.

**Example**: Searching for "pump valve"
- ✅ "Main Pump"
- ✅ "Safety Valve"
- ✅ "Pump and Valve System"
- ❌ "Main Building"

### Search Features
1. **Case-Insensitive**: "PUMP" matches "pump", "Pump", "PUMP"
2. **Whitespace Handling**: Multiple spaces are treated as single separators
3. **Partial Matching**: "equip" matches "equipment"
4. **Recursive**: Searches through all nested levels
5. **Auto-Expand**: Parent items expand when children match

## Theme Variables Used

The component uses the following CSS custom properties:

```css
--primary-background
--secondary-background
--primary-text
--secondary-text
--accent-color
--accent-color-hover
--accent-color-shadow
--border-color
--card-background
--hover-color
--warning-background
```

## Comparison with Old Component

### Old Component
- ❌ No search functionality
- ❌ Basic styling
- ❌ Limited filtering options
- ✅ Virtual scrolling

### New Component
- ✅ Advanced search with AND/OR logic
- ✅ Theme-aware styling
- ✅ Better organized code
- ✅ Virtual scrolling
- ✅ Auto-expand on search
- ✅ Clear search button
- ✅ Empty states
- ✅ Responsive design

## Migration Guide

### From Old to New Component

**Old:**
```typescript
import { ToggleMenuComponent } from './shared/menu/toggle-menu/toggle-menu.component';
```

**New:**
```typescript
import { RfToggleMenuComponent } from './shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
```

The API is backwards compatible - all existing event handlers work the same way!

## Performance

- Uses Angular signals for reactive state management
- Computed values for efficient filtering
- Virtual scrolling for large lists
- Optimized recursive search algorithm

## Accessibility

- Keyboard navigation support (inherited from toggle-list)
- Focus visible indicators
- ARIA labels for search controls
- Semantic HTML structure
