/** Ported from the desktop `models/maximo/maximo.models.ts` — backend-matching, phone subset. */

export interface MaximoWorkOrder {
  href: string;
  /** Maximo numeric WO primary key (WORKORDERID) — anchor for WO-scoped Q&A conversations. */
  workorderid?: number;
  wonum: string;
  description: string;
  longDescription: string;
  status: string;
  worktype: string;
  assetnum: string;
  location: string;
  siteid: string;
  reportdate: string;
  targetStart: string;
  targetFinish?: string;
  schedstart: string;
  schedfinish: string;
  leadCraft: string;
  supervisor: string;
  reportedby: string;
  priority: string;
  pmnum: string;
  statusDate?: string;
  taskid?: string;
  parent?: string;
  istask?: boolean;
  /** Outage-type domain value (PLAN / SNOW); only on outage-list rows. */
  outageType?: string;
  /** How many LOTO isolation notes this WO already has; on outage-list rows only. */
  lotoNoteCount?: number;
}

export interface MaximoServiceRequest {
  href: string;
  ticketid: string;
  description: string;
  longDescription: string;
  status: string;
  assetnum: string;
  location: string;
  siteid: string;
  reportedby: string;
  reportdate: string;
  classstructureid: string;
  priority: string;
  affectedperson: string;
}

export interface CreateMaximoServiceRequest {
  description: string;
  longDescription?: string;
  assetnum?: string;
  location?: string;
  siteid?: string;
  reportedby?: string;
  classstructureid?: string;
  priority?: string;
  affectedperson?: string;
}

export interface MaximoLaborEntry {
  laborcode?: string;   // blank = signed-in user (resolved server-side)
  regularhrs?: number;
}

export interface CompleteWorkOrderRequest {
  labor?: MaximoLaborEntry[];
  summary?: string;
  details?: string;
  complete?: boolean;
}

/** WO statuses that can still be completed (mirrors the desktop). */
export const COMPLETABLE_WO_STATUSES = ['APPR', 'INPRG', 'WMATL', 'WSCH', 'WPCOND'];

export interface MaximoOverview {
  mode: string;
  asOf: string;
  weekStart: string;
  weekEnd: string;
  personCount: number;
  overdue: MaximoWorkOrder[];
  dueThisWeek: MaximoWorkOrder[];
  completedThisWeek: MaximoWorkOrder[];
  completedLastWeek: MaximoWorkOrder[];
  upcoming: MaximoWorkOrder[];
}

// ── Offline PM grab + completion draft ─────────────────────────────────────

/** A work order grabbed for offline work: the WO + all its assigned completion forms, cached locally. */
export interface MaximoGrab {
  wo: MaximoWorkOrder;
  formTemplates: MaximoFormTemplate[];        // all forms assigned to this WO's PM (operator picks one)
  formTemplate?: MaximoFormTemplate | null;   // legacy single-form field (older cached grabs) — read-compat only
  grabbedAt: number;
}

/** An in-progress completion, saved locally; submitted on reconnect. */
export interface MaximoCompletionDraft {
  wonum: string;
  href: string;
  mode: 'form' | 'manual';
  templateFormKey?: string;
  pmnum?: string;
  siteid?: string;
  formValues?: Record<string, any>;
  hours?: string;
  summary?: string;
  details?: string;
  status: 'draft' | 'pending' | 'failed';
  updatedAt: number;
  lastError?: string;
}

// ── Dynamic PM completion forms ────────────────────────────────────────────

export type MaximoFieldType =
  | 'text' | 'textarea' | 'number' | 'date'
  | 'checkbox' | 'select' | 'radio-group' | 'checkbox-group' | 'image' | 'computed' | 'timer';

export interface MaximoFormFieldDef {
  name: string;
  label: string;
  type: MaximoFieldType;
  required?: boolean;
  options?: string[];
  unit?: string;
  section?: string;
  placeholder?: string;
  maximoTarget?: '' | 'worklog' | 'laborhours' | 'reading';
  imageSrc?: string;
  /** 'computed' only: arithmetic expression over other field names, evaluated in the app (result is submitted). */
  formula?: string;
  /** 'computed' only: human-readable formula shown to the operator for reference. */
  note?: string;
  /** 'timer' only: show a "time since {field} started → take the sample at {minutes} min" prompt, and
   *  optionally auto-fill the measured interval minutes into {fillInto} when this timer is started. */
  waitAfter?: { field: string; minutes: number; fillInto?: string };
  /** 'computed' only: when the result exceeds this threshold (magnitude when alertAbs), the form shows an
   *  out-of-tolerance prompt to file a Work Request prefilled with alertWrLocation + alertWrText. */
  alertThreshold?: number;
  alertAbs?: boolean;
  alertWrLocation?: string;
  alertWrText?: string;
}

export interface MaximoFormTemplate {
  id?: number;
  formKey: string;
  formName: string;
  description?: string;
  fieldsJson: string;                 // JSON.stringify(MaximoFormFieldDef[])
  matchPmnum?: string | null;
  matchDescriptionContains?: string | null;
  completeWoStatus?: string | null;
  active?: boolean;
}

