/**
 * Electronic Maximo task forms — client models. A template is data-driven: its fields are authored in the
 * form-builder and stored as a JSON array (fieldsJson). The fill page maps those defs onto SmartFormComponent
 * FormFields. See project memory project-maximo-electronic-forms.
 */

/** Field types the form-builder offers (each maps to a SmartFormComponent field type). */
export type MaximoFieldType =
  | 'text' | 'textarea' | 'number' | 'date'
  | 'checkbox'        // single boolean (e.g. a checklist item)
  | 'select'          // one-of dropdown (needs options)
  | 'radio-group'     // one-of radios — use for pass/fail (options)
  | 'checkbox-group'  // many-of (options)
  | 'image';          // read-only reference photo (no input); imageSrc holds a URL/base64 data URL

/** Where a field's value is written back to Maximo on completion (beyond the PDF). */
export type MaximoWriteTarget = '' | 'worklog' | 'laborhours' | 'reading';

/** One data-driven field definition (persisted inside MaximoFormTemplate.fieldsJson). */
export interface MaximoFormFieldDef {
  name: string;        // control key, unique within the form
  label: string;
  type: MaximoFieldType;
  required?: boolean;
  options?: string[];  // for select / radio-group / checkbox-group
  unit?: string;       // display suffix for numeric readings (e.g. "psi")
  section?: string;    // groups fields under a heading
  placeholder?: string;
  maximoTarget?: MaximoWriteTarget;  // '' = PDF only; else worklog line / labor hours / reading line
  imageSrc?: string;   // for type 'image' — a URL or base64 data URL of a reference photo
}

export interface MaximoFormTemplate {
  id?: number;
  formKey: string;
  formName: string;
  description?: string;
  fieldsJson: string;                 // JSON.stringify(MaximoFormFieldDef[])
  matchPmnum?: string | null;
  matchDescriptionContains?: string | null;
  completeWoStatus?: string | null;   // WO status to set on completion (e.g. "COMP")
  active: boolean;
}

export type MaximoFormStatus = 'DRAFT' | 'COMPLETED';

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
  status?: MaximoFormStatus;
  submittedBy?: string;
  submittedAt?: string;
  pdfDoclinkId?: string;
  writeBackNote?: string;
}

/** One reagent below target on an inventory form (chem-lab reorder flow). qty to order = need. */
export interface ReorderLine {
  reagent: string;
  target: number;
  inStock: number;
  need: number;
}

/** Result of sending (or previewing) the vendor reorder email. */
export interface ReorderResult {
  sent: boolean;
  message: string;
  recipient?: string;
  cc?: string;
  poNumber?: string;
  doclinkId?: string;
  lines: ReorderLine[];
}

/** True when a form is a reorder-capable inventory form (has any `<key>__instock` field). */
export function isInventoryForm(defs: MaximoFormFieldDef[] | null | undefined): boolean {
  return (defs ?? []).some(d => (d?.name ?? '').endsWith('__instock'));
}

/**
 * Live reorder preview computed from a filled inventory form — a client-side mirror of the server's
 * ChemInventoryReorderService, so the form can show "what will be reordered" as it's filled. For each
 * `<key>__instock` field: need = target(`<key>__desired`) - inStock; included reagents (`<key>__include`
 * truthy) with need > 0 are returned. Reagent label = the field's section. Empty for non-inventory forms.
 */
export function computeReorderLines(defs: MaximoFormFieldDef[] | null | undefined, values: any): ReorderLine[] {
  const v = values ?? {};
  const num = (x: any) => { const n = parseFloat(x); return isNaN(n) ? 0 : n; };
  const out: ReorderLine[] = [];
  for (const d of defs ?? []) {
    const name = d?.name ?? '';
    if (!name.endsWith('__instock')) continue;
    const base = name.slice(0, -'__instock'.length);
    const include = v[base + '__include'];
    if (!(include === true || include === 'true')) continue;
    const target = num(v[base + '__desired']);
    const inStock = num(v[name]);
    const need = target - inStock;
    if (need > 0) out.push({ reagent: d.section || d.label || name, target, inStock, need });
  }
  return out;
}
