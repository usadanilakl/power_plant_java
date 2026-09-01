import { WorkRequest, WorkRequestAreaDto } from '../../models/permits/work-request.model';
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
  const fd = workRequest as any;
  const unknownArea = fd.workAreaUnknown === true;
  workRequest.workAreaUnknown = unknownArea;

  let picked: PickedArea | null = null;

  if (unknownArea) {
    // They told us they cannot place it. Drop any area picked before they said so, so we never send
    // a half-remembered guess alongside "not sure".
    workRequest.workAreaId = null;
    workRequest.workAreaName = '';
    workRequest.workAreas = [];

    // Guarded on PRESENCE, not on value. `locationDescription` is a helper control that does not
    // survive `new WorkRequest(draft)`, and an unguarded assignment wipes locationOfWork to '' on
    // every resumed draft — then saveDraft persists the empty string, so the requester's typed
    // description is destroyed in storage as well as on screen.
    if ('locationDescription' in fd) {
      workRequest.locationOfWork = String(fd.locationDescription ?? '').trim();
    }
  } else {
    switch (mapValueState(fd.workAreaMap)) {
      case 'ARRAY': {
        // A rendered multi-select is authoritative, empty included: [] means "I removed them all".
        workRequest.workAreas = rebuildAreas(workRequest, fd.workAreaMap);
        const primary = workRequest.workAreas[0] ?? null;
        workRequest.workAreaId = primary ? primary.id : null;
        workRequest.workAreaName = primary ? primary.name : '';
        if (primary && primary.id != null) picked = { id: primary.id, name: primary.name };
        break;
      }

      case 'OBJECT': {
        const value = fd.workAreaMap as PickedArea;
        picked = { id: value.id, name: value.name };
        workRequest.workAreaId = value.id;
        workRequest.workAreaName = value.name;

        // An object can only come from a SINGLE-select control, so the picked area is the whole
        // set. Without this, changing the area on the review form left `workAreas` describing the
        // area that is no longer selected — and the permits map plots a request on its work area
        // AND every id in `workAreas`, so the job appeared in two places at once.
        const list = workRequest.workAreas ?? [];
        if (list.length && !list.some(a => a.id === value.id)) {
          workRequest.workAreas = rebuildAreas(workRequest, [{ id: value.id, name: value.name }]);
        }
        break;
      }

      case 'ABSENT':
      default: {
        // ABSENT means "no picker rendered, or the helper key did not survive reconstruction". It
        // has NEVER meant "no area picked" — reading it that way is what broke the wizard:
        // `new WorkRequest(draft)` copies declared fields only, so reloading the PWA drops
        // `workAreaMap`, this branch nulled `workAreaId`, and the location step refused to advance
        // while the map, driven by the surviving `workAreas`, still showed the areas selected.
        if (workRequest.workAreaId != null) {
          fd.workAreaMap = { id: workRequest.workAreaId, name: workRequest.workAreaName };
          picked = { id: workRequest.workAreaId, name: workRequest.workAreaName };
        } else {
          // Recovery for drafts already damaged in the wild, where the null was persisted. Ranked
          // BELOW workAreaId on purpose: `workAreas` is written only by the wizard, so it goes
          // stale as soon as someone changes the area on the review form, and preferring it would
          // silently revert a correction they had just made.
          const list = workRequest.workAreas ?? [];
          const fallback = list.find(a => a?.primary && typeof a?.id === 'number')
            ?? list.find(a => typeof a?.id === 'number');
          if (fallback && fallback.id != null) {
            workRequest.workAreaId = fallback.id;
            workRequest.workAreaName = fallback.name;
            fd.workAreaMap = { id: fallback.id, name: fallback.name };
            picked = { id: fallback.id, name: fallback.name };
          } else {
            workRequest.workAreaId = null;
            workRequest.workAreaName = '';
          }
        }
        break;
      }
    }

    // Same presence guard as the unknown branch. Recomputing from an absent `locationDetail`
    // truncates "Boiler Room - north side, behind the guard" back to "Boiler Room", and a requester
    // resumed at a later step never renders the control again, so it can never come back.
    if ('locationDetail' in fd) {
      const locationDetail = String(fd.locationDetail ?? '').trim();
      if (workRequest.workAreaName) {
        workRequest.locationOfWork = locationDetail
          ? `${workRequest.workAreaName} - ${locationDetail}`
          : workRequest.workAreaName;
      } else if (locationDetail) {
        workRequest.locationOfWork = locationDetail;
      }
    }
  }

  // The equipment picker emits an object; the model stores the tag number.
  const equipmentValue: any = workRequest.affectedEquipment;
  if (equipmentValue && typeof equipmentValue === 'object' && equipmentValue.tagNumber) {
    workRequest.affectedEquipment = equipmentValue.tagNumber;
  }

  // Typed equipment, for the requester whose kit is not in the snapshot. The picker has no
  // manual-entry box, so before this a contractor who could not find their equipment simply could
  // not get past the step — while the step's own help text told them to describe it instead.
  // The picked value always wins; this only fills a blank.
  const typedEquipment = String(fd.affectedEquipmentText ?? '').trim();
  if (typedEquipment && !String(workRequest.affectedEquipment ?? '').trim()) {
    workRequest.affectedEquipment = typedEquipment;
  }

  if (options.strip) {
    delete fd.workAreaMap;
    delete fd.locationDetail;
    delete fd.locationDescription;
    delete fd.affectedEquipmentText;
  }
  return picked;
}

/** The three states a `workAreaMap` value can be in. See the ABSENT note above — it is not "empty". */
type MapValueState = 'ARRAY' | 'OBJECT' | 'ABSENT';

function mapValueState(value: unknown): MapValueState {
  if (Array.isArray(value)) return 'ARRAY';
  if (value && typeof value === 'object' && (value as any).id !== undefined) return 'OBJECT';
  return 'ABSENT';
}

/**
 * Rebuild `workAreas` from a picked list, preserving the per-area answers already given.
 *
 * <p>Matched by id, so ticking a fourth area does not wipe the three answers made about the first
 * three. An area whose own record says it is a confined space starts with entry ticked, because
 * that is what its record says; the requester can untick it and the untick survives the next
 * re-pick.
 *
 * <p>This lives here rather than in the wizard so that BOTH surfaces rebuild the list the same way.
 * It used to exist only in the wizard's `onAreasPicked`, which is why the review form could change
 * the area without `workAreas` following.
 */
function rebuildAreas(workRequest: WorkRequest, list: any[]): WorkRequestAreaDto[] {
  const existing = new Map((workRequest.workAreas ?? []).map(a => [a.id, a]));
  return (list ?? [])
    .filter(area => area && typeof area.id === 'number')
    .map((area, i) => {
      const prior = existing.get(area.id);
      return {
        id: area.id,
        name: area.name,
        primary: i === 0,
        confinedSpaceEntry: prior ? prior.confinedSpaceEntry : !!area.isConfinedSpace,
        spaceName: prior ? prior.spaceName : (area.isConfinedSpace ? area.name : null),
        hotWork: prior ? prior.hotWork : false,
      };
    });
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
