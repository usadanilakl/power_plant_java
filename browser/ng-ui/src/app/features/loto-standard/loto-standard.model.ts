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
  zeroEnergyMethod?: string;
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
  lotoPointOrder?: string;
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

// ── Phase 2: verification / walkdown checklist ─────────────────────────────

/** A checkmark against a standard-level (global) item. */
export interface GlobalItem {
  checked: boolean;
  checkedBy?: string;
  checkedAt?: string;
  notes?: string;
}

/** Per-point field walkdown. The seven checks are tri-state: null = unanswered, true = pass, false = fail. */
export interface PointChecklist {
  fileReferenceProvided?: boolean | null;
  metalTagPresent?: boolean | null;
  equipmentAccessible?: boolean | null;
  tagNumbersMatch?: boolean | null;
  isolationPositionCorrect?: boolean | null;
  restoredPositionCorrect?: boolean | null;
  equipmentLockable?: boolean | null;
  zeroEnergyAdequate?: boolean | null;
  comment?: string;
  checkedBy?: string;
  checkedAt?: string;
}

export interface LotoStandardWalkdown {
  standardId: number;
  standardVersion?: number;
  startedBy?: string;
  startedAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  globalItems: Record<string, GlobalItem>;
  pointResults: Record<string, PointChecklist>;
}

/** The per-point checks, in display order, with their prompts. */
export const POINT_CHECKS: { key: keyof PointChecklist; label: string }[] = [
  { key: 'fileReferenceProvided',    label: 'File reference provided' },
  { key: 'metalTagPresent',          label: 'Metal tag present' },
  { key: 'equipmentAccessible',      label: 'Equipment accessible' },
  { key: 'tagNumbersMatch',          label: 'Tag numbers match (app / file / metal tag)' },
  { key: 'isolationPositionCorrect', label: 'Isolation position correct' },
  { key: 'restoredPositionCorrect',  label: 'Restored position correct' },
  { key: 'equipmentLockable',        label: 'Equipment lockable' },
  { key: 'zeroEnergyAdequate',       label: 'Zero energy adequate' },
];

export interface GlobalItemDef {
  key: string;
  label: string;
  /** A standard prose field to show for verification (prerequisites / hazard control / procedure). */
  field?: keyof LotoStandard;
  /** Show the item even when its prose field is empty (procedures — the order still needs verifying). */
  showWhenEmpty?: boolean;
  /** Show the ordered point sequence to verify. */
  order?: 'install' | 'removal';
}

/**
 * Global (standard-level) checklist items. Prerequisites/hazard-control show only when they have content;
 * procedures + order always show (the sequence needs verifying even without prose). Each item that has a
 * `field` or `order` renders its actual content inline so the verifier can read what they're signing off.
 */
export const GLOBAL_ITEMS: GlobalItemDef[] = [
  { key: 'name',                 label: 'Standard name is correct' },
  { key: 'installPrerequisites', label: 'Install prerequisites',  field: 'installPrerequisitesText' },
  { key: 'installHazardControl', label: 'Install hazard control', field: 'installHazardControlText' },
  { key: 'installProcedure',     label: 'Install procedure',      field: 'installProcedureText', showWhenEmpty: true },
  { key: 'installOrder',         label: 'Installation order is correct', order: 'install' },
  { key: 'removalPrerequisites', label: 'Removal prerequisites',  field: 'removalPrerequisitesText' },
  { key: 'removalHazardControl', label: 'Removal hazard control', field: 'removalHazardControlText' },
  { key: 'removalProcedure',     label: 'Removal procedure',      field: 'removalProcedureText', showWhenEmpty: true },
  { key: 'removalOrder',         label: 'Removal order is correct', order: 'removal' },
];

