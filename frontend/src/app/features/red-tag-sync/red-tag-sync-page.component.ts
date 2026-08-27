import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, effect, inject, signal
} from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ApplyResult, DiffAction, DiffEntry, DiffPlan, RedTagStateSyncService, RedTagStatus
} from '../../services/automation/red-tag-state-sync.service';
import { RedTagAutomationService } from '../../services/automation/red-tag-automation.service';
import { RedTagAutomationPanelComponent } from '../../shared/automation/red-tag-automation-panel/red-tag-automation-panel.component';

/**
 * Preview + Apply page for the Red Tag → local state-sync flow.
 *
 * <p>Flow:
 * <ol>
 *   <li>User picks a Red Tag status (ACTIVE / INACTIVE / CANCELED / CLOSED)
 *       and clicks Scrape. That kicks off a background SikuliX session that
 *       drives the Red Tag desktop app; progress streams into the shared
 *       Red-Tag automation panel above via SSE.</li>
 *   <li>When the scrape completes, the reconciler builds a diff plan the user
 *       previews here — grouped by proposed action (Create / Update / Close /
 *       Orphan). Each row has a skip toggle and (for Orphans) a candidate
 *       picker. Rows can be edited inline before submitting.</li>
 *   <li>Clicking Apply posts the edited plan back; the server executes each
 *       non-skipped entry through {@code LotoBypassService.bypass(...)} with
 *       source = "STATE_SYNC" so every mutation is audited.</li>
 * </ol>
 */
