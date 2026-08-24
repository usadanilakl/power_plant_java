import { ValidatorFn } from "@angular/forms";
import { Option } from "./option.model";

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'date' |
  'time' | 'checkbox-group' | 'checkbox' | 'radio' | 'file' | 'multi-input' |
  'number' | 'radio-group' | 'form-array' | 'email' | 'password' | 'signature' | 'work-area-map' | 'equipment-picker' |
  'maximo-tree-picker';
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
  /**
   * Show (and validate) this field only while a condition on another field holds.
   *
   * `value` is the simple case: strict equality against that field's value.
   *
   * `matches` covers conditions equality cannot express — most usefully a checkbox-group, whose
   * value is an object rather than a scalar. Supply one or the other; `matches` wins if both are
   * given. The predicate receives the controlling field's CURRENT value, so it must tolerate
   * `null` / `undefined` (a hidden controlling field is reset to undefined).
   *
   * Example — only ask for the Cr(VI) assessment when Welding is among the hot work types:
   *   `showWhen: { field: 'hotWorkTypes', matches: v => v?.welding === true }`
   */
  showWhen?: {
    field: string;
    value?: any;
    matches?: (controllingValue: any) => boolean;
  };
  fields?: FormField[];
  readonly?: boolean;
  placeholder?: string;
  /**
   * For 'work-area-map': restrict the map to these work-area type names (case-insensitive).
   * Omit to show every area type.
   */
  allowedAreaTypes?: string[];
  /**
   * For 'work-area-map': drop these work-area type names (case-insensitive). Applied after
   * `allowedAreaTypes`. Use when you want everything EXCEPT a few types.
   */
  excludedAreaTypes?: string[];
  /**
   * For 'work-area-map': drop confined spaces. Independent of how the area-type Value happens to be
   * named — matches the hub's `isConfinedSpace` flag (any confined-space hazard set on the area) OR
   * an area type named "confined space". Prefer this over spelling the type name in
   * `excludedAreaTypes`, which silently no-ops if the name differs.
   */
  excludeConfinedSpaces?: boolean;
}

export interface FormFieldGroup {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
}