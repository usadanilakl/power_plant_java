import { ValidatorFn } from "@angular/forms";
import { Option } from "../option.model";
import { Question } from "./question.model";
import { Signal } from "@angular/core";

export interface FormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'multi-select'
    | 'date'
    | 'time'
    | 'checkbox-group'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'multi-input'
    | 'number'
    | 'radio-group'
    | 'form-array'
    | 'group'
    | 'equipment-browser'
    | 'equipment-shape-drawer'
    | 'equipment-list-manager'
    | 'value-select'
    | 'multi-value-select'
    | 'zero-energy-phrase-builder';
  validators?: ValidatorFn[];
  options?: Option[];
  categoryAlias?: string; // For value-select and multi-value-select types
  canManageValues?: boolean; // For value-select and multi-value-select types
  initialValue?: any;
  currentValue?: any;
  question?: Question;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  style?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
    borderWidth?: number;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    border?: string;
    padding?: string;
  };
  layout?: {
    padding?: number;
    margin?: number;
    alignment?: 'left' | 'center' | 'right';
  };
  lines?: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  };
  group?: FormFieldGroup;
  fields?: FormField[];
  nestedForm?: any;
  arrayIndexRange?: { start: number; end: number };
  readonly?: boolean;
  showWhen?: {
    field: string;
    value: any;
  };

  // Context for equipment-list-manager
  context?: EquipmentListManagerContext;

  // Guide system support
  guideId?: string;         // Guide identifier in format "guideId:stepId"
  guideMessage?: string;    // Message to show when this field is highlighted
}

/**
 * Context options for equipment-list-manager field type
 */
export interface EquipmentListManagerContext {
  currentLotoPointId?: number;
  currentLotoPointTagNumber?: string;
  conflictMode?: 'has-association' | 'no-association' | 'none';
  useUnifiedDialog?: boolean;  // Use unified browse/draw dialog instead of separate dialogs
  requireLotoPointForDrawn?: boolean;  // Require LOTO point creation for newly drawn equipment
  requireLotoPointForUnassociated?: boolean;  // Require LOTO point creation for equipment without LOTO point association
}

export interface FormFieldGroup {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}


export interface FieldHelperCheckbox {
  id: string;           // Unique identifier for the checkbox
  label: string;        // Label text displayed next to checkbox
  checked?: boolean;    // Initial/current checked state
}

export interface RfFormField {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'multi-select'
    | 'value-select'
    | 'multi-value-select'
    | 'date'
    | 'time'
    | 'checkbox-group'
    | 'checkbox'
    | 'radio'
    | 'file'
    | 'multi-input'
    | 'number'
    | 'radio-group'
    | 'form-array'
    | 'group'
    | 'equipment-browser'
    | 'equipment-shape-drawer'
    | 'equipment-list-manager'
    | 'zero-energy-phrase-builder'
    | 'comment'
    | 'hidden';
  validators?: ValidatorFn[];
  options?: Option[] | Signal<Option[]>;
  categoryAlias?: string; // For value-select and multi-value-select types
  canManageValues?: boolean; // For value-select and multi-value-select types
  accept?: string; // For file input - accepted file types
  helperCheckbox?: FieldHelperCheckbox; // Optional checkbox displayed under the field
  tooltip?: string; // Tooltip text shown on hover
  initialValue?: any;
  currentValue?: any;
  question?: Question;
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  style?: {
    backgroundColor?: string;
    textColor?: string;
    borderColor?: string;
    borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
    borderWidth?: number;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    border?: string;
    padding?: string;
  };
  layout?: {
    padding?: number;
    margin?: number;
    alignment?: 'left' | 'center' | 'right';
  };
  lines?: {
    top?: boolean;
    right?: boolean;
    bottom?: boolean;
    left?: boolean;
  };
  group?: FormFieldGroup;
  fields?: RfFormField[];
  nestedForm?: any;
  arrayIndexRange?: { start: number; end: number };
  readonly?: boolean;
  showWhen?: {
    field: string;
    value: any;
  };

  // Context for equipment-list-manager and form groups
  context?: EquipmentListManagerContext & { [key: string]: any };

  // Context for comment input
  commentContext?: {
    entityType: string;
    entityId: number;
  };

  // Guide system support
  guideId?: string;         // Guide identifier in format "guideId:stepId"
  guideMessage?: string;    // Message to show when this field is highlighted
}