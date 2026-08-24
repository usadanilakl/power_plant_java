import { Option } from '../inputs/option.model';

/**
 * The hazard shapes the Safe Work / Hot Work / Confined Space permits carry, mirrored for the PWA.
 *
 * <p>Field names match the Java POJOs (`SwHazards`, `HotWorkMeasures`, `ConfinedSpaceHazards`)
 * exactly, because what a requester declares here is what seeds the permits an operator generates
 * from the request. A renamed key would silently stop carrying over — nothing would break loudly,
 * a hazard would just quietly fail to appear on the permit — so treat these names as a contract
 * with the backend, not as local labels.
 *
 * <p>Labels come from the desktop Safe Work form so the same hazard reads the same way to the
 * contractor declaring it and the operator reviewing it.
 */

export class SwHazards {
  // Column 1 — * requires Plant Manager approval, ** requires Energized Electrical WP
  highTemp = false;
  highPressure = false;
  hazardousFlammablePipingMaint = false;
  electricalTesting599V = false;
  energized = false;
  storedEnergy = false;
  eyeHazard = false;
  egressAccess = false;
  ergonomicHazard = false;
  // Column 2
  fallingObject = false;
  highNoise = false;
  dustParticulate = false;
  combustibleDust = false;
  fireHazard = false;
  hotSurface = false;
  slippery = false;
  ventilationRequired = false;
  lightingRestrictions = false;
  exposedRotatingParts = false;
  // Column 3
  chemicalExposure = false;
  liftingHazard = false;
  handTraps = false;
  heatColdStress = false;
  elevatedSurface = false;
  environmental = false;
  weatherHazards = false;
  testingTroubleshooting50V = false;
  hexavalentChromium = false;
  other = false;

  constructor(data: Partial<SwHazards> = {}) {
    Object.assign(this, data ?? {});
  }
}

export class HotWorkMeasures {
  areaIsClean = false;
  flammablesAreSecured = false;
  noCombustibleDustOrDebrisPresent = false;
  radiativeHeatPreventiveMeasuresAreTaken = false;
  vesselsArePurged = false;
  openingsAreCovered = false;
  ductVentilationIsSecured = false;
  lockOutIsCompleted = false;
  communicationIsEstablished = false;
  fireWatchIsAwareOfDuties = false;
  fireExtinguisherPresent = false;
  fireProtectionIsInService = false;

  constructor(data: Partial<HotWorkMeasures> = {}) {
    Object.assign(this, data ?? {});
  }
}

export class ConfinedSpaceHazards {
  oxygenDeficiency = false;
  flammableGas = false;
  combustibleDust = false;
  toxicGas = false;
  rotatingEquipment = false;
  electricalShock = false;
  entrapment = false;
  engulfment = false;
  heatStress = false;
  other = false;

  constructor(data: Partial<ConfinedSpaceHazards> = {}) {
    Object.assign(this, data ?? {});
  }
}

/**
 * The free-text companions to some hazards (`weatherHazardDescription`, `voltageDescription`,
 * `otherDescription`) exist on the Java POJOs but are deliberately not offered here. They are
 * operator-authored detail that belongs on the permit, and the requester already has a Detailed
 * Work Scope field for anything they want to say. Leaving them out keeps the checkbox blocks
 * scannable on a phone; the backend's `@JsonIgnoreProperties` tolerates their absence and the
 * operator's permit form still has them.
 */

const SW_HAZARD_LABELS: ReadonlyArray<[keyof SwHazards, string]> = [
  ['highTemp', 'High Temperature (>140F) *'],
  ['highPressure', 'High Pressure (>100 psi) *'],
  ['hazardousFlammablePipingMaint', 'Hazardous or Flammable Piping Maint. *'],
  ['electricalTesting599V', 'Electrical Testing >599V *'],
  ['energized', 'Energized Electrical Work (>50V) **'],
  ['storedEnergy', 'Stored Energy (LOTO)'],
  ['eyeHazard', 'Eye Hazard'],
  ['egressAccess', 'Egress & Access Hazard'],
  ['ergonomicHazard', 'Ergonomic Hazards'],
  ['fallingObject', 'Falling Object Hazard'],
  ['highNoise', 'High Noise'],
  ['dustParticulate', 'Dust/Particulate'],
  ['combustibleDust', 'Combustible Dust'],
  ['fireHazard', 'Fire/Explosion Hazard'],
  ['hotSurface', 'Hot Surfaces'],
  ['slippery', 'Slip/Trip/Fall Hazards'],
  ['ventilationRequired', "Ventilation Req'd (Mech/Natural)"],
  ['lightingRestrictions', 'Lighting/Visibility Restrictions'],
  ['exposedRotatingParts', 'Exposed Rotating Parts'],
  ['chemicalExposure', 'Possible Chemical Exposure'],
  ['liftingHazard', 'Lifting Hazard'],
  ['handTraps', 'Hand Traps'],
  ['heatColdStress', 'Heat/Cold Stress'],
  ['elevatedSurface', 'Elevated Work Surface'],
  ['environmental', 'Environmental Concern'],
  ['weatherHazards', 'Weather Hazards'],
  ['testingTroubleshooting50V', 'Testing/Troubleshooting >50V'],
  ['hexavalentChromium', 'Hexavalent Chromium (Cr VI)'],
  ['other', 'Other (describe in work scope)'],
];

