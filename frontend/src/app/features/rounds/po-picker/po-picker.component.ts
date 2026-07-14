import { Component, computed, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PhysicalObjectNode, poColor } from '../../../models/physical/physical-object.models';

interface Row { n: PhysicalObjectNode; depth: number; expandable: boolean; }

/**
 * Reusable PhysicalObject selector: a collapsible hierarchy tree with search + a "built only" toggle (so hand-built
 * local objects — which are otherwise buried under hundreds of Maximo-seeded location nodes — are one click away).
 * Emits {@code pick} with the chosen node id, or null to clear. The parent owns the selection value.
 */
@Component({
  selector: 'app-po-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pp">
      <div class="pp-tools">
        <input class="pp-search" [ngModel]="queryS()" (ngModelChange)="queryS.set($event)" placeholder="Search name or tag…" />
        <label class="pp-built"><input type="checkbox" [ngModel]="builtOnly()" (ngModelChange)="builtOnly.set($event)" /> built only</label>
      </div>
      <div class="pp-list">
        <button *ngIf="selectedId() != null" class="pp-clear" (click)="pick.emit(null)">✕ clear selection</button>
        <div class="pp-row" *ngFor="let row of rows()" [class.sel]="row.n.id === selectedId()" [style.paddingLeft.px]="6 + row.depth * 14">
          <button class="pp-caret" *ngIf="row.expandable" (click)="toggle(row.n.id)">{{ isExpanded(row.n.id) ? '▾' : '▸' }}</button>
          <span class="pp-caret-sp" *ngIf="!row.expandable"></span>
          <button class="pp-node" (click)="pick.emit(row.n.id)">
            <span class="dot" [style.background]="poColor(row.n.type)"></span>
            <span class="pp-name">{{ row.n.name }}</span>
            <span class="pp-tag" *ngIf="row.n.tagNumber">{{ row.n.tagNumber }}</span>
            <span class="pp-badge" *ngIf="row.n.local">built</span>
            <span class="pp-type">{{ row.n.type }}</span>
          </button>
        </div>
        <div class="pp-empty" *ngIf="!rows().length">No matches.</div>
      </div>
    </div>
  `,
  styles: [`
    .pp { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
    .pp-tools { display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-bottom: 1px solid #eee; background: #fafafa; }
    .pp-search { flex: 1; padding: 5px 7px; border: 1px solid #ccc; border-radius: 4px; font: inherit; }
    .pp-built { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #666; white-space: nowrap; }
    .pp-list { max-height: 240px; overflow-y: auto; }
    .pp-clear { display: block; width: 100%; text-align: left; background: #fff; border: none; border-bottom: 1px solid #f0f0f0; padding: 5px 8px; color: #c62828; font-size: 12px; cursor: pointer; }
    .pp-row { display: flex; align-items: center; }
    .pp-row.sel { background: #e3f2fd; }
    .pp-caret { background: none; border: none; color: #888; cursor: pointer; width: 16px; padding: 0; font-size: 11px; }
    .pp-caret-sp { width: 16px; flex: none; }
    .pp-node { flex: 1; min-width: 0; display: flex; align-items: center; gap: 6px; text-align: left; background: none; border: none; padding: 5px 8px 5px 0; cursor: pointer; font-size: 12px; }
    .pp-node:hover { background: #f5f9ff; }
    .dot { width: 9px; height: 9px; border-radius: 50%; flex: none; }
    .pp-name { color: #222; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .pp-tag { color: #888; font-size: 11px; }
    .pp-badge { background: #e8f5e9; color: #2e7d32; border-radius: 3px; padding: 0 5px; font-size: 10px; }
    .pp-type { margin-left: auto; color: #bbb; font-size: 10px; }
    .pp-empty { padding: 12px; text-align: center; color: #999; font-size: 12px; }
  `],
})
export class PoPickerComponent {
  nodes = input<PhysicalObjectNode[]>([]);
  selectedId = input<number | null>(null);
  pick = output<number | null>();

  readonly poColor = poColor;
  queryS = signal('');
  builtOnly = signal(false);
  expanded = signal<Set<number>>(new Set());

  isExpanded(id: number): boolean { return this.expanded().has(id); }
  toggle(id: number): void {
    const s = new Set(this.expanded());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.expanded.set(s);
  }

  readonly rows = computed<Row[]>(() => {
    const q = this.queryS().trim().toLowerCase();
    const all = this.nodes();
    const built = this.builtOnly();

    if (q) {
      return all
        .filter(n => (!built || n.local) &&
          ((n.name || '').toLowerCase().includes(q) || (n.tagNumber || '').toLowerCase().includes(q)))
        .slice(0, 200)
        .map(n => ({ n, depth: 0, expandable: false }));
    }
    if (built) {
      return all.filter(n => n.local).map(n => ({ n, depth: 0, expandable: false }));
    }

    // hierarchy
    const byParent = new Map<number | null, PhysicalObjectNode[]>();
    for (const n of all) {
      const k = n.parentId ?? null;
      if (!byParent.has(k)) byParent.set(k, []);
      byParent.get(k)!.push(n);
    }
    const sortFn = (a: PhysicalObjectNode, b: PhysicalObjectNode) => (a.name || '').localeCompare(b.name || '');
    const exp = this.expanded();
    const out: Row[] = [];
    const walk = (list: PhysicalObjectNode[], depth: number, guard: number) => {
      if (guard > 100) return;
      for (const n of [...list].sort(sortFn)) {
        const kids = byParent.get(n.id) ?? [];
        out.push({ n, depth, expandable: kids.length > 0 });
        if (kids.length && exp.has(n.id)) walk(kids, depth + 1, guard + 1);
      }
    };
    walk(byParent.get(null) ?? [], 0, 0);
    return out;
  });
}
