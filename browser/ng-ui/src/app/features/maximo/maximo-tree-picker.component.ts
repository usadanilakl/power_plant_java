import { Component, EventEmitter, Output, computed, inject, input, signal } from '@angular/core';
import { MaximoApiService } from './maximo-api.service';
import { PhysicalObjectNode } from './maximo.model';
import { TreeMenuComponent } from '../../shared/tree-menu/tree-menu.component';
import { NestedItem } from '../../shared/tree-menu/nested-item.model';

/** One color per hierarchy level for the tree dots — mirrors the desktop plant-hierarchy palette. */
const TYPE_COLORS: Record<string, string> = {
  PLANT: '#26C6DA', SECTION: '#42A5F5', SYSTEM: '#66BB6A',
  SKID: '#FFA726', EQUIPMENT: '#AB47BC', LOCATION: '#8D6E63',
};

/**
 * Reusable Maximo plant-tree picker for the PWA. Wraps the shared {@link TreeMenuComponent} over the
 * Maximo-seeded PhysicalObject hierarchy (loaded lazily on first open) and emits the picked asset/location.
 *
 * `mode` shapes what a row selects:
 *  - `both`     — equipment → {assetnum, its location}; location node → {'', location}; org node → ignored.
 *  - `location` — any node carrying a Maximo location → {'', location}; else ignored.
 *  - `asset`    — equipment (has an assetnum) → {assetnum, its location}; else ignored.
 *
 * The tree is Maximo-SEEDED (not live), so a brand-new code may not be present yet — HOSTS keep their own
 * "type manually" free-text escape hatch (this component intentionally has none), matching the desktop
 * `app-maximo-location-tree-picker`.
 */
@Component({
  selector: 'app-maximo-tree-picker',
  standalone: true,
  imports: [TreeMenuComponent],
  template: `
    @if (assetnum() || location()) {
      <p class="tp-picked">
        @if (mode() !== 'location' && assetnum()) { Asset: <b>{{ assetnum() }}</b> }
        @if (mode() !== 'location' && assetnum() && location()) { · }
        @if (location()) { Location: <b>{{ location() }}</b> }
        <button type="button" class="tp-clear" (click)="clear()">clear</button>
      </p>
    }
    <button type="button" class="tp-toggle" (click)="toggleTree()">
      {{ treeOpen() ? 'Hide plant tree ▲' : 'Browse plant tree ▼' }}
    </button>
    @if (treeOpen()) {
      @if (treeLoading()) { <p class="tp-hint">Loading plant tree…</p> }
      @else if (treeError()) { <p class="tp-err">{{ treeError() }}</p> }
      @else {
        <div class="tp-host">
          <app-tree-menu [menuItems]="treeItems()" [searchPlaceholder]="searchPlaceholder()"
                         (itemClick)="onSelect($event)"></app-tree-menu>
        </div>
        <p class="tp-hint">{{ hint() }}</p>
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .tp-picked { font-size: 0.85rem; color: var(--primary-text); margin: -0.2rem 0 0.6rem; }
    .tp-clear { background: none; border: none; color: var(--accent-color); font-size: 0.78rem; cursor: pointer; font-family: inherit; }
    .tp-toggle { width: 100%; text-align: left; background: var(--secondary-background); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.6rem 0.7rem; font-size: 0.9rem; color: var(--primary-text); cursor: pointer; font-family: inherit; margin-bottom: 0.5rem; }
    .tp-host { height: 320px; border: 1px solid var(--border-color); border-radius: 10px; overflow: hidden; margin-bottom: 0.6rem; }
    .tp-hint { font-size: 0.85rem; color: var(--secondary-text, #888); margin: 0 0 0.6rem; }
    .tp-err { color: #e74c3c; font-size: 0.85rem; margin: 0 0 0.6rem; }
  `]
})
export class MaximoTreePickerComponent {
  private api = inject(MaximoApiService);

  mode = input<'both' | 'location' | 'asset'>('both');
  assetnum = input<string>('');
  location = input<string>('');

  @Output() selection = new EventEmitter<{ assetnum: string; location: string }>();

  treeOpen = signal(false);
  treeLoading = signal(false);
  treeError = signal<string | null>(null);
  treeItems = signal<NestedItem[]>([]);
  private byId = new Map<number, PhysicalObjectNode>();
  private treeLoaded = false;

  searchPlaceholder = computed(() => {
    switch (this.mode()) {
      case 'location': return 'Search a location…';
      case 'asset': return 'Search an asset…';
      default: return 'Search location or asset…';
    }
  });

  hint = computed(() => {
    const what = this.mode() === 'location' ? 'a location'
      : this.mode() === 'asset' ? 'an asset' : 'a location or asset';
    return `Tap the arrow to open a group · tap ${what} to select it. Not here? Use "type manually".`;
  });

  toggleTree(): void {
    this.treeOpen.update(v => !v);
    if (this.treeOpen() && !this.treeLoaded) this.loadTree();
  }

  private loadTree(): void {
    this.treeLoading.set(true);
    this.treeError.set(null);
    this.api.getPhysicalObjectTree().subscribe({
      next: nodes => {
        // Maximo-seeded hierarchy only — drop local (hand-built) nodes with no Maximo asset/location.
        const filtered = nodes.filter(n => n.local !== true);
        this.byId = new Map(filtered.map(n => [n.id, n]));
        this.treeItems.set(this.buildTree(filtered));
        this.treeLoaded = true;
        this.treeLoading.set(false);
      },
      error: e => {
        this.treeError.set(e?.error?.message || e?.message || 'Failed to load plant tree');
        this.treeLoading.set(false);
      },
    });
  }

  /** Row-body tap selects (the tree's left caret handles expand/collapse). Selection respects `mode`. */
  onSelect(item: NestedItem): void {
    const node = this.byId.get(Number(item.id));
    if (!node) return;
    const asset = (node.maximoAssetnum ?? '').trim();
    const loc = (node.maximoLocation ?? '').trim();
    switch (this.mode()) {
      case 'location':
        if (loc) this.emit('', loc);
        break;
      case 'asset':
        if (asset) this.emit(asset, loc);
        break;
      default: // 'both'
        if (asset) this.emit(asset, loc);
        else if (loc) this.emit('', loc);
    }
  }

  clear(): void { this.selection.emit({ assetnum: '', location: '' }); }

  private emit(assetnum: string, location: string): void {
    this.selection.emit({ assetnum, location });
    this.treeOpen.set(false);
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
      subtitle: this.nodeSubtitle(n),
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

  private nodeSubtitle(n: PhysicalObjectNode): string {
    // Put the raw Maximo code in the subtitle so the tree's name+subtitle search matches on it.
    const code = n.maximoAssetnum || n.maximoLocation || n.tagNumber;
    return [code, n.type].filter(Boolean).join(' · ');
  }
}