const HOT_WORK_LABELS: ReadonlyArray<[keyof HotWorkMeasures, string]> = [
  ['areaIsClean', 'Area is clean'],
  ['flammablesAreSecured', 'Flammables secured'],
  ['noCombustibleDustOrDebrisPresent', 'No combustible dust/debris present'],
  ['radiativeHeatPreventiveMeasuresAreTaken', 'Radiative heat prevention in place'],
  ['vesselsArePurged', 'Vessels purged'],
  ['openingsAreCovered', 'Openings covered'],
  ['ductVentilationIsSecured', 'Duct ventilation secured'],
  ['lockOutIsCompleted', 'Lock-out completed'],
  ['communicationIsEstablished', 'Communication established'],
  ['fireWatchIsAwareOfDuties', 'Fire watch aware of duties'],
  ['fireExtinguisherPresent', 'Fire extinguisher present'],
  ['fireProtectionIsInService', 'Fire protection in service'],
];

const CONFINED_SPACE_LABELS: ReadonlyArray<[keyof ConfinedSpaceHazards, string]> = [
  ['oxygenDeficiency', 'Oxygen deficiency'],
  ['flammableGas', 'Flammable gas'],
  ['combustibleDust', 'Combustible dust'],
  ['toxicGas', 'Toxic gas'],
  ['rotatingEquipment', 'Rotating equipment'],
  ['electricalShock', 'Electrical shock'],
  ['entrapment', 'Entrapment'],
  ['engulfment', 'Engulfment'],
  ['heatStress', 'Heat stress'],
  ['other', 'Other (describe in work scope)'],
];

/**
 * Turn a hazard object into checkbox-group options.
 *
 * The checkbox group renders its ticked state from `option.value` and writes back under
 * `option.key`, so the options must be rebuilt from the CURRENT object — which is what the model's
 * `getFormFields()` does each time it runs.
 */
function toOptions<T extends object>(
  current: T,
  labels: ReadonlyArray<[keyof T, string]>
): Option[] {
  return labels.map(([key, label]) => ({
    key: key as string,
    label,
    value: current[key] === true,
  }));
}

export const swHazardOptions = (h: SwHazards): Option[] => toOptions(h, SW_HAZARD_LABELS);
export const hotWorkMeasureOptions = (m: HotWorkMeasures): Option[] => toOptions(m, HOT_WORK_LABELS);
export const confinedSpaceHazardOptions = (h: ConfinedSpaceHazards): Option[] =>
  toOptions(h, CONFINED_SPACE_LABELS);

/** Human-readable list of everything ticked — for the email fallback body and summaries. */
export function tickedLabels<T extends object>(
  current: T | null | undefined,
  labels: ReadonlyArray<[keyof T, string]>
): string[] {
  if (!current) return [];
  return labels.filter(([key]) => current[key] === true).map(([, label]) => label);
}

export const tickedSwHazards = (h: SwHazards | null | undefined) => tickedLabels(h, SW_HAZARD_LABELS);
export const tickedHotWorkMeasures = (m: HotWorkMeasures | null | undefined) =>
  tickedLabels(m, HOT_WORK_LABELS);
export const tickedConfinedSpaceHazards = (h: ConfinedSpaceHazards | null | undefined) =>
  tickedLabels(h, CONFINED_SPACE_LABELS);

/**
 * The three blocks as the single JSON envelope the SharePoint `DeclaredHazards` column holds.
 *
 * Key names (`hazards` / `hotWork` / `confinedSpace`) must match the Java `DeclaredHazards` POJO
 * exactly — this is a wire contract, and a mismatch fails silently rather than loudly.
 *
 * Only used on the Power Automate fallback path. When the hub is reachable the declaration travels
 * as three typed objects on the normal DTO; this envelope exists because the PA path writes
 * straight to SharePoint, and without it a declaration made while the hub was down was dropped on
 * the floor — the requester saw "submitted successfully" and the operator saw no hazards at all.
 *
 * Returns '' when nothing is ticked, so a request with no declaration leaves the column genuinely
 * empty instead of stamping a meaningless `{}` on it.
 */
