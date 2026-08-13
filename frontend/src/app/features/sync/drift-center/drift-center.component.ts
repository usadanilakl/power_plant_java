import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import {
  DriftService, DriftRecord, DriftScanState, ThreeWayFieldDiff, ThreeWayFieldEntry,
  FileDriftReport, FileDriftEntry, FileDriftKind,
} from '../../../services/drift.service';
import { SyncStatusService } from '../../../services/sync-status.service';

interface DriftRow { id: number; hub?: DriftRecord; sp?: DriftRecord; }

/** The four buckets the breakdown strip counts — and now filters by. Mirrors the backend's
 *  DriftDetectionService.breakdown() keys so a chip's count and its filter can't diverge. */
export type DriftFilterKind = 'hubDiffers' | 'onHubNotLocal' | 'localNotOnHub' | 'sharePoint';

/**
 * Consolidated Drift Center (Sync Dashboard › Drift). One tool over the persisted hub + SharePoint drift:
 * SEE (overview by type) → drill into a type's drifted rows → COMPARE (3-way field diff) → ACCEPT (per
 * field / whole row / push-to-SP) → BULK. Replaces the scattered Compare / Audit / Verify panels.
 */
@Component({
  selector: 'app-drift-center',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drift-center.component.html',
  styleUrl: './drift-center.component.css',
})
export class DriftCenterComponent implements OnInit {
  private drift = inject(DriftService);
  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private syncStatus = inject(SyncStatusService);

  overview = signal<DriftScanState[]>([]);
  selectedType = signal<string | null>(null);
  records = signal<DriftRecord[]>([]);
  loadingRecords = signal(false);
  busy = signal(false);
  scanning = signal(false);
  lastScanAt = signal<string | null>(null);

  // Pending-backlog counts — restored from the retired Sync Overview tab. Sourced from SyncStatusService
  // (kept warm app-wide by the header sync-indicator); we also fetch once on init so they render now.
  outgoingPending = signal<number>(0);   // local FieldChanges not yet acked by the hub
  incomingPending = signal<number>(0);   // hub changes queued for this client, not yet pulled

  selected = signal<Set<number>>(new Set());
  /** entityId -> human label for the drifted rows (from the backend SyncLabelService). */
  labels = signal<Map<number, string>>(new Map());

  compareId = signal<number | null>(null);
  diff = signal<ThreeWayFieldDiff | null>(null);
  diffLoading = signal(false);

  driftingTypes = computed(() =>
    this.overview().filter(o => o.flaggedCount > 0).sort((a, b) => b.flaggedCount - a.flaggedCount));
  cleanTypes = computed(() =>
    this.overview().filter(o => o.flaggedCount === 0 && o.lastScannedAt).sort((a, b) => a.entityType.localeCompare(b.entityType)));
  typesDrifting = computed(() => this.driftingTypes().length);
  totalDrift = computed(() => this.overview().reduce((s, o) => s + o.flaggedCount, 0));
  /** Direction/peer breakdown of what's drifting (from the service signal). */
  breakdown = computed(() => this.drift.breakdown());

  /** Every drifted row of the selected type — the unfiltered set. Label loading and the chip counts read
   *  THIS, never the filtered view, so searching by name still works after a filter narrows the table. */
  allRows = computed<DriftRow[]>(() => {
    const byId = new Map<number, DriftRow>();
    for (const r of this.records()) {
      if (r.fieldName !== '_entity_') continue;
      const row = byId.get(r.entityId) ?? { id: r.entityId };
      if (r.peer === 'HUB') row.hub = r; else if (r.peer === 'SHAREPOINT') row.sp = r;
      byId.set(r.entityId, row);
    }
    return [...byId.values()];
  });

  /** Active breakdown filter (a clicked chip), or null for "everything". */
  kindFilter = signal<DriftFilterKind | null>(null);
  /** Free-text entity filter — matches the human label or the id. */
  search = signal('');

