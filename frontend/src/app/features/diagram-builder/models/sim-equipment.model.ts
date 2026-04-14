// --- Enums (literal unions) ---

export type SimRole = 'source' | 'sink' | 'valve' | 'pump' | 'pipe' | 'vessel' | 'junction' | 'instrument' | 'motor'
  | 'three-way-valve' | 'selector-valve' | 'pressure-regulator' | 'filter' | 'bearing'
  | 'heater' | 'vapor-extractor' | 'heat-exchanger' | 'accumulator';
export type SourceEntityType = 'Equipment' | 'LotoPoint';
export type ValvePosition = 'open' | 'closed' | 'throttled';
export type MeasuredProperty = 'pressure' | 'temperature' | 'flow';

// --- SimParams (versioned JSON) ---

export interface SimParams {
  schemaVersion: 1;

  // Source
  sourcePressure?: number;
  sourceTemperature?: number;
  sourceFlowRate?: number;

  // Valve
  valvePosition?: ValvePosition;
  throttlePercent?: number;
  cvCoefficient?: number;

  // Pump
  pumpRunning?: boolean;
  pumpDeltaP?: number;
  pumpEfficiency?: number;
  maxFlow?: number;
  minInletPressure?: number;

  // Pipe (template defaults)
  diameter?: number;
  length?: number;
  frictionFactor?: number;
  insulationFactor?: number;
  material?: string;

  // Vessel
  volume?: number;
  maxPressure?: number;
  currentLevel?: number;
  minLevel?: number;

  // Instrument
  measuredProperty?: MeasuredProperty;

  // Motor
  running?: boolean;
  power?: number;

  // Three-way valve
  threeWayPosition?: number;  // 0-100: 0 = all to port A, 100 = all to port B

  // Selector valve
  selectedPort?: string;      // 'A' or 'B'

  // Pressure regulator
  setpointPressure?: number;
  regulatorMaxFlow?: number;

  // Filter
  filterDeltaP?: number;

  // Bearing
  bearingFlowRequired?: number;
  bearingMaxTemp?: number;
  bearingTemp?: number;
  heatTransferCoeff?: number;

  // Accumulator
  accumulatorSetPressure?: number;
  accumulatorDamping?: number;

  // Heat exchanger
  hxEffectiveness?: number;

  // Vessel thermal
  vesselTemperature?: number;

  // Heater
  heaterRunning?: boolean;
  heaterDeltaT?: number;

  // Vapor extractor
  extractorRunning?: boolean;
  extractorPressureReduction?: number;
}

// --- DTO (matches backend SimEquipmentDto) ---

export interface SimEquipmentDto {
  id?: number;
  name?: string;
  description?: string;
  symbolId?: string;
  svgPath?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  defaultColor?: string;
  simRole?: SimRole | string;
  simParamsJson?: string;
  sourceEntityType?: SourceEntityType | 'EQUIPMENT' | 'LOTO_POINT' | string;
  sourceEntityId?: number;
  dateCreated?: string;
  dateModified?: string;
  createdBy?: string;
  deleted?: boolean;
}

// --- Helpers ---

export function parseSimParams(json: string | null | undefined): SimParams {
  if (!json) return { schemaVersion: 1 };
  try {
    const parsed = JSON.parse(json);
    if (!parsed.schemaVersion) parsed.schemaVersion = 1;
    return parsed;
  } catch {
    return { schemaVersion: 1 };
  }
}

export function serializeSimParams(params: SimParams): string {
  return JSON.stringify({ ...params, schemaVersion: 1 });
}

export function normalizeSimRole(role: string | null | undefined): SimRole {
  switch ((role || '').toLowerCase()) {
    case 'source': return 'source';
    case 'sink': return 'sink';
    case 'valve': return 'valve';
    case 'pump': return 'pump';
    case 'pipe': return 'pipe';
    case 'vessel': return 'vessel';
    case 'instrument': return 'instrument';
    case 'motor': return 'motor';
    case 'three-way-valve': return 'three-way-valve';
    case 'selector-valve': return 'selector-valve';
    case 'pressure-regulator': return 'pressure-regulator';
    case 'filter': return 'filter';
    case 'bearing': return 'bearing';
    case 'heater': return 'heater';
    case 'vapor-extractor': return 'vapor-extractor';
    case 'heat-exchanger': return 'heat-exchanger';
    case 'accumulator': return 'accumulator';
    case 'junction':
    default:
      return 'junction';
  }
}