export interface MaximoFormSubmission {
  id?: number;
  submissionKey?: string;
  templateFormKey: string;
  templateName?: string;
  wonum: string;
  pmnum?: string;                     // the WO's PM id, so the audit view can group completions by PM
  woHref?: string;
  siteid?: string;
  valuesJson: string;                 // JSON.stringify(fieldName -> value)
  status?: 'DRAFT' | 'COMPLETED';
  submittedBy?: string;
  submittedAt?: string;
  /** Also transition the WO to COMP on completion — the mobile "Submit & complete" flow sets this. */
  completeWo?: boolean;
  /** Backend completion outcome: true = WO reached target status, false = form attached but Maximo rejected the
   *  close (see woCloseError), undefined/null = no close attempted. Lets the UI avoid a false COMP. */
  woClosed?: boolean | null;
  /** Maximo's rejection message when woClosed === false (the form still attached; only the close failed). */
  woCloseError?: string;
}

/** One reagent below its target on a chem-inventory form (need = target − inStock). */
export interface ReorderLine {
  reagent: string;
  target: number;
  inStock: number;
  need: number;
}

/** Outcome of a reorder-email send (or dry-run preview). */
export interface ReorderResult {
  sent: boolean;
  message?: string;
  recipient?: string;
  cc?: string;
  poNumber?: string;
  doclinkId?: string;
  lines?: ReorderLine[];
}

/** A Maximo attachment (doclink) on a WO — phone subset of the desktop MaximoDoclink. */
export interface MaximoDoclink {
  href: string;            // doclink id
  title?: string;
  urlname?: string;        // download filename
  doctype?: string;
  mimeType?: string;
  size?: number;
  createdDate?: string;
  createby?: string;
}

/** A Maximo worklog note on a WO. */
export interface MaximoWorklog {
  href?: string;
  worklogid?: number;
  description?: string;        // summary
  longDescription?: string;   // details
  logtype?: string;
  createby?: string;
  createdate?: string;
}

export interface MaximoLocation {
  href: string;
  location: string;
  description: string;
  type: string;
  status: string;
  siteid: string;
  parent?: string;
}

/**
 * One node of the plant hierarchy — flat, with parentId (mirrors the backend PhysicalObjectDto / desktop
 * `PhysicalObjectNode`, phone subset). The tree picker assembles the tree client-side from this flat list; an
 * EQUIPMENT/asset node carries `maximoAssetnum` + `maximoLocation`, a location node carries `maximoLocation`.
 */
export interface PhysicalObjectNode {
  id: number;
  name: string;
  type: string | null;          // PLANT | SECTION | SYSTEM | SKID | EQUIPMENT | LOCATION
  tagNumber: string | null;
  description: string | null;
  maximoLocation: string | null;
  maximoAssetnum: string | null;
  parentId: number | null;
  local: boolean;               // hand-built node (filtered out) vs Maximo-seeded hierarchy node
}

// ── Parts checkout ─────────────────────────────────────────────────────────

export interface MaximoInventoryItem {
  itemnum: string;
  description: string;
  issueunit: string;
  storeroom: string;
  binnum: string;
  curbal: number | null;
  status?: string;
}

export interface PartsCheckoutLine {
  itemnum: string;
  quantity: number;
  storeroom?: string;
}

export interface PartsCheckoutRequest {
  description?: string;
  location: string;
  worktype?: string;
  siteid?: string;
  storeroom?: string;
  lines: PartsCheckoutLine[];
  memo?: string;
}

export interface PartsCheckoutResult {
  wonum: string;
  href: string;
  status: string;
  actmatcost?: number;
}

/** WO status choices offered in the mobile filter (mirrors the desktop dropdown). */
export const WO_STATUSES = ['', 'WAPPR', 'APPR', 'INPRG', 'COMP', 'CLOSE', 'CAN'] as const;
/** SR status choices. */
export const SR_STATUSES = ['', 'NEW', 'QUEUED', 'INPROG', 'PENDING', 'RESOLVED', 'CLOSED'] as const;
/** Work-type choices for a WO filter. */
/** Fallback worktype codes, used only when the dynamic fetch from Maximo fails or the backend is old. These are
 *  the codes actually present on live JG work orders (verified against Maximo), plus WIN for the newly-added
 *  Winterization type (which has no WOs yet, so it can't be auto-discovered). The backend property
 *  `maximo.curated-worktypes` is the source of truth once the backend is deployed. */
export const WO_WORKTYPES = ['', 'PM', 'CM', 'INS', 'PRO', 'WAR', 'SAF', 'REG', 'MOC', 'WINT'] as const;
/** Friendly labels for known worktype codes; unknown codes render as the raw code. WINT/INS come from the
 *  Field List → Maximo worktype mapping (maximo.field-list.wo-worktype-mappings). */
export const WO_WORKTYPE_LABELS: Record<string, string> = {
  PM: 'Preventive Maintenance', CM: 'Corrective Maintenance', INS: 'Insulation',
  PRO: 'Project', WAR: 'Warranty', SAF: 'Safety', REG: 'Regulatory',
  MOC: 'Management of Change', WINT: 'Winterization', EM: 'Emergency', INSP: 'Inspection',
};
export function worktypeLabel(code: string): string {
  if (!code) return 'Any type';
  return WO_WORKTYPE_LABELS[code] ? `${code} — ${WO_WORKTYPE_LABELS[code]}` : code;
}

/** A colour class for a status chip (grouped, not per-status). */
export function statusClass(status: string | undefined): string {
  switch ((status || '').toUpperCase()) {
    case 'COMP': case 'CLOSE': case 'RESOLVED': case 'CLOSED': return 'st-done';
    case 'INPRG': case 'INPROG': return 'st-active';
    case 'WAPPR': case 'NEW': case 'QUEUED': case 'PENDING': return 'st-wait';
    case 'CAN': return 'st-cancel';
    default: return 'st-open';
  }
}
