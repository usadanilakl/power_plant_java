import { ValidatorFn } from "@angular/forms";
import { Option } from "../option.model";
import { Question } from "./question.model";

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'multi-select' | 'date' | 'time' | 'checkbox-group' | 'checkbox' | 'radio';
  validators?: ValidatorFn[];
  options?: Option[];
  initialValue?: any;
  currentValue?: any;
  question?: Question
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
}