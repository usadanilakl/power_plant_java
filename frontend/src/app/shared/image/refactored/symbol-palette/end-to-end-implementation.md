# Symbol/Markup Implementation (Completed)

## Approach
Symbols are implemented as an extension of the Equipment entity with two additional fields:
- `symbolId`: PID symbol identifier (null = rectangle, e.g., "mov", "centrifugal-pump")
- `svgPath`: SVG path data for rendering the symbol

## Server Side (Uses existing Equipment infrastructure):
1. Equipment entity - added `symbolId` and `svgPath` fields
2. EquipmentDto - added `symbolId` and `svgPath` fields
3. EquipmentIdDto - added `symbolId` and `svgPath` fields
4. No changes needed to repo, service, controller, or mapper (auto-mapped)

## Client Side:
1. EquipmentModel - added `symbolId` and `svgPath` fields
2. EquipmentDto - updated constructor, toJson(), fromJson(), toIdModel()
3. EquipmentIdDto - updated with symbol fields
4. EquipmentMapperService - updated to handle svg-symbol shapes:
   - mapToRfShape() returns SVGSymbolShape when symbolId exists
   - shapeToEquipment() handles both rectangle and svg-symbol types
   - mapRfShapeToCoordinates() handles both types
5. InteractiveImageComponent - emits shapeDrawn when symbol is placed

## Relationships:
1. FileObject has multiple Equipment (including symbols)
2. Equipment (rectangle or symbol) can have association with LotoPoints

## Flow:
1. File loads, all related equipment (rectangles and symbols) load and get placed at their coordinates
2. User can interact with existing items or create new ones via symbol palette
3. New items can be associated with loto points (same flow as rectangles)

## Key Points:
- Symbols use the same Equipment entity, API, and services as rectangles
- `symbolId = null` means rectangle (existing behavior, backward compatible)
- `symbolId = "mov"` (or other symbol ID) means symbol with svgPath for rendering
- Context menu, resize, move, delete, loto association all work the same
- shapeDrawn event triggers for both rectangles and symbols
