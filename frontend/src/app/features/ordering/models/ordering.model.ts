// Ordering feature models. These mirror the backend dto/order/* DTOs. They intentionally do NOT extend BaseDto/
// BaseModel: the Ordering data lives in the hub-independent SharePoint ledger (string keys, no numeric id / sync
// fields), so plain interfaces are the right fit.

export interface OrderPreset {
  label: string;
  defaultQty: number | null;
  /** FILL mode: the tank/equipment capacity. */
  capacity?: number | null;
  /** FILL mode: the product this equipment holds (used to total the order per product). */
  product?: string;
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
  /** 'QUANTITY' (pick presets + enter qty) or 'FILL' (top-off equipment: order = sum(capacity − level) per product). */
  orderMode?: string;
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
  testMode?: boolean;
  testRecipient?: string;
  testCc?: string;
}

/** Dry-run render of an order email — exactly what would be sent. */
export interface OrderPreview {
  to?: string;
  cc?: string;
  subject?: string;
  poNumber?: string;
  bodyHtml?: string;
}
