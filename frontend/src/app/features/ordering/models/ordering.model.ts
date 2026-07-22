// Ordering feature models. These mirror the backend dto/order/* DTOs. They intentionally do NOT extend BaseDto/
// BaseModel: the Ordering data lives in the hub-independent SharePoint ledger (string keys, no numeric id / sync
// fields), so plain interfaces are the right fit.

export interface OrderPreset {
  label: string;
  defaultQty: number | null;
}

export interface OrderTextOption {
  kind: 'FREE' | 'FIXED' | 'SEASONAL';
  label: string;
  text?: string;
  monthFrom?: number | null;
  monthTo?: number | null;
}

export interface OrderCatalogItem {
  sharepointId?: string;
  itemKey: string;
  displayName: string;
  vendor: string;
  contactEmail?: string;
  ccEmails?: string;
  bodyNote?: string;
  blanketPoNumber?: string;
  unit?: string;
  defaultQtyPresets: OrderPreset[];
  textOptions: OrderTextOption[];
  active: boolean;
  sortOrder?: number | null;
}

export interface OrderLine {
  description: string;
  qty: number | null;
  unit?: string;
}

export interface OrderRecord {
  sharepointId?: string;
  pwaId?: string;
  orderDate?: string;
  orderedBy?: string;
  vendor?: string;
  catalogItemKey?: string;
  poNumber?: string;
  recipient?: string;
  cc?: string;
  subject?: string;
  lines: OrderLine[];
  emailSent: boolean;
  emailError?: string;
  sourceSuggestionId?: string;
  status?: string;
}

export interface ReorderSuggestion {
  sharepointId?: string;
  pwaId?: string;
  suggestedAt?: string;
  catalogItemKey?: string;
  source?: string;
  roundQuestionId?: string;
  reading?: string;
  lowLimit?: string;
  suggestedQty?: string;
  reason?: string;
  status?: string;
  resultingOrderId?: string;
}

export interface PlaceOrderRequest {
  itemKey: string;
  orderedBy?: string;
  note?: string;
  sourceSuggestionId?: string;
  lines: OrderLine[];
}
