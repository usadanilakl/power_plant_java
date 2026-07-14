/** Mirrors backend dto/permits/loto_permit/PwaLotoDtos + reuses drawing/position types from the Standards feature. */
export type { PointDrawing, PositionOptions } from '../loto-standard/loto-standard.model';

export type Phase = 'HANG' | 'VERIFY' | 'WALKDOWN';

export interface GrabInfo { phase: string; by: string | null; byName: string | null; at: string | null; }

export interface PwaLotoListItem {
  id: number;
  permitNumber: string | null;
  requestor: string | null;
  equipmentSystem: string | null;
  status: string | null;
  phases: Phase[];
  hangGrab: GrabInfo | null;
  verifyGrab: GrabInfo | null;
  walkdownSessions: number;
  pointCount: number;
  hungCount: number;
  verifiedCount: number;
  /** Separation-of-duty: this user hung every still-unverified point, so they cannot verify any of them. */
  verifyBlockedForMe: boolean;
}

export interface PwaLotoPoint {
  id: number;
  orderIndex: number | null;
  tagNumber: string | null;
  description: string | null;
  isoPosId: number | null;
  isolatedPosition: string | null;
  normPosId: number | null;
  normalPosition: string | null;
  zeroEnergyMethod: string | null;
  specificLocation: string | null;
  generalLocation: string | null;
  lockable: boolean | null;
  tagged: boolean | null;
  installPredecessors: number[] | null;
  installSafetyConditions: string[] | null;
  hungBy: string | null;
  hungAt: string | null;
  verifiedBy: string | null;
  verifiedAt: string | null;
  /** False when the current user hung this point (hanger≠verifier) — disable Mark-verified and show the reason. */
  canVerify: boolean;
  verifyBlockedReason: string | null;
}

export interface PwaLotoDetail {
  id: number;
  permitNumber: string | null;
  requestor: string | null;
  equipmentSystem: string | null;
  status: string | null;
  caApproved: boolean;
  allHung: boolean;
  allVerified: boolean;
  phases: Phase[];
  hangGrab: GrabInfo | null;
  verifyGrab: GrabInfo | null;
  /** Any still-unverified point this user did NOT hang. False → they may view but not verify this permit. */
  canVerifyAny: boolean;
  points: PwaLotoPoint[];
}

export interface PointAck { pointId: number; acknowledged: string[]; notes: string | null; }
export interface HangSubmitRequest { points: PointAck[]; signHung: boolean; hungNotes: string | null; }
export interface VerifySubmitRequest { points: PointAck[]; signVerified: boolean; verifiedNotes: string | null; }
export interface PhaseSubmitResult {
  applied: number; skipped: number; failures: string[]; aggregateSigned: boolean; aggregateMessage: string | null;
}

export interface WalkdownStartRequest { crewName: string | null; notes: string | null; }
export interface PointCheck { pointId: number; checked: boolean; notes: string | null; }
export interface WalkdownSubmitRequest { points: PointCheck[]; complete: boolean; notes: string | null; }
export interface PwaWalkdownPointState { pointId: number; checked: boolean; checkedBy: string | null; checkedAt: string | null; notes: string | null; }
export interface PwaWalkdownSession {
  id: number; lotoId: number | null; crewName: string | null; startedBy: string | null; startedAt: string | null;
  completed: boolean; completedBy: string | null; completedAt: string | null; points: PwaWalkdownPointState[];
}

// ── offline drafts (localStorage) ──
export type DraftStatus = 'draft' | 'pending' | 'failed';

/** In-progress / queued hang or verify. answers keyed by pointId. savedAt = epoch millis. */
export interface PhaseDraft {
  lotoId: number;
  phase: 'HANG' | 'VERIFY';
  answers: Record<number, { checked: boolean; acknowledged: string[]; notes: string }>;
  sign: boolean;
  aggregateNotes: string;
  savedAt: number;
  status: DraftStatus;
  lastError?: string | null;
}

/** In-progress / queued walkdown against a specific session. */
export interface WalkdownDraft {
  sessionId: number;
  lotoId: number;
  answers: Record<number, { checked: boolean; notes: string }>;
  complete: boolean;
  notes: string;
  savedAt: number;
  status: DraftStatus;
  lastError?: string | null;
}
