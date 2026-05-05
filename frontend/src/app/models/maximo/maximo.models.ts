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
  status: string;
  worktype: string;
  assetnum: string;
  location: string;
  siteid: string;
  reportdate: string;
  schedstart: string;
  schedfinish: string;
  leadCraft: string;
  supervisor: string;
  priority: string;
}

export interface MaximoDoclink {
  href: string;
  document: string;
  description: string;
  urlname: string;
  url: string;
  urltype: string;
  doctype: string;
  doclinksid: number;
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
