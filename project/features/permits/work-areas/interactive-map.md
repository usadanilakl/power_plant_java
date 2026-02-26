## Interactive Plant Map

### Description

The Work Area Map is a split-panel component that renders a plant outline image with interactive rectangular shapes overlaid on it. Each shape represents one or more work areas. The map supports three modes: Edit (admin setup), Select (operator use during permit creation), and Overview (workload monitoring).

The implementation reuses the existing `InteractiveImageComponent` (same component used by LOTO Builder for P&ID diagrams) with different configuration presets per mode.

### Route

`/permit-builder/work-area-map` → `WorkAreaMapComponent`

### Layout

```
+---------------------------+-----------------------------+
|     Left Panel            |       Right Panel           |
|                           |                             |
|  [Select] [Edit] [Over]  |                             |
|  ─────────────────────    |   InteractiveImageComponent |
|                           |                             |
|  Work Area list or        |   Plant outline image with  |
|  permit count details     |   rectangular shape overlays|
|  (varies by mode)         |                             |
|                           |                             |
+---------------------------+-----------------------------+
        resizable divider ↕
```

- Left panel width is resizable via drag divider (same pattern as loto-builder-container)
- Right panel contains the `InteractiveImageComponent` with shape overlays
- Plant map image URL is stored as a system setting. If not configured, an input field is shown to set it.

### Modes

#### Select Mode (Operator)
- Config preset: `WORK_AREA_SELECTOR` (select only, no draw/edit)
- Left panel: list of all work areas, searchable
- Click a shape on the map → highlights associated work areas in the left panel
- Click a work area in the left panel → can be used for permit form selection
- Shape colors: blue default, green when selected

#### Edit Mode (Admin/Dev)
- Config preset: `WORK_AREA_EDITOR` (draw, resize, move, delete shapes)
- Left panel:
    - When a shape is selected: shows assigned work areas with remove buttons, plus a dropdown to assign unassigned areas
    - When no shape selected: list of all shapes
- Draw new shapes by click-drag on the image
- Context menu on shapes: delete
- Shape save/delete persisted immediately via API

#### Overview Mode (Monitoring)
- Config preset: `WORK_AREA_OVERVIEW` (view only + hover, no interaction)
- Left panel: all work areas with active permit count badges
    - Format: Area Name — SW: X | HW: X | CS: X
- Shapes are color-coded by total active permit count:
    - Gray: 0 permits
    - Green: 1-2 permits
    - Amber: 3-5 permits
    - Red: 6+ permits
- Hover over shape → tooltip with work area names assigned to that shape
- Data loaded from `GET /ng/work-areas/with-permit-counts`

### State Management

**WorkAreaMapStateService** (`work-area-map/work-area-map-state.service.ts`)
- Provided at component level (each map instance gets its own state)

Signals:
- `mode` - current map mode ('select' | 'edit' | 'overview')
- `workAreas` - all WorkAreaDto[]
- `shapes` - all WorkAreaMapShapeDto[]
- `permitCounts` - WorkAreaPermitCounts[] (overview mode)
- `selectedShapeId` / `hoveredShapeId` - interaction state
- `plantMapImageUrl` - plant outline image URL

Computed:
- `rfShapes` - converts `WorkAreaMapShapeDto[]` → `RfRectangleShape[]` for the InteractiveImageComponent
    - Parses coordinate string (supports both JSON and custom `{startX:0,...}` format)
    - Sets shape color based on mode: blue (default), overview colors based on permit counts
- `hoveredShapeWorkAreas` / `selectedShapeWorkAreas` - work areas filtered by shape assignment
- `unassignedWorkAreas` - areas not assigned to any shape (for edit mode dropdown)

Methods:
- `loadAll()` - `forkJoin` of work areas + shapes
- `loadPermitCounts()` - loads permit count data
- `setMode(mode)` - switches mode, loads permit counts if overview
- `selectShape(id)` / `saveShape(dto)` / `deleteShape(id)`
- `assignWorkAreaToShape(areaId, shapeId)` / `removeWorkAreaFromShape(areaId)`

### InteractiveImageComponent Integration

The map component passes data to `InteractiveImageComponent` via inputs:

```
[imageUrl]="state.plantMapImageUrl()"
[shapesInput]="state.rfShapes()"
[hoveredShapeId]="state.hoveredShapeId()"
[selectedShapeIdInput]="state.selectedShapeId()"
[config]="currentConfig"
```

And listens to outputs:
- `(shapeHovered)` → `state.hoveredShapeId.set()`
- `(shapeClicked)` → `state.selectShape()`
- `(shapeDrawn)` → `state.saveShape()` (edit mode)
- `(shapeUpdated)` → `state.saveShape()` (edit mode)
- `(shapeDeleted)` → `state.deleteShape()` (edit mode)

### Config Presets

Three presets defined in `interactive-image-config.model.ts`:

| Preset | Draw | Select | Move/Resize | Delete | Hover | Zoom |
|--------|------|--------|-------------|--------|-------|------|
| `WORK_AREA_EDITOR` | yes | yes | yes | yes | yes | yes |
| `WORK_AREA_SELECTOR` | no | yes | no | no | yes | yes |
| `WORK_AREA_OVERVIEW` | no | no | no | no | yes | yes |

### Shape Coordinate Format

Shapes store coordinates as a string in the format:
```
{startX:120,startY:80,endX:320,endY:240,width:200,height:160,rotation:0}
```

The state service parses this into `RfRectangleShape` objects with `x`, `y`, `width`, `height` properties for the InteractiveImageComponent canvas renderer.