  /** What the table shows: breakdown chip AND search, intersected. */
  rows = computed<DriftRow[]>(() => {
    const kind = this.kindFilter();
    const q = this.search().trim().toLowerCase();
    return this.allRows().filter(r => this.matchesKind(r, kind) && this.matchesSearch(r, q));
  });

  /** Per-type counts for the chips. The /breakdown signal is GLOBAL (all types); when a type is selected
   *  the chip must show the number it will actually filter to, or clicking "1957" and getting 3 rows reads
   *  like a bug. The global number stays available in the chip's tooltip. */
  typeCounts = computed(() => {
    const c = { hubDiffers: 0, onHubNotLocal: 0, localNotOnHub: 0, sharePoint: 0 };
    for (const r of this.allRows()) {
      if (r.hub?.kind === 'DIFFERING') c.hubDiffers++;
      else if (r.hub?.kind === 'MISSING_LOCALLY') c.onHubNotLocal++;
      else if (r.hub?.kind === 'MISSING_ON_PEER') c.localNotOnHub++;
      if (r.sp) c.sharePoint++;
    }
    return c;
  });
  filtering = computed(() => this.kindFilter() !== null || this.search().trim() !== '');

  /** Selected rows that are actually VISIBLE. Bulk actions are scoped to these: acting on rows a filter
   *  has hidden would be a destructive surprise. */
  visibleSelected = computed(() => this.rows().filter(r => this.selected().has(r.id)).map(r => r.id));
  allSelected = computed(() => this.rows().length > 0 && this.visibleSelected().length === this.rows().length);

  /** The drifted row currently open in the compare drawer — so the drawer can offer the same whole-row
   *  actions (Use Hub / Keep Local / Push) right next to the field diff, instead of forcing a blind choice. */
  compareRow = computed<DriftRow | null>(() => {
    const id = this.compareId();
    // allRows, not rows: the drawer is about ONE row and must keep its actions even if the list filter
    // (or a search the user typed after opening it) no longer includes that row.
    return id == null ? null : (this.allRows().find(r => r.id === id) ?? null);
  });

