import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RfFloatingWindowComponent } from '../../rf-floating-window/rf-floating-window.component';
import { LotoDto } from '../../../models/loto/loto.model';
import { LotoSnapshotDto, PointPrerequisiteDto } from '../../../models/loto/loto-snapshot.model';
import { LotoService } from '../../../services/loto/loto.service';

export type GuidedProcedureMode = 'HANG' | 'VERIFY' | 'WALKDOWN';

interface RowState {
  pointId: number;
  tagNumber: string;
  description: string;
  predecessors: { id: number; tag: string; satisfied: boolean }[];
  safetyConditions: string[];
  installRefNotes: string;
  done: boolean;
  doneBy: string | null;
  doneAt: string | null;
  storedNotes: string;
}

@Component({
  selector: 'app-guided-procedure-window',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, RfFloatingWindowComponent],
  template: `
    <app-rf-floating-window
      [windowId]="'guided-procedure-' + mode()"
      [initialPosition]="{ x: 200, y: 80 }"
      [initialSize]="{ width: 1100, height: 720 }"
      [minSize]="{ width: 720, height: 480 }"
      [headerClass]="headerClass()"
      (closed)="closed.emit()">

      <div window-header class="gpw-header">
        <mat-icon>{{ headerIcon() }}</mat-icon>
        <strong>{{ headerTitle() }}</strong>
        <span class="spacer"></span>
        <span class="progress">{{ progressText() }}</span>
        <button mat-icon-button (click)="closed.emit()" title="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="gpw-body">
        @if (!mutable()) {
          <div class="banner banner-locked">
            <mat-icon>lock</mat-icon>
            Active LOTO — go through Modify to make changes.
          </div>
        }
        @if (mode() === 'VERIFY' && !allHung()) {
          <div class="banner banner-warn">
            <mat-icon>warning</mat-icon>
            Verify is unavailable until every point has been hung.
          </div>
        }
        @if (mode() === 'WALKDOWN' && !allVerified()) {
          <div class="banner banner-warn">
            <mat-icon>warning</mat-icon>
            Walkdown is unavailable until every point has been verified.
          </div>
        }

        <table class="gpw-table">
          <thead>
            <tr>
              <th style="width: 9%">Tag #</th>
              <th style="width: 16%">Description</th>
              <th style="width: 14%">Predecessors</th>
              <th style="width: 18%">Safety conditions</th>
              <th style="width: 14%">Install ref. notes</th>
              <th style="width: 17%">Notes for this step</th>
              <th style="width: 12%">Status</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows(); track row.pointId) {
              <tr [class.done]="row.done" [class.blocked]="!row.done && !predecessorsSatisfied(row)">
                <td>{{ row.tagNumber }}</td>
                <td>{{ row.description }}</td>
                <td>
                  @if (row.predecessors.length === 0) {
                    <span class="muted">—</span>
                  } @else {
                    @for (p of row.predecessors; track p.id) {
                      <div class="pred" [class.sat]="p.satisfied">
                        {{ p.satisfied ? '✓' : '⏸' }} {{ p.tag }}
                      </div>
                    }
                  }
                </td>
                <td>
                  @if (mode() === 'WALKDOWN') {
                    @if (row.safetyConditions.length === 0) {
                      <span class="muted">—</span>
                    } @else {
                      @for (c of row.safetyConditions; track c) {
                        <div class="cond ref">· {{ c }}</div>
                      }
                    }
                  } @else {
                    @if (row.safetyConditions.length === 0) {
                      <span class="muted">—</span>
                    } @else {
                      @for (c of row.safetyConditions; track c) {
                        <label class="cond-row">
                          <input type="checkbox"
                                 [disabled]="row.done || !mutable()"
                                 [checked]="condAcked(row.pointId, c)"
                                 (change)="toggleCond(row.pointId, c)">
                          <span>{{ c }}</span>
                        </label>
                      }
                    }
                  }
                </td>
                <td>
                  <div class="ref-notes">{{ row.installRefNotes || '—' }}</div>
                </td>
                <td>
                  <textarea class="notes-input"
                            [disabled]="!mutable() || (mode() === 'VERIFY' && !allHung()) || (mode() === 'WALKDOWN' && !allVerified())"
                            [ngModel]="notesDraft(row.pointId)"
                            (ngModelChange)="setNotesDraft(row.pointId, $event)"
                            [placeholder]="row.done ? row.storedNotes || '(no notes)' : 'Optional notes…'"></textarea>
                </td>
                <td>
                  @if (row.done) {
                    <div class="status-done">
                      <strong>✓ {{ row.doneBy }}</strong>
                      <span class="t">{{ formatTime(row.doneAt) }}</span>
                      @if (mutable()) {
                        <button mat-stroked-button class="undo" (click)="undo(row)">Undo</button>
                      }
                    </div>
                  } @else {
                    <button mat-raised-button color="primary"
                            [disabled]="!canAct(row)"
                            (click)="act(row)">
                      {{ actionLabel() }}
                    </button>
                    @if (!canAct(row)) {
                      <div class="hint muted">{{ blockHint(row) }}</div>
                    }
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (rows().length === 0) {
          <p class="empty">No LOTO points on this permit.</p>
        }
      </div>
    </app-rf-floating-window>
  `,
  styles: [`
    .gpw-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; user-select: none; }
    .gpw-header .spacer { flex: 1; }
    .gpw-header .progress { color: rgba(255, 255, 255, 0.85); font-size: 13px; }
    .gpw-header.hang { background: linear-gradient(90deg, #c62828, #b71c1c); color: white; }
    .gpw-header.verify { background: linear-gradient(90deg, #1565c0, #0d47a1); color: white; }
    .gpw-header.walkdown { background: linear-gradient(90deg, #2e7d32, #1b5e20); color: white; }
    .gpw-body { padding: 12px 16px; height: 100%; overflow: auto; box-sizing: border-box; }
    .banner { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 13px; }
    .banner-locked { background: #2a1a1a; border: 1px solid #c62828; color: #ffab91; }
    .banner-warn { background: #2a221a; border: 1px solid #f9a825; color: #ffe082; }
    .gpw-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .gpw-table th, .gpw-table td { padding: 8px; text-align: left; border-bottom: 1px solid #2a2a2a; vertical-align: top; }
    .gpw-table th { color: #aaa; font-weight: 500; background: #181818; position: sticky; top: 0; }
    .gpw-table tr.done { background: rgba(46, 125, 50, 0.06); }
    .gpw-table tr.blocked { background: rgba(198, 40, 40, 0.05); }
    .pred { font-size: 12px; color: #888; }
    .pred.sat { color: #66bb6a; }
    .cond-row { display: flex; gap: 6px; align-items: center; font-size: 12px; padding: 2px 0; }
    .cond.ref { font-size: 12px; color: #888; padding: 2px 0; }
    .ref-notes { white-space: pre-wrap; color: #aaa; font-size: 12px; }
    .notes-input { width: 100%; min-height: 64px; resize: vertical; background: #1a1a1a; color: #ddd; border: 1px solid #333; border-radius: 4px; padding: 4px 6px; font-family: inherit; font-size: 12px; }
    .status-done { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; font-size: 12px; }
    .status-done .t { color: #888; }
    .undo { font-size: 11px; padding: 0 8px !important; min-height: 24px !important; line-height: 24px !important; }
    .hint { font-size: 11px; margin-top: 4px; max-width: 140px; }
    .muted { color: #666; font-style: italic; }
    .empty { color: #888; font-style: italic; padding: 20px; text-align: center; }
  `],
})
export class GuidedProcedureWindowComponent {
  private lotoService = inject(LotoService);

