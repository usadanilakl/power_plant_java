import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { RfToggleMenuComponent } from '../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { NestedItem } from '../../../models/ui/nested-item.model';
import { PhysicalObjectApiService } from '../../../services/physical/physical-object-api.service';
import { PhysicalObjectNode } from '../../../models/physical/physical-object.models';

/** One tree pick resolves to an SR target: an equipment/asset node → assetnum + its location; a location node
 *  → location only (assetnum cleared). */
export interface MaximoTreeSelection {
  assetnum: string;
  location: string;
}

/** Colors per hierarchy level for the tree dots — mirrors the plant-hierarchy browser (single source there). */
const TYPE_COLORS: Record<string, string> = {
  PLANT: '#26C6DA', SECTION: '#42A5F5', SYSTEM: '#66BB6A',
  SKID: '#FFA726', EQUIPMENT: '#AB47BC', LOCATION: '#8D6E63',
};

/**
 * Compact "pick a location OR an asset from the plant tree" control. Reuses the shared
 * {@link RfToggleMenuComponent} (client-side search + auto-expand) fed by the Maximo-seeded PhysicalObject tree.
 *
 * ONE pick sets BOTH the SR's assetnum and location: choosing an EQUIPMENT/asset node emits its
 * {@code maximoAssetnum} + {@code maximoLocation}; choosing a location node emits its {@code maximoLocation} and
 * clears the assetnum (a deliberately broader location beats a precisely wrong asset — the same rule the manual
 * ladder follows). Local-only (hand-built) nodes are filtered out, so only Maximo-seeded targets are offered.
 *
 * The tree is Maximo-SEEDED (reflects the last reseed), so a brand-new code won't be here yet — the SR form keeps
 * a manual-entry escape hatch for that case.
 */
@Component({
  selector: 'app-maximo-location-tree-picker',
  standalone: true,
  imports: [CommonModule, RfToggleMenuComponent],
  template: `
    <div class="tp">
      <div class="tp-current">
        <button type="button" class="tp-toggle" (click)="toggle()">
          <ng-container *ngIf="hasSelection(); else placeholder">
            <span class="tp-sel">
              <ng-container *ngIf="showAsset() && assetnum">asset <strong>{{ assetnum }}</strong></ng-container>
              <ng-container *ngIf="showAsset() && showLocation() && assetnum && location"> · </ng-container>
              <ng-container *ngIf="showLocation() && location">location <strong>{{ location }}</strong></ng-container>
            </span>
          </ng-container>
          <ng-template #placeholder>
            <span class="tp-ph">Select a {{ noun() }} from the plant tree…</span>
          </ng-template>
          <span class="tp-chev">{{ open() ? '▲' : '▼' }}</span>
        </button>
        <button type="button" class="tp-clear" *ngIf="hasSelection()" (click)="clear()" title="Clear">✕</button>
      </div>

      <div class="tp-panel" *ngIf="open()">
        <div *ngIf="loading()" class="tp-hint">Loading plant tree…</div>
        <div *ngIf="error() as e" class="tp-err">Failed to load tree: {{ e }}</div>
        <div class="tp-tree" *ngIf="!loading() && !error()">
          <app-rf-toggle-menu
            [menuItems]="treeItems()"
            [caretToggleOnly]="true"
            [searchPlaceholder]="'Search ' + noun() + ' code…'"
            (itemClick)="onPick($event)">
          </app-rf-toggle-menu>
        </div>
        <div class="tp-note" *ngIf="!loading() && !error()">
          Use the arrow to open a group · click a {{ noun() }} to select it.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tp { position: relative; width: 100%; }
    .tp-current { display: flex; gap: 4px; align-items: stretch; }
    .tp-toggle {
      flex: 1; text-align: left; display: flex; align-items: center; justify-content: space-between; gap: 8px;
      background: #2a2a2a; color: #e6e6e6; border: 1px solid #444; border-radius: 3px; padding: 5px 8px;
      font: inherit; cursor: pointer;
    }
    .tp-toggle:hover { border-color: #666; background: #2a2a2a; }
    .tp-ph { color: #888; }
    .tp-sel strong { color: #7cc6ff; }
    .tp-chev { color: #888; font-size: 10px; flex-shrink: 0; }
    .tp-clear { background: #444; color: #ccc; border: 0; border-radius: 3px; padding: 0 8px; cursor: pointer; }
    .tp-clear:hover { background: #555; }
    .tp-panel {
      margin-top: 4px; border: 1px solid #444; border-radius: 4px; background: #1f1f1f; overflow: hidden;
    }
    .tp-hint, .tp-err { padding: 10px; }
    .tp-err { color: #ff7b72; }
    .tp-note { padding: 6px 10px; border-top: 1px solid #333; color: #888; font-size: 11px; }
    /* RfToggleMenu needs an explicit height (virtual scroll). */
    .tp-tree { height: 340px; display: flex; }
    .tp-tree app-rf-toggle-menu { flex: 1; }
  `],
})
export class MaximoLocationTreePickerComponent {
  private api = inject(PhysicalObjectApiService);

