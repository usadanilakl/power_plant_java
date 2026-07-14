import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RfFloatingWindowComponent } from '../../rf-floating-window/rf-floating-window.component';
import { LotoDto } from '../../../models/loto/loto.model';
import { LotoSnapshotDto, PointPrerequisiteDto } from '../../../models/loto/loto-snapshot.model';
import { LotoService } from '../../../services/loto/loto.service';
import { WalkdownSessionService } from '../../../services/loto/walkdown-session.service';
import { WalkdownSessionDto } from '../../../models/loto/walkdown-session.model';
import { StepUpDialogComponent } from '../../step-up/step-up-dialog.component';
import { AuthService } from '../../../services/auth.service';

export type GuidedProcedureMode = 'HANG' | 'VERIFY' | 'WALKDOWN' | 'REMOVE';

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
  needsRehang: boolean;
}

@Component({
  selector: 'app-guided-procedure-window',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, RfFloatingWindowComponent, StepUpDialogComponent],
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
        @if (mode() === 'VERIFY' && !hangingComplete()) {
          <div class="banner banner-warn">
            <mat-icon>warning</mat-icon>
            Verify is unavailable until 'Hanging Complete' is signed by one of the hangers.
          </div>
        }
        @if (mode() === 'WALKDOWN' && !allVerified()) {
          <div class="banner banner-warn">
            <mat-icon>warning</mat-icon>
            Walkdown is unavailable until every point has been verified.
          </div>
        }
        @if (mode() === 'REMOVE' && !caReleased()) {
          <div class="banner banner-warn">
            <mat-icon>warning</mat-icon>
            Removal is unavailable until the Control Authority has released the LOTO.
          </div>
        }

        @if (mode() === 'WALKDOWN' && !selectedSession()) {
          <!-- Walkdown sessions list view -->
          <div class="walkdown-sessions">
            <div class="walkdown-sessions-header">
              <h3>Walkdown Sessions</h3>
              @if (allVerified() && !startingSession()) {
                <button mat-raised-button color="primary" (click)="showStartSessionForm.set(true)">
                  <mat-icon>add</mat-icon> Start New Walkdown
                </button>
              }
            </div>
            @if (showStartSessionForm()) {
              <div class="start-session-form">
                <input #crewInput placeholder="Crew name (e.g. 'Day Shift A')" class="form-input crew-input">
                <input #notesInput placeholder="Session notes (optional)" class="form-input">
                <button mat-raised-button color="primary"
                        (click)="startSession(crewInput.value, notesInput.value); crewInput.value=''; notesInput.value=''">
                  Start
                </button>
                <button mat-stroked-button (click)="showStartSessionForm.set(false)">Cancel</button>
              </div>
            }
            @if (sessions().length === 0) {
              <p class="empty">No walkdown sessions yet. Each crew can start their own.</p>
            } @else {
              <table class="sessions-table">
                <thead>
                  <tr>
                    <th>Crew</th>
                    <th>Started by</th>
                    <th>Started</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of sessions(); track s.id) {
                    <tr [class.completed]="s.completed">
                      <td><strong>{{ s.crewName || '(unnamed)' }}</strong></td>
                      <td>{{ s.startedBy }}</td>
                      <td>{{ formatTime(s.startedAt) }}</td>
                      <td>
                        @if (s.completed) {
                          <span class="badge-completed">COMPLETED</span>
                        } @else {
                          <span class="badge-active">IN PROGRESS</span>
                        }
                      </td>
                      <td>{{ sessionProgress(s) }}</td>
                      <td>
                        <button mat-stroked-button (click)="openSession(s)">
                          {{ s.completed ? 'View' : 'Continue' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>
        } @else if (mode() === 'WALKDOWN' && selectedSession()) {
          <!-- Single walkdown session detail -->
          <div class="walkdown-session-header">
            <button mat-icon-button (click)="closeSession()" title="Back to sessions">
              <mat-icon>arrow_back</mat-icon>
            </button>
            <strong>{{ selectedSession()!.crewName || '(unnamed)' }}</strong>
            <span class="muted">— started by {{ selectedSession()!.startedBy }} at {{ formatTime(selectedSession()!.startedAt) }}</span>
            <span class="spacer"></span>
            @if (selectedSession()!.completed) {
              <span class="badge-completed">COMPLETED {{ formatTime(selectedSession()!.completedAt) }}</span>
            } @else {
              <button mat-raised-button color="primary"
                      [disabled]="!allSessionPointsChecked()"
                      (click)="completeSession()">
                Complete &amp; Lock
              </button>
            }
          </div>
          <table class="gpw-table">
            <thead>
              <tr>
                <th style="width: 12%">Tag #</th>
                <th style="width: 22%">Description</th>
                <th style="width: 10%">Checked</th>
                <th style="width: 14%">By</th>
                <th style="width: 14%">At</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              @for (p of loto().lotoPoints ?? []; track p.id) {
                <tr [class.done]="isSessionPointChecked(p.id!)">
                  <td>{{ p.tagNumber }}</td>
                  <td>{{ p.description }}</td>
                  <td>
                    <input type="checkbox"
                           [disabled]="selectedSession()!.completed"
                           [checked]="isSessionPointChecked(p.id!)"
                           (change)="toggleSessionPoint(p.id!, $any($event.target).checked)">
                  </td>
                  <td>{{ sessionPointCheckedBy(p.id!) || '—' }}</td>
                  <td>{{ formatTime(sessionPointCheckedAt(p.id!)) || '—' }}</td>
                  <td>
                    <input type="text" class="notes-input"
                           [disabled]="selectedSession()!.completed"
                           [value]="sessionPointNotes(p.id!) || ''"
                           (blur)="onSessionPointNotesBlur(p.id!, $any($event.target).value)">
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
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
              <tr [class.done]="row.done"
                  [class.blocked]="!row.done && !predecessorsSatisfied(row)"
                  [class.needs-rehang]="row.needsRehang">
                <td>
                  {{ row.tagNumber }}
                  @if (row.needsRehang) {
                    <span class="rehang-badge" title="Needs re-hang after Test/Modification">↻</span>
                  }
                </td>
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
                            [disabled]="!mutable() || (mode() === 'VERIFY' && !hangingComplete()) || (mode() === 'WALKDOWN' && !allVerified()) || (mode() === 'REMOVE' && !caReleased())"
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
        }
      </div>
    </app-rf-floating-window>

    @if (stepUpRow()) {
      <app-step-up-dialog
        [actionLabel]="'Verify point ' + stepUpRow()!.tagNumber"
        (authorized)="onStepUpAuthorized($event)"
        (cancelled)="stepUpRow.set(null)">
      </app-step-up-dialog>
    }
  `,
  styles: [`
    .gpw-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; user-select: none; }
    .gpw-header .spacer { flex: 1; }
    .gpw-header .progress { color: rgba(255, 255, 255, 0.85); font-size: 13px; }
    .gpw-header.hang { background: linear-gradient(90deg, #c62828, #b71c1c); color: white; }
    .gpw-header.verify { background: linear-gradient(90deg, #1565c0, #0d47a1); color: white; }
    .gpw-header.walkdown { background: linear-gradient(90deg, #2e7d32, #1b5e20); color: white; }
    .gpw-header.remove { background: linear-gradient(90deg, #ef6c00, #e65100); color: white; }
    .gpw-body { padding: 12px 16px; height: 100%; overflow: auto; box-sizing: border-box; }
    .banner { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 6px; margin-bottom: 10px; font-size: 13px; }
    .banner-locked { background: #2a1a1a; border: 1px solid #c62828; color: #ffab91; }
    .banner-warn { background: #2a221a; border: 1px solid #f9a825; color: #ffe082; }
    .gpw-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .gpw-table th, .gpw-table td { padding: 8px; text-align: left; border-bottom: 1px solid #2a2a2a; vertical-align: top; }
    .gpw-table th { color: #aaa; font-weight: 500; background: #181818; position: sticky; top: 0; }
    .gpw-table tr.done { background: rgba(46, 125, 50, 0.06); }
    .gpw-table tr.blocked { background: rgba(198, 40, 40, 0.05); }
    .gpw-table tr.needs-rehang { background: rgba(239, 108, 0, 0.10); }
    .rehang-badge { display: inline-block; margin-left: 4px; padding: 0 5px; background: #ef6c00; color: white; border-radius: 8px; font-size: 11px; font-weight: 700; }
    .walkdown-sessions { padding: 4px 0; }
    .walkdown-sessions-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .walkdown-sessions-header h3 { margin: 0; color: #82b1ff; }
    .start-session-form { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; align-items: center; background: #1a1a1a; padding: 10px; border-radius: 4px; }
    .form-input { background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: white; padding: 6px 10px; font-size: 13px; }
    .crew-input { min-width: 200px; }
    .sessions-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .sessions-table th, .sessions-table td { padding: 8px; text-align: left; border-bottom: 1px solid #2a2a2a; }
    .sessions-table th { color: #aaa; font-weight: 500; background: #181818; }
    .sessions-table tr.completed { opacity: 0.8; background: rgba(46, 125, 50, 0.05); }
    .badge-completed { display: inline-block; padding: 2px 8px; background: #2e7d32; color: white; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .badge-active { display: inline-block; padding: 2px 8px; background: #f9a825; color: black; border-radius: 10px; font-size: 11px; font-weight: 600; }
    .walkdown-session-header { display: flex; align-items: center; gap: 8px; padding: 8px 0; margin-bottom: 12px; border-bottom: 1px solid #2a2a2a; color: #ddd; font-size: 14px; }
    .walkdown-session-header .spacer { flex: 1; }
    .walkdown-session-header .muted { color: #888; font-size: 12px; }
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
  private walkdownSessionService = inject(WalkdownSessionService);
  private authService = inject(AuthService);

  // ── Walkdown sessions state ───────────────────────────────────────────────
  sessions = signal<WalkdownSessionDto[]>([]);
  selectedSession = signal<WalkdownSessionDto | null>(null);
  showStartSessionForm = signal(false);
  startingSession = signal(false);

  constructor_walkdownInit = effect(() => {
    if (this.mode() !== 'WALKDOWN') return;
    const id = this.loto()?.id;
    if (!id) return;
    this.walkdownSessionService.listForLoto(id).subscribe({
      next: res => this.sessions.set((res.responseData ?? []).map(WalkdownSessionDto.fromJson)),
      error: () => this.sessions.set([]),
    });
  }, { allowSignalWrites: true });

  startSession(crewName: string, notes: string): void {
    const id = this.loto()?.id;
    if (!id) return;
    const trimmed = (crewName || '').trim();
    if (!trimmed) { alert('Crew name is required'); return; }
    this.startingSession.set(true);
    this.walkdownSessionService.start(id, trimmed, notes || null).subscribe({
      next: res => {
        this.startingSession.set(false);
        this.showStartSessionForm.set(false);
        const session = WalkdownSessionDto.fromJson(res.responseData);
        this.sessions.set([session, ...this.sessions()]);
        this.selectedSession.set(session);
      },
      error: err => {
        this.startingSession.set(false);
        alert(err?.error?.message ?? err?.message ?? 'Failed to start walkdown');
      },
    });
  }

  openSession(s: WalkdownSessionDto): void { this.selectedSession.set(s); }
  closeSession(): void { this.selectedSession.set(null); }

  sessionProgress(s: WalkdownSessionDto): string {
    const points = this.loto().lotoPoints ?? [];
    const total = points.length;
    const done = points.filter(p => !!s.pointStates?.[p.id!]?.checked).length;
    return `${done} / ${total}`;
  }

  isSessionPointChecked(pointId: number): boolean {
    return !!this.selectedSession()?.pointStates?.[pointId]?.checked;
  }
  sessionPointCheckedBy(pointId: number): string | null {
    return this.selectedSession()?.pointStates?.[pointId]?.checkedBy ?? null;
  }
  sessionPointCheckedAt(pointId: number): string | null {
    return this.selectedSession()?.pointStates?.[pointId]?.checkedAt ?? null;
  }
  sessionPointNotes(pointId: number): string | null {
    return this.selectedSession()?.pointStates?.[pointId]?.notes ?? null;
  }

  allSessionPointsChecked(): boolean {
    const s = this.selectedSession();
    if (!s) return false;
    const points = this.loto().lotoPoints ?? [];
    if (points.length === 0) return false;
    return points.every(p => !!s.pointStates?.[p.id!]?.checked);
  }

  toggleSessionPoint(pointId: number, checked: boolean): void {
    const s = this.selectedSession();
    if (!s?.id) return;
    if (s.completed) return;
    const notes = s.pointStates?.[pointId]?.notes ?? null;
    this.walkdownSessionService.checkPoint(s.id, pointId, checked, notes).subscribe({
      next: res => this.applySessionUpdate(res.responseData),
      error: err => alert(err?.error?.message ?? err?.message ?? 'Point check failed'),
    });
  }

  onSessionPointNotesBlur(pointId: number, value: string): void {
    const s = this.selectedSession();
    if (!s?.id || s.completed) return;
    const current = s.pointStates?.[pointId]?.notes ?? '';
    if ((value ?? '') === current) return;
    const checked = !!s.pointStates?.[pointId]?.checked;
    this.walkdownSessionService.checkPoint(s.id, pointId, checked, value ?? null).subscribe({
      next: res => this.applySessionUpdate(res.responseData),
      error: err => alert(err?.error?.message ?? err?.message ?? 'Notes save failed'),
    });
  }

  completeSession(): void {
    const s = this.selectedSession();
    if (!s?.id) return;
    if (!confirm('Complete and lock this walkdown? It cannot be modified after this.')) return;
    this.walkdownSessionService.complete(s.id, null).subscribe({
      next: res => this.applySessionUpdate(res.responseData),
      error: err => alert(err?.error?.message ?? err?.message ?? 'Complete failed'),
    });
  }

  private applySessionUpdate(data: any): void {
    if (!data) return;
    const updated = WalkdownSessionDto.fromJson(data);
    this.sessions.set(this.sessions().map(x => x.id === updated.id ? updated : x));
    if (this.selectedSession()?.id === updated.id) this.selectedSession.set(updated);
  }

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
    // REMOVE happens after CA release while LOTO is still Active/Test (not Closed).
    if (this.mode() === 'REMOVE') {
      return status !== 'Closed' && this.caReleased();
    }
    // HANG/VERIFY: Building, or Mod/Test resume flow.
    if (this.mode() === 'HANG' || this.mode() === 'VERIFY') {
      return status === 'Building' || status === 'Modification' || status === 'Test' || status === null;
    }
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

  caReleased = computed(() => {
    const snaps = this.loto().snapshots ?? [];
    return snaps.some(s => !!s.controlAuthorityReleasedBy);
  });

  /** True when the aggregate "Hanging Complete" sign-off has been recorded by any snapshot. */
  hangingComplete = computed(() => {
    const snaps = this.loto().snapshots ?? [];
    return snaps.some(s => !!s.hungBy);
  });

  /** Mirror of LotoSnapshot.effectiveRemovalPredecessors() for client-side display. */
  private effectiveRemovalPreds(pointId: number, spec: PointPrerequisiteDto | null,
                                allPrereqs: Record<number, PointPrerequisiteDto>): number[] {
    if (spec && spec.removalRequiredPointIds && spec.removalRequiredPointIds.length > 0) {
      return spec.removalRequiredPointIds;
    }
    const snap = this.latestSnapshot();
    const reverse = !!snap?.removalReversesInstallOrder;
    if (reverse) {
      return Object.entries(allPrereqs)
        .filter(([k, v]) => Number(k) !== pointId
          && (v.installRequiredPointIds ?? []).includes(pointId))
        .map(([k]) => Number(k));
    }
    return spec?.installRequiredPointIds ?? [];
  }

  rows = computed<RowState[]>(() => {
    const points = this.loto().lotoPoints ?? [];
    const snap = this.latestSnapshot();
    const prereqs = this.prereqs();
    const m = this.mode();

    const doneByMap: Record<number, string> =
      m === 'HANG'   ? (snap?.pointHungBy ?? {}) :
      m === 'VERIFY' ? (snap?.pointVerifiedBy ?? {}) :
      m === 'REMOVE' ? (snap?.pointRemovedBy ?? {}) :
                       (snap?.pointWalkdownBy ?? {});
    const doneAtMap: Record<number, string> =
      m === 'HANG'   ? (snap?.pointHungAt ?? {}) :
      m === 'VERIFY' ? (snap?.pointVerifiedAt ?? {}) :
      m === 'REMOVE' ? (snap?.pointRemovedAt ?? {}) :
                       (snap?.pointWalkdownAt ?? {});
    const storedNotesMap: Record<number, string> =
      m === 'HANG'   ? (snap?.pointHangNotes ?? {}) :
      m === 'VERIFY' ? (snap?.pointVerifyNotes ?? {}) :
      m === 'REMOVE' ? (snap?.pointRemovedNotes ?? {}) :
                       (snap?.pointWalkdownNotes ?? {});
    // Predecessor-satisfied keyset: HANG/WALKDOWN use hung-by; VERIFY uses verified-by;
    // REMOVE uses removed-by (each removal step gates on its predecessors being removed).
    const predDoneSet: Record<number, string> =
      m === 'VERIFY' ? (snap?.pointVerifiedBy ?? {}) :
      m === 'REMOVE' ? (snap?.pointRemovedBy ?? {}) :
                       (snap?.pointHungBy ?? {});

    const tagOf = (id: number) => points.find(p => p.id === id)?.tagNumber ?? `#${id}`;

    return points.map(p => {
      const spec = prereqs[p.id!] ?? null;
      // HANG/VERIFY/WALKDOWN use install-side prereqs. REMOVE uses effective removal-side
      // (per-point override → reverse-of-install when reverse flag set → install fallback).
      const requiredIds = m === 'REMOVE'
        ? this.effectiveRemovalPreds(p.id!, spec, prereqs)
        : (spec?.installRequiredPointIds ?? []);
      const safetyConds = m === 'REMOVE'
        ? ((spec?.removalSafetyConditions?.length ?? 0) > 0
            ? spec!.removalSafetyConditions!
            : (spec?.installSafetyConditions ?? []))
        : (spec?.installSafetyConditions ?? []);
      const installRef = m === 'REMOVE'
        ? (spec?.removalNotes ?? '')
        : (spec?.installNotes ?? '');
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
        needsRehang: (snap?.pointNeedsRehang ?? []).includes(p.id!),
      };
    }).sort((a, b) => {
      // For HANG/VERIFY: surface needs-rehang points first to streamline the resume flow.
      if (m !== 'HANG' && m !== 'VERIFY') return 0;
      if (a.needsRehang === b.needsRehang) return 0;
      return a.needsRehang ? -1 : 1;
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
    this.mode() === 'VERIFY' ? 'verified_user' :
    this.mode() === 'REMOVE' ? 'lock_open' : 'directions_walk');
  headerTitle = computed(() =>
    this.mode() === 'HANG' ? 'Hanging Procedure' :
    this.mode() === 'VERIFY' ? 'Verifying Procedure' :
    this.mode() === 'REMOVE' ? 'Removal Procedure' : 'Walkdown');
  actionLabel = computed(() =>
    this.mode() === 'HANG' ? 'Mark Hung' :
    this.mode() === 'VERIFY' ? 'Mark Verified' :
    this.mode() === 'REMOVE' ? 'Mark Removed' : 'Mark Walked-Down');

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
    if (this.mode() === 'VERIFY' && !this.hangingComplete()) return false;
    if (this.mode() === 'WALKDOWN' && !this.allVerified()) return false;
    if (this.mode() === 'REMOVE' && !this.caReleased()) return false;
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
    if (this.mode() === 'VERIFY' && !this.hangingComplete()) return "'Hanging Complete' not signed yet";
    if (this.mode() === 'WALKDOWN' && !this.allVerified()) return 'Verify every point first';
    if (this.mode() === 'REMOVE' && !this.caReleased()) return 'CA must release first';
    if (!this.predecessorsSatisfied(row)) return 'Predecessors not done';
    if (this.mode() !== 'WALKDOWN') return 'Acknowledge all safety conditions';
    return '';
  }

  /**
   * Tracks a pending VERIFY action waiting on PIN entry. Non-VERIFY modes run
   * directly under the logged-in user. For VERIFY, the PIN dialog is a shared-
   * workstation affordance — see {@link sessionCanVerifyDirectly}.
   */
  stepUpRow = signal<RowState | null>(null);

  /**
   * True when the currently signed-in session ALREADY satisfies the "verifier
   * must be a different person than the hanger" rule — in which case there's
   * no need to prompt for a PIN. Requires:
   *   - a logged-in user with an email,
   *   - LOTO-qualified (or higher) role,
   *   - the point has a recorded hanger,
   *   - and that hanger identity is NOT the logged-in email (case-insensitive).
   *
   * When any of those fail, we fall back to the step-up PIN dialog. The
   * backend still enforces the same rule server-side against whichever
   * identity actually acts (session token OR step-up token), so this is
   * purely a UX shortcut — a wrong local decision can't bypass the rule.
   */
  private sessionCanVerifyDirectly(pointId: number): boolean {
    const email = this.authService.currentUser?.email;
    if (!email) return false;
    if (!this.authService.isLotoQualified()) return false;
    const snap = this.latestSnapshot();
    const hung = (snap?.pointHungBy ?? {}) as Record<number, string>;
    const hangerId = hung[pointId];
    if (!hangerId) return false; // no hanger recorded — safer to prompt for PIN
    return hangerId.toLowerCase() !== email.toLowerCase();
  }

  act(row: RowState): void {
    if (this.mode() === 'VERIFY' && !this.sessionCanVerifyDirectly(row.pointId)) {
      // Session user is either not LOTO-qualified, is the same person who
      // hung this point, or the hanger identity is unknown — prompt for PIN
      // so a physically different person can identify themselves. On success
      // the backend uses the PIN bearer as the actor.
      this.stepUpRow.set(row);
      return;
    }
    this.runAction(row, null);
  }

  /** Called by step-up dialog on successful PIN entry. */
  onStepUpAuthorized(result: { token: string; expiresAt: string }): void {
    const row = this.stepUpRow();
    this.stepUpRow.set(null);
    if (!row) return;
    this.runAction(row, result.token);
  }

  private runAction(row: RowState, stepUpToken: string | null): void {
    const lotoId = this.loto().id;
    if (!lotoId) return;
    const notes = this.notesDraft(row.pointId) || null;
    const ack = Array.from(this.acked()[row.pointId] ?? []);

    const obs =
      this.mode() === 'HANG'   ? this.lotoService.markPointHung(lotoId, row.pointId, ack, notes) :
      this.mode() === 'VERIFY' ? this.lotoService.markPointVerified(lotoId, row.pointId, ack, notes, stepUpToken) :
      this.mode() === 'REMOVE' ? this.lotoService.markPointRemoved(lotoId, row.pointId, ack, notes) :
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
      this.mode() === 'REMOVE' ? this.lotoService.unmarkPointRemoved(lotoId, row.pointId) :
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