/** Points in install or removal sequence (from lotoPointOrder; removal reverses install when flagged). */
export function orderedPoints(std: LotoStandard | null, which: 'install' | 'removal'): LotoPointRef[] {
  const pts = std?.lotoPoints ?? [];
  if (pts.length < 2) return [...pts];
  let ordered = [...pts];
  const raw = std?.lotoPointOrder;
  if (raw) {
    try {
      const map = JSON.parse(raw) as Record<string, number>;
      ordered = [...pts].sort((a, b) => (map[String(a.id)] ?? 0) - (map[String(b.id)] ?? 0));
    } catch { /* keep natural order */ }
  }
  if (which === 'removal' && std?.removalReversesInstallOrder) ordered = [...ordered].reverse();
  return ordered;
}

/** True when every one of the seven checks has been answered (non-null). */
export function pointChecklistComplete(c: PointChecklist | undefined): boolean {
  if (!c) return false;
  return POINT_CHECKS.every(({ key }) => c[key] === true || c[key] === false);
}

/** True when any answered check is negative (fail). */
export function pointHasNegative(c: PointChecklist | undefined): boolean {
  if (!c) return false;
  return POINT_CHECKS.some(({ key }) => c[key] === false);
}

// ── Position options + in-field corrections ────────────────────────────────

/** isoPos / normPos Value option lists (mirror the desktop 'isoPos' / 'normPos' categories). */
export interface PositionOptions {
  isoPos: LotoValueRef[];
  normPos: LotoValueRef[];
}

export interface PointCorrection {
  tagNumber?: string;
  description?: string;
  isoPosId?: number | null;
  normPosId?: number | null;
  /** Mirrors LotoPoint.specificLocation (free text). */
  specificLocation?: string;
  /** Mirrors LotoPoint.generalLocation (free text). */
  generalLocation?: string;
}

// ── Offline draft + one-shot submit ────────────────────────────────────────

export type SubmissionStatus = 'draft' | 'pending' | 'submitted' | 'failed';

export interface GlobalItemInput {
  checked: boolean;
  notes?: string;
}

/** Everything captured for one standard's walkdown — persisted locally, submitted in one shot. */
export interface WalkdownDraft {
  standardId: number;
  capturedVersion?: number;
  transition: 'verify' | 'walkdown' | null;
  notes: string;
  globalItems: Record<string, GlobalItemInput>;
  pointResults: Record<string, PointChecklist>;
  corrections: Record<string, PointCorrection>;
  status: SubmissionStatus;
  updatedAt: number;   // epoch millis (avoids the localStorage ISO-date reviver)
  lastError?: string;
}

/** The payload POSTed to /walkdown/submit (derived from a WalkdownDraft). */
export interface WalkdownSubmitPayload {
  capturedVersion?: number;
  transition: 'verify' | 'walkdown' | null;
  notes?: string;
  globalItems: Record<string, GlobalItemInput>;
  pointResults: Record<string, PointChecklist>;
  corrections: Record<string, PointCorrection>;
}

export interface WalkdownSubmitResult {
  standard: LotoStandard | null;
  transitioned: boolean;
  transitionMessage?: string | null;
}

// ── Per-point photos & comments (PWA extension) ────────────────────────────

/** Shallow FileDto shape the backend ships for LOTO Point pictures. */
export interface LotoPointPhoto {
  id: number;
  name?: string | null;
  /** Relative path under {@code serverUrl}; render as {@code `${serverUrl}/${fileLink}`}. */
  fileLink?: string | null;
  extension?: string | null;
}

/** Comment on a LOTO point — polymorphic entityType="LotoPoint" on the backend. */
export interface LotoPointComment {
  id: number;
  content: string;
  entityId?: number;
  entityType?: string;
  needsAttention?: boolean;
  isResolved?: boolean;
  /** Author (from Spring Data auditing @CreatedBy). Backend fills from the JWT principal. */
  createdBy?: string | null;
  dateCreated?: string | null;
}

// ── Drawings (per-point file viewer) ───────────────────────────────────────

/** "This point on this drawing": which file + the highlight rectangle in the image's original pixels. */
export interface PointDrawing {
  pointId: number;
  fileId: number;
  fileName?: string;
  // Highlight rectangle (original image pixels) — null when the drawing is linked but no shape was drawn.
  imageWidth?: number | null;
  imageHeight?: number | null;
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
}
