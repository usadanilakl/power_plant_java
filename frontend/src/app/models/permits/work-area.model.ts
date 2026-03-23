import { Validators } from '@angular/forms';
import { BaseDto, BaseModel } from '../base/base.model';
import { FormField, RfFormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { SwHazards } from './safe-work.model';
import { HotWorkMeasures } from './hot-work.model';
import { ConfinedSpaceHazards } from './confined-space.model';
import { Option } from '../option.model';

export interface WorkAreaModel extends BaseModel {
  description: string | null;
  areaType: { id: number; name: string } | null;
  constantHazards: SwHazards | null;
  constantHotWorkMeasures: HotWorkMeasures | null;
  constantConfinedSpaceHazards: ConfinedSpaceHazards | null;
  constantLotoIds: number[];
  shapeId: number | null;
}

export class WorkAreaDto extends BaseDto implements WorkAreaModel {
  description: string | null;
  areaType: { id: number; name: string } | null;
  constantHazards: SwHazards | null;
  constantHotWorkMeasures: HotWorkMeasures | null;
  constantConfinedSpaceHazards: ConfinedSpaceHazards | null;
  constantLotoIds: number[];
  shapeId: number | null;

  constructor(data: Partial<WorkAreaModel> = {}) {
    super(data);
    this.description = data.description ?? null;
    this.areaType = data.areaType ?? null;
    this.constantHazards = data.constantHazards ? new SwHazards(data.constantHazards) : null;
    this.constantHotWorkMeasures = data.constantHotWorkMeasures ? new HotWorkMeasures(data.constantHotWorkMeasures) : null;
    this.constantConfinedSpaceHazards = data.constantConfinedSpaceHazards ? new ConfinedSpaceHazards(data.constantConfinedSpaceHazards) : null;
    this.constantLotoIds = data.constantLotoIds ?? [];
    this.shapeId = data.shapeId ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      areaType: this.areaType,
      constantHazards: this.constantHazards,
      constantHotWorkMeasures: this.constantHotWorkMeasures,
      constantConfinedSpaceHazards: this.constantConfinedSpaceHazards,
      constantLotoIds: this.constantLotoIds,
      shapeId: this.shapeId,
    };
  }

  static override fromJson(json: any): WorkAreaDto {
    if (!json) return new WorkAreaDto();
    return new WorkAreaDto({
      id: json.id || 0,
      name: json.name || '',
      description: json.description,
      areaType: json.areaType,
      constantHazards: json.constantHazards,
      constantHotWorkMeasures: json.constantHotWorkMeasures,
      constantConfinedSpaceHazards: json.constantConfinedSpaceHazards,
      constantLotoIds: json.constantLotoIds || [],
      shapeId: json.shapeId,
    });
  }

  static toFormFields(entity: WorkAreaDto, lotoStandardOptions: Option[] = []): RfFormField[] {
    return [
      {
        name: 'name',
        label: 'Area Name',
        type: 'text',
        validators: [Validators.required],
        initialValue: entity.name ?? '',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        initialValue: entity.description ?? '',
      },
      {
        name: 'areaType',
        label: 'Area Type',
        type: 'value-select',
        categoryAlias: 'workAreaType',
        canManageValues: true,
        initialValue: entity.areaType?.id ?? null,
      },
      {
        name: 'constantLotoIds',
        label: 'LOTO Standards',
        type: 'loto-standard-select',
        options: lotoStandardOptions,
        initialValue: entity.constantLotoIds ?? [],
      },
      ...WorkAreaDto.getHazardFields(entity.constantHazards),
      ...WorkAreaDto.getHotWorkMeasureFields(entity.constantHotWorkMeasures),
      ...WorkAreaDto.getConfinedSpaceHazardFields(entity.constantConfinedSpaceHazards),
    ];
  }

  static getHazardFields(hazardsDto: SwHazards | null): RfFormField[] {
    const hazards = hazardsDto || new SwHazards();
    const group = { label: 'Constant Hazards', orientation: 'horizontal' as const };
    return [
      { name: 'constantHazards.highTemp', label: 'High Temp', type: 'checkbox', initialValue: hazards.highTemp, group },
      { name: 'constantHazards.highPressure', label: 'High Pressure', type: 'checkbox', initialValue: hazards.highPressure, group },
      { name: 'constantHazards.energized', label: 'Energized', type: 'checkbox', initialValue: hazards.energized, group },
      { name: 'constantHazards.storedEnergy', label: 'Stored Energy', type: 'checkbox', initialValue: hazards.storedEnergy, group },
      { name: 'constantHazards.eyeHazard', label: 'Eye Hazard', type: 'checkbox', initialValue: hazards.eyeHazard, group },
      { name: 'constantHazards.egressAccess', label: 'Egress/Access', type: 'checkbox', initialValue: hazards.egressAccess, group },
      { name: 'constantHazards.fireHazard', label: 'Fire Hazard', type: 'checkbox', initialValue: hazards.fireHazard, group },
      { name: 'constantHazards.chemicalExposure', label: 'Chemical Exposure', type: 'checkbox', initialValue: hazards.chemicalExposure, group },
      { name: 'constantHazards.confinedSpace', label: 'Confined Space', type: 'checkbox', initialValue: (hazards as any).confinedSpace ?? false, group },
      { name: 'constantHazards.highNoise', label: 'High Noise', type: 'checkbox', initialValue: hazards.highNoise, group },
      { name: 'constantHazards.dustParticulate', label: 'Dust/Particulate', type: 'checkbox', initialValue: hazards.dustParticulate, group },
      { name: 'constantHazards.combustibleDust', label: 'Combustible Dust', type: 'checkbox', initialValue: hazards.combustibleDust, group },
      { name: 'constantHazards.hotSurface', label: 'Hot Surface', type: 'checkbox', initialValue: hazards.hotSurface, group },
      { name: 'constantHazards.slippery', label: 'Slippery', type: 'checkbox', initialValue: hazards.slippery, group },
      { name: 'constantHazards.ventilationRequired', label: 'Ventilation Required', type: 'checkbox', initialValue: hazards.ventilationRequired, group },
      { name: 'constantHazards.elevatedSurface', label: 'Elevated Surface', type: 'checkbox', initialValue: hazards.elevatedSurface, group },
      { name: 'constantHazards.liftingHazard', label: 'Lifting Hazard', type: 'checkbox', initialValue: hazards.liftingHazard, group },
      { name: 'constantHazards.handTraps', label: 'Hand Traps', type: 'checkbox', initialValue: hazards.handTraps, group },
      { name: 'constantHazards.heatColdStress', label: 'Heat/Cold Stress', type: 'checkbox', initialValue: hazards.heatColdStress, group },
      { name: 'constantHazards.environmental', label: 'Environmental', type: 'checkbox', initialValue: hazards.environmental, group },
    ];
  }

  static getHotWorkMeasureFields(measuresDto: HotWorkMeasures | null): RfFormField[] {
    const measures = measuresDto || new HotWorkMeasures();
    const group = { label: 'Constant Hot Work Measures', orientation: 'horizontal' as const };
    return [
      { name: 'constantHotWorkMeasures.areaIsClean', label: 'Area is Clean', type: 'checkbox', initialValue: measures.areaIsClean, group },
      { name: 'constantHotWorkMeasures.flammablesAreSecured', label: 'Flammables Secured', type: 'checkbox', initialValue: measures.flammablesAreSecured, group },
      { name: 'constantHotWorkMeasures.noCombustibleDustOrDebrisPresent', label: 'No Combustible Dust/Debris', type: 'checkbox', initialValue: measures.noCombustibleDustOrDebrisPresent, group },
      { name: 'constantHotWorkMeasures.radiativeHeatPreventiveMeasuresAreTaken', label: 'Radiative Heat Prevention', type: 'checkbox', initialValue: measures.radiativeHeatPreventiveMeasuresAreTaken, group },
      { name: 'constantHotWorkMeasures.vesselsArePurged', label: 'Vessels Purged', type: 'checkbox', initialValue: measures.vesselsArePurged, group },
      { name: 'constantHotWorkMeasures.openingsAreCovered', label: 'Openings Covered', type: 'checkbox', initialValue: measures.openingsAreCovered, group },
      { name: 'constantHotWorkMeasures.ductVentilationIsSecured', label: 'Duct Ventilation Secured', type: 'checkbox', initialValue: measures.ductVentilationIsSecured, group },
      { name: 'constantHotWorkMeasures.lockOutIsCompleted', label: 'Lock-Out Completed', type: 'checkbox', initialValue: measures.lockOutIsCompleted, group },
      { name: 'constantHotWorkMeasures.communicationIsEstablished', label: 'Communication Established', type: 'checkbox', initialValue: measures.communicationIsEstablished, group },
      { name: 'constantHotWorkMeasures.fireWatchIsAwareOfDuties', label: 'Fire Watch Aware of Duties', type: 'checkbox', initialValue: measures.fireWatchIsAwareOfDuties, group },
      { name: 'constantHotWorkMeasures.fireExtinguisherPresent', label: 'Fire Extinguisher Present', type: 'checkbox', initialValue: measures.fireExtinguisherPresent, group },
      { name: 'constantHotWorkMeasures.fireProtectionIsInService', label: 'Fire Protection in Service', type: 'checkbox', initialValue: measures.fireProtectionIsInService, group },
    ];
  }

  static getConfinedSpaceHazardFields(hazardsDto: ConfinedSpaceHazards | null): RfFormField[] {
    const hazards = hazardsDto || new ConfinedSpaceHazards();
    const group = { label: 'Constant Confined Space Hazards', orientation: 'horizontal' as const };
    return [
      { name: 'constantConfinedSpaceHazards.oxygenDeficiency', label: 'Oxygen Deficiency', type: 'checkbox', initialValue: hazards.oxygenDeficiency, group },
      { name: 'constantConfinedSpaceHazards.flammableGas', label: 'Flammable Gas', type: 'checkbox', initialValue: hazards.flammableGas, group },
      { name: 'constantConfinedSpaceHazards.combustibleDust', label: 'Combustible Dust', type: 'checkbox', initialValue: hazards.combustibleDust, group },
      { name: 'constantConfinedSpaceHazards.toxicGas', label: 'Toxic Gas', type: 'checkbox', initialValue: hazards.toxicGas, group },
      { name: 'constantConfinedSpaceHazards.rotatingEquipment', label: 'Rotating Equipment', type: 'checkbox', initialValue: hazards.rotatingEquipment, group },
      { name: 'constantConfinedSpaceHazards.electricalShock', label: 'Electrical Shock', type: 'checkbox', initialValue: hazards.electricalShock, group },
      { name: 'constantConfinedSpaceHazards.entrapment', label: 'Entrapment', type: 'checkbox', initialValue: hazards.entrapment, group },
      { name: 'constantConfinedSpaceHazards.engulfment', label: 'Engulfment', type: 'checkbox', initialValue: hazards.engulfment, group },
      { name: 'constantConfinedSpaceHazards.heatStress', label: 'Heat Stress', type: 'checkbox', initialValue: hazards.heatStress, group },
    ];
  }

  static toTableColumns(): Column[] {
    return [
      { id: 'name', header: 'Name', accessorKey: 'name' },
      { id: 'description', header: 'Description', accessorKey: 'description' },
      { id: 'areaType', header: 'Area Type', accessorFn: (item: any) => item.areaType?.name ?? '' },
    ];
  }
}

export interface WorkAreaMapShapeDto {
  id: number;
  coordinates: string;
  originalPictureSize: string;
  label: string;
  workAreaIds: number[];
}

export interface WorkAreaPermitCounts {
  workArea: WorkAreaDto;
  safeWorkCount: number;
  hotWorkCount: number;
  confinedSpaceCount: number;
}
