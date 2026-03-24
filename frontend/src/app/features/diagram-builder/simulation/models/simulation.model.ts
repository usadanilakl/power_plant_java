export type SimNodeRole =
  | 'source'
  | 'sink'
  | 'valve'
  | 'pump'
  | 'instrument'
  | 'motor'
  | 'junction'
  | 'pipe';

export type ValvePosition = 'open' | 'closed' | 'throttled';

export const SYMBOL_ROLE_MAP: Record<string, SimNodeRole> = {
  'manual-valve': 'valve',
  'mov': 'valve',
  'aov': 'valve',
  'cv': 'valve',
  'bypass-line-2-valves': 'valve',
  'centrifugal-pump': 'pump',
  'pressure-indicator': 'instrument',
  'motor': 'motor',
};

export function roleFromShapeType(type: string): SimNodeRole {
  if (type === 'line') return 'pipe';
  return 'junction';
}

export interface SimNodeParams {
  role: SimNodeRole;

  // Source
  sourcePressure?: number;
  sourceTemperature?: number;
  sourceFlowRate?: number;

  // Valve
  valvePosition?: ValvePosition;
  throttlePercent?: number;

  // Pump
  pumpRunning?: boolean;
  pumpDeltaP?: number;

  // Pipe
  pipeFrictionDrop?: number;
}

export interface SimNodeState {
  shapeId: number;
  role: SimNodeRole;
  params: SimNodeParams;
  pressure: number;
  temperature: number;
  flowRate: number;
  isFlowing: boolean;
}

export interface SimEdgeState {
  connectionId: number;
  flowRate: number;
  pressure: number;
  temperature: number;
  isFlowing: boolean;
}

export interface SimGraphNode {
  shapeId: number;
  role: SimNodeRole;
  params: SimNodeParams;
  upstreamEdges: number[];
  downstreamEdges: number[];
}

export function defaultParams(role: SimNodeRole): SimNodeParams {
  const base: SimNodeParams = { role };
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
      break;
    case 'pipe':
      base.pipeFrictionDrop = 0.5;
      break;
  }
  return base;
}

export function defaultNodeState(shapeId: number, role: SimNodeRole): SimNodeState {
  return {
    shapeId,
    role,
    params: defaultParams(role),
    pressure: 0,
    temperature: 0,
    flowRate: 0,
    isFlowing: false,
  };
}
