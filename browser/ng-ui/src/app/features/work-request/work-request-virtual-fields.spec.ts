import { WorkRequest } from '../../models/permits/work-request.model';
import { foldWorkRequestVirtualFields } from './work-request-virtual-fields';

/**
 * The fold is the one chokepoint both the wizard and the review form run their area answers
 * through, and it is where a work request quietly lost its area.
 *
 * <p>The case that matters most is RECONSTRUCTION: `new WorkRequest(draft)` copies declared fields
 * only, so reloading the PWA drops the `workAreaMap` helper. The fold used to read that absence as
 * "no area picked" and null the scalars, while `workAreas` survived — so the map went on showing
 * the chosen areas while the wizard refused to advance past "where is the work?".
 */
describe('foldWorkRequestVirtualFields', () => {

  function area(id: number, name: string, primary = false) {
    return { id, name, primary, confinedSpaceEntry: false, spaceName: null, hotWork: false };
  }

  it('keeps the area when the helper control did not survive reconstruction', () => {
    const wr = new WorkRequest({
      workAreaId: 7,
      workAreaName: 'Boiler Room',
      workAreas: [area(7, 'Boiler Room', true)],
      locationOfWork: 'Boiler Room - north side',
    } as any);
    expect((wr as any).workAreaMap).toBeUndefined();

    const picked = foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.workAreaId).toBe(7);
    expect(wr.workAreaName).toBe('Boiler Room');
    expect(picked).toEqual({ id: 7, name: 'Boiler Room' });
    // Rehydrated, so later folds take the fast path.
    expect((wr as any).workAreaMap).toEqual({ id: 7, name: 'Boiler Room' });
  });

  it('does not truncate locationOfWork when locationDetail was dropped', () => {
    const wr = new WorkRequest({
      workAreaId: 7,
      workAreaName: 'Boiler Room',
      locationOfWork: 'Boiler Room - north side, behind the guard',
    } as any);

    foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.locationOfWork).toBe('Boiler Room - north side, behind the guard');
  });

  it('does not wipe locationOfWork on the unknown-area branch when the description was dropped', () => {
    const wr = new WorkRequest({
      workAreaUnknown: true,
      locationOfWork: 'Behind the water treatment shed',
    } as any);

    foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.locationOfWork).toBe('Behind the water treatment shed');
  });

  it('recovers a draft already damaged in the wild', () => {
    const wr = new WorkRequest({
      workAreaId: null,
      workAreaName: '',
      workAreas: [area(7, 'Boiler Room', true)],
    } as any);

    foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.workAreaId).toBe(7);
    expect(wr.workAreaName).toBe('Boiler Room');
  });

  it('does not silently revert an area changed on the review form', () => {
    const wr = new WorkRequest({ workAreas: [area(7, 'Boiler Room', true)] } as any);
    (wr as any).workAreaMap = { id: 9, name: 'Turbine Deck' };

    foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.workAreaId).toBe(9);
    // workAreas has to follow, or the permits map draws the request on both areas at once.
    expect(wr.workAreas.map(a => a.id)).toEqual([9]);
  });

  it('leaves a multi-area list alone when the primary is already in it', () => {
    const wr = new WorkRequest({
      workAreas: [area(7, 'Boiler Room', true), area(8, 'Turbine Deck'), area(9, 'Yard')],
    } as any);
    (wr as any).workAreaMap = { id: 7, name: 'Boiler Room' };

    foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.workAreas.map(a => a.id)).toEqual([7, 8, 9]);
  });

  it('rebuilds the list from an array value, preserving per-area answers', () => {
    const wr = new WorkRequest({
      workAreas: [
        { id: 7, name: 'Boiler Room', primary: true, confinedSpaceEntry: true, spaceName: 'Drum', hotWork: false },
      ],
    } as any);
    (wr as any).workAreaMap = [{ id: 7, name: 'Boiler Room' }, { id: 8, name: 'Turbine Deck' }];

    foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.workAreas.length).toBe(2);
    expect(wr.workAreas[0].spaceName).toBe('Drum');
    expect(wr.workAreas[0].confinedSpaceEntry).toBeTrue();
    expect(wr.workAreas[0].primary).toBeTrue();
    expect(wr.workAreas[1].primary).toBeFalse();
    expect(wr.workAreaId).toBe(7);
  });

  it('treats an empty array as a deliberate clear', () => {
    const wr = new WorkRequest({ workAreas: [area(7, 'Boiler Room', true)] } as any);
    (wr as any).workAreaMap = [];

    foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.workAreas).toEqual([]);
    expect(wr.workAreaId).toBeNull();
  });

  it('does not carry isConfinedSpace onto the picked value', () => {
    // applyAreaConfinedSpace writes spaceToBeEntered from a truthy isConfinedSpace, which would
    // overwrite the specific space the requester typed with the bare area name.
    const wr = new WorkRequest({ workAreaId: 7, workAreaName: 'Boiler Room' } as any);

    const picked: any = foldWorkRequestVirtualFields(wr, { strip: false });

    expect(picked.isConfinedSpace).toBeUndefined();
  });

  it('clears the area list on the unknown branch', () => {
    const wr = new WorkRequest({
      workAreaUnknown: true,
      workAreas: [area(7, 'Boiler Room', true)],
    } as any);

    foldWorkRequestVirtualFields(wr, { strip: false });

    expect(wr.workAreas).toEqual([]);
    expect(wr.workAreaId).toBeNull();
  });

  it('falls back to typed equipment only when nothing was picked', () => {
    const typed = new WorkRequest({} as any);
    (typed as any).affectedEquipmentText = 'the big grey pump by the door';
    foldWorkRequestVirtualFields(typed, { strip: false });
    expect(typed.affectedEquipment).toBe('the big grey pump by the door');

    const picked = new WorkRequest({ affectedEquipment: '1CND455' } as any);
    (picked as any).affectedEquipmentText = 'the big grey pump by the door';
    foldWorkRequestVirtualFields(picked, { strip: false });
    expect(picked.affectedEquipment).toBe('1CND455');
  });

  it('strips every helper control on submit', () => {
    const wr = new WorkRequest({ workAreaId: 7, workAreaName: 'Boiler Room' } as any);
    (wr as any).locationDetail = 'north side';
    (wr as any).affectedEquipmentText = 'a pump';

    foldWorkRequestVirtualFields(wr, { strip: true });

    expect('workAreaMap' in (wr as any)).toBeFalse();
    expect('locationDetail' in (wr as any)).toBeFalse();
    expect('locationDescription' in (wr as any)).toBeFalse();
    expect('affectedEquipmentText' in (wr as any)).toBeFalse();
  });
});
