import { BaseDto, BaseModel } from '../base/base.model';
import { RfFormField } from '../ui/form-field.model';
import { Column } from '../column.model';
import { SwHazards } from './safe-work.model';
import { HotWorkMeasures } from './hot-work.model';
import { ConfinedSpaceHazards } from './confined-space.model';

export interface WorkCategoryProfileModel extends BaseModel {
  workCategory: { id: number; name: string } | null;
  standardHazards: SwHazards | null;
  standardHotWorkMeasures: HotWorkMeasures | null;
  standardConfinedSpaceHazards: ConfinedSpaceHazards | null;
}

export class WorkCategoryProfileDto extends BaseDto implements WorkCategoryProfileModel {
  workCategory: { id: number; name: string } | null;
  standardHazards: SwHazards | null;
  standardHotWorkMeasures: HotWorkMeasures | null;
  standardConfinedSpaceHazards: ConfinedSpaceHazards | null;

  constructor(data: Partial<WorkCategoryProfileModel> = {}) {
    super(data);
    this.workCategory = data.workCategory ?? null;
    this.standardHazards = data.standardHazards ? new SwHazards(data.standardHazards) : null;
    this.standardHotWorkMeasures = data.standardHotWorkMeasures ? new HotWorkMeasures(data.standardHotWorkMeasures) : null;
    this.standardConfinedSpaceHazards = data.standardConfinedSpaceHazards ? new ConfinedSpaceHazards(data.standardConfinedSpaceHazards) : null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      workCategory: this.workCategory,
      standardHazards: this.standardHazards,
      standardHotWorkMeasures: this.standardHotWorkMeasures,
      standardConfinedSpaceHazards: this.standardConfinedSpaceHazards,
    };
  }

  static override fromJson(json: any): WorkCategoryProfileDto {
    if (!json) return new WorkCategoryProfileDto();
    return new WorkCategoryProfileDto({
      id: json.id || 0,
      name: json.name || '',
      workCategory: json.workCategory,
      standardHazards: json.standardHazards,
      standardHotWorkMeasures: json.standardHotWorkMeasures,
      standardConfinedSpaceHazards: json.standardConfinedSpaceHazards,
    });
  }

  static toFormFields(entity: WorkCategoryProfileDto): RfFormField[] {
    return [
      {
        name: 'workCategoryName',
        label: 'Work Category',
        type: 'text',
        readonly: true,
        initialValue: entity.workCategory?.name ?? '',
      },
      ...WorkCategoryProfileDto.getHazardFields(entity.standardHazards),
      ...WorkCategoryProfileDto.getHotWorkMeasureFields(entity.standardHotWorkMeasures),
      ...WorkCategoryProfileDto.getConfinedSpaceHazardFields(entity.standardConfinedSpaceHazards),
    ];
  }

  static getHazardFields(hazardsDto: SwHazards | null): RfFormField[] {
    const hazards = hazardsDto || new SwHazards();
    const group = { label: 'Standard Hazards', orientation: 'horizontal' as const };
    return [
      { name: 'standardHazards.highTemp', label: 'High Temp', type: 'checkbox', initialValue: hazards.highTemp, group },
      { name: 'standardHazards.highPressure', label: 'High Pressure', type: 'checkbox', initialValue: hazards.highPressure, group },
      { name: 'standardHazards.energized', label: 'Energized', type: 'checkbox', initialValue: hazards.energized, group },
      { name: 'standardHazards.storedEnergy', label: 'Stored Energy', type: 'checkbox', initialValue: hazards.storedEnergy, group },
      { name: 'standardHazards.eyeHazard', label: 'Eye Hazard', type: 'checkbox', initialValue: hazards.eyeHazard, group },
      { name: 'standardHazards.egressAccess', label: 'Egress/Access', type: 'checkbox', initialValue: hazards.egressAccess, group },
      { name: 'standardHazards.fireHazard', label: 'Fire Hazard', type: 'checkbox', initialValue: hazards.fireHazard, group },
      { name: 'standardHazards.chemicalExposure', label: 'Chemical Exposure', type: 'checkbox', initialValue: hazards.chemicalExposure, group },
      { name: 'standardHazards.highNoise', label: 'High Noise', type: 'checkbox', initialValue: hazards.highNoise, group },
      { name: 'standardHazards.dustParticulate', label: 'Dust/Particulate', type: 'checkbox', initialValue: hazards.dustParticulate, group },
      { name: 'standardHazards.combustibleDust', label: 'Combustible Dust', type: 'checkbox', initialValue: hazards.combustibleDust, group },
      { name: 'standardHazards.hotSurface', label: 'Hot Surface', type: 'checkbox', initialValue: hazards.hotSurface, group },
      { name: 'standardHazards.slippery', label: 'Slippery', type: 'checkbox', initialValue: hazards.slippery, group },
      { name: 'standardHazards.ventilationRequired', label: 'Ventilation Required', type: 'checkbox', initialValue: hazards.ventilationRequired, group },
      { name: 'standardHazards.elevatedSurface', label: 'Elevated Surface', type: 'checkbox', initialValue: hazards.elevatedSurface, group },
      { name: 'standardHazards.liftingHazard', label: 'Lifting Hazard', type: 'checkbox', initialValue: hazards.liftingHazard, group },
      { name: 'standardHazards.handTraps', label: 'Hand Traps', type: 'checkbox', initialValue: hazards.handTraps, group },
      { name: 'standardHazards.heatColdStress', label: 'Heat/Cold Stress', type: 'checkbox', initialValue: hazards.heatColdStress, group },
      { name: 'standardHazards.environmental', label: 'Environmental', type: 'checkbox', initialValue: hazards.environmental, group },
    ];
  }

  static getHotWorkMeasureFields(measuresDto: HotWorkMeasures | null): RfFormField[] {
    const measures = measuresDto || new HotWorkMeasures();
    const group = { label: 'Standard Hot Work Measures', orientation: 'horizontal' as const };
    return [
      { name: 'standardHotWorkMeasures.areaIsClean', label: 'Area is Clean', type: 'checkbox', initialValue: measures.areaIsClean, group },
      { name: 'standardHotWorkMeasures.flammablesAreSecured', label: 'Flammables Secured', type: 'checkbox', initialValue: measures.flammablesAreSecured, group },
      { name: 'standardHotWorkMeasures.noCombustibleDustOrDebrisPresent', label: 'No Combustible Dust/Debris', type: 'checkbox', initialValue: measures.noCombustibleDustOrDebrisPresent, group },
      { name: 'standardHotWorkMeasures.radiativeHeatPreventiveMeasuresAreTaken', label: 'Radiative Heat Prevention', type: 'checkbox', initialValue: measures.radiativeHeatPreventiveMeasuresAreTaken, group },
      { name: 'standardHotWorkMeasures.vesselsArePurged', label: 'Vessels Purged', type: 'checkbox', initialValue: measures.vesselsArePurged, group },
      { name: 'standardHotWorkMeasures.openingsAreCovered', label: 'Openings Covered', type: 'checkbox', initialValue: measures.openingsAreCovered, group },
      { name: 'standardHotWorkMeasures.ductVentilationIsSecured', label: 'Duct Ventilation Secured', type: 'checkbox', initialValue: measures.ductVentilationIsSecured, group },
      { name: 'standardHotWorkMeasures.lockOutIsCompleted', label: 'Lock-Out Completed', type: 'checkbox', initialValue: measures.lockOutIsCompleted, group },
      { name: 'standardHotWorkMeasures.communicationIsEstablished', label: 'Communication Established', type: 'checkbox', initialValue: measures.communicationIsEstablished, group },
      { name: 'standardHotWorkMeasures.fireWatchIsAwareOfDuties', label: 'Fire Watch Aware of Duties', type: 'checkbox', initialValue: measures.fireWatchIsAwareOfDuties, group },
      { name: 'standardHotWorkMeasures.fireExtinguisherPresent', label: 'Fire Extinguisher Present', type: 'checkbox', initialValue: measures.fireExtinguisherPresent, group },
      { name: 'standardHotWorkMeasures.fireProtectionIsInService', label: 'Fire Protection in Service', type: 'checkbox', initialValue: measures.fireProtectionIsInService, group },
    ];
  }

  static getConfinedSpaceHazardFields(hazardsDto: ConfinedSpaceHazards | null): RfFormField[] {
    const hazards = hazardsDto || new ConfinedSpaceHazards();
    const group = { label: 'Standard Confined Space Hazards', orientation: 'horizontal' as const };
    return [
      { name: 'standardConfinedSpaceHazards.oxygenDeficiency', label: 'Oxygen Deficiency', type: 'checkbox', initialValue: hazards.oxygenDeficiency, group },
      { name: 'standardConfinedSpaceHazards.flammableGas', label: 'Flammable Gas', type: 'checkbox', initialValue: hazards.flammableGas, group },
      { name: 'standardConfinedSpaceHazards.combustibleDust', label: 'Combustible Dust', type: 'checkbox', initialValue: hazards.combustibleDust, group },
      { name: 'standardConfinedSpaceHazards.toxicGas', label: 'Toxic Gas', type: 'checkbox', initialValue: hazards.toxicGas, group },
      { name: 'standardConfinedSpaceHazards.rotatingEquipment', label: 'Rotating Equipment', type: 'checkbox', initialValue: hazards.rotatingEquipment, group },
      { name: 'standardConfinedSpaceHazards.electricalShock', label: 'Electrical Shock', type: 'checkbox', initialValue: hazards.electricalShock, group },
      { name: 'standardConfinedSpaceHazards.entrapment', label: 'Entrapment', type: 'checkbox', initialValue: hazards.entrapment, group },
      { name: 'standardConfinedSpaceHazards.engulfment', label: 'Engulfment', type: 'checkbox', initialValue: hazards.engulfment, group },
      { name: 'standardConfinedSpaceHazards.heatStress', label: 'Heat Stress', type: 'checkbox', initialValue: hazards.heatStress, group },
    ];
  }

  static toTableColumns(): Column[] {
    return [
      { id: 'workCategory', header: 'Work Category', accessorFn: (item: any) => item.workCategory?.name ?? '' },
      { id: 'hazardCount', header: 'Hazards', accessorFn: (item: any) => {
        const h = item.standardHazards;
        if (!h) return '0';
        return String(Object.values(h).filter(v => v === true).length);
      }},
      { id: 'hotWorkCount', header: 'Hot Work Measures', accessorFn: (item: any) => {
        const m = item.standardHotWorkMeasures;
        if (!m) return '0';
        return String(Object.values(m).filter(v => v === true).length);
      }},
      { id: 'confinedSpaceCount', header: 'Confined Space Hazards', accessorFn: (item: any) => {
        const h = item.standardConfinedSpaceHazards;
        if (!h) return '0';
        return String(Object.values(h).filter(v => v === true).length);
      }},
    ];
  }
}
