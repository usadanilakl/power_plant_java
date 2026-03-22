# Diagram Builder — Verification Prompt

Copy and paste this prompt to Claude to verify the diagram builder implementation is complete and correct.

---

## Prompt

```
Review the diagram builder feature implementation in this project. Check the following end-to-end flow and report any issues, missing pieces, or broken connections:

## 1. Backend Stack Verification
Read these files and verify:
- `src/main/java/com/dk_power/power_plant_java/entities/diagrams/Diagram.java` — extends BaseAuditEntity, has name, description, canvasWidth, canvasHeight, shapesJson (TEXT), connectionsJson (TEXT), gridSize, @Audited, @Where soft delete
- `src/main/java/com/dk_power/power_plant_java/repository/diagrams/DiagramRepo.java` — extends BaseRepository<Diagram>
- `src/main/java/com/dk_power/power_plant_java/dto/diagrams/DiagramDto.java` — extends BaseDto, matches entity fields
- `src/main/java/com/dk_power/power_plant_java/mappers/diagrams/DiagramMapper.java` — implements BaseMapper, has convertToDto/convertToEntity with null checks, fetches existing entity on update
- `src/main/java/com/dk_power/power_plant_java/sevice/angular/diagrams/NgDiagramService.java` — implements NgCrudService, has getRepo/getMapper/getSessionFactory/getDto/getEntity/getEntityManager/getEntityClass, has createDiagram/updateDiagram/getDiagramById
- `src/main/java/com/dk_power/power_plant_java/controller/angular/diagrams/NgDiagramController.java` — @RestController at /ng/diagrams, has get-all, get-by-id/{id}, POST, PUT/{id}, DELETE/{id}, all wrapped in NgApiResponse with try/catch

## 2. Frontend Model Verification
Read these files and verify:
- `frontend/src/app/features/diagram-builder/models/diagram-shape.model.ts` — has DiagramBaseShape, DiagramRectangleShape, DiagramCircleShape, DiagramLineShape, DiagramTextShape, DiagramSymbolShape, DiagramConnection, AnchorPoint, DiagramToolType, AlignmentType, DistributeType
- `frontend/src/app/features/diagram-builder/models/diagram.model.ts` — has DiagramDto, DiagramData, parseDiagramData(), serializeDiagramData()
- `frontend/src/app/features/diagram-builder/models/diagram-config.model.ts` — has DiagramCanvasConfig, DIAGRAM_BUILDER_CONFIG (all editing true), DIAGRAM_RENDERER_CONFIG (editing false, viewing true)

## 3. Service Layer Verification
Read each service and verify:
- `diagram-api.service.ts` — injects HttpClient, uses environment.apiUrl + '/diagrams', has getAll/getById/create/update/delete returning Observable<SpringApiResponse>
- `diagram-shape-manager.service.ts` — @Injectable() (not providedIn root), uses signals for shapes/connections/selectedShapeIds, has addShape/updateShape/deleteShape/deleteSelectedShapes, addConnection/updateConnection/deleteConnection, selection methods, auto-deletes connections when shapes are deleted
- `diagram-render.service.ts` — @Injectable(), drawAll() renders connections then shapes then selection handles, drawShape dispatches by type, drawConnection with L-shaped routing + arrowheads, drawSelectionHandles with 8 resize + rotation handle, hitTestShape/hitTestHandle/hitTestAnchor, getAnchorPoint/getAllAnchors/drawAnchorPoints
- `diagram-drawing.service.ts` — @Injectable(), activeTool signal, clientToCanvasCoords(clientX, clientY, canvasRect, transformState), startDrawing/updateDrawing/finishDrawing returning DiagramElement, drawPreview on temp canvas, selectSymbol()
- `diagram-grid.service.ts` — @Injectable(), gridVisible/snapEnabled/gridSize signals, drawGrid with dot pattern, snapPosition/snapDimension
- `diagram-connection.service.ts` — @Injectable(), isDrawingConnection signal, startConnection/updateConnection/finishConnection/cancelConnection, drawPreview showing line from source anchor to cursor
- `diagram-alignment.service.ts` — @Injectable(), alignShapes (6 directions, first=reference), distributeShapes (even spacing, first/last fixed), matchSize
- `diagram-state.service.ts` — @Injectable(), currentDiagram/isDirty/isSaving/isLoading signals, loadDiagram/createNewDiagram/markDirty/save, debounced auto-save (2s), setShapeManager to connect with ShapeManagerService

## 4. Component Verification
- `diagram-canvas.component.ts` — providers array includes all 7 diagram services + ZoomPanService, template has toolbar/symbol-palette/triple-canvas/properties/status-bar, onMouseDown handles pan/connection/drawing/select/resize/drag, onMouseMove handles pan/drawing-preview/connection-preview/resize/drag/hover, onMouseUp finishes drawing/drag/resize, onWheel for zoom, onKeyDown for Delete/Escape/Arrow keys, onAlign/onDistribute/deleteSelected/zoomIn/zoomOut/zoomFit, render() method updates grid+shapes+temp canvases, effect() triggers re-render on signal changes
- `diagram-toolbar.component.ts` — outputs for onAlign/onDistribute/onDelete/onZoomIn/onZoomOut/onZoomFit, tool buttons with active state, alignment buttons disabled when <2 selected, distribute disabled when <3
- `diagram-properties.component.ts` — shows shape properties (x,y,width,height,rotation,color,fillColor,lineWidth,label) when single selected, shows count when multi-selected, shows diagram name/description when nothing selected
- `diagram-list.component.ts` — loads diagrams on init, createNew navigates to /diagram-builder/new, openBuilder/openViewer navigate to build/:id and view/:id, deleteDiagram calls API then reloads

## 5. Route Verification
- `frontend/src/app/routes/diagram-builder.routes.ts` — has /diagram-builder with children: list, new (mode:builder), build/:id (mode:builder), view/:id (mode:renderer)
- `frontend/src/app/app.routes.ts` — imports DIAGRAM_BUILDER_ROUTES and spreads with authGuard + fullAccessGuard

## 6. Integration Checks
Verify these cross-cutting concerns:
- DiagramCanvasComponent reads route data 'mode' to pick BUILDER vs RENDERER config
- DiagramCanvasComponent reads route param 'id' to load existing diagram, or creates new if no id
- DiagramStateService.markDirty() is called after: addShape, deleteSelectedShapes, drag end, resize end, arrow key move, alignment, distribution, connection add, property changes
- Connections auto-delete when connected shapes are deleted (in deleteShape and deleteSelectedShapes)
- PIDSymbolsService (from shared/image/refactored/) is reused — verify import path is correct
- SymbolPaletteComponent (from shared/image/refactored/) is reused — verify import path and event name (symbolSelected) match
- ZoomPanService.calculateZoom is called correctly from onWheel

## 7. Report
For each section above, report:
- ✅ if correct
- ⚠️ if minor issue (works but could be improved)
- ❌ if broken/missing (prevents feature from working)

Include specific file paths and line numbers for any issues found.
```