  /** Current SR target — shown in the collapsed summary (host keeps sr.assetnum / sr.location the truth).
   *  Accepts undefined so optional criteria fields ({@code criteria.assetnum?}) bind without a ?? '' coercion. */
  @Input() assetnum: string | undefined = '';
  @Input() location: string | undefined = '';
  /**
   * What a pick resolves to:
   *   - 'both' (default): one pick fills BOTH assetnum + location (equipment → both; location node → location only).
   *   - 'location': ANY node carrying a location (equipment OR location node) emits its location; assetnum stays empty.
   *   - 'asset': only equipment nodes are pickable; emits the asset (+ its location for reference).
   * Single-field modes let two independent pickers ('location' + 'asset') coexist without clearing each other.
   */
  @Input() mode: 'both' | 'location' | 'asset' = 'both';
  @Output() selection = new EventEmitter<MaximoTreeSelection>();

  open = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  treeItems = signal<NestedItem[]>([]);

  private byId = new Map<number, PhysicalObjectNode>();
  private loaded = false;

  toggle() {
    this.open.update(o => !o);
    if (this.open() && !this.loaded) this.loadTree();
  }

  async loadTree() {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Maximo-seeded hierarchy only — drop local (hand-built) nodes that carry no Maximo asset/location.
      const nodes = (await firstValueFrom(this.api.getTree())).filter(n => n.local !== true);
      this.byId = new Map(nodes.map(n => [n.id, n]));
      this.treeItems.set(this.buildTree(nodes));
      this.loaded = true;
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? String(e));
      this.treeItems.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Row-body click selects the node (caret-toggle mode means expansion is the caret's job, not this click).
   * An equipment node files against the asset + its location; a location node files against the location; an
   * organisational node with no Maximo code selects nothing (drill in via the caret).
   */
  onPick(item: NestedItem) {
    const node = this.byId.get(Number(item.id));
    if (!node) return;
    const asset = (node.maximoAssetnum ?? '').trim();
    const loc = (node.maximoLocation ?? '').trim();

    if (this.mode === 'location') {
      // Location-only picker: ANY node carrying a location (equipment OR location node) files against that
      // location; the asset is never emitted. A node with no location isn't a valid target here.
      if (!loc) return;
      this.assetnum = '';
      this.location = loc;
    } else if (this.mode === 'asset') {
      // Asset-only picker: only equipment nodes (which carry an assetnum) are pickable; keep the location for
      // reference. A location/organisational node has no assetnum → nothing to file against.
      if (!asset) return;
      this.assetnum = asset;
      this.location = loc;
    } else if (asset) {
      // 'both': asset/equipment node → file against the asset AND its location.
      this.assetnum = asset;
      this.location = loc;
    } else if (loc) {
      // 'both': location node → file against the location; clear the asset (broader-but-right beats precise-but-wrong).
      this.assetnum = '';
      this.location = loc;
    } else {
      // Organizational node with neither code — clicking just expands/collapses it; nothing to file against.
      return;
    }
    this.selection.emit({ assetnum: this.assetnum ?? '', location: this.location ?? '' });
    this.open.set(false);
  }

  /** Noun used in the placeholder / summary / search hint — reflects what this instance can pick. */
  noun(): string {
    return this.mode === 'location' ? 'location' : this.mode === 'asset' ? 'asset' : 'location or asset';
  }
  /** Whether the asset half is shown in the collapsed summary (hidden in location-only mode). */
  showAsset(): boolean { return this.mode !== 'location'; }
  /** Whether the location half is shown in the collapsed summary (hidden in asset-only mode). */
  showLocation(): boolean { return this.mode !== 'asset'; }
  /** Whether there's a value to show (vs. the placeholder), scoped to this mode's field(s). */
  hasSelection(): boolean {
    if (this.mode === 'location') return !!this.location;
    if (this.mode === 'asset') return !!this.assetnum;
    return !!(this.assetnum || this.location);
  }

  clear() {
    this.assetnum = '';
    this.location = '';
    this.selection.emit({ assetnum: '', location: '' });
  }

  private buildTree(nodes: PhysicalObjectNode[]): NestedItem[] {
    const byParent = new Map<number | null, PhysicalObjectNode[]>();
    for (const n of nodes) {
      const key = n.parentId ?? null;
      const arr = byParent.get(key) ?? [];
      arr.push(n);
      byParent.set(key, arr);
    }
    const make = (n: PhysicalObjectNode): NestedItem => ({
      id: n.id,
      name: n.name || n.tagNumber || n.maximoLocation || `#${n.id}`,
      subtitle: this.subtitle(n),
      objectType: n.type || '',
      color: TYPE_COLORS[n.type || ''] || '#78909C',
      isExpanded: false,
      values: (byParent.get(n.id) ?? [])
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        .map(make),
    });
    return (byParent.get(null) ?? [])
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map(make);
  }

  private subtitle(n: PhysicalObjectNode): string {
    // buildTree deliberately puts the raw Maximo code into name/subtitle so RfToggleMenu's name+subtitle
    // client-side search matches on the raw asset/location code too.
    const code = n.maximoAssetnum || n.maximoLocation || n.tagNumber;
    return [code, n.type].filter(Boolean).join(' · ');
  }
}
