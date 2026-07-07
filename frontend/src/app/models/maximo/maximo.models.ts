export interface MaximoAsset {
  href: string;
  assetnum: string;
  description: string;
  siteid: string;
  location: string;
  status: string;
  assettype: string;
  assetid: number;
  parent: string;
  disabled: boolean;
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
  /** PM-master id (e.g. "JG-1183") on PM-generated WOs; null/empty on one-off WOs. */
  pmnum: string;
  /** When the WO's status last changed (completion time for COMP WOs); present on overview rows. */
  statusDate?: string;
  /** Task sequence number when this row is an internal task of a parent WO; null on top-level WOs. */
  taskid?: string;
  /** Parent WO number when this row is a task/child WO; null on top-level WOs. */
  parent?: string;
  /** True when this row is an internal task (completed independently on the parent's Tasks tab). */
  istask?: boolean;
}

/** One Maximo ticket (SR or WO) with the asset the tag matcher identified/suggested for it. */
export interface MaximoTicketAsset {
  id: number;
  ticketKey: string;
  ticketType: 'SR' | 'WO';
  ticketId: string;
  href: string;
  title: string;
  status: string;
  siteid: string;
  reportDate: string;
  maximoAssetnum: string;
  maximoLocation: string;
  identifiedAssetnum: string | null;
  confidence: 'EXACT' | 'STRONG' | 'PARTIAL' | 'NONE';
  matchSource: string;
  suggestedAssets: string[];
  extractedTags: string[];
  processedAt: string | null;
}

/**
 * A tracked people set's work orders bucketed by due status against the current ISO week (Mon–Sun).
 * The "All" tab is served separately (getPeopleWorkOrders) so it can be status-filtered.
 */
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

export interface MaximoDoclink {
  href: string;            // doclink id (e.g. "21934")
  document: string;
  title: string;           // dcterms:title — display name
  description: string;     // dcterms:description — often a server-side path
  urlname: string;         // download filename
  url: string;             // populated for WEB-type links only; FILE-type uses backend stream proxy
  urltype: string;         // FILE / WEB
  doctype: string;
  doclinksid: number;
  mimeType: string;
  size: number;
  createdDate: string;
  modifiedDate: string;
  createby: string;
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
  /** Maximo personid; blank = signed-in user (resolved server-side). */
  laborcode?: string;
  regularhrs?: number;
}

/** Payload for completing a work order: report labor + worklog, then change status. */
export interface CompleteWorkOrderRequest {
  labor?: MaximoLaborEntry[];
  summary?: string;
  details?: string;
  logtype?: string;     // defaults to CLIENTNOTE server-side
  complete?: boolean;   // defaults to true server-side
  status?: string;      // defaults to COMP server-side
  memo?: string;
}

export interface MaximoLocation {
  href: string;
  location: string;
  description: string;
  type: string;
  status: string;
  siteid: string;
}

export interface MaximoInventoryItem {
  itemnum: string;
  description: string;
  issueunit: string;
  storeroom: string;   // warehouse
  binnum: string;      // bin / physical address within the warehouse
  curbal: number | null;
}

export interface MaximoInventoryStock {
  href: string;
  itemnum: string;
  storeroom: string;
  binnum: string;
  issueunit: string;
  status: string;
  curbal: number | null;
  reservedqty: number | null;
  minlevel: number | null;
  maxlevel: number | null;
  reorder: number | null;
  orderqty: number | null;
  invcost: number | null;
  issueytd: number | null;
  issue1yrago: number | null;
  issue2yrago: number | null;
  issue3yrago: number | null;
}

export interface MaximoInventoryUsage {
  wonum: string;
  quantity: number | null;
  transdate: string;
  issuetype: string;
  linecost: number | null;
}

export interface MaximoWorkType {
  value: string;
  label: string;
}

export interface PartsCheckoutLine {
  itemnum: string;
  quantity: number;
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
  actmatcost: number | null;
}

export interface MaximoMaterialTxn {
  matusetransid: number;
  itemnum: string;
  description: string | null;
  issuetype: string;   // ISSUE / RETURN
  storeloc: string;
  issueunit: string;
  quantity: number;    // signed: issue negative, return positive
  linecost: number | null;
}

export interface ReturnMaterialRequest {
  lines: PartsCheckoutLine[];
  storeroom?: string;
}

export interface IssueMaterialRequest {
  lines: PartsCheckoutLine[];
  storeroom?: string;
}

export type MaximoAttachmentParent = 'asset' | 'sr' | 'wo';
export type MaximoTicketParent = 'sr' | 'wo';

export interface MaximoWorklog {
  href: string;
  worklogid: number;
  description: string;
  longDescription: string;
  logtype: string;
  logtypeDescription: string;
  createby: string;
  createdate: string;
  modifyby: string;
  modifydate: string;
  clientviewable: boolean;
  recordkey: string;
}

export interface MaximoServiceRequestCriteria {
  status?: string;
  assetnum?: string;
  location?: string;
  priority?: string;
  reportedby?: string;
  affectedperson?: string;
  classstructureid?: string;
  reportdateFrom?: string;     // ISO 8601
  reportdateTo?: string;       // ISO 8601
  descriptionContains?: string;
  longDescriptionContains?: string;
  siteid?: string;
}

export interface MaximoWorkOrderCriteria {
  status?: string;
  worktype?: string;
  assetnum?: string;
  location?: string;
  priority?: string;
  leadCraft?: string;
  supervisor?: string;
  schedstartFrom?: string;     // ISO 8601, e.g. 2022-01-01T00:00:00-05:00
  schedfinishTo?: string;      // ISO 8601
  reportdateFrom?: string;     // ISO 8601
  reportdateTo?: string;       // ISO 8601
  descriptionContains?: string;
  longDescriptionContains?: string;
  wonumContains?: string;
  siteid?: string;
}
