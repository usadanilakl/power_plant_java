// --- Enums (literal unions) ---

export type SimRole = 'source' | 'sink' | 'valve' | 'pump' | 'pipe' | 'vessel' | 'junction' | 'instrument' | 'motor';
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
  'heat-exchanger': 'vessel',
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
};
