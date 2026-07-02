import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { RfToggleMenuComponent } from '../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { MaximoTableComponent } from '../../maximo/maximo-table/maximo-table.component';
import { WO_COLUMNS, SR_COLUMNS } from '../../maximo/maximo-table-configs';
import { NestedItem } from '../../../models/ui/nested-item.model';
import { PhysicalObjectApiService } from '../../../services/physical/physical-object-api.service';
import {
  PhysicalObjectMaximoTab,
  PhysicalObjectNode,
  PhysicalObjectSeedResult,
  TagMatchProbe,
} from '../../../models/physical/physical-object.models';

/** Colors per hierarchy level for the tree dots. */
const TYPE_COLORS: Record<string, string> = {
  PLANT: '#26C6DA', SECTION: '#42A5F5', SYSTEM: '#66BB6A',
  SKID: '#FFA726', EQUIPMENT: '#AB47BC', LOCATION: '#8D6E63',
};

/**
 * Read-only browser for the Maximo-seeded PhysicalObject tree (Slice 1). Left: the hierarchy via the shared
 * RfToggleMenuComponent. Right: the selected node's identity + its Maximo tab (work orders + service requests
 * for the node's asset/location link). "Reseed from Maximo" (re)builds the tree. Touches nothing else in the app.
 */
@Component({
  selector: 'app-physical-object-browser',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, RfToggleMenuComponent, MaximoTableComponent],
  templateUrl: './physical-object-browser.component.html',
  styleUrl: './physical-object-browser.component.css',
})
export class PhysicalObjectBrowserComponent {
  private api = inject(PhysicalObjectApiService);

  readonly woColumns = WO_COLUMNS;
  readonly srColumns = SR_COLUMNS;

  private byId = new Map<number, PhysicalObjectNode>();
  treeItems = signal<NestedItem[]>([]);
  nodeCount = signal(0);
  loading = signal(false);
  error = signal<string | null>(null);

  selected = signal<PhysicalObjectNode | null>(null);
  tab = signal<PhysicalObjectMaximoTab | null>(null);
  tabLoading = signal(false);
  tabError = signal<string | null>(null);

  siteId = '';
  seeding = signal(false);
  seedError = signal<string | null>(null);
  seedResult = signal<PhysicalObjectSeedResult | null>(null);

  probing = signal(false);
  probe = signal<TagMatchProbe | null>(null);

  constructor() {
    this.loadTree();
  }

  async runProbe() {
    this.probing.set(true);
    try {
      this.probe.set(await firstValueFrom(this.api.tagMatchProbe()));
    } catch {
      this.probe.set(null);
    } finally {
      this.probing.set(false);
    }
  }

  pct(matched: number, total: number): number {
    return total > 0 ? Math.round((matched / total) * 100) : 0;
  }

  async loadTree() {
    this.loading.set(true); this.error.set(null);
    try {
      const nodes = await firstValueFrom(this.api.getTree());
      this.byId = new Map(nodes.map(n => [n.id, n]));
      this.nodeCount.set(nodes.length);
      this.treeItems.set(this.buildTree(nodes));
    } catch (e: any) {
      this.error.set(this.msg(e)); this.treeItems.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  onSelect(item: NestedItem) {
    const node = this.byId.get(Number(item.id));
    if (!node) return;
    this.selected.set(node);
    this.tab.set(null); this.tabError.set(null);
    if (node.maximoAssetnum || node.maximoLocation) {
      this.tabLoading.set(true);
      firstValueFrom(this.api.getMaximoTab(node.id))
        .then(t => this.tab.set(t))
        .catch(e => this.tabError.set(this.msg(e)))
        .finally(() => this.tabLoading.set(false));
    }
  }

  async reseed() {
    this.seeding.set(true); this.seedError.set(null);
    try {
      this.seedResult.set(await firstValueFrom(this.api.reseed(this.siteId.trim() || undefined)));
      await this.loadTree();
    } catch (e: any) {
      this.seedError.set(this.msg(e));
    } finally {
      this.seeding.set(false);
    }
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
    const code = n.maximoAssetnum || n.maximoLocation || n.tagNumber;
    return [code, n.type].filter(Boolean).join(' · ');
  }

  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
