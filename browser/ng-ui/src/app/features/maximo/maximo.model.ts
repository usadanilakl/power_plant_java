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

export interface MaximoLocation {
  href: string;
  location: string;
  description: string;
  type: string;
  status: string;
  siteid: string;
  parent?: string;
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
