/** Ported from the desktop `models/maximo/maximo.models.ts` — backend-matching, phone subset. */

export interface MaximoWorkOrder {
  href: string;
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
  schedstart: string;
  schedfinish: string;
  leadCraft: string;
  supervisor: string;
  priority: string;
  pmnum: string;
  statusDate?: string;
  taskid?: string;
  parent?: string;
  istask?: boolean;
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
  | 'checkbox' | 'select' | 'radio-group' | 'checkbox-group' | 'image';

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
  woHref?: string;
  siteid?: string;
  valuesJson: string;                 // JSON.stringify(fieldName -> value)
  status?: 'DRAFT' | 'COMPLETED';
  submittedBy?: string;
  submittedAt?: string;
  /** Also transition the WO to COMP on completion — the mobile "Submit & complete" flow sets this. */
  completeWo?: boolean;
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
export const WO_WORKTYPES = ['', 'CM', 'PM', 'EM', 'INSP'] as const;

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
