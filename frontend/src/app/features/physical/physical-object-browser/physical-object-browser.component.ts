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
  LinkedFile,
  NodeWriteRequest,
  PhysicalObjectMaximoTab,
  PhysicalObjectNode,
  PhysicalObjectSeedResult,
  TagMatchProbe,
} from '../../../models/physical/physical-object.models';
import { environment } from '../../../../environments/environment';
import { RfFileApiService } from '../../files/refactored/services/rf-file-api.service';
import { FileDto } from '../../../models/file/file.model';

/** Colors per hierarchy level for the tree dots. */
const TYPE_COLORS: Record<string, string> = {
  PLANT: '#26C6DA', SECTION: '#42A5F5', SYSTEM: '#66BB6A',
  SKID: '#FFA726', EQUIPMENT: '#AB47BC', LOCATION: '#8D6E63',
};
const TYPE_OPTIONS = ['PLANT', 'SECTION', 'SYSTEM', 'SKID', 'EQUIPMENT', 'LOCATION'];

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
  private filesApi = inject(RfFileApiService);

  readonly typeOptions = TYPE_OPTIONS;
  readonly apiBase = environment.baseApiUrl;

  // edit form (populated on select)
  editName = ''; editType = ''; editTag = ''; editDesc = ''; editLoc = '';
  savingEdit = signal(false);

  // documents (linked files) + file search
  files = signal<LinkedFile[]>([]);
  filesLoading = signal(false);
  fileQuery = '';
  fileResults = signal<FileDto[]>([]);
  fileSearching = signal(false);

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
      // Binder mode: this browser is the Maximo-seeded location hierarchy only; hand-built (local) nodes live
      // on the plant map. `!== true` is transition-safe (an old backend without `local` shows everything).
      const nodes = (await firstValueFrom(this.api.getTree())).filter(n => n.local !== true);
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
    this.populateEdit(node);
    this.loadFiles(node.id);
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

  // ── edit ──
  private populateEdit(n: PhysicalObjectNode) {
    this.editName = n.name ?? '';
    this.editType = n.type ?? '';
    this.editTag = n.tagNumber ?? '';
    this.editDesc = n.description ?? '';
    this.editLoc = n.specificLocation ?? '';
    this.fileResults.set([]); this.fileQuery = '';
  }

  async saveEdit() {
    const n = this.selected();
    if (!n) return;
    this.savingEdit.set(true); this.error.set(null);
    try {
      // blank = leave unchanged (matches the PATCH contract) — never silently wipe a field on save.
      const body: NodeWriteRequest = {
        name: this.editName.trim() || undefined,
        type: this.editType || undefined,
        tagNumber: this.editTag.trim() || undefined,
        description: this.editDesc.trim() || undefined,
        specificLocation: this.editLoc.trim() || undefined,
      };
      const updated = await firstValueFrom(this.api.updateNode(n.id, body));
      if (updated) {
        this.selected.set(updated);
        this.byId.set(updated.id, updated);
        await this.loadTree();
      }
    } catch (e: any) {
      this.error.set(this.msg(e));
    } finally {
      this.savingEdit.set(false);
    }
  }

  // ── documents (linked files) ──
  private async loadFiles(nodeId: number) {
    this.filesLoading.set(true);
    try { this.files.set(await firstValueFrom(this.api.getNodeFiles(nodeId))); }
    catch { this.files.set([]); }
    finally { this.filesLoading.set(false); }
  }

  async searchFiles() {
    if (!this.fileQuery.trim()) { this.fileResults.set([]); return; }
    this.fileSearching.set(true);
    try {
      const page = await firstValueFrom(
        this.filesApi.searchFiles({ type: 'global', query: this.fileQuery.trim(), page: 1 }, 20));
      this.fileResults.set((page?.responseData?.content ?? []).map(f => FileDto.fromJson(f)));
    } catch { this.fileResults.set([]); }
    finally { this.fileSearching.set(false); }
  }

  async linkFile(f: FileDto) {
    const n = this.selected();
    if (!n) return;
    try {
      await firstValueFrom(this.api.linkFile(n.id, f.id));
      this.fileResults.set([]); this.fileQuery = '';
      await this.loadFiles(n.id);
    } catch (e: any) { this.error.set(this.msg(e)); }
  }

  async unlinkFile(file: LinkedFile) {
    const n = this.selected();
    if (!n) return;
    try { await firstValueFrom(this.api.unlinkFile(n.id, file.id)); await this.loadFiles(n.id); }
    catch (e: any) { this.error.set(this.msg(e)); }
  }

  openFile(file: LinkedFile) {
    if (file.fileLink) window.open(`${this.apiBase}/${file.fileLink}`, '_blank');
  }

  fileLabel(f: FileDto): string {
    const num = Array.isArray(f.fileNumber) ? f.fileNumber.join(' ') : ((f as any).fileNumber ?? '');
    return [f.name, num].filter(Boolean).join(' · ') || `#${f.id}`;
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