@Component({
  selector: 'app-red-tag-sync-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RedTagAutomationPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
  <div class="page">
    <header class="page-head">
      <div class="head-row">
        <button class="btn back" (click)="goBack()" title="Back">◀ Back</button>
        <h1>Red Tag → Local Sync</h1>
        <a class="btn" routerLink="/" title="Home">Home</a>
      </div>
      <p class="hint">
        Pull the LOTO list out of Red Tag and reconcile it against local state.
        Every change requires Control Authority; every applied row is written to
        the bypass audit log.
      </p>
    </header>

    <section class="scrape-bar">
      <label>
        Status:
        <select [(ngModel)]="pickedStatus" [disabled]="sessionRunning()">
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="CANCELED">CANCELED</option>
          <option value="CLOSED">CLOSED</option>
        </select>
      </label>
      <button class="btn primary"
              [disabled]="sessionRunning()"
              (click)="startScrape()">
        {{ sessionRunning() ? 'Sync running…' : 'Scrape Red Tag' }}
      </button>
      <button class="btn"
              [disabled]="!plan() || sessionRunning()"
              (click)="rebuildPlan()">Rebuild plan</button>
      <button class="btn" (click)="reloadLatest()">Reload latest</button>
    </section>

    <!-- Live SikuliX progress -->
    <app-red-tag-automation-panel></app-red-tag-automation-panel>

    <ng-container *ngIf="plan() as p; else noPlan">
      <section class="summary">
        <h2>Diff plan · <span class="chip">{{ p.status }}</span></h2>
        <div class="counts">
          <span class="chip create">Create: {{ counts().create }}</span>
          <span class="chip update">Update: {{ counts().update }}</span>
          <span class="chip close">Close: {{ counts().close }}</span>
          <span class="chip orphan">Orphan: {{ counts().orphan }}</span>
          <span class="chip skip">Skipped: {{ counts().skipped }}</span>
        </div>
        <label class="reason">
          Audit reason (optional override):
          <input type="text" [(ngModel)]="reasonOverride"
                 placeholder="Red Tag state sync — {{ p.status }}">
        </label>
        <button class="btn apply"
                [disabled]="applying() || activeCount() === 0"
                (click)="apply(p)">
          {{ applying()
              ? 'Applying…'
              : ('Apply ' + activeCount() + ' change' + (activeCount() === 1 ? '' : 's')) }}
        </button>
      </section>

      <ng-container *ngFor="let group of grouped()">
        <section class="group" *ngIf="group.entries.length" [attr.data-action]="group.action">
          <h3>{{ groupTitle(group.action) }} <span class="mini">({{ group.entries.length }})</span></h3>
          <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th class="c-skip">Skip</th>
                <th class="c-rt">Red Tag row</th>
                <th class="c-local">Local LOTO</th>
                <th class="c-diff">Changes</th>
                <th class="c-note">Notes</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of group.entries; trackBy: trackEntry" [class.skipped]="e.skip">
                <td class="c-skip">
                  <input type="checkbox" [checked]="e.skip"
                         (change)="setSkip(e, $any($event.target).checked)">
                </td>
                <td class="c-rt">
                  <div class="rt-num">#{{ e.redTagLotoNumber || '?' }}</div>
                  <div>
                    <label>Job:
                      <input type="text" [(ngModel)]="e.redTagJobDescription">
                    </label>
                  </div>
                  <div>
                    <label>Box:
                      <input type="text" size="4" [(ngModel)]="e.redTagLockBox">
                    </label>
                    <label>Requestor:
                      <input type="text" [(ngModel)]="e.redTagRequestor">
                    </label>
                  </div>
                </td>
                <td class="c-local">
                  <ng-container *ngIf="e.localLotoId; else noLocalOrPicker">
                    <div class="rt-num">{{ e.localPermitNumber || '#' + e.localLotoId }}</div>
                    <div class="mini">
                      status: {{ e.localPermitStatus || '—' }}<br>
                      box: {{ e.localBoxNumber ?? '—' }} · redTagNum: {{ e.localRedTagNum || '—' }}
                    </div>
                    <div class="mini job">{{ e.localJobDescription }}</div>
                  </ng-container>
                  <ng-template #noLocalOrPicker>
                    <div *ngIf="e.action === 'ORPHAN'; else willCreate">
                      <label>Pair with:
                        <select [ngModel]="e.localLotoId"
                                (ngModelChange)="pickCandidate(e, $event)">
                          <option [ngValue]="null">— pick candidate —</option>
                          <option *ngFor="let cid of e.candidateLocalLotoIds"
                                  [ngValue]="cid">Loto #{{ cid }}</option>
                        </select>
                      </label>
                    </div>
                    <ng-template #willCreate>
                      <div class="mini muted">Will create as
                        <b>{{ localStatusFor(p.status) }}</b>
                      </div>
                    </ng-template>
                  </ng-template>
                </td>
                <td class="c-diff">
                  <span class="chip" *ngFor="let f of e.changedFields">{{ f }}</span>
                  <span class="chip muted" *ngIf="!e.changedFields?.length">—</span>
                </td>
                <td class="c-note mini">{{ e.reason }}</td>
              </tr>
            </tbody>
          </table>
          </div>
        </section>
      </ng-container>
    </ng-container>

    <ng-template #noPlan>
      <section class="empty">
        <p>No plan yet. Pick a status and click <b>Scrape Red Tag</b>.</p>
      </section>
    </ng-template>

    <section class="apply-result" *ngIf="lastResult() as r">
      <h2>Apply result</h2>
      <p>
        <b>{{ r.applied }}</b> applied ·
        <b>{{ r.skipped }}</b> skipped ·
        <b>{{ r.failed }}</b> failed
      </p>
      <details *ngIf="r.outcomes.length">
        <summary>Per-row disposition</summary>
        <ul>
          <li *ngFor="let o of r.outcomes"
              [class.ok]="o.status === 'OK'"
              [class.failed]="o.status === 'FAILED'">
            {{ o.entryKey }} · {{ o.status }}
            <span *ngIf="o.affectedLotoId">→ Loto #{{ o.affectedLotoId }}</span>
            <span *ngIf="o.errorMessage" class="err"> — {{ o.errorMessage }}</span>
          </li>
        </ul>
      </details>
    </section>
  </div>
  `,
  styleUrl: './red-tag-sync-page.component.css'
})
export class RedTagSyncPageComponent implements OnInit {
  private syncSvc = inject(RedTagStateSyncService);
  private automationSvc = inject(RedTagAutomationService);
  private destroyRef = inject(DestroyRef);
  private location = inject(Location);

  goBack() { this.location.back(); }

  pickedStatus: RedTagStatus = 'ACTIVE';
  reasonOverride = '';

  readonly plan = this.syncSvc.currentPlan;
  readonly applying = this.syncSvc.isApplying;
  readonly sessionRunning = computed(() => this.automationSvc.isRunning());
  readonly lastResult = signal<ApplyResult | null>(null);

  readonly counts = computed(() => {
    const p = this.plan();
    const c = { create: 0, update: 0, close: 0, orphan: 0, skipped: 0 };
    if (!p) return c;
    for (const e of p.entries) {
      if (e.skip) { c.skipped++; continue; }
      if (e.action === 'CREATE') c.create++;
      else if (e.action === 'UPDATE') c.update++;
      else if (e.action === 'CLOSE') c.close++;
      else if (e.action === 'ORPHAN') c.orphan++;
    }
    return c;
  });

  readonly activeCount = computed(() =>
    this.plan()?.entries.filter(e => !e.skip).length ?? 0);

  readonly grouped = computed(() => {
    const p = this.plan();
    const order: DiffAction[] = ['CREATE', 'UPDATE', 'CLOSE', 'ORPHAN'];
    if (!p) return order.map(a => ({ action: a, entries: [] as DiffEntry[] }));
    return order.map(a => ({
      action: a,
      entries: p.entries.filter(e => e.action === a),
    }));
  });

  constructor() {
    // Whenever the automation panel says the session finished successfully,
    // refresh the cached plan (build-plan is the last scrape step so the
    // server should have a fresh plan waiting).
    effect(() => {
      if (this.automationSvc.isCompleted()) {
        this.reloadLatest();
      }
    });
  }

  ngOnInit(): void {
    // Wake the SSE stream so progress renders even on a hard reload.
    this.automationSvc.connect();
    this.reloadLatest();
  }

  startScrape() {
    this.syncSvc.scrape(this.pickedStatus)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { /* progress arrives via SSE */ },
        error: (err) => alert(errorText(err, 'Failed to start Red Tag scrape')),
      });
  }

  reloadLatest() {
    this.syncSvc.latestPlan()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  rebuildPlan() {
    this.syncSvc.rebuildPlan()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: err => alert(errorText(err, 'Rebuild failed')) });
  }

  apply(plan: DiffPlan) {
    if (!confirm(`Apply ${this.activeCount()} change(s)? Every affected LOTO is audited as a Red Tag Bypass.`)) return;
    this.syncSvc.apply(plan, this.reasonOverride)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.lastResult.set(result);
          alert(`Apply done: ${result.applied} applied, ${result.skipped} skipped, ${result.failed} failed.`);
        },
        error: (err) => alert(errorText(err, 'Apply failed')),
      });
  }

  setSkip(e: DiffEntry, skip: boolean) { e.skip = skip; }

  pickCandidate(e: DiffEntry, id: number | null) {
    e.localLotoId = id;
    if (id != null) e.skip = false; // pairing an orphan re-arms it
  }

  trackEntry = (_: number, e: DiffEntry) => e.key;

  groupTitle(a: DiffAction): string {
    switch (a) {
      case 'CREATE': return 'Create';
      case 'UPDATE': return 'Update';
      case 'CLOSE':  return 'Close';
      case 'ORPHAN': return 'Orphan — needs manual pairing';
    }
  }

  localStatusFor(status: RedTagStatus): string {
    switch (status) {
      case 'ACTIVE':   return 'Active';
      case 'INACTIVE': return 'Building';
      case 'CANCELED':
      case 'CLOSED':   return 'Closed';
    }
  }
}

function errorText(err: unknown, fallback: string): string {
  const e = err as { error?: { message?: string }; message?: string } | null;
  return e?.error?.message ?? e?.message ?? fallback;
}
