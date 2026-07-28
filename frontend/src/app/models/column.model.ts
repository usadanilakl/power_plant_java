
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
  /**
   * Pin the column to the LEFT or RIGHT edge of the table viewport. Sticky
   * columns stay visible during horizontal scroll — used for row-action
   * buttons ("add to standard" / "remove from standard" arrows on the LOTO
   * Points dual-table). The table CSS applies {@code position: sticky} +
   * a z-index bump; if unset, the column behaves as a normal column.
   * <p>
   * When multiple sticky-left / sticky-right columns exist, callers are
   * responsible for the column order (left-sticky columns should come
   * first in the columns array; right-sticky columns last). The table
   * does not re-order them for you.
   */
  sticky?: 'left' | 'right';
}