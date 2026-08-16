import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import {
  AdminMaximoFieldListDriftService,
  MaximoFieldListDrift,
  MaximoFieldListDriftBucket
} from '../../../services/admin/admin-maximo-field-list-drift.service';

interface BucketTile {
  key: keyof Pick<MaximoFieldListDrift,
    'createPending' | 'cancelPending' | 'maximoClosedLocalOpen' | 'localClosedMaximoOpen'>;
  label: string;
  hint: string;
  severity: 'info' | 'warn' | 'danger';
}

const BUCKETS: BucketTile[] = [
  {
    key: 'createPending',
    label: 'Create backlog',
    hint: 'Rows whose initial Maximo create failed and are queued for backfill retry.',
    severity: 'warn'
  },
  {
    key: 'cancelPending',
    label: 'Cancel backlog',
    hint: 'Locally-deleted rows whose Maximo cancel call failed. Backfill will retry.',
    severity: 'warn'
  },
  {
    key: 'maximoClosedLocalOpen',
    label: 'Maximo closed / local open',
    hint: 'Ops closed the record in Maximo but the local PWA still shows it open. Someone should close it locally.',
    severity: 'info'
  },
  {
    key: 'localClosedMaximoOpen',
    label: 'Local closed / WO still open',
    hint: 'The wo-completion-status flip fired but bridge.complete() failed. WO is still in ops queue.',
    severity: 'danger'
  }
];

@Component({
  selector: 'app-admin-maximo-drift',
  standalone: true,
  imports: [CommonModule, DatePipe],
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
          Health of the Field List → Maximo bridge. Rows in the buckets below are either stuck (backfill will retry),
          or diverged (someone needs to reconcile). Bridge feature-flag: change
          <code>maximo.field-list.enabled</code> in <code>application-secrets.properties</code> to enable or disable.
          Empty buckets when the feature is off is expected.
        </p>

        <div class="error" *ngIf="error()">{{ error() }}</div>

        <ng-container *ngIf="snap() as s">
          <div class="meta">
            <span>Total routed to Maximo: <strong>{{ s.totalRoutedToMaximo }}</strong></span>
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
                    <span class="pill deleted" *ngIf="r.deleted">deleted</span>
                  </td>
                  <td>{{ r.dateModified | date:'short' }}</td>
                  <td>{{ r.submitterName || '—' }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #emptyBucket>
              <p class="empty">Nothing here — all clear.</p>
            </ng-template>
          </div>
        </ng-container>
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
    .meta { display: flex; gap: 24px; color: #666; font-size: 13px; margin-bottom: 14px; }
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
    button:not(.link) {
      background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px;
      cursor: pointer; font-size: 13px;
    }
    button:not(.link):disabled { background: #999; cursor: not-allowed; }
    button:not(.link):hover:not(:disabled) { background: #218838; }
  `]
})
export class AdminMaximoDriftComponent implements OnInit {
  private api = inject(AdminMaximoFieldListDriftService);

  buckets = BUCKETS;
  loading = signal(false);
  error = signal<string | null>(null);
  snap = signal<MaximoFieldListDrift | null>(null);
  selected = signal<BucketTile['key'] | null>(null);

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

  select(key: BucketTile['key'] | null): void {
    this.selected.set(this.selected() === key ? null : key);
  }

  bucketOf(s: MaximoFieldListDrift, key: BucketTile['key']): MaximoFieldListDriftBucket {
    return s[key];
  }

  labelFor(key: BucketTile['key']): string {
    return BUCKETS.find(b => b.key === key)?.label ?? key;
  }
}
