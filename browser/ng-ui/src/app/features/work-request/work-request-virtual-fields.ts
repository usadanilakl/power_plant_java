import { WorkRequest } from '../../models/permits/work-request.model';
import { HotWorkProfile } from '../../models/permits/permit-hazards.model';

/** The area picked on the map, as the picker hands it over. */
export interface PickedArea {
  id: number;
  name: string;
  isConfinedSpace?: boolean;
}

/**
 * Fold the form's helper controls down into the fields the model actually stores.
 *
 * <p>`workAreaMap`, `locationDetail` and `locationDescription` exist only to drive the UI. The model
 * keeps `workAreaId` / `workAreaName` / `locationOfWork`, and the equipment picker hands over an
 * object where the model wants a tag number. Nothing downstream — validation, submission, the
 * hazard seeding — sees the helper controls, so this has to run before any of it.
 *
 * <p>Shared by the single-page form and the wizard. It used to live only in the form, which is why
 * the wizard's "pick an area" step could not be completed: the picker set `workAreaMap`, nothing
 * turned that into `workAreaId`, and the step's own validation quite correctly said no area had
 * been chosen.
 *
 * @param strip removes the helper controls afterwards. True on submit, where they must not travel
 *   to the server. **False while editing**: the wizard rebuilds each step's fields from the draft,
 *   so stripping `workAreaMap` would blank the map picker the moment the requester touched anything
 *   else, or went back a step.
 * @returns the picked area, or null — so the caller can seed from it before it is stripped.
 */
export function foldWorkRequestVirtualFields(
  workRequest: WorkRequest,
  options: { strip: boolean }
): PickedArea | null {
  const unknownArea = (workRequest as any).workAreaUnknown === true;
  workRequest.workAreaUnknown = unknownArea;

  let picked: PickedArea | null = null;

  if (unknownArea) {
    // They told us they cannot place it. Drop any area picked before they ticked the box, so we
    // never send a half-remembered guess alongside "not sure".
    workRequest.workAreaId = null;
    workRequest.workAreaName = '';
    workRequest.locationOfWork = String((workRequest as any).locationDescription ?? '').trim();
  } else {
    const mapValue = (workRequest as any).workAreaMap;
    if (mapValue && typeof mapValue === 'object' && mapValue.id !== undefined) {
      picked = mapValue as PickedArea;
      workRequest.workAreaId = picked.id;
      workRequest.workAreaName = picked.name;
    } else {
      workRequest.workAreaId = null;
      workRequest.workAreaName = '';
    }

    const locationDetail = String((workRequest as any).locationDetail ?? '').trim();
    if (workRequest.workAreaName) {
      workRequest.locationOfWork = locationDetail
        ? `${workRequest.workAreaName} - ${locationDetail}`
        : workRequest.workAreaName;
    } else if (locationDetail) {
      workRequest.locationOfWork = locationDetail;
    }
  }

  // The equipment picker emits an object; the model stores the tag number.
  const equipmentValue: any = workRequest.affectedEquipment;
  if (equipmentValue && typeof equipmentValue === 'object' && equipmentValue.tagNumber) {
    workRequest.affectedEquipment = equipmentValue.tagNumber;
  }

  if (options.strip) {
    delete (workRequest as any).workAreaMap;
    delete (workRequest as any).locationDetail;
    delete (workRequest as any).locationDescription;
  }
  return picked;
}

/**
 * Fold the four flat hot-work controls into the nested `hotWorkProfile` the model stores.
 *
 * <p>Same reason as the work-area controls: the form is flat, the model is not. Idempotent, and it
 * has to handle answers being *withdrawn*, not just given — the withdrawals are the whole point:
 *
 * <ul>
 *   <li>hot work switched back to "No" drops the entire profile, so a request cannot carry a stale
 *       welding assessment into the permits an operator generates from it;</li>
 *   <li>un-ticking Welding clears the Cr(VI) answers, which would otherwise still be scored;</li>
 *   <li>un-ticking Other clears its free text.</li>
 * </ul>
 *
 * @param strip see {@link foldWorkRequestVirtualFields}. False while editing, or the wizard's
 *   hot-work answers would vanish from the controls the moment they were typed.
 */
export function foldHotWorkProfile(workRequest: WorkRequest, options: { strip: boolean }): void {
  const fd = workRequest as any;

  if (fd.isHotWorkRequired !== 'Yes') {
    workRequest.hotWorkProfile = new HotWorkProfile();
  } else {
    const ticked = fd.hotWorkTypes && typeof fd.hotWorkTypes === 'object' ? fd.hotWorkTypes : {};
    const profile = new HotWorkProfile({ ...ticked });
    profile.otherDescription = profile.other ? (fd.hotWorkOtherDescription ?? '').trim() : '';
    profile.fumeLevel = profile.welding ? (fd.hotWorkFumeLevel ?? '') : '';
    profile.chromeContent = profile.welding ? (fd.hotWorkChromeContent ?? '') : '';
    workRequest.hotWorkProfile = profile;
  }

  if (options.strip) {
    delete fd.hotWorkTypes;
    delete fd.hotWorkOtherDescription;
    delete fd.hotWorkFumeLevel;
    delete fd.hotWorkChromeContent;
  }
}
