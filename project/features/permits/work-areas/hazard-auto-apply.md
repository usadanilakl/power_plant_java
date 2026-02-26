## Constant Hazards Auto-Apply

### Description

When a user selects a Work Area while creating a permit (SafeWork, HotWork, ConfinedSpace, or WorkRequest), the area's constant hazards automatically populate the hazard checkboxes on the form. This prevents operators from missing hazards that are always present in a given area.

### Flow

```
User opens permit form (e.g. SafeWork)
        ||
        \/
User selects Work Area from dropdown
        ||
        \/
WorkAreaSelectComponent emits full WorkAreaDto
(includes constantHazards: SwHazards POJO)
        ||
        \/
Form component receives (workAreaSelected) event
        ||
        \/
onWorkAreaSelected() patches hazard FormControls:
  - hazards.highTemp = constantHazards.highTemp
  - hazards.highPressure = constantHazards.highPressure
  - ... (all 20 hazard fields)
        ||
        \/
Hazard checkboxes update on the form
User can still modify checkboxes after auto-apply
```

### Implementation

#### Frontend: WorkAreaSelectComponent

The `WorkAreaSelectComponent` (CVA form field) emits the full `WorkAreaDto` object, not just the ID. This allows the parent form to access `constantHazards` without an additional API call.

```typescript
// On selection change
workAreaSelected = output<WorkAreaDto | null>();

private emitSelectedWorkArea(valueId: any): void {
  const selected = this.workAreas().find(wa => wa.id === valueId) || null;
  this.workAreaSelected.emit(selected);
}
```

#### Frontend: Form Components

Both form systems handle the event:

**SmartFormComponent** (used by SafeWork, HotWork, ConfinedSpace):
```typescript
onWorkAreaSelected(workArea: WorkAreaDto | null): void {
  if (!workArea?.constantHazards || !this.form) return;
  const hazards = workArea.constantHazards;
  const hazardGroup = this.form.get('hazards');
  if (!hazardGroup) return;

  // Patch each hazard field from constantHazards
  Object.keys(hazards).forEach(key => {
    const control = hazardGroup.get(key);
    if (control && hazards[key]) {
      control.setValue(hazards[key]);
    }
  });
}
```

**RfReactiveFormComponent** (used by WorkRequest):
- Same logic, patches `hazards.*` FormGroup controls

#### Hazard Field Mapping

The field names align 1:1 between `constantHazards` (WorkArea) and `hazards` (SafeWork):

| WorkArea constantHazards | SafeWork hazards | Label |
|--------------------------|------------------|-------|
| constantHazards.highTemp | hazards.highTemp | High Temp |
| constantHazards.highPressure | hazards.highPressure | High Pressure |
| constantHazards.energized | hazards.energized | Energized |
| constantHazards.storedEnergy | hazards.storedEnergy | Stored Energy |
| constantHazards.eyeHazard | hazards.eyeHazard | Eye Hazard |
| constantHazards.egressAccess | hazards.egressAccess | Egress/Access |
| constantHazards.fireHazard | hazards.fireHazard | Fire Hazard |
| constantHazards.chemicalExposure | hazards.chemicalExposure | Chemical Exposure |
| constantHazards.confinedSpace | hazards.confinedSpace | Confined Space |
| constantHazards.highNoise | hazards.highNoise | High Noise |
| constantHazards.dustParticulate | hazards.dustParticulate | Dust/Particulate |
| constantHazards.combustibleDust | hazards.combustibleDust | Combustible Dust |
| constantHazards.hotSurface | hazards.hotSurface | Hot Surface |
| constantHazards.slippery | hazards.slippery | Slippery |
| constantHazards.ventilationRequired | hazards.ventilationRequired | Ventilation Required |
| constantHazards.elevatedSurface | hazards.elevatedSurface | Elevated Surface |
| constantHazards.liftingHazard | hazards.liftingHazard | Lifting Hazard |
| constantHazards.handTraps | hazards.handTraps | Hand Traps |
| constantHazards.heatColdStress | hazards.heatColdStress | Heat/Cold Stress |
| constantHazards.environmental | hazards.environmental | Environmental |

Both use the `SwHazards` POJO (backend) / interface (frontend), so field names are identical.

#### Backend: Permit Mapper Updates

All permit mappers include `workArea` in DTO responses so the frontend can display which area a permit belongs to:

- **SafeWorkMapper** → `dto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()))`
- **HotWorkMapper** → same pattern
- **ConfinedSpaceMapper** → same pattern
- **WorkRequestMapper** → `ngDto.setWorkArea(workAreaMapper.convertToDto(entity.getWorkArea()))` (on `convertToNgDto`, since NgWorkRequestDto has its own `workArea` field)

### Behavior Notes

1. Auto-apply only sets checkboxes to `true` — it does not uncheck any hazards that were already checked
2. User can modify any checkbox after auto-apply (it's a suggestion, not a lock)
3. Changing the work area selection re-applies the new area's constant hazards
4. If the selected area has no constant hazards, no changes are made to the form
