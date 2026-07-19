import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, of } from 'rxjs';
import {
  DriftService, DriftRecord, DriftScanState, ThreeWayFieldDiff,
} from '../../../services/drift.service';

interface DriftRow { id: number; hub?: DriftRecord; sp?: DriftRecord; }

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

  overview = signal<DriftScanState[]>([]);
  selectedType = signal<string | null>(null);
  records = signal<DriftRecord[]>([]);
  loadingRecords = signal(false);
  busy = signal(false);
  scanning = signal(false);
  lastScanAt = signal<string | null>(null);

  selected = signal<Set<number>>(new Set());

  compareId = signal<number | null>(null);
  diff = signal<ThreeWayFieldDiff | null>(null);
  diffLoading = signal(false);

  driftingTypes = computed(() =>
    this.overview().filter(o => o.flaggedCount > 0).sort((a, b) => b.flaggedCount - a.flaggedCount));
  cleanTypes = computed(() =>
    this.overview().filter(o => o.flaggedCount === 0 && o.lastScannedAt).sort((a, b) => a.entityType.localeCompare(b.entityType)));
  typesDrifting = computed(() => this.driftingTypes().length);
  totalDrift = computed(() => this.overview().reduce((s, o) => s + o.flaggedCount, 0));

  rows = computed<DriftRow[]>(() => {
    const byId = new Map<number, DriftRow>();
    for (const r of this.records()) {
      if (r.fieldName !== '_entity_') continue;
      const row = byId.get(r.entityId) ?? { id: r.entityId };
      if (r.peer === 'HUB') row.hub = r; else if (r.peer === 'SHAREPOINT') row.sp = r;
      byId.set(r.entityId, row);
    }
    return [...byId.values()];
  });
  allSelected = computed(() => this.rows().length > 0 && this.selected().size === this.rows().length);

  /** The drifted row currently open in the compare drawer — so the drawer can offer the same whole-row
   *  actions (Use Hub / Keep Local / Push) right next to the field diff, instead of forcing a blind choice. */
  compareRow = computed<DriftRow | null>(() => {
    const id = this.compareId();
    return id == null ? null : (this.rows().find(r => r.id === id) ?? null);
  });

  ngOnInit(): void { this.reloadOverview(); }

  private reloadOverview(): void {
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
    this.selected.set(new Set());
    this.closeCompare();
    this.loadRecords();
  }

  private loadRecords(): void {
    const t = this.selectedType(); if (!t) return;
    this.loadingRecords.set(true);
    this.drift.statusRecords(t).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(recs => { this.records.set(recs); this.loadingRecords.set(false); });
  }

  scanNow(): void {
    if (this.scanning()) return;
    const t = this.selectedType();
    this.scanning.set(true);
    (t ? this.drift.scanType(t) : this.drift.scanAll())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => { this.scanning.set(false); this.reloadOverview(); this.loadRecords(); });
  }

  // ---- selection ----
  toggle(id: number): void {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }
  isSel(id: number): boolean { return this.selected().has(id); }
  toggleAll(): void {
    this.selected.set(this.allSelected() ? new Set() : new Set(this.rows().map(r => r.id)));
  }

  // ---- reconcile (row + bulk) ----
  act(id: number, kind: 'hub' | 'local' | 'sp'): void { this.runReconcile([id], kind); }
  bulk(kind: 'hub' | 'local' | 'sp'): void { this.runReconcile([...this.selected()], kind); }

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
