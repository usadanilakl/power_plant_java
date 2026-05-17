import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Column } from '../../../models/column.model';

/** Cap on suggestions rendered in the dropdown — narrow further by typing more. */
const MAX_SUGGESTIONS = 50;

/**
 * Self-contained table for Maximo list views over already-fetched local data.
 *
 *   - Sort: click a column header (asc → desc → unsorted)
 *   - Per-column filter: substring, case-insensitive, AND'd across columns
 *   - Global search: space-separated tokens, each token must (AND) or may (OR) appear in any cell
 *
 * No services, no providers, no persistence — just bind [items] + [columns] and listen to
 * (rowDoubleClicked) / (rowClicked). For richer behavior (virtual scroll, column drag, server
 * pagination, persisted sort) the shared rf-table is the right tool — this component is
 * deliberately the lightweight alternative.
 */
@Component({
  selector: 'app-maximo-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './maximo-table.component.html',
  styleUrl: './maximo-table.component.css'
})
export class MaximoTableComponent {
  @Input({ required: true }) columns: Column[] = [];
  @Input({ required: true }) items: any[] = [];
  @Input() emptyMessage = 'No results.';

  @Output() rowClicked = new EventEmitter<any>();
  @Output() rowDoubleClicked = new EventEmitter<any>();

  globalSearch = '';
  globalSearchLogic: 'AND' | 'OR' = 'AND';
  columnFilters: Record<string, string> = {};
  sortColumn: string | null = null;
  sortDir: 'asc' | 'desc' = 'asc';

  /** Which column's filter input is focused (and so should show its suggestions). */
  focusedColumn = signal<string | null>(null);
  private blurTimer: ReturnType<typeof setTimeout> | null = null;

  toggleLogic() {
    this.globalSearchLogic = this.globalSearchLogic === 'AND' ? 'OR' : 'AND';
  }

  /** Click column header — cycle through asc → desc → unsorted. */
  onHeaderClick(col: Column) {
    if (col.sortable === false) return;
    if (this.sortColumn !== col.id) {
      this.sortColumn = col.id;
      this.sortDir = 'asc';
    } else if (this.sortDir === 'asc') {
      this.sortDir = 'desc';
    } else {
      this.sortColumn = null;
    }
  }

  cell(item: any, col: Column): string {
    let v: any;
    if (col.accessorFn) v = col.accessorFn(item);
    else if (col.accessorKey) v = item[col.accessorKey];
    else v = item[col.id];
    return v == null ? '' : String(v);
  }

  /**
   * Plain method (not computed) — items / filters / sort live as mutable properties
   * so change detection re-runs this on every CD cycle. With realistic Maximo result
   * sizes (≤500 rows × ≤15 cols), it's fast enough.
   */
  visibleItems(): any[] {
    let result = this.items;

    // 1. Per-column filters — AND'd
    for (const col of this.columns) {
      if (col.filterable === false) continue;
      const f = (this.columnFilters[col.id] ?? '').trim().toLowerCase();
      if (!f) continue;
      result = result.filter(item => this.cell(item, col).toLowerCase().includes(f));
    }

    // 2. Global search — split on whitespace; each token must (AND) or may (OR) appear
    //    in the concatenated cell text for the row.
    const tokens = this.globalSearch.trim().toLowerCase().split(/\s+/).filter(t => t);
    if (tokens.length > 0) {
      result = result.filter(item => {
        const joined = this.columns.map(c => this.cell(item, c).toLowerCase()).join(' ');
        return this.globalSearchLogic === 'AND'
          ? tokens.every(t => joined.includes(t))
          : tokens.some(t => joined.includes(t));
      });
    }

    // 3. Sort
    if (this.sortColumn) {
      const col = this.columns.find(c => c.id === this.sortColumn);
      if (col) {
        const dir = this.sortDir === 'asc' ? 1 : -1;
        result = [...result].sort((a, b) => {
          const av = this.cell(a, col);
          const bv = this.cell(b, col);
          // Numeric sort if both parse as numbers, otherwise string compare
          const an = Number(av), bn = Number(bv);
          if (av !== '' && bv !== '' && !isNaN(an) && !isNaN(bn)) {
            return (an - bn) * dir;
          }
          return av.localeCompare(bv) * dir;
        });
      }
    }

    return result;
  }

  // ---- Suggestion dropdown ---------------------------------------------------

  onFilterFocus(col: Column) {
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
    this.focusedColumn.set(col.id);
  }

  onFilterBlur() {
    // Small delay so a click on a dropdown option fires (mousedown → blur → click).
    // Using (mousedown) on the option below also helps — the timeout is the safety net.
    this.blurTimer = setTimeout(() => {
      this.focusedColumn.set(null);
      this.blurTimer = null;
    }, 150);
  }

  /** Unique non-empty values currently in the column, sorted. */
  uniqueValuesFor(col: Column): string[] {
    const seen = new Set<string>();
    for (const item of this.items) {
      const v = this.cell(item, col);
      if (v) seen.add(v);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }

  /** Suggestions = unique values filtered by what's already typed in the input. */
  suggestionsFor(col: Column): { items: string[]; truncated: number } {
    const filter = (this.columnFilters[col.id] ?? '').trim().toLowerCase();
    let all = this.uniqueValuesFor(col);
    if (filter) all = all.filter(v => v.toLowerCase().includes(filter));
    const truncated = Math.max(0, all.length - MAX_SUGGESTIONS);
    return { items: all.slice(0, MAX_SUGGESTIONS), truncated };
  }

  pickSuggestion(col: Column, value: string) {
    this.columnFilters[col.id] = value;
    if (this.blurTimer) {
      clearTimeout(this.blurTimer);
      this.blurTimer = null;
    }
    this.focusedColumn.set(null);
  }

  clearColumnFilter(col: Column) {
    this.columnFilters[col.id] = '';
  }
}
