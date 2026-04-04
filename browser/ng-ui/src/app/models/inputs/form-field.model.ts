import { ValidatorFn } from "@angular/forms";
import { Option } from "./option.model";

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'date' |
  'time' | 'checkbox-group' | 'checkbox' | 'radio' | 'file' | 'multi-input' |
  'number' | 'radio-group' | 'form-array' | 'email' | 'password' | 'signature' | 'work-area-map' | 'equipment-picker';
  validators?: ValidatorFn[];
  options?: Option[];
  multiple?: boolean;
  accept?: string;
  initialValue?: any;
  currentValue?: any;
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
  showWhen?: {
    field: string;
    value: any;
  };
  fields?: FormField[];
  readonly?: boolean;
  placeholder?: string;
}

export interface FormFieldGroup {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}