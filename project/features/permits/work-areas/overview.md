## Description

Work Areas represent physical locations within the plant. They serve three purposes:

1. **Clarity** - Standardized plant location vocabulary across employees and contractors. Contractors unfamiliar with the plant can:
    - View an interactive map and find their work location
    - Search areas by name
    - Read area descriptions with equipment information
2. **Workload Tracking** - As permits are issued, the overview mode renders all active work across the plant in multiple formats: interactive map with badges, list, and table. Operators can see at a glance who is working where and what permits are active.
3. **Constant Hazards** - Each area has hazards that are always present (confined space, LOTO, flammable materials, etc.). When a SafeWork permit is created for a work area, constant hazards auto-populate the hazard checkboxes so operators don't miss anything.

## Design Decisions

1. **WorkArea is its own entity** (not a Value) - needs Description, ConstantHazards, ConstantLotos, AreaType, and map shape coordinates. Too rich for the Value model.
2. **ConstantHazards reuses `SwHazards` POJO** - stored as JSON TEXT column. Fields map 1:1 to SafeWork hazard checkboxes for auto-apply.
3. **ConstantLotos is ManyToMany to `LotoStandard`** - LOTOs that always apply when working in an area.
4. **AreaType uses Value FK** - `@ManyToOne Value` with category alias `workAreaType`. New types added without code changes.
5. **WorkArea lives on BasePermitEntity** - all permit types (WR, SW, HW, CS) inherit the `workArea` field automatically.
6. **Map shapes are separate entities** - `WorkAreaMapShape` stores shape coordinates. `WorkArea.shape` is ManyToOne (one shape can represent multiple work areas).

## Implementation

See detailed documentation:
- [Backend Architecture](backend-architecture.md) - Entity, DTO, Repo, Mapper, Service, Controller
- [Frontend Architecture](frontend-architecture.md) - Model, Services, Form Field, CRUD Page
- [Interactive Map](interactive-map.md) - Three-mode plant map (Edit, Select, Overview)
- [Hazard Auto-Apply](hazard-auto-apply.md) - Constant hazards auto-populate on area selection

## Entity Fields

- **Name** (inherited from BaseAuditEntity)
- **Description** (TEXT) - detailed area description
- **ConstantHazards** (JSON TEXT) - `SwHazards` POJO: highTemp, highPressure, energized, storedEnergy, eyeHazard, egressAccess, fireHazard, chemicalExposure, confinedSpace, highNoise, dustParticulate, combustibleDust, hotSurface, slippery, ventilationRequired, elevatedSurface, liftingHazard, handTraps, heatColdStress, environmental
- **ConstantLotos** (ManyToMany LotoStandard) - LOTOs always required for the area
- **AreaType** (ManyToOne Value) - category `workAreaType` (Confined Space, Electrical, Explosive Gas, Chemical, etc.)
- **Shape** (ManyToOne WorkAreaMapShape) - map position and size

## Routes

- `/permit-builder/work-areas` - CRUD management page (table + form)
- `/permit-builder/work-area-map` - Interactive plant map (Edit / Select / Overview modes)