export function declaredHazardsEnvelope(
  hazards: SwHazards | null | undefined,
  hotWork: HotWorkMeasures | null | undefined,
  confinedSpace: ConfinedSpaceHazards | null | undefined,
  hotWorkProfile?: HotWorkProfile | null
): string {
  const anyTicked = (block: object | null | undefined) =>
    !!block && Object.values(block).some(v => v === true);

  if (!anyTicked(hazards) && !anyTicked(hotWork) && !anyTicked(confinedSpace)
      && !anyTicked(hotWorkProfile)) {
    return '';
  }
  return JSON.stringify({
    hazards: hazards ?? null,
    hotWork: hotWork ?? null,
    confinedSpace: confinedSpace ?? null,
    hotWorkProfile: hotWorkProfile ?? null,
  });
}


/**
 * What kind of hot work is planned, plus the hexavalent chromium (Cr(VI)) assessment.
 *
 * Field names mirror the Java `HotWorkProfile` POJO exactly — same wire contract as the hazard
 * blocks above.
 *
 * Two levels, because only the second is expensive to fill in: the type is asked whenever hot work
 * is required, and the Cr(VI) assessment only when *welding* is one of the types, since that is the
 * operation that liberates hexavalent chromium from chrome-bearing base metal.
 */
export class HotWorkProfile {
  // Level 1 — type of hot work
  welding = false;
  grinding = false;
  torchCutting = false;
  plasmaCutting = false;
  arcGouging = false;
  brazingSoldering = false;
  openFlameHeating = false;
  other = false;
  otherDescription = '';

  // Level 2 — Cr(VI) assessment, welding only. '' = not assessed.
  fumeLevel: '' | 'HIGH' | 'MEDIUM' | 'LOW' = '';
  chromeContent: '' | 'HIGH' | 'MEDIUM' | 'LOW' = '';

  constructor(data: Partial<HotWorkProfile> = {}) {
    Object.assign(this, data ?? {});
  }
}

const HOT_WORK_TYPE_LABELS: ReadonlyArray<[keyof HotWorkProfile, string]> = [
  ['welding', 'Welding'],
  ['grinding', 'Grinding'],
  ['torchCutting', 'Torch cutting'],
  ['plasmaCutting', 'Plasma cutting'],
  ['arcGouging', 'Arc gouging'],
  ['brazingSoldering', 'Brazing / soldering'],
  ['openFlameHeating', 'Open flame / heating'],
  ['other', 'Other (describe below)'],
];

/**
 * The worksheet's weights are part of the label on purpose — the printed form shows them, the
 * assessment is their product, and a requester picking a tier should see what it costs.
 */
export const FUME_LEVEL_OPTIONS: Option[] = [
  { value: 'HIGH', label: 'High fume producing (9) — stick welding, arc gouging, plasma cutting, torch cutting' },
  { value: 'MEDIUM', label: 'Medium fume producing (3) — MIG welding' },
  { value: 'LOW', label: 'Low fume producing (1) — TIG welding, grinding' },
];

export const CHROME_CONTENT_OPTIONS: Option[] = [
  { value: 'HIGH', label: 'High chrome content (9) — over 17%' },
  { value: 'MEDIUM', label: 'Medium chrome content (3) — over 9% up to 17%' },
  { value: 'LOW', label: 'Low chrome content (1) — 0.5% to 9%' },
];

export const hotWorkTypeOptions = (p: HotWorkProfile): Option[] =>
  toOptions(p as any, HOT_WORK_TYPE_LABELS as any);

/** Ticked hot work types, as readable labels. */
export const tickedHotWorkTypes = (p: HotWorkProfile | null | undefined): string[] =>
  tickedLabels(p as any, HOT_WORK_TYPE_LABELS as any);

/** Worksheet weight for a tier; 0 when unanswered, so an unassessed job scores 0 and reads as such. */
export function hotWorkWeightOf(tier: string | null | undefined): number {
  switch ((tier ?? '').toUpperCase()) {
    case 'HIGH': return 9;
    case 'MEDIUM': return 3;
    case 'LOW': return 1;
    default: return 0;
  }
}

/** `fume x chrome` per the worksheet. 0 when either half is unanswered. */
export function hotWorkExposureScore(p: HotWorkProfile | null | undefined): number {
  if (!p) return 0;
  return hotWorkWeightOf(p.fumeLevel) * hotWorkWeightOf(p.chromeContent);
}
