import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NestedItem } from './nested-item.model';

interface FlatItem extends NestedItem {
  level: number;
  hasChildren: boolean;
}

/**
 * Trimmed, phone-friendly port of the desktop `RfToggleMenuComponent` for the PWA. A searchable, expandable tree:
 *
 *  - recursive client-side filter over name + subtitle (AND over whitespace-split terms),
 *  - branches with matching descendants auto-expand,
 *  - {@link itemClick} emits the clicked node (a branch also toggles open/closed on click).
 *
 * No virtual scroll (the seeded tree is small enough for a plain scrolling list) and no external deps beyond
 * CommonModule, so it drops into the standalone ng-ui app cleanly.
 */
@Component({
  selector: 'app-tree-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tm">
      <div class="tm-search">
        <input type="text" [placeholder]="searchPlaceholder()" [value]="searchQuery()"
               (input)="onSearchChange($any($event.target).value)" autocomplete="off" />
        <button type="button" class="tm-clear" *ngIf="searchQuery()" (click)="clearSearch()" title="Clear">✕</button>
      </div>
      <div class="tm-list">
        <div class="tm-row" *ngFor="let it of flatItems()"
             [style.padding-left.px]="10 + it.level * 16" (click)="onRowClick(it)">
          <button type="button" class="tm-caret tm-caret-btn" *ngIf="it.hasChildren"
                  [attr.aria-label]="it.isExpanded ? 'Collapse' : 'Expand'"
                  (click)="onCaret($event, it)">{{ it.isExpanded ? '▾' : '▸' }}</button>
          <span class="tm-caret tm-caret-leaf" *ngIf="!it.hasChildren"></span>
          <span class="tm-dot" [style.background]="it.color"></span>
          <span class="tm-text">
            <span class="tm-name">{{ it.name }}</span>
            <span class="tm-sub" *ngIf="it.subtitle">{{ it.subtitle }}</span>
          </span>
        </div>
        <div class="tm-empty" *ngIf="!flatItems().length">
          {{ searchQuery() ? 'No matches' : 'No items' }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tm { display: flex; flex-direction: column; height: 100%; min-height: 0; }
    .tm-search { position: relative; padding: 6px; }
    .tm-search input {
      width: 100%; box-sizing: border-box; padding: 0.5rem 2rem 0.5rem 0.6rem;
      border: 1px solid var(--border-color); border-radius: 8px; font-size: 0.9rem;
      background: var(--secondary-background); color: var(--primary-text); font-family: inherit;
    }
    .tm-clear {
      position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
      background: none; border: none; color: var(--secondary-text, #888); font-size: 0.9rem; cursor: pointer;
    }
    .tm-list { flex: 1; overflow-y: auto; min-height: 0; }
    .tm-row {
      display: flex; align-items: center; gap: 0.4rem; width: 100%; text-align: left; box-sizing: border-box;
      background: none; border: none; border-bottom: 1px solid var(--border-color);
      padding: 0.55rem 0.6rem; color: var(--primary-text); font-family: inherit; font-size: 0.85rem; cursor: pointer;
    }
    .tm-row:active { background: var(--secondary-background); }
    .tm-caret { flex-shrink: 0; width: 1rem; text-align: center; color: var(--secondary-text, #888); font-size: 0.75rem; }
    .tm-caret-btn { min-width: 1.8rem; height: 1.8rem; margin: -0.3rem 0; padding: 0; background: none; border: none;
      font: inherit; font-size: 0.8rem; color: var(--secondary-text, #888); cursor: pointer; border-radius: 6px; }
    .tm-caret-btn:active { background: var(--border-color); }
    .tm-caret-leaf { visibility: hidden; }
    .tm-dot { flex-shrink: 0; width: 8px; height: 8px; border-radius: 50%; }
    .tm-text { display: flex; flex-direction: column; min-width: 0; }
    .tm-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-sub { font-size: 0.72rem; color: var(--secondary-text, #888); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .tm-empty { padding: 1rem; text-align: center; color: var(--secondary-text, #888); font-size: 0.85rem; }
  `],
})
export class TreeMenuComponent {
  menuItems = input<NestedItem[]>([]);
  searchPlaceholder = input<string>('Search...');
  itemClick = output<NestedItem>();

  searchQuery = signal('');
  private expanded = signal<Set<string | number>>(new Set());

  /** Recursive filter: keep a node if it (name+subtitle) matches all terms, or if any descendant does. */
  private filteredItems = computed<NestedItem[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const items = this.menuItems();
    if (!q) return items;
    const terms = q.split(/\s+/).filter(t => t.length > 0);
    return this.filterItems(items, terms);
  });

  flatItems = computed<FlatItem[]>(() => {
    const searching = this.searchQuery().trim().length > 0;
    const expanded = this.expanded();
    const flatten = (items: NestedItem[], level: number): FlatItem[] => {
      let out: FlatItem[] = [];
      for (const it of items) {
        const hasChildren = !!(it.values && it.values.length > 0);
        // During search, a branch auto-opens if the filter flagged it (isExpanded) OR the user toggled it open.
        const isOpen = searching ? ((it.isExpanded ?? false) || expanded.has(it.id)) : expanded.has(it.id);
        out.push({ ...it, level, hasChildren, isExpanded: isOpen });
        if (hasChildren && isOpen) out = out.concat(flatten(it.values!, level + 1));
      }
      return out;
    };
    return flatten(this.filteredItems(), 0);
  });

  onSearchChange(v: string) { this.searchQuery.set(v); }
  clearSearch() { this.searchQuery.set(''); }

  /** Row body → select (emit). Expansion is the caret's job so tapping a location/asset picks it. */
  onRowClick(item: FlatItem) {
    this.itemClick.emit(item);
  }

  /** Left caret → expand/collapse only; stop the event so the row's select doesn't also fire. */
  onCaret(event: Event, item: FlatItem) {
    event.stopPropagation();
    this.toggle(item.id);
  }

  private toggle(id: string | number) {
    this.expanded.update(s => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  private filterItems(items: NestedItem[], terms: string[]): NestedItem[] {
    const res: NestedItem[] = [];
    for (const it of items) {
      const text = (it.name + (it.subtitle ? ' ' + it.subtitle : '')).toLowerCase();
      const selfMatch = terms.every(t => text.includes(t));
      const kids = it.values ? this.filterItems(it.values, terms) : [];
      if (selfMatch || kids.length > 0) {
        res.push({ ...it, values: kids.length > 0 ? kids : it.values, isExpanded: kids.length > 0 });
      }
    }
    return res;
  }
}
