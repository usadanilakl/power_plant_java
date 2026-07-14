/**
 * LOTO Standard development workflow — frontend mirror of backend constants.
 * Backend source of truth: LotoStandardStatus.java + LotoRole.java + LotoStandardApprovalEvent.Type
 */

export const LotoStandardStatusName = {
  DRAFT: 'Draft',
  PENDING_VERIFICATION: 'Pending Verification',
  VERIFIED: 'Verified',
  WALKDOWN_COMPLETE: 'Walkdown Complete',
  READY_FOR_TESTING: 'Ready For Testing',
  APPROVED: 'Approved',
  NEW_PENDING_REAPPROVAL: 'New - Pending Reapproval',
} as const;

export type LotoStandardStatusValue = typeof LotoStandardStatusName[keyof typeof LotoStandardStatusName];

export const LotoRole = {
  // Canonical roles
  CONTROL_AUTHORITY: 'CONTROL_AUTHORITY',
  LOTO_QUALIFIED: 'LOTO_QUALIFIED',
  REQUESTOR: 'REQUESTOR',
  MANAGER: 'MANAGER',
  // Legacy aliases (treated as CONTROL_AUTHORITY / LOTO_QUALIFIED by AuthService helpers)
  AFFECTED: 'AFFECTED',
  AUTHORIZED: 'AUTHORIZED',
  QUALIFIED: 'QUALIFIED',
} as const;

export type LotoRoleValue = typeof LotoRole[keyof typeof LotoRole];

/** Maps current status -> set of allowed targets. Mirrors LotoStandardStatus.allowedTargets(). */
export function allowedTargetStatuses(current: string | null | undefined): string[] {
  if (!current) return [LotoStandardStatusName.DRAFT];
  switch (current) {
    case LotoStandardStatusName.DRAFT:
      return [LotoStandardStatusName.PENDING_VERIFICATION];
    case LotoStandardStatusName.PENDING_VERIFICATION:
      return [LotoStandardStatusName.VERIFIED, LotoStandardStatusName.DRAFT];
    case LotoStandardStatusName.VERIFIED:
      return [LotoStandardStatusName.WALKDOWN_COMPLETE, LotoStandardStatusName.DRAFT];
    case LotoStandardStatusName.WALKDOWN_COMPLETE:
      return [LotoStandardStatusName.READY_FOR_TESTING, LotoStandardStatusName.DRAFT];
    case LotoStandardStatusName.READY_FOR_TESTING:
      return [LotoStandardStatusName.APPROVED, LotoStandardStatusName.DRAFT];
    case LotoStandardStatusName.APPROVED:
      return [];
    case LotoStandardStatusName.NEW_PENDING_REAPPROVAL:
      return [LotoStandardStatusName.PENDING_VERIFICATION, LotoStandardStatusName.DRAFT];
    default:
      return [];
  }
}

/** Color hex for each status badge. */
export function statusColor(status: string | null | undefined): string {
  switch (status) {
    case LotoStandardStatusName.DRAFT: return '#71717a';
    case LotoStandardStatusName.PENDING_VERIFICATION: return '#f59e0b';
    case LotoStandardStatusName.VERIFIED: return '#3b82f6';
    case LotoStandardStatusName.WALKDOWN_COMPLETE: return '#06b6d4';
    case LotoStandardStatusName.READY_FOR_TESTING: return '#8b5cf6';
    case LotoStandardStatusName.APPROVED: return '#22c55e';
    case LotoStandardStatusName.NEW_PENDING_REAPPROVAL: return '#ef4444';
    default: return '#a1a1aa';
  }
}

export type LotoStandardApprovalEventType =
  | 'SUBMITTED_FOR_VERIFICATION'
  | 'VERIFIED'
  | 'WALKDOWN_COMPLETE'
  | 'READY_FOR_TESTING'
  | 'APPROVED'
  | 'INVALIDATED'
  | 'REAPPROVED'
  | 'EDIT_PENDING_REVIEW'
  | 'EDIT_ACCEPTED_AS_MINOR'
  | 'EDIT_REQUIRES_REAPPROVAL';

export interface LotoStandardApprovalEventDto {
  id: number;
  standardId: number;
  standardVersion: number | null;
  eventType: LotoStandardApprovalEventType;
  performedBy: string | null;
  eventAt: string;
  fromStatus: string | null;
  toStatus: string | null;
  notes: string | null;
}

/** See loto-procedure.md §3.3. */
export type LotoStandardPendingChangeResolution = 'PENDING' | 'KEPT' | 'DISMISSED';

/**
 * One field-level edit captured while a LotoStandard is APPROVED. The reviewer
 * (CA or Manager) marks each row KEPT or DISMISSED and then closes the
 * review either as minor (status stays APPROVED) or as substantive (status
 * flips to NEW_PENDING_REAPPROVAL).
 */
export interface LotoStandardPendingChangeDto {
  id: number;
  standardId: number;
  /** Null when the edit was on the standard itself (not on one of its points). */
  lotoPointId: number | null;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  editedBy: string;
  editedAt: string;
  resolution: LotoStandardPendingChangeResolution;
  resolvedBy: string | null;
  resolvedAt: string | null;
}

/** Friendly label for a target status, used on the action button. */
export function actionLabelFor(targetStatus: string): string {
  switch (targetStatus) {
    case LotoStandardStatusName.PENDING_VERIFICATION: return 'Submit for Verification';
    case LotoStandardStatusName.VERIFIED: return 'Verify';
    case LotoStandardStatusName.WALKDOWN_COMPLETE: return 'Mark Walkdown Complete';
    case LotoStandardStatusName.READY_FOR_TESTING: return 'Mark Ready for Testing';
    case LotoStandardStatusName.APPROVED: return 'Approve';
    case LotoStandardStatusName.DRAFT: return 'Send Back to Draft';
    default: return targetStatus;
  }
}

/** Backend endpoint path segment for transitioning to a target status. */
export function endpointForTarget(targetStatus: string): string | null {
  switch (targetStatus) {
    case LotoStandardStatusName.PENDING_VERIFICATION: return 'submit-for-verification';
    case LotoStandardStatusName.VERIFIED: return 'verify';
    case LotoStandardStatusName.WALKDOWN_COMPLETE: return 'walkdown-complete';
    case LotoStandardStatusName.READY_FOR_TESTING: return 'ready-for-testing';
    case LotoStandardStatusName.APPROVED: return 'approve';
    case LotoStandardStatusName.DRAFT: return 'send-back-to-draft';
    default: return null;
  }
}

/**
 * Required role for each transition. Kept aligned with the backend gates in
 * {@code NgLotoStandardService}:
 * - APPROVED and WALKDOWN_COMPLETE are Manager-only (final approval + walkdown-
 *   is-a-manager-responsibility).
 * - Everything else (submit, verify, ready-for-testing, send-back-to-draft) is
 *   Control Authority.
 */
export function roleForTarget(targetStatus: string): LotoRoleValue {
  switch (targetStatus) {
    case LotoStandardStatusName.APPROVED: return LotoRole.MANAGER;
    case LotoStandardStatusName.WALKDOWN_COMPLETE: return LotoRole.MANAGER;
    default: return LotoRole.CONTROL_AUTHORITY;
  }
}