  loto = input.required<LotoDto>();
  mode = input.required<GuidedProcedureMode>();
  prereqsOverride = input<Record<number, PointPrerequisiteDto> | null>(null);

  closed = output<void>();
  lotoChanged = output<LotoDto>();

  // Local UI state — per-point ack-conditions + notes drafts.
  private acked = signal<Record<number, Set<string>>>({});
  private notes = signal<Record<number, string>>({});

  constructor() {
    // Reset per-point drafts whenever the loto identity changes.
    effect(() => {
      const id = this.loto()?.id ?? null;
      // Read id only — runs once per id change. Don't touch acked/notes signals here.
      void id;
      this.acked.set({});
      this.notes.set({});
    }, { allowSignalWrites: true });
  }

  private latestSnapshot = computed<LotoSnapshotDto | null>(() => {
    const snaps = this.loto().snapshots ?? [];
    if (snaps.length === 0) return null;
    return [...snaps].sort((a, b) => (b.id ?? 0) - (a.id ?? 0))[0];
  });

  private prereqs = computed<Record<number, PointPrerequisiteDto>>(() => {
    const snap = this.latestSnapshot();
    return (snap?.pointPrerequisites as Record<number, PointPrerequisiteDto>) ?? this.prereqsOverride() ?? {};
  });

