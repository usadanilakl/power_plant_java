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
