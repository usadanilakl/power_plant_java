import { ValidatorFn } from "@angular/forms";
import { Option } from "../option.model";

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multi-select';
  validators?: ValidatorFn[];
  options?: Option[];
  initialValue?: any;
  currentValue?: any;
}