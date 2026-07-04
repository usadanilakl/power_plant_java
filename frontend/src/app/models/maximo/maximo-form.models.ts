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
  | 'checkbox-group'; // many-of (options)

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
  woHref?: string;
  siteid?: string;
  valuesJson: string;                 // JSON.stringify(fieldName -> value)
  status?: MaximoFormStatus;
  submittedBy?: string;
  submittedAt?: string;
  pdfDoclinkId?: string;
  writeBackNote?: string;
}
