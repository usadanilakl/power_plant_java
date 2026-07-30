
import { TemplateRef } from '@angular/core';

export interface Column {
  id: string;
  header: string;
  accessorKey?: string;
  accessorFn?: (item: any) => string;
  conditionalStyling?: (item: any, column: Column) => { [key: string]: string };
  width?: number;
  filterable?: boolean;
  sortable?: boolean;
  template?: TemplateRef<{ $implicit: any; column: Column }>;
  /** Optional field key to use when opening forms - useful when accessorKey is nested (e.g., 'zeroEnergy.method') but form needs base field ('zeroEnergy') */
  formFieldKey?: string;
}