export function normalizeSourceEntityType(type: string | null | undefined): SourceEntityType | null {
  switch ((type || '').toLowerCase()) {
    case 'equipment':
    case 'equip':
    case 'eq':
    case 'equipment_entity':
    case 'equipment-entity':
    case 'equipment entity':
      return 'Equipment';
    case 'lotopoint':
    case 'loto_point':
    case 'loto-point':
    case 'loto point':
      return 'LotoPoint';
    default:
      return null;
  }
}

export function defaultSimParams(role: SimRole): SimParams {
  const base: SimParams = { schemaVersion: 1 };
  switch (role) {
    case 'source':
      base.sourcePressure = 100;
      base.sourceTemperature = 500;
      base.sourceFlowRate = 10000;
      break;
    case 'valve':
      base.valvePosition = 'open';
      base.throttlePercent = 50;
      break;
    case 'pump':
      base.pumpRunning = true;
      base.pumpDeltaP = 50;
      base.maxFlow = 10000;
      base.minInletPressure = 10;
      break;
    case 'pipe':
      base.diameter = 12;
      base.length = 50;
      base.frictionFactor = 0.02;
      base.insulationFactor = 0;
      break;
    case 'vessel':
      base.volume = 1000;
      base.maxPressure = 3000;
      base.currentLevel = 50;
      base.minLevel = 0;
      base.sourcePressure = 15;
      break;
    case 'instrument':
      base.measuredProperty = 'pressure';
      break;
    case 'motor':
      base.running = true;
      base.power = 500;
      break;
    case 'three-way-valve':
      base.threeWayPosition = 50;
      break;
    case 'selector-valve':
      base.selectedPort = 'A';
      break;
    case 'pressure-regulator':
      base.setpointPressure = 50;
      base.regulatorMaxFlow = 10000;
      break;
    case 'filter':
      base.filterDeltaP = 5;
      break;
    case 'bearing':
      base.bearingFlowRequired = 100;
      base.bearingMaxTemp = 180;
      base.bearingTemp = 200;
      base.heatTransferCoeff = 0.3;
      break;
    case 'heater':
      base.heaterRunning = false;
      base.heaterDeltaT = 50;
      break;
    case 'vapor-extractor':
      base.extractorRunning = true;
      base.extractorPressureReduction = 2;
      break;
    case 'accumulator':
      base.accumulatorSetPressure = 50;
      base.accumulatorDamping = 0.3;
      break;
    case 'heat-exchanger':
      base.hxEffectiveness = 0.7;
      break;
  }
  return base;
}

export const SYMBOL_ROLE_MAP: Record<string, SimRole> = {
  'manual-valve': 'valve',
  'gate-valve': 'valve',
  'globe-valve': 'valve',
  'check-valve': 'valve',
  'ball-valve': 'valve',
  'butterfly-valve': 'valve',
  'relief-valve': 'valve',
  'mov': 'valve',
  'aov': 'valve',
  'cv': 'valve',
  'bypass-line-2-valves': 'valve',
  'centrifugal-pump': 'pump',
  'vertical-pump': 'pump',
  'positive-displacement-pump': 'pump',
  'compressor': 'pump',
  'heat-exchanger': 'heat-exchanger',
  'horizontal-vessel': 'vessel',
  'vertical-vessel': 'vessel',
  'tank': 'vessel',
  'pressure-indicator': 'instrument',
  'pressure-transmitter': 'instrument',
  'temperature-indicator': 'instrument',
  'flow-indicator': 'instrument',
  'level-indicator': 'instrument',
  'motor': 'motor',
  'generator': 'motor',
  'transformer': 'motor',
  'breaker': 'motor',
  'switchgear': 'motor',
  // Rotating equipment
  'generator-body': 'vessel',
  'shaft-seal': 'vessel',
  'bearing-housing': 'bearing',
  'exciter': 'junction',
  'drain-pot': 'vessel',
  'float-trap': 'valve',
  'vacuum-pump': 'pump',
  'detraining-tank': 'vessel',
  'vapor-extractor': 'vapor-extractor',
  'filter': 'filter',
  'seal-drain-tray': 'vessel',
  'vacuum-tank-horizontal': 'vessel',
  'expansion-tank': 'vessel',
  'three-way-valve': 'three-way-valve',
  'square-tank': 'vessel',
};