  mutable = computed(() => {
    const status = this.loto().permitStatus?.name ?? null;
    return status === 'Building' || status === null;
  });

  allHung = computed(() => {
    const points = this.loto().lotoPoints ?? [];
    if (points.length === 0) return false;
    const snap = this.latestSnapshot();
    const hung = (snap?.pointHungBy ?? {}) as Record<number, string>;
    return points.every(p => !!hung[p.id!]);
  });

  allVerified = computed(() => {
    const points = this.loto().lotoPoints ?? [];
    if (points.length === 0) return false;
    const snap = this.latestSnapshot();
    const verified = (snap?.pointVerifiedBy ?? {}) as Record<number, string>;
    return points.every(p => !!verified[p.id!]);
  });

  rows = computed<RowState[]>(() => {
    const points = this.loto().lotoPoints ?? [];
    const snap = this.latestSnapshot();
    const prereqs = this.prereqs();
    const m = this.mode();

    const doneByMap: Record<number, string> =
      m === 'HANG'   ? (snap?.pointHungBy ?? {}) :
      m === 'VERIFY' ? (snap?.pointVerifiedBy ?? {}) :
                       (snap?.pointWalkdownBy ?? {});
    const doneAtMap: Record<number, string> =
      m === 'HANG'   ? (snap?.pointHungAt ?? {}) :
      m === 'VERIFY' ? (snap?.pointVerifiedAt ?? {}) :
                       (snap?.pointWalkdownAt ?? {});
    const storedNotesMap: Record<number, string> =
      m === 'HANG'   ? (snap?.pointHangNotes ?? {}) :
      m === 'VERIFY' ? (snap?.pointVerifyNotes ?? {}) :
                       (snap?.pointWalkdownNotes ?? {});
    // Predecessor-satisfied keyset: for HANG and WALKDOWN we look at pointHungBy
    // (so walkdown follows the same install-order gating). VERIFY needs predecessors
    // verified, not hung.
    const predDoneSet: Record<number, string> =
      m === 'VERIFY' ? (snap?.pointVerifiedBy ?? {}) : (snap?.pointHungBy ?? {});

    const tagOf = (id: number) => points.find(p => p.id === id)?.tagNumber ?? `#${id}`;

    return points.map(p => {
      const spec = prereqs[p.id!] ?? null;
      const requiredIds = spec?.requiredPointIds ?? [];
      const safetyConds = spec?.safetyConditions ?? [];
      const installRef = (m === 'HANG' || m === 'WALKDOWN') ? (spec?.installNotes ?? '') :
                         (m === 'VERIFY') ? (spec?.installNotes ?? '') : '';
      return {
        pointId: p.id!,
        tagNumber: p.tagNumber ?? '',
        description: p.description ?? '',
        predecessors: requiredIds.map(id => ({
          id, tag: tagOf(id), satisfied: !!predDoneSet[id],
        })),
        safetyConditions: safetyConds,
        installRefNotes: installRef ?? '',
        done: !!doneByMap[p.id!],
        doneBy: doneByMap[p.id!] ?? null,
        doneAt: doneAtMap[p.id!] ?? null,
        storedNotes: storedNotesMap[p.id!] ?? '',
      };
    });
  });

  progressText = computed(() => {
    const total = this.rows().length;
    const done = this.rows().filter(r => r.done).length;
    return `${done} / ${total} complete`;
  });

