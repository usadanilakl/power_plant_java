import { SimRole } from '../../models/sim-equipment.model';
import { RoleStrategy } from './role-strategy';
import { sourceStrategy } from './source.strategy';
import { sinkStrategy } from './sink.strategy';
import { valveStrategy } from './valve.strategy';
import { pumpStrategy } from './pump.strategy';
import { vesselStrategy } from './vessel.strategy';
import { passthroughStrategy } from './passthrough.strategy';

const STRATEGIES: Record<SimRole, RoleStrategy> = {
  source: sourceStrategy,
  sink: sinkStrategy,
  valve: valveStrategy,
  pump: pumpStrategy,
  vessel: vesselStrategy,
  pipe: passthroughStrategy,
  junction: passthroughStrategy,
  instrument: passthroughStrategy,
  motor: passthroughStrategy,
};

export function getStrategy(role: SimRole): RoleStrategy {
  return STRATEGIES[role] ?? passthroughStrategy;
}
