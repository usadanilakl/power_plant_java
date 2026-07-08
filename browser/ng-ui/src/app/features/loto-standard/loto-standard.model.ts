/** Mirrors the backend LotoStandardDto / LotoPointDto for the mobile read view. */

export interface LotoValueRef {
  id: number;
  name: string;
}

export interface LotoPointRef {
  id: number;
  tagNumber?: string;
  description?: string;
  tagged?: string;
  isolatedPosition?: string;
  normalPosition?: string;
  isoPos?: LotoValueRef | null;
  normPos?: LotoValueRef | null;
  specificLocation?: string;
  generalLocation?: string;
  fluid?: string;
  isLabeled?: boolean;
  isLockable?: boolean;
  fileIds?: string;
  processingStatus?: LotoValueRef | null;
}

export interface LotoStandard {
  id: number;
  name?: string;
  description?: string;
  lotoPoints?: LotoPointRef[];
  installPrerequisitesText?: string;
  installHazardControlText?: string;
  installProcedureText?: string;
  removalPrerequisitesText?: string;
  removalHazardControlText?: string;
  removalProcedureText?: string;
  removalReversesInstallOrder?: boolean;
  developmentStatus?: LotoValueRef | null;
  currentVersion?: number;
  submittedForVerificationBy?: string;
  submittedForVerificationAt?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  walkdownBy?: string;
  walkdownAt?: string;
  managerApprovedBy?: string;
  managerApprovedAt?: string;
}

/** Development-status names (mirror backend LotoStandardStatus). */
export const LOTO_STANDARD_STATUS = {
  DRAFT: 'Draft',
  PENDING_VERIFICATION: 'Pending Verification',
  VERIFIED: 'Verified',
  WALKDOWN_COMPLETE: 'Walkdown Complete',
  READY_FOR_TESTING: 'Ready For Testing',
  APPROVED: 'Approved',
  NEW_PENDING_REAPPROVAL: 'New - Pending Reapproval',
} as const;

/** A plain-language phase label for the four buckets the user cares about. */
export function statusPhase(statusName: string | undefined | null): string {
  switch (statusName) {
    case LOTO_STANDARD_STATUS.APPROVED: return 'Active';
    case LOTO_STANDARD_STATUS.WALKDOWN_COMPLETE:
    case LOTO_STANDARD_STATUS.READY_FOR_TESTING: return 'Walked down';
    case LOTO_STANDARD_STATUS.PENDING_VERIFICATION:
    case LOTO_STANDARD_STATUS.VERIFIED: return 'Verification';
    default: return 'Under construction';
  }
}
