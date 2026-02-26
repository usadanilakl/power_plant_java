## Backend Architecture

### Entities

**WorkArea** (`entities/permits/WorkArea.java`)
- Extends `BaseAuditEntity` (inherits id, name, dateCreated, dateModified, deleted, sync tracking)
- `description` (TEXT) - detailed area description
- `constantHazardsJson` (TEXT) - JSON-serialized `SwHazards` POJO
    - Accessor methods: `getConstantHazards()` / `setConstantHazards(SwHazards)` handle JSON serialization via Jackson ObjectMapper
- `areaType` (`@ManyToOne Value`) - FK to Value entity, category alias `workAreaType`
- `shape` (`@ManyToOne WorkAreaMapShape`) - FK to map shape entity
- `constantLotos` (`@ManyToMany LotoStandard`) - join table `work_area_loto_standard`

**WorkAreaMapShape** (`entities/permits/WorkAreaMapShape.java`)
- Extends `BaseAuditEntity`
- `coordinates` (TEXT) - shape position/size as string: `{startX:0,startY:0,endX:100,endY:100,width:100,height:100,rotation:0}`
- `originalPictureSize` (String) - image dimensions for scaling
- `label` (String) - optional display label on the map

**BasePermitEntity** modification:
- Added `@ManyToOne WorkArea workArea` with `@JoinColumn(name = "work_area_id")`
- All permit types (SafeWork, HotWork, ConfinedSpace, WorkRequest) inherit this field

### DTOs

**WorkAreaDto** (`dto/permits/WorkAreaDto.java`)
- id, name, description, dateCreated, dateModified
- `areaType` (ValueDto) - area type reference
- `constantHazards` (SwHazards) - deserialized hazards POJO
- `constantLotoIds` (List<Long>) - flattened LOTO standard IDs
- `shapeId` (Long) - map shape reference

**WorkAreaMapShapeDto** (`dto/permits/WorkAreaMapShapeDto.java`)
- id, name, coordinates, originalPictureSize, label, dateCreated, dateModified
- `workAreaIds` (List<Long>) - IDs of work areas assigned to this shape

### Repository

**WorkAreaRepo** (`repository/permits/WorkAreaRepo.java`)
- Extends `BaseRepository<WorkArea>`
- `findByAreaType_Id(Long typeId)` - filter by area type
- `findByShape_Id(Long shapeId)` - find areas assigned to a shape

**WorkAreaMapShapeRepo** (`repository/permits/WorkAreaMapShapeRepo.java`)
- Extends `BaseRepository<WorkAreaMapShape>`

### Mapper

**WorkAreaMapper** (`mappers/permits/WorkAreaMapper.java`)
- `convertToDto(WorkArea)` → `WorkAreaDto` - maps entity fields, converts constantLotos to ID list, sets shapeId
- `convertToEntity(WorkAreaDto)` → `WorkArea` - loads existing entity if ID present, maps fields, looks up shape by shapeId
- `convertShapeToDto(WorkAreaMapShape)` → `WorkAreaMapShapeDto` - includes workAreaIds via `findByShape_Id()`
- `convertShapeToEntity(WorkAreaMapShapeDto)` → `WorkAreaMapShape` - loads existing or creates new

### Service

**NgWorkAreaService** (`sevice/angular/permits/NgWorkAreaService.java`)
- Implements `NgCrudService<WorkArea, WorkAreaDto, WorkAreaRepo, WorkAreaMapper>`
- Injected repos: WorkAreaRepo, WorkAreaMapShapeRepo, SafeWorkRepo, HotWorkRepo, ConfinedSpaceRepo

Work Area CRUD:
1. `saveFromDto(WorkAreaDto)` - converts DTO to entity, resolves areaType via ValueService, resolves constantLotos via EntityManager, saves
2. `getAllDtoList()` - returns all work areas as DTOs
3. `getDtoByIdTyped(Long id)` - single area lookup
4. `getByAreaType(Long typeId)` - filter by area type

Permit Count Queries:
5. `getActivePermitCounts(Long workAreaId)` - JPQL count of SafeWork/HotWork/ConfinedSpace with `permitStatus.name = 'Active'` for a given work area
6. `getAllWithPermitCounts()` - all areas with their active permit counts (for overview mode)

Map Shape CRUD:
7. `saveShape(WorkAreaMapShapeDto)` - create/update shape
8. `getAllShapes()` - list all shapes
9. `deleteShape(Long id)` - soft delete

### Controllers

**WorkAreaController** (`controller/angular/permits/WorkAreaController.java`)
- Base: `/ng/work-areas`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/get-all` | List all work areas |
| GET | `/get-by-id/{id}` | Single area with details |
| POST | `/` | Save work area |
| DELETE | `/{id}` | Soft delete |
| GET | `/by-area-type/{typeId}` | Filter by area type |
| GET | `/with-permit-counts` | All areas with active SW/HW/CS counts |
| GET | `/permit-counts/{id}` | Counts for a single area |

**WorkAreaMapShapeController** (`controller/angular/permits/WorkAreaMapShapeController.java`)
- Base: `/ng/work-area-shapes`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/get-all` | List all map shapes |
| POST | `/` | Save map shape |
| DELETE | `/{id}` | Soft delete shape |

### Permit Mapper Updates

All permit mappers now include `workArea` in DTO conversion:
- **SafeWorkMapper** - `convertToDto()` maps `entity.getWorkArea()` via `workAreaMapper.convertToDto()`
- **HotWorkMapper** - same pattern
- **ConfinedSpaceMapper** - same pattern
- **WorkRequestMapper** - `convertToNgDto()` maps workArea (NgWorkRequestDto has its own `workArea` field since it doesn't extend BasePermitDto)
