# Diagram Builder & Renderer

A standalone canvas-based diagram builder for creating P&ID diagrams, process flow diagrams, and custom schematics — without requiring a background image.

## Overview

The diagram builder extends the project's existing drawing capabilities (used in the LOTO builder for image annotation) into a full-featured diagram editor. It uses its own dedicated shape model — completely decoupled from the image-based `RfShape` system — so changes here never affect the LOTO/image annotation code.

**Two modes, same component:**
- **Builder** (`/diagram-builder/build/:id`) — full editing: draw, drag, resize, rotate, connect, align
- **Renderer** (`/diagram-builder/view/:id`) — view-only: pan, zoom, select for inspection

## Architecture

```
diagram-builder/
├── models/
│   ├── diagram-shape.model.ts    # Shape types (Rectangle, Circle, Line, Text, Symbol, Connection)
│   ├── diagram.model.ts          # DiagramDto + JSON serialization helpers
│   └── diagram-config.model.ts   # Builder vs Renderer config presets
├── services/
│   ├── diagram-api.service.ts          # HTTP CRUD → /ng/diagrams
│   ├── diagram-shape-manager.service.ts # Signal-based shape/connection/selection state
│   ├── diagram-render.service.ts       # Canvas rendering, hit testing, selection handles
│   ├── diagram-drawing.service.ts      # Drawing lifecycle + coordinate conversion
│   ├── diagram-grid.service.ts         # Dot grid + snap-to-grid
│   ├── diagram-connection.service.ts   # Connection drawing mode (anchor-to-anchor)
│   ├── diagram-alignment.service.ts    # Align, distribute, match-size
│   └── diagram-state.service.ts        # Persistence with debounced auto-save (2s)
└── components/
    ├── diagram-canvas/     # Main component — triple-canvas, all mouse/keyboard handling
    ├── diagram-toolbar/    # Drawing, alignment, distribution, canvas tool groups
    ├── diagram-properties/ # Side panel: shape position/size/color/label, diagram metadata
    └── diagram-list/       # Diagram list with create/edit/view/delete
```

## Data Flow

```
User interaction → DiagramCanvasComponent (mouse/keyboard handlers)
    → DiagramDrawingService (drawing lifecycle) or DiagramShapeManagerService (selection/drag)
    → DiagramShapeManagerService (signal-based state updates)
    → effect() triggers → DiagramRenderService.drawAll() on shape canvas
    → DiagramStateService.markDirty() → debounced save → DiagramApiService → backend
```

## Shape Model

Dedicated types — no dependency on `fr-shape.model.ts`:

| Type | Interface | Key Fields |
|------|-----------|------------|
| Rectangle | `DiagramRectangleShape` | x, y, width, height, color, fillColor, lineWidth |
| Circle | `DiagramCircleShape` | x, y, width, height (ellipse bounding box) |
| Line | `DiagramLineShape` | startX, startY, endX, endY |
| Text | `DiagramTextShape` | text, fontSize, fontFamily |
| Symbol | `DiagramSymbolShape` | symbolId, svgPath (from PIDSymbolsService) |
| Connection | `DiagramConnection` | sourceShapeId, targetShapeId, anchors, waypoints |

All shapes share: `id`, `type`, `x`, `y`, `width`, `height`, `rotation?`, `color?`, `fillColor?`, `lineWidth?`, `zIndex?`, `locked?`, `label?`

## Backend

| Layer | File | Notes |
|-------|------|-------|
| Entity | `entities/diagrams/Diagram.java` | Extends `BaseAuditEntity`, `shapesJson`/`connectionsJson` as TEXT |
| Repository | `repository/diagrams/DiagramRepo.java` | Extends `BaseRepository<Diagram>` |
| DTO | `dto/diagrams/DiagramDto.java` | Extends `BaseDto` |
| Mapper | `mappers/diagrams/DiagramMapper.java` | Manual field-by-field conversion |
| Service | `sevice/angular/diagrams/NgDiagramService.java` | Implements `NgCrudService` |
| Controller | `controller/angular/diagrams/NgDiagramController.java` | REST at `/ng/diagrams` |

**Endpoints:**
- `GET /ng/diagrams/get-all` — list all diagrams
- `GET /ng/diagrams/get-by-id/{id}` — get diagram with full JSON
- `POST /ng/diagrams` — create
- `PUT /ng/diagrams/{id}` — update
- `DELETE /ng/diagrams/{id}` — soft delete

## Reused Services (no modification)

| Service | What it provides |
|---------|-----------------|
| `ZoomPanService` | Transform state (scale + translate), wheel zoom calculations |
| `PIDSymbolsService` | P&ID symbol library (8 symbols: valves, pumps, instruments, electrical) |
| `SymbolPaletteComponent` | UI for browsing/selecting P&ID symbols by category |

## Routes

```
/diagram-builder          → redirects to /list
/diagram-builder/list     → DiagramListComponent
/diagram-builder/new      → DiagramCanvasComponent (builder mode, creates new diagram)
/diagram-builder/build/:id → DiagramCanvasComponent (builder mode, loads existing)
/diagram-builder/view/:id  → DiagramCanvasComponent (renderer mode)
```

All routes protected by `authGuard` + `fullAccessGuard`.

## Keyboard Shortcuts (Builder Mode)

| Key | Action |
|-----|--------|
| Arrow keys | Move selected shapes ±1px |
| Shift + Arrow keys | Move selected shapes ±10px |
| Delete | Delete selected shapes |
| Escape | Cancel drawing/connection, switch to select tool |
| Ctrl + Click | Toggle shape in multi-selection |
| Alt + Drag / Middle-click drag | Pan canvas |
| Scroll wheel | Zoom in/out |

## Tools

| Group | Tools |
|-------|-------|
| Drawing | Select, Rectangle, Circle, Line, Text, P&ID Symbol, Connection |
| Alignment | Left, Right, Top, Bottom, H-Center, V-Center (2+ selected) |
| Distribution | Horizontal, Vertical (3+ selected) |
| Canvas | Toggle Grid, Snap-to-Grid, Zoom In/Out/Fit |
| Actions | Delete Selected |

## Connection Drawing

1. Select the **Connection** tool from toolbar
2. Anchor dots (blue) appear on all shape edges (top/right/bottom/left midpoints)
3. Click a source anchor → drag → click a target anchor
4. Connections route with L-shaped paths by default
5. Connections auto-delete when either connected shape is deleted

## Design Decisions

- **Dedicated shape model** — no modifications to `fr-shape.model.ts`. Zero risk to LOTO/image code.
- **JSON storage** — shapes/connections stored as JSON TEXT columns. Diagrams are self-contained, so relational mapping isn't needed.
- **Component-level providers** — each diagram canvas gets its own service instances (ShapeManager, RenderService, etc.), preventing cross-contamination between diagrams.
- **Debounced auto-save** — changes auto-persist after 2 seconds of inactivity.
- **Config-driven modes** — `DIAGRAM_BUILDER_CONFIG` vs `DIAGRAM_RENDERER_CONFIG` control what's enabled, same component handles both.