  ngOnInit(): void {
    this.reloadOverview();
    // Restore the pending-backlog readout (from the retired Overview tab): subscribe to the shared
    // SyncStatusService streams (kept warm by the header sync-indicator) + fetch once so they show now.
    this.syncStatus.status$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => this.outgoingPending.set(s?.pendingServerChanges ?? 0));
    this.syncStatus.syncHealth$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(h => this.incomingPending.set(h?.serverPendingChangesForClient ?? 0));
    this.syncStatus.fetchStatus().subscribe();
    this.syncStatus.fetchSyncHealthCheck().subscribe();
    // Honour a ?type= deep-link (sync badge / Activity / in-table links) on first load AND on re-navigation
    // to an already-open Drift Center. The observable (not snapshot) fires again when only the query param
    // changes; it wins over reloadOverview's "auto-select first drifting type" fallback.
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((pm) => {
      const t = pm.get('type');
      if (t && t !== this.selectedType()) this.selectType(t);
    });
  }

  private reloadOverview(): void {
    this.drift.refreshBreakdown();
    this.drift.overview$().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(list => {
      this.overview.set(list);
      const latest = list.map(o => o.lastScannedAt).filter(Boolean).sort().pop();
      this.lastScanAt.set(latest ?? null);
      if (!this.selectedType() && this.driftingTypes().length) {
        this.selectType(this.driftingTypes()[0].entityType);
      }
    });
  }

  selectType(type: string): void {
    this.selectedType.set(type);
    this.filesMode.set(false); // picking an entity type leaves the file-content view
    this.selected.set(new Set());
    this.labels.set(new Map()); // ids are per-type — never carry labels across a type switch
    this.search.set('');        // a search term from the previous type is just noise here
    // The breakdown filter DOES persist: "show me everything that's on the hub but not here" is a
    // workflow you walk type by type, and the highlighted chip keeps it visible.

    this.closeCompare();
    this.loadRecords();
  }

  private loadRecords(): void {
    const t = this.selectedType(); if (!t) return;
    this.loadingRecords.set(true);
    this.drift.statusRecords(t).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(recs => {
        this.records.set(recs);
        this.loadingRecords.set(false);
        this.loadLabels(t);
      });
  }

  /** Resolve human labels for the drifted rows so the list reads "01-VCND100 · #123", not "#123".
   *  Mixed local/hub-only ids — the server resolves locally first and only asks the hub for the rest. */
  private loadLabels(type: string): void {
    // allRows, not rows: search matches on the label, so every row needs one even while a filter hides it.
    const ids = this.allRows().map(r => r.id).filter(id => !this.labels().has(id));
    if (!ids.length) return;
    this.drift.labels(type, ids).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(m => {
      this.labels.update(prev => { const n = new Map(prev); m.forEach((v, k) => n.set(k, v)); return n; });
    });
  }

  /** Human label for a drifted row; '' until it loads (the id is always shown next to it anyway). */
  label(id: number): string {
    const l = this.labels().get(id);
    return !l || l === '#' + id ? '' : l;
  }

  // ==================== File-content drift (the bytes channel) ====================
  // Entity drift compares ROWS; a FileObject row can be perfectly in sync while its PDF is missing from
  // disk, because bytes travel on a separate queue. This view is its own mode: on-demand scan, path-based
  // list, pull/push repair.

  filesMode = signal(false);
  fileReport = signal<FileDriftReport | null>(null);
  fileScanning = signal(false);
  fileBusy = signal(false);
  fileResult = signal('');
  fileKindFilter = signal<FileDriftKind | null>(null);
  fileSearch = signal('');
  fileSelected = signal<Set<string>>(new Set());

  fileRows = computed<FileDriftEntry[]>(() => {
    const all = this.fileReport()?.entries ?? [];
    const kind = this.fileKindFilter();
    const q = this.fileSearch().trim().toLowerCase();
    return all.filter(e =>
      (!kind || e.kind === kind) &&
      (!q || e.relativePath.toLowerCase().includes(q) || (e.label ?? '').toLowerCase().includes(q)));
  });
  fileAllSelected = computed(() =>
    this.fileRows().length > 0 && this.fileRows().every(e => this.fileSelected().has(e.relativePath)));
  /** Visible + selected only — bulk repair must never touch rows a filter is hiding. */
  fileVisibleSelected = computed(() =>
    this.fileRows().filter(e => this.fileSelected().has(e.relativePath)).map(e => e.relativePath));
  /**
   * A repair direction is offered only where it's meaningful: you can push anything that EXISTS locally
   * and pull anything that exists ON THE HUB. SIZE_DIFFERS qualifies for both on purpose — a size
   * mismatch doesn't say which side is right, so forcing "download" would silently make the hub the
   * winner and could overwrite a locally-correct file.
   */
  filePushable = computed(() =>
    this.fileRows().filter(e => e.kind !== 'MISSING_LOCALLY' && this.fileSelected().has(e.relativePath))
      .map(e => e.relativePath));
  filePullable = computed(() =>
    this.fileRows().filter(e => e.kind !== 'MISSING_ON_HUB' && this.fileSelected().has(e.relativePath))
      .map(e => e.relativePath));

  openFiles(): void {
    this.filesMode.set(true);
    this.closeCompare();
    if (!this.fileReport()) this.scanFiles();
  }
  closeFiles(): void { this.filesMode.set(false); }

  scanFiles(): void {
    if (this.fileScanning()) return;
    this.fileScanning.set(true);
    this.fileResult.set('');
    this.drift.scanFiles().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      this.fileReport.set(r);
      this.fileScanning.set(false);
      this.fileSelected.set(new Set());
    });
  }

  fileFilterBy(kind: FileDriftKind): void {
    this.fileKindFilter.set(this.fileKindFilter() === kind ? null : kind);
  }
  onFileSearch(v: string): void { this.fileSearch.set(v); }
  fileToggle(path: string): void {
    const s = new Set(this.fileSelected());
    s.has(path) ? s.delete(path) : s.add(path);
    this.fileSelected.set(s);
  }
  fileIsSel(path: string): boolean { return this.fileSelected().has(path); }
  fileToggleAll(): void {
    const visible = this.fileRows().map(e => e.relativePath);
    if (this.fileAllSelected()) {
      this.fileSelected.update(s => new Set([...s].filter(p => !visible.includes(p))));
    } else {
      this.fileSelected.update(s => new Set([...s, ...visible]));
    }
  }

  /** Pull from the hub — synchronous, so a re-scan right after gives a truthful result. */
  pullFiles(paths: string[]): void {
    if (!paths.length || this.fileBusy()) return;
    this.fileBusy.set(true);
    this.drift.pullFiles(paths).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      this.fileBusy.set(false);
      this.fileResult.set(r?.message ?? 'Pull failed');
      this.scanFiles();
    });
  }

  /**
   * Push local-only files up. The upload goes through the existing durable queue, so it completes in the
   * BACKGROUND — we deliberately do NOT re-scan straight away, because the bytes won't be on the hub yet
   * and an immediate re-scan would still show the file as drifting and read like the repair failed.
   */
  pushFiles(paths: string[]): void {
    if (!paths.length || this.fileBusy()) return;
    this.fileBusy.set(true);
    this.drift.pushFiles(paths).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(r => {
      this.fileBusy.set(false);
      this.fileResult.set(r?.message ?? 'Push failed');
      this.fileSelected.set(new Set());
    });
  }

  fileKindText(k: FileDriftKind): string {
    return k === 'MISSING_LOCALLY' ? 'on hub, not here'
      : k === 'MISSING_ON_HUB' ? 'here, not on hub' : 'size differs';
  }
  /** Human file size; '—' when that side doesn't have the file at all. */
  size(bytes?: number): string {
    if (bytes == null) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  /** Diff-cell rendering — delegated so the drawer and the in-form popovers read identically. */
  cellText(f: ThreeWayFieldEntry, side: 'local' | 'hub'): string { return this.drift.valueText(f, side); }
  cellRaw(f: ThreeWayFieldEntry, side: 'local' | 'hub'): string { return this.drift.valueRaw(f, side); }

  scanNow(): void {
    if (this.scanning()) return;
    const t = this.selectedType();
    this.scanning.set(true);
    (t ? this.drift.scanType(t) : this.drift.scanAll())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.scanning.set(false); this.reloadOverview(); this.loadRecords(); });
  }

  // ---- filters ----

  /** Click a breakdown chip to show only that group; click the active one again to clear. */
  filterBy(kind: DriftFilterKind): void {
    this.kindFilter.set(this.kindFilter() === kind ? null : kind);
    this.closeCompare(); // the open row may no longer be in view
  }
  onSearch(value: string): void { this.search.set(value); }
  clearFilters(): void { this.kindFilter.set(null); this.search.set(''); }

  /** Does a row belong to the given breakdown bucket? Same mapping as the backend's breakdown(): a row
   *  that drifts on BOTH peers counts under its hub kind AND under SharePoint. */
  private matchesKind(r: DriftRow, kind: DriftFilterKind | null): boolean {
    if (!kind) return true;
    switch (kind) {
      case 'hubDiffers': return r.hub?.kind === 'DIFFERING';
      case 'onHubNotLocal': return r.hub?.kind === 'MISSING_LOCALLY';
      case 'localNotOnHub': return r.hub?.kind === 'MISSING_ON_PEER';
      case 'sharePoint': return !!r.sp;
    }
  }

  /** Match on the human label or the id — "vcnd100", "#123" and "123" all find the row. */
  private matchesSearch(r: DriftRow, q: string): boolean {
    if (!q) return true;
    const needle = q.startsWith('#') ? q.slice(1) : q;
    if (String(r.id).includes(needle)) return true;
    return (this.labels().get(r.id) ?? '').toLowerCase().includes(q);
  }

  // ---- selection ----
  toggle(id: number): void {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }
  isSel(id: number): boolean { return this.selected().has(id); }
  toggleAll(): void {
    // Scoped to the filtered view — "select all" must never reach rows the user can't see.
    if (this.allSelected()) {
      const visible = new Set(this.rows().map(r => r.id));
      this.selected.update(s => new Set([...s].filter(id => !visible.has(id))));
    } else {
      this.selected.update(s => new Set([...s, ...this.rows().map(r => r.id)]));
    }
  }

  // ---- reconcile (row + bulk) ----
  act(id: number, kind: 'hub' | 'local' | 'sp'): void { this.runReconcile([id], kind); }
  /** Bulk acts on the VISIBLE selection only — see {@link visibleSelected}. */
  bulk(kind: 'hub' | 'local' | 'sp'): void { this.runReconcile(this.visibleSelected(), kind); }

  ackRow(row: DriftRow): void { this.runAck([row.hub?.id, row.sp?.id]); }
  bulkAck(): void {
    const ids: (number | undefined)[] = [];
    for (const r of this.rows()) if (this.selected().has(r.id)) { ids.push(r.hub?.id, r.sp?.id); }
    this.runAck(ids);
  }

  private runReconcile(ids: number[], kind: 'hub' | 'local' | 'sp'): void {
    const t = this.selectedType();
    if (!t || !ids.length || this.busy()) return;
    this.busy.set(true);
    const calls = ids.map(id => kind === 'hub' ? this.drift.acceptHub(t, id)
      : kind === 'local' ? this.drift.keepLocal(t, id) : this.drift.pushToSp(t, id));
    forkJoin(calls).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.drift.scanType(t).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.busy.set(false); this.selected.set(new Set()); this.reloadOverview(); this.loadRecords();
      });
    });
  }
  private runAck(recordIds: (number | undefined)[]): void {
    const ids = recordIds.filter((x): x is number => x != null);
    if (!ids.length || this.busy()) return;
    this.busy.set(true);
    forkJoin(ids.map(id => this.drift.acknowledge(id))).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.busy.set(false); this.selected.set(new Set()); this.loadRecords(); });
  }

  // ---- compare drawer ----
  openCompare(id: number): void {
    const t = this.selectedType(); if (!t) return;
    this.compareId.set(id); this.diff.set(null); this.diffLoading.set(true);
    this.drift.fieldDiff(t, id).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => { this.diff.set(d); this.diffLoading.set(false); });
  }
  closeCompare(): void { this.compareId.set(null); this.diff.set(null); }
  acceptField(field: string, source: 'hub' | 'local'): void {
    const t = this.selectedType(); const id = this.compareId();
    if (!t || id == null || this.busy()) return;
    this.busy.set(true);
    this.drift.acceptField(t, id, field, source).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.drift.scanType(t).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.busy.set(false); this.openCompare(id); this.reloadOverview(); this.loadRecords();
      });
    });
  }

  /** A row is still "flagged" if either peer's record is FLAGGED; else it's been acknowledged. */
  rowFlagged(row: DriftRow): boolean {
    return row.hub?.status === 'FLAGGED' || row.sp?.status === 'FLAGGED';
  }

  kindText(r?: DriftRecord): string {
    if (!r) return '';
    return r.kind === 'DIFFERING' ? 'differs' : r.kind === 'MISSING_LOCALLY' ? 'on peer, not here' : 'missing on peer';
  }
  fmt(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso); const s = Math.round((Date.now() - d.getTime()) / 1000);
    if (s < 60) return s + 's ago';
    if (s < 3600) return Math.round(s / 60) + 'm ago';
    return Math.round(s / 3600) + 'h ago';
  }
}