  headerClass = computed(() => `gpw-header ${this.mode().toLowerCase()}`);
  headerIcon = computed(() =>
    this.mode() === 'HANG' ? 'lock' :
    this.mode() === 'VERIFY' ? 'verified_user' : 'directions_walk');
  headerTitle = computed(() =>
    this.mode() === 'HANG' ? 'Hanging Procedure' :
    this.mode() === 'VERIFY' ? 'Verifying Procedure' : 'Walkdown');
  actionLabel = computed(() =>
    this.mode() === 'HANG' ? 'Mark Hung' :
    this.mode() === 'VERIFY' ? 'Mark Verified' : 'Mark Walked-Down');

  predecessorsSatisfied(row: RowState): boolean {
    return row.predecessors.every(p => p.satisfied);
  }

  condAcked(pointId: number, cond: string): boolean {
    return this.acked()[pointId]?.has(cond) ?? false;
  }

  toggleCond(pointId: number, cond: string): void {
    const m = { ...this.acked() };
    const set = new Set(m[pointId] ?? []);
    if (set.has(cond)) set.delete(cond); else set.add(cond);
    m[pointId] = set;
    this.acked.set(m);
  }

  notesDraft(pointId: number): string {
    return this.notes()[pointId] ?? '';
  }

  setNotesDraft(pointId: number, value: string): void {
    this.notes.set({ ...this.notes(), [pointId]: value });
  }

  canAct(row: RowState): boolean {
    if (!this.mutable()) return false;
    if (row.done) return false;
    if (this.mode() === 'VERIFY' && !this.allHung()) return false;
    if (this.mode() === 'WALKDOWN' && !this.allVerified()) return false;
    if (!this.predecessorsSatisfied(row)) return false;
    if (this.mode() !== 'WALKDOWN') {
      const ackSet = this.acked()[row.pointId] ?? new Set<string>();
      const required = (row.safetyConditions ?? []).filter(c => c && c.trim().length > 0);
      if (!required.every(c => ackSet.has(c))) return false;
    }
    return true;
  }

  blockHint(row: RowState): string {
    if (!this.mutable()) return '';
    if (this.mode() === 'VERIFY' && !this.allHung()) return 'Hang every point first';
    if (this.mode() === 'WALKDOWN' && !this.allVerified()) return 'Verify every point first';
    if (!this.predecessorsSatisfied(row)) return 'Predecessors not done';
    if (this.mode() !== 'WALKDOWN') return 'Acknowledge all safety conditions';
    return '';
  }

  act(row: RowState): void {
    const lotoId = this.loto().id;
    if (!lotoId) return;
    const notes = this.notesDraft(row.pointId) || null;
    const ack = Array.from(this.acked()[row.pointId] ?? []);

    const obs =
      this.mode() === 'HANG'   ? this.lotoService.markPointHung(lotoId, row.pointId, ack, notes) :
      this.mode() === 'VERIFY' ? this.lotoService.markPointVerified(lotoId, row.pointId, ack, notes) :
                                  this.lotoService.markPointWalkdown(lotoId, row.pointId, notes);

    obs.subscribe({
      next: res => {
        const updated = LotoDto.fromJson(res.responseData);
        this.lotoChanged.emit(updated);
        // Clear local drafts for this point.
        const n = { ...this.notes() }; delete n[row.pointId]; this.notes.set(n);
        const a = { ...this.acked() }; delete a[row.pointId]; this.acked.set(a);
      },
      error: err => alert(err?.error?.message ?? err?.message ?? 'Action failed'),
    });
  }

  undo(row: RowState): void {
    const lotoId = this.loto().id;
    if (!lotoId) return;
    if (!confirm(`Clear ${this.mode().toLowerCase()} for point ${row.tagNumber}?`)) return;
    const obs =
      this.mode() === 'HANG'   ? this.lotoService.unmarkPointHung(lotoId, row.pointId) :
      this.mode() === 'VERIFY' ? this.lotoService.unmarkPointVerified(lotoId, row.pointId) :
                                  this.lotoService.unmarkPointWalkdown(lotoId, row.pointId);
    obs.subscribe({
      next: res => {
        const updated = LotoDto.fromJson(res.responseData);
        this.lotoChanged.emit(updated);
      },
      error: err => alert(err?.error?.message ?? err?.message ?? 'Undo failed'),
    });
  }

  formatTime(t: string | null): string {
    if (!t) return '';
    try {
      return new Date(t).toLocaleString();
    } catch {
      return t;
    }
  }
}
