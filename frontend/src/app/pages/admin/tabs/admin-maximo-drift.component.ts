import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminMaximoFieldListDriftService,
  MaximoFieldListDrift,
  MaximoFieldListDriftBucket,
  MaximoFieldListDriftRow,
  MaximoFieldListResolveResult,
  MaximoBulkCancelPreview,
  MaximoBulkCancelResult
} from '../../../services/admin/admin-maximo-field-list-drift.service';
import { Observable } from 'rxjs';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';

type BucketKey =
  | 'createPending'
  | 'cancelPending'
  | 'completePending'
  | 'maximoClosedLocalOpen'
  | 'localClosedMaximoOpen'
  | 'localNotInMaximo';

interface BucketTile {
  key: BucketKey;
  label: string;
  hint: string;
  severity: 'info' | 'warn' | 'danger';
  /** Which row-level actions apply to rows in this bucket. */
  actions: Array<'retrySubmit' | 'retryCancel' | 'retryComplete' | 'acceptMaximo' | 'pushLocalClose'>;
}

const BUCKETS: BucketTile[] = [
  {
    key: 'createPending',
    label: 'Create backlog',
    hint: 'Rows whose initial Maximo create failed and are queued for backfill retry.',
    severity: 'warn',
    actions: ['retrySubmit']
  },
  {
    key: 'cancelPending',
    label: 'Cancel backlog',
    hint: 'Locally-deleted rows whose Maximo cancel call failed. Backfill will retry.',
    severity: 'warn',
    actions: ['retryCancel']
  },
  {
    key: 'completePending',
    label: 'WO COMP backlog',
    hint: 'Local Closed but the WO COMP push failed. Backfill will retry.',
    severity: 'warn',
    actions: ['retryComplete']
  },
  {
    key: 'maximoClosedLocalOpen',
    label: 'Maximo closed / local open',
    hint: 'Ops closed the record in Maximo (via a route outside our bridge) but the local mirror still shows open. Adopt Maximo status to catch up.',
    severity: 'info',
    actions: ['acceptMaximo']
  },
  {
    key: 'localClosedMaximoOpen',
    label: 'Local closed / WO still open',
    hint: 'The wo-completion-status flip fired but bridge.complete() failed silently. Push the local close to Maximo again.',
    severity: 'danger',
    actions: ['pushLocalClose']
  },
  {
    key: 'localNotInMaximo',
    label: 'Local present / not in Maximo',
    hint: 'listType routes to Maximo but the row never got a Maximo record. Common causes: item existed before the bridge was enabled, or its Submitted event was suppressed because the row was already terminal (Closed/Cancelled) at import time. "Retry submit" here creates the Maximo record now.',
    severity: 'warn',
    actions: ['retrySubmit']
  }
];

