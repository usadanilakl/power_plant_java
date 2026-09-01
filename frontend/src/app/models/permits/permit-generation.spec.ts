import { SafeWorkDto, SwHazards } from './safe-work.model';
import { HotWorkDto, HotWorkMeasures, HotWorkProfile } from './hot-work.model';
import { ConfinedSpaceDto, ConfinedSpaceHazards } from './confined-space.model';
import { WorkRequestDto } from './work-request.model';
import { WorkAreaDto } from './work-area.model';
import { WorkCategoryProfileDto } from './work-category-profile.model';

/**
 * What a generated permit starts from.
 *
 * <p>This is the highest-consequence logic in the flow: a contractor declares hazards, an operator
 * presses "Generate from WR", and whatever comes out is what the crew works to. It had no test at
 * all, and all three generators were silently dropping the contractor's own declaration.
 */
describe('generatePermitFromRequest', () => {

  function request(overrides: Partial<WorkRequestDto> = {}): WorkRequestDto {
    return new WorkRequestDto({
      requestedBy: 'A Contractor',
      company: 'Acme',
      location: 'Boiler Room',
      workScope: 'Replace gauge',
      ...overrides,
    } as any);
  }

  // ------------------------------------------------------------------ hazards carry over

  it('carries a hazard the requester declared onto the Safe Work permit', () => {
    const wr = request({ declaredHazards: new SwHazards({ fallingObject: true }) } as any);

    const permit = SafeWorkDto.generatePermitFromRequest(wr, null, null);

    expect((permit.hazards as any).fallingObject).withContext(
      'a hazard ticked only on the request must reach the permit').toBeTrue();
  });

  it('carries a hazard the requester declared onto the Confined Space permit', () => {
    const wr = request({
      declaredConfinedSpaceHazards: new ConfinedSpaceHazards({ toxicGas: true }),
    } as any);

    const permit = ConfinedSpaceDto.generatePermitFromRequest(wr, null, null);

    expect((permit.hazards as any).toxicGas).toBeTrue();
  });

  it('still merges the area and category profiles for Safe Work hazards', () => {
    // Hazards ARE properties of a place, so profile seeding stays — it is what saves an operator
    // re-entering what is permanently true of an area.
    const wr = request({ declaredHazards: new SwHazards({ fallingObject: true }) } as any);
    const area = new WorkAreaDto({ constantHazards: new SwHazards({ hotSurface: true }) } as any);
    const profile = new WorkCategoryProfileDto({
      standardHazards: new SwHazards({ handTraps: true }),
    } as any);

    const permit = SafeWorkDto.generatePermitFromRequest(wr, area, profile);

    expect((permit.hazards as any).fallingObject).toBeTrue();
    expect((permit.hazards as any).hotSurface).toBeTrue();
    expect((permit.hazards as any).handTraps).toBeTrue();
  });

  // ------------------------------------------------------------------ hot work precautions

  it('does not tick a hot work precaution nobody affirmed', () => {
    const permit = HotWorkDto.generatePermitFromRequest(request(), null, null);
    const measures: any = permit.measures;

    const ticked = Object.keys(measures).filter(k => measures[k] === true);
    expect(ticked).withContext(
      'an unanswered precaution must not arrive pre-affirmed').toEqual([]);
  });

  it('takes hot work precautions from the request', () => {
    const wr = request({
      declaredHotWorkMeasures: new HotWorkMeasures({ fireExtinguisherPresent: true }),
    } as any);

    const permit = HotWorkDto.generatePermitFromRequest(wr, null, null);

    expect((permit.measures as any).fireExtinguisherPresent).toBeTrue();
    expect((permit.measures as any).vesselsArePurged).toBeFalse();
  });

  it('does NOT let an area or category profile affirm a precaution', () => {
    // A precaution is an attestation, not a property of a place. A profile holding all-true — which
    // is exactly what the old all-true default persisted — must not put twelve unmade statements
    // onto a permit.
    const allTrue: any = {};
    for (const key of Object.keys(new HotWorkMeasures())) allTrue[key] = true;

    const area = new WorkAreaDto({ constantHotWorkMeasures: new HotWorkMeasures(allTrue) } as any);
    const profile = new WorkCategoryProfileDto({
      standardHotWorkMeasures: new HotWorkMeasures(allTrue),
    } as any);

    const permit = HotWorkDto.generatePermitFromRequest(request(), area, profile);
    const measures: any = permit.measures;

    const ticked = Object.keys(measures).filter(k => measures[k] === true);
    expect(ticked).withContext('profiles must not pre-affirm precautions').toEqual([]);
  });

  it('defaults every precaution to unaffirmed', () => {
    const measures: any = new HotWorkMeasures();
    const ticked = Object.keys(measures).filter(k => measures[k] === true);
    expect(ticked).toEqual([]);
  });

  // ------------------------------------------------------------------ work type

  it('maps the declared hot work profile onto the permit work type', () => {
    const wr = request({
      hotWorkProfile: new HotWorkProfile({ welding: true, torchCutting: true }),
    } as any);

    const permit = HotWorkDto.generatePermitFromRequest(wr, null, null);

    expect(permit.workType!.welding).toBeTrue();
    expect(permit.workType!.cutting).toBeTrue();
    expect(permit.workType!.brazing).toBeFalse();
  });

  it('names a declared hot work type that has no box of its own', () => {
    const wr = request({
      hotWorkProfile: new HotWorkProfile({ arcGouging: true, openFlameHeating: true }),
    } as any);

    const permit = HotWorkDto.generatePermitFromRequest(wr, null, null);

    expect(permit.workType!.other).withContext('unmapped types fall to Other').toBeTrue();
    expect(permit.workType!.otherDescription).toContain('Arc gouging');
    expect(permit.workType!.otherDescription).toContain('Open flame');
  });

  it('keeps free text from every source, not just the first', () => {
    // The requester's own wording is the LAST source, so a first-wins merge dropped exactly the
    // description written by the person standing at the job.
    const wr = request({
      declaredHazards: new SwHazards({ weatherHazards: true, weatherHazardDescription: 'scaffold is iced over' }),
    } as any);
    const area = new WorkAreaDto({
      constantHazards: new SwHazards({ weatherHazards: true, weatherHazardDescription: 'watch for ice' }),
    } as any);

    const permit = SafeWorkDto.generatePermitFromRequest(wr, area, null);

    expect((permit.hazards as any).weatherHazardDescription).toContain('watch for ice');
    expect((permit.hazards as any).weatherHazardDescription).toContain('scaffold is iced over');
  });

  it('does not repeat identical free text arriving from two sources', () => {
    // The PWA seeds a request from the same area profile the operator merges in here, so the same
    // wording legitimately arrives twice.
    const same = 'watch for ice';
    const wr = request({
      declaredHazards: new SwHazards({ weatherHazards: true, weatherHazardDescription: same }),
    } as any);
    const area = new WorkAreaDto({
      constantHazards: new SwHazards({ weatherHazards: true, weatherHazardDescription: same }),
    } as any);

    const permit = SafeWorkDto.generatePermitFromRequest(wr, area, null);

    expect((permit.hazards as any).weatherHazardDescription).toBe(same);
  });

  it('reports the Cr(VI) assessment on the special instructions', () => {
    const wr = request({
      hotWorkProfile: new HotWorkProfile({ welding: true, fumeLevel: 'SMAW', chromeContent: '>5%' }),
      hotWorkExposureScore: 27,
    } as any);

    const permit = HotWorkDto.generatePermitFromRequest(wr, null, null);

    expect(permit.specialInstructions).toContain('27');
    expect(permit.specialInstructions).toContain('SMAW');
  });
});
