import { SimRole } from '../../models/sim-equipment.model';
import { RoleStrategy } from './role-strategy';
import { sourceStrategy } from './source.strategy';
import { sinkStrategy } from './sink.strategy';
import { valveStrategy } from './valve.strategy';
import { pumpStrategy } from './pump.strategy';
import { vesselStrategy } from './vessel.strategy';
import { passthroughStrategy } from './passthrough.strategy';
import { threeWayValveStrategy } from './three-way-valve.strategy';
import { selectorValveStrategy } from './selector-valve.strategy';
import { pressureRegulatorStrategy } from './pressure-regulator.strategy';
import { filterStrategy } from './filter.strategy';
import { bearingStrategy } from './bearing.strategy';
import { heaterStrategy } from './heater.strategy';
import { vaporExtractorStrategy } from './vapor-extractor.strategy';
import { heatExchangerStrategy } from './heat-exchanger.strategy';
import { accumulatorStrategy } from './accumulator.strategy';

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
  'three-way-valve': threeWayValveStrategy,
  'selector-valve': selectorValveStrategy,
  'pressure-regulator': pressureRegulatorStrategy,
  filter: filterStrategy,
  bearing: bearingStrategy,
  heater: heaterStrategy,
  'vapor-extractor': vaporExtractorStrategy,
  'heat-exchanger': heatExchangerStrategy,
  accumulator: accumulatorStrategy,
};

export function getStrategy(role: SimRole): RoleStrategy {
  return STRATEGIES[role] ?? passthroughStrategy;
}