@Component({
  selector: 'app-admin-maximo-drift',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <div class="admin-container">
      <div class="admin-section">
        <div class="section-head">
          <h3>Maximo Field List Drift</h3>
          <button (click)="load()" [disabled]="loading()">
            {{ loading() ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
        <p class="description">
          Health of the Field List → Maximo bridge. Rows in the buckets below are either stuck
          (backfill will retry — click a row's action to retry now) or diverged (Maximo and local
          disagree — the row-level action adopts one side or pushes the other). Bridge feature-flag:
          <code>maximo.field-list.enabled</code> in <code>application-secrets.properties</code>.
          Empty buckets when the feature is off is expected.
        </p>

        <div class="error" *ngIf="error()">{{ error() }}</div>
        <div class="toast" *ngIf="toast() as t" [class.ok]="t.ok" [class.bad]="!t.ok">{{ t.message }}</div>

        <ng-container *ngIf="snap() as s">
          <div class="meta">
            <span>Total routed to Maximo: <strong>{{ s.totalRoutedToMaximo }}</strong></span>
            <span>Attachment upload backlog: <strong>{{ s.attachmentUploadPendingCount }}</strong></span>
            <span>Last refreshed: {{ s.computedAt | date:'medium' }}</span>
          </div>

          <div class="cards">
            <div class="card"
                 *ngFor="let b of buckets"
                 [class.selected]="selected() === b.key"
                 [class.warn]="b.severity === 'warn' && bucketOf(s, b.key).count > 0"
                 [class.danger]="b.severity === 'danger' && bucketOf(s, b.key).count > 0"
                 (click)="select(b.key)">
              <div class="card-label">{{ b.label }}</div>
              <div class="card-value">{{ bucketOf(s, b.key).count }}</div>
              <div class="card-sub" *ngIf="bucketOf(s, b.key).oldestAgeDays != null">
                oldest {{ bucketOf(s, b.key).oldestAgeDays }}d ago
              </div>
              <div class="card-hint">{{ b.hint }}</div>
            </div>
          </div>

          <div class="drilldown" *ngIf="selected() as key">
            <div class="drilldown-head">
              <h4>{{ labelFor(key) }} — samples ({{ bucketOf(s, key).samples.length }} of {{ bucketOf(s, key).count }})</h4>
              <button class="link" (click)="select(null)">Clear</button>
            </div>
            <table *ngIf="bucketOf(s, key).samples.length > 0; else emptyBucket">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Local status</th>
                  <th>Maximo</th>
                  <th>Modified</th>
                  <th>Submitter</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let r of bucketOf(s, key).samples">
                  <td>{{ r.id }}</td>
                  <td>{{ r.title }}</td>
                  <td>{{ r.listTypeName || '—' }}</td>
                  <td>{{ r.localStatus || '—' }}</td>
                  <td>
                    <span class="rec-badge" *ngIf="r.maximoRecordType">
                      {{ r.maximoRecordType }} {{ r.maximoRecordId }} • {{ r.maximoStatus || '?' }}
                    </span>
                    <span *ngIf="!r.maximoRecordType">—</span>
                    <span class="pill pending" *ngIf="r.maximoSyncPending">create pending</span>
                    <span class="pill pending" *ngIf="r.maximoCancelPending">cancel pending</span>
                    <span class="pill pending" *ngIf="r.maximoCompletePending">complete pending</span>
                    <span class="pill deleted" *ngIf="r.deleted">deleted</span>
                  </td>
                  <td>{{ r.dateModified | date:'short' }}</td>
                  <td>{{ r.submitterName || '—' }}</td>
                  <td>
                    <button *ngFor="let a of actionsFor(key)"
                            class="action-btn"
                            [class.busy]="busyId() === r.id"
                            [disabled]="busyId() != null"
                            (click)="doAction(a, r)">
                      {{ actionLabel(a) }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <ng-template #emptyBucket>
              <p class="empty">Nothing here — all clear.</p>
            </ng-template>
          </div>
        </ng-container>
      </div>

      <!-- Bulk-cancel Maximo WO orphans — for cleaning up WOs that got created when the
           bridge was first enabled against a repo that already had Closed items. Preview
           first (dry-read), review candidates, execute to CAN them in Maximo. -->
      <div class="admin-section" style="margin-top: 20px;">
        <div class="section-head">
          <h3>Bulk-cancel Maximo WO orphans</h3>
        </div>
        <p class="description">
          Cancels Maximo WOs whose local FieldListItem is already in a terminal state.
          Common cause: the Maximo bridge was enabled after items already existed as Closed
          in H2 — the next SP-import / CRDT save routed them into Maximo as WAPPR WOs that
          nobody wants to work.
          <br><br>
          <strong>Pick the Maximo statuses to sweep and the local statuses that qualify.</strong>
          Preview first, review the candidates, then Execute — one Maximo <code>changeStatus → CAN</code>
          call per row.
        </p>

        <div class="bulk-form">
          <div class="bulk-row">
            <div class="bulk-col">
              <div class="bulk-label">Maximo statuses (WO side)</div>
              <div class="bulk-checks">
                <label *ngFor="let s of allMaximoStatuses">
                  <input type="checkbox" [checked]="bulkMaximoStatuses.has(s)"
                         (change)="toggleBulkMaximoStatus(s, $event)"> {{ s }}
                </label>
              </div>
            </div>
            <div class="bulk-col">
              <div class="bulk-label">Local statuses (H2 side)</div>
              <div class="bulk-checks">
                <label *ngFor="let s of allLocalStatuses">
                  <input type="checkbox" [checked]="bulkLocalStatuses.has(s)"
                         (change)="toggleBulkLocalStatus(s, $event)"> {{ s }}
                </label>
              </div>
            </div>
          </div>
          <div class="bulk-row">
            <div class="bulk-col wide">
              <div class="bulk-label">Cancel reason (sent to Maximo worklog memo, 50 char cap)</div>
              <input type="text" class="bulk-reason" [(ngModel)]="bulkReason"
                     placeholder="Bulk-cancel: erroneous Maximo route on bridge enablement" />
            </div>
          </div>
          <div class="bulk-actions">
            <button (click)="bulkPreview()" [disabled]="bulkBusy() != null || bulkMaximoStatuses.size === 0 || bulkLocalStatuses.size === 0">
              {{ bulkBusy() === 'preview' ? 'Loading…' : 'Preview candidates' }}
            </button>
            <button *ngIf="bulkPreviewData() && bulkPreviewData()!.candidateCount > 0"
                    class="danger"
                    (click)="bulkExecute()"
                    [disabled]="bulkBusy() != null">
              {{ bulkBusy() === 'execute' ? 'Cancelling…' : ('Execute — cancel ' + bulkPreviewData()!.candidateCount + ' WO(s)') }}
            </button>
          </div>
        </div>

        <div class="toast" *ngIf="bulkResult() as r" [class.ok]="r.failed === 0" [class.bad]="r.failed > 0">
          Attempted {{ r.attempted }} — cancelled {{ r.cancelled }}, failed {{ r.failed }}.
          <ul *ngIf="r.failures?.length" style="margin: 6px 0 0 18px;">
            <li *ngFor="let f of r.failures">#{{ f.id }} ({{ f.wonum || 'no wonum' }}): {{ f.error }}</li>
          </ul>
        </div>

        <div class="drilldown" *ngIf="bulkPreviewData() as p">
          <div class="drilldown-head">
            <h4>Candidates ({{ p.samples.length }} of {{ p.candidateCount }} shown)</h4>
          </div>
          <table *ngIf="p.samples.length > 0; else emptyPreview">
            <thead>
              <tr>
                <th>ID</th><th>Title</th><th>Type</th><th>Local status</th>
                <th>Maximo</th><th>Modified</th><th>Submitter</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of p.samples">
                <td>{{ r.id }}</td><td>{{ r.title }}</td>
                <td>{{ r.listTypeName || '—' }}</td>
                <td>{{ r.localStatus || '—' }}</td>
                <td>
                  <span class="rec-badge" *ngIf="r.maximoRecordType">
                    {{ r.maximoRecordType }} {{ r.maximoRecordId }} • {{ r.maximoStatus || '?' }}
                  </span>
                  <span *ngIf="!r.maximoRecordType">—</span>
                </td>
                <td>{{ r.dateModified | date:'short' }}</td>
                <td>{{ r.submitterName || '—' }}</td>
              </tr>
            </tbody>
          </table>
          <ng-template #emptyPreview>
            <p class="empty">No candidates match the selected criteria.</p>
          </ng-template>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 20px; max-width: 1400px; margin: 0 auto; }
    .admin-section { background: white; border-radius: 6px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .section-head { display: flex; justify-content: space-between; align-items: center; }
    .section-head h3 { margin: 0; color: #333; }
    .description { color: #555; font-size: 13px; margin: 10px 0 20px; line-height: 1.5; }
    .description code { background: #f0f0f0; padding: 1px 6px; border-radius: 3px; font-size: 12px; }
    .error { background: #fee; color: #900; padding: 10px; border-radius: 4px; margin: 10px 0; }
    .toast { padding: 8px 12px; border-radius: 4px; margin: 8px 0; font-size: 13px; }
    .toast.ok { background: #e6f4ea; color: #1e7e34; }
    .toast.bad { background: #fef2f2; color: #b91c1c; }
    .meta { display: flex; gap: 24px; color: #666; font-size: 13px; margin-bottom: 14px; flex-wrap: wrap; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; margin-bottom: 20px; }
    .card {
      background: #fafafa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 14px;
      cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
    }
    .card:hover { border-color: #007bff; }
    .card.selected { border-color: #007bff; box-shadow: 0 0 0 2px rgba(0,123,255,0.2); }
    .card.warn { background: #fff8e6; border-color: #f0c674; }
    .card.danger { background: #fdecea; border-color: #e57373; }
    .card-label { font-size: 13px; color: #555; }
    .card-value { font-size: 28px; font-weight: 600; color: #222; margin: 4px 0 2px; }
    .card-sub { font-size: 12px; color: #777; }
    .card-hint { font-size: 12px; color: #666; margin-top: 8px; line-height: 1.4; }
    .drilldown { margin-top: 10px; }
    .drilldown-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
    .drilldown-head h4 { margin: 0; color: #333; }
    .link { background: none; border: none; color: #007bff; cursor: pointer; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
    th { background: #f5f5f5; font-weight: 600; color: #444; }
    tr:hover td { background: #fafafa; }
    .rec-badge {
      display: inline-block; padding: 2px 8px; border-radius: 3px; background: #e3f2fd; color: #1565c0;
      font-family: ui-monospace, monospace; font-size: 12px;
    }
    .pill { display: inline-block; padding: 1px 6px; border-radius: 3px; font-size: 11px; margin-left: 6px; }
    .pill.pending { background: #fff3cd; color: #856404; }
    .pill.deleted { background: #f5c6cb; color: #721c24; }
    .empty { color: #999; font-style: italic; padding: 20px 0; text-align: center; }
    button:not(.link):not(.action-btn) {
      background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px;
      cursor: pointer; font-size: 13px;
    }
    button:not(.link):not(.action-btn):disabled { background: #999; cursor: not-allowed; }
    button:not(.link):not(.action-btn):hover:not(:disabled) { background: #218838; }
    .action-btn {
      background: #007bff; color: white; border: none; padding: 4px 10px; border-radius: 3px;
      cursor: pointer; font-size: 12px; margin-right: 4px;
    }
    .action-btn:hover:not(:disabled) { background: #0056b3; }
    .action-btn:disabled { background: #bbb; cursor: wait; }
    .action-btn.busy { background: #999; }

    /* Bulk-cancel form */
    .bulk-form { display: flex; flex-direction: column; gap: 14px; margin-bottom: 14px; }
    .bulk-row { display: flex; gap: 20px; flex-wrap: wrap; }
    .bulk-col { flex: 1; min-width: 260px; }
    .bulk-col.wide { flex: 100%; }
    .bulk-label { font-size: 12px; font-weight: 600; color: #555; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.4px; }
    .bulk-checks { display: flex; gap: 12px; flex-wrap: wrap; }
    .bulk-checks label {
      display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: #333;
      padding: 6px 10px; border: 1px solid #ddd; border-radius: 4px; background: #fafafa; cursor: pointer;
    }
    .bulk-checks label:has(input:checked) { border-color: #007bff; background: #e7f0ff; color: #0056b3; }
    .bulk-reason {
      width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid #ccc; border-radius: 4px;
      font-family: inherit; font-size: 13px;
    }
    .bulk-actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .bulk-actions button.danger { background: #dc3545; }
    .bulk-actions button.danger:hover:not(:disabled) { background: #c82333; }
  `]
})
export class AdminMaximoDriftComponent implements OnInit {
  private api = inject(AdminMaximoFieldListDriftService);

  buckets = BUCKETS;
  loading = signal(false);
  error = signal<string | null>(null);
  snap = signal<MaximoFieldListDrift | null>(null);
  selected = signal<BucketKey | null>(null);
  busyId = signal<number | null>(null);
  toast = signal<MaximoFieldListResolveResult | null>(null);

  // Bulk-cancel panel state
  readonly allMaximoStatuses = ['WAPPR', 'APPR', 'WSCH', 'INPRG', 'COMP', 'CLOSE', 'CAN'];
  readonly allLocalStatuses = ['Open', 'In Progress', 'Closed', 'Cancelled'];
  bulkMaximoStatuses = new Set<string>(['WAPPR', 'APPR', 'WSCH', 'INPRG']); // defaults matching server
  bulkLocalStatuses = new Set<string>(['Closed', 'Cancelled']);
  bulkReason = '';
  bulkBusy = signal<'preview' | 'execute' | null>(null);
  bulkPreviewData = signal<MaximoBulkCancelPreview | null>(null);
  bulkResult = signal<MaximoBulkCancelResult | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.snapshot(50).subscribe({
      next: r => {
        this.snap.set(r.responseData ?? null);
        this.loading.set(false);
      },
      error: e => {
        this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load drift snapshot');
        this.loading.set(false);
      }
    });
  }

  select(key: BucketKey | null): void {
    this.selected.set(this.selected() === key ? null : key);
  }

  bucketOf(s: MaximoFieldListDrift, key: BucketKey): MaximoFieldListDriftBucket {
    return s[key];
  }

  labelFor(key: BucketKey): string {
    return BUCKETS.find(b => b.key === key)?.label ?? key;
  }

  actionsFor(key: BucketKey): BucketTile['actions'] {
    return BUCKETS.find(b => b.key === key)?.actions ?? [];
  }

  actionLabel(a: BucketTile['actions'][number]): string {
    switch (a) {
      case 'retrySubmit': return 'Retry submit';
      case 'retryCancel': return 'Retry cancel';
      case 'retryComplete': return 'Retry COMP';
      case 'acceptMaximo': return 'Accept Maximo status';
      case 'pushLocalClose': return 'Push local close';
    }
  }

  doAction(a: BucketTile['actions'][number], r: MaximoFieldListDriftRow): void {
    if (this.busyId() != null) return;
    this.busyId.set(r.id);
    this.toast.set(null);
    let call$: Observable<SpringApiResponse<MaximoFieldListResolveResult>>;
    switch (a) {
      case 'retrySubmit': call$ = this.api.retrySubmit(r.id); break;
      case 'retryCancel': call$ = this.api.retryCancel(r.id); break;
      case 'retryComplete': call$ = this.api.retryComplete(r.id); break;
      case 'acceptMaximo': call$ = this.api.acceptMaximoStatus(r.id); break;
      case 'pushLocalClose': call$ = this.api.pushLocalClose(r.id); break;
    }
    call$.subscribe({
      next: resp => {
        const result = resp.responseData ?? { ok: false, message: resp.message ?? 'Unknown result' };
        this.toast.set(result);
        this.busyId.set(null);
        // Reload snapshot so the successfully-resolved row drops out of its bucket.
        if (result.ok) this.load();
      },
      error: e => {
        this.toast.set({ ok: false, message: e?.error?.message ?? e?.message ?? 'Request failed' });
        this.busyId.set(null);
      }
    });
  }

  // ==================== Bulk-cancel handlers ====================

  toggleBulkMaximoStatus(s: string, ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked;
    const next = new Set(this.bulkMaximoStatuses);
    if (on) next.add(s); else next.delete(s);
    this.bulkMaximoStatuses = next;
    // Any criteria change invalidates the stale preview + result.
    this.bulkPreviewData.set(null);
    this.bulkResult.set(null);
  }

  toggleBulkLocalStatus(s: string, ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked;
    const next = new Set(this.bulkLocalStatuses);
    if (on) next.add(s); else next.delete(s);
    this.bulkLocalStatuses = next;
    this.bulkPreviewData.set(null);
    this.bulkResult.set(null);
  }

  bulkPreview(): void {
    if (this.bulkBusy() != null) return;
    this.bulkBusy.set('preview');
    this.bulkResult.set(null);
    this.api.bulkCancelPreview({
      maximoStatuses: [...this.bulkMaximoStatuses],
      localStatuses: [...this.bulkLocalStatuses],
      sampleLimit: 100,
    }).subscribe({
      next: r => {
        this.bulkPreviewData.set(r.responseData ?? null);
        this.bulkBusy.set(null);
      },
      error: e => {
        this.error.set(e?.error?.message ?? e?.message ?? 'Preview failed');
        this.bulkBusy.set(null);
      },
    });
  }

  bulkExecute(): void {
    const preview = this.bulkPreviewData();
    if (!preview || preview.candidateCount === 0) return;
    if (this.bulkBusy() != null) return;
    if (!confirm(`Cancel ${preview.candidateCount} Maximo WO(s)? This calls changeStatus → CAN on each and can only be undone in the Maximo Web UI.`)) return;
    this.bulkBusy.set('execute');
    this.api.bulkCancelExecute({
      maximoStatuses: [...this.bulkMaximoStatuses],
      localStatuses: [...this.bulkLocalStatuses],
      reason: (this.bulkReason || '').trim() || undefined,
    }).subscribe({
      next: r => {
        this.bulkResult.set(r.responseData ?? null);
        this.bulkBusy.set(null);
        // Fresh preview after execute so the count reflects the just-cancelled rows leaving
        // the query (they're now at CAN status).
        this.bulkPreview();
        // Refresh the main drift snapshot too — several buckets read the same rows.
        this.load();
      },
      error: e => {
        this.error.set(e?.error?.message ?? e?.message ?? 'Execute failed');
        this.bulkBusy.set(null);
      },
    });
  }
}
