import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, switchMap, tap, catchError } from 'rxjs';
import { of } from 'rxjs';
import {
  SharePointSyncStatusService,
  SharePointSyncStatus,
} from '../../services/sharepoint-sync-status.service';
import { GlobalMessageService } from '../global-message/global-message.service';
import {
  EntitySyncCheckService,
  VerificationResult,
  EntityVerificationStatus,
  ThreeWayFieldDiff,
  ThreeWayFieldEntry
} from '../../services/sync/entity-sync-check.service';

@Component({
  selector: 'app-sp-sync-toolbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (status()?.dataStale) {
      <div class="stale-banner">
        Hub offline — data might be outdated
      </div>
    }
    <div class="sp-sync-bar">
      <span class="hub-chip" [class.online]="status()?.hubOnline" [class.offline]="status() && !status()?.hubOnline">
        {{ status()?.hubOnline ? 'Hub Online' : 'Hub Offline' }}
      </span>
      <button class="action-btn sync-btn" (click)="onSync()" [disabled]="isSyncing()">
        {{ isSyncing() ? 'Syncing...' : 'Sync SharePoint' }}
      </button>
      <span class="sync-time">{{ syncTimeDisplay() }}</span>
      @if (lastSyncSummary()) {
        <span class="sync-summary">{{ lastSyncSummary() }}</span>
      }

      <!-- Verification section -->
      <span class="separator">|</span>
      <button class="action-btn verify-btn" (click)="runVerification()" [disabled]="isVerifying()">
        <span class="material-icons" [class.spinning]="isVerifying()" style="font-size:14px">
          {{ isVerifying() ? 'sync' : 'verified' }}
        </span>
        {{ isVerifying() ? 'Checking...' : 'Verify' }}
      </button>
      @if (verifyResult()) {
        <span class="verify-chip" [class]="verifyStatusClass()" (click)="verifyExpanded.set(!verifyExpanded())">
          @if (!verifyResult()!.hubReachable) {
            Hub unreachable
          } @else if (verifyResult()!.issueCount === 0) {
            All {{ verifyResult()!.okCount }} OK
          } @else {
            {{ verifyResult()!.issueCount }} issue(s)
          }
        </span>
        <span class="source-chips">
          <span class="src-chip">L:{{ verifyResult()!.localCount }}</span>
          <span class="src-chip" [class.warn]="!verifyResult()!.hubReachable">H:{{ verifyResult()!.hubReachable ? verifyResult()!.hubCount : '?' }}</span>
          @if (verifyResult()!.spBacked) {
            <span class="src-chip" [class.warn]="!verifyResult()!.spReachable">SP:{{ verifyResult()!.spReachable ? verifyResult()!.spCount : '?' }}</span>
          }
        </span>
        @if (verifyResult()!.issueCount > 0) {
          <span class="material-icons expand-toggle" (click)="verifyExpanded.set(!verifyExpanded())" style="font-size:16px;cursor:pointer">
            {{ verifyExpanded() ? 'expand_less' : 'expand_more' }}
          </span>
        }
      }
    </div>

    <!-- Expanded issue list -->
    @if (verifyExpanded() && verifyResult() && verifyResult()!.issueCount > 0) {
      <div class="verify-details">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Local</th>
              <th>Hub</th>
              @if (verifyResult()!.spBacked) { <th>SP</th> }
              <th>Local Modified</th>
              <th>Hub Modified</th>
              @if (verifyResult()!.spBacked) { <th>SP Modified</th> }
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (issue of verifyResult()!.issues; track (issue.entityId ?? issue.sharepointId)) {
              <tr [class.selected]="selectedEntityId() === issue.entityId"
                  [class.sp-only-row]="issue.entityId == null"
                  (click)="onIssueRowClick(issue)"
                  [title]="issue.entityId == null ? 'SP-only item — no local entity to compare' : ''">
                <td class="mono">{{ issue.entityId ?? ('SP:' + issue.sharepointId) }}</td>
                <td><span class="presence" [class.yes]="issue.inLocal" [class.no]="!issue.inLocal">{{ issue.inLocal ? 'Yes' : 'No' }}</span></td>
                <td><span class="presence" [class.yes]="issue.inHub" [class.no]="!issue.inHub">{{ issue.inHub ? 'Yes' : 'No' }}</span></td>
                @if (verifyResult()!.spBacked) {
                  <td>
                    <span class="presence"
                      [class.yes]="issue.inSharePoint === true"
                      [class.no]="issue.inSharePoint === false"
                      [class.na]="issue.inSharePoint == null">
                      {{ issue.inSharePoint == null ? (verifyResult()!.spReachable ? '-' : '?') : (issue.inSharePoint ? 'Yes' : 'No') }}
                    </span>
                  </td>
                }
                <td class="ts">{{ issue.localModified ? (issue.localModified | date:'short') : '-' }}</td>
                <td class="ts">{{ issue.hubModified ? (issue.hubModified | date:'short') : '-' }}</td>
                @if (verifyResult()!.spBacked) {
                  <td class="ts">{{ issue.spModified ? (issue.spModified | date:'short') : '-' }}</td>
                }
                <td><span class="status-tag" [class]="'st-' + issue.overallStatus.toLowerCase()">{{ formatStatus(issue.overallStatus) }}</span></td>
                <td class="actions">
                  @if (issue.overallStatus === 'HUB_ONLY' || issue.overallStatus === 'STALE_LOCAL') {
                    <button class="res-btn" (click)="pullFromHub(issue); $event.stopPropagation()" title="Pull from hub">
                      <span class="material-icons">cloud_download</span>
                    </button>
                  }
                  @if (issue.overallStatus === 'LOCAL_ONLY' || issue.overallStatus === 'STALE_HUB') {
                    <button class="res-btn" (click)="pushToHub(issue); $event.stopPropagation()" title="Push to hub">
                      <span class="material-icons">cloud_upload</span>
                    </button>
                  }
                  @if (issue.inLocal && issue.inSharePoint) {
                    <button class="res-btn" (click)="acceptFromSp(issue); $event.stopPropagation()" title="Accept from SharePoint">
                      <span class="material-icons">table_view</span>
                    </button>
                  }
                  @if (issue.entityId != null) {
                    <button class="res-btn" (click)="openDiff(issue); $event.stopPropagation()" title="View field diff">
                      <span class="material-icons">compare_arrows</span>
                    </button>
                  } @else {
                    <span class="sp-only-label">SP only</span>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    <!-- 3-way field diff panel -->
    @if (diffResult()) {
      <div class="diff-panel">
        <div class="diff-header">
          <span>Field diff for {{ diffResult()!.entityType }} #{{ diffResult()!.entityId }}</span>
          <span class="diff-count">{{ diffResult()!.mismatchCount }} mismatch(es)</span>
          <button class="res-btn" (click)="diffResult.set(null)" title="Close">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="diff-actions">
          <button class="action-btn resolve-all-btn" (click)="resolveEntity('local')" title="Push local to hub">Accept Local</button>
          <button class="action-btn resolve-all-btn" (click)="resolveEntity('hub')" title="Pull hub to local">Accept Hub</button>
          @if (diffResult()!.spBacked) {
            <button class="action-btn resolve-all-btn" (click)="resolveEntity('sp')" title="Accept SharePoint">Accept SP</button>
          }
        </div>
        <table class="diff-table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Local</th>
              <th>Hub</th>
              @if (diffResult()!.spBacked) { <th>SharePoint</th> }
            </tr>
          </thead>
          <tbody>
            @for (f of diffResult()!.fields; track f.fieldName) {
              @if (!f.allMatch) {
                <tr>
                  <td class="field-name">{{ f.fieldName }}</td>
                  <td [class.winner]="f.localHubMatch && f.localSpMatch"
                      [class.diff]="!f.localHubMatch || !f.localSpMatch">{{ f.localValue ?? '(null)' }}</td>
                  <td [class.diff]="!f.localHubMatch">{{ f.hubValue ?? '(null)' }}</td>
                  @if (diffResult()!.spBacked) {
                    <td [class.diff]="f.spMapped && !f.localSpMatch">{{ f.spMapped ? (f.spValue ?? '(null)') : '-' }}</td>
                  }
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    }
  `,
  styles: [`
    :host { display: block; }

    .stale-banner {
      background: rgba(255, 152, 0, 0.15);
      border-left: 3px solid #ff9800;
      color: #ffb74d;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
    }

    .sp-sync-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 4px 8px;
      font-size: 12px;
      border-bottom: 1px solid var(--border-color, #444);
      flex-shrink: 0;
    }

    .hub-chip {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    .hub-chip.online { background: rgba(76, 175, 80, 0.2); color: #81c784; }
    .hub-chip.offline { background: rgba(244, 67, 54, 0.2); color: #e57373; }

    .action-btn {
      padding: 4px 12px;
      border: none;
      border-radius: 3px;
      cursor: pointer;
      font-size: 12px;
      font-weight: 500;
    }

    .sync-btn {
      background-color: var(--surface-secondary, #333);
      color: var(--text-primary, #e0e0e0);
      border: 1px solid var(--border-color, #444);
    }
    .sync-btn:hover:not(:disabled) { background-color: var(--surface-hover, #444); }
    .sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .sync-time { color: var(--text-secondary, #aaa); font-style: italic; }
    .sync-summary { color: var(--text-secondary, #aaa); margin-left: auto; }

    .separator { color: var(--border-color, #444); }

    .verify-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      background-color: var(--surface-secondary, #333);
      color: var(--text-primary, #e0e0e0);
      border: 1px solid var(--border-color, #444);
    }
    .verify-btn:hover:not(:disabled) { background-color: var(--surface-hover, #444); }
    .verify-btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .verify-chip {
      padding: 2px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
    }
    .verify-chip.ok { background: rgba(76, 175, 80, 0.2); color: #81c784; }
    .verify-chip.warn { background: rgba(255, 152, 0, 0.2); color: #ffb74d; }
    .verify-chip.error { background: rgba(244, 67, 54, 0.2); color: #e57373; }

    .source-chips { display: flex; gap: 4px; }
    .src-chip {
      font-size: 10px;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 3px;
      background: rgba(255,255,255,0.06);
      color: var(--text-secondary, #aaa);
    }
    .src-chip.warn { color: #ff9800; background: rgba(255,152,0,0.12); }

    .expand-toggle { color: var(--text-secondary, #aaa); }

    .spinning { animation: spin 1s linear infinite; }
    @keyframes spin { 100% { transform: rotate(360deg); } }

    /* ---- Issue table ---- */
    .verify-details {
      background: var(--card-background, #1a1a2e);
      border-bottom: 1px solid var(--border-color);
      max-height: 280px;
      overflow-y: auto;
    }
    .verify-details table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .verify-details th {
      text-align: left; padding: 5px 8px; font-weight: 600;
      color: var(--text-secondary, #aaa);
      border-bottom: 1px solid var(--border-color);
      position: sticky; top: 0;
      background: var(--card-background, #1a1a2e);
    }
    .verify-details td {
      padding: 4px 8px; color: var(--text-primary, #e0e0e0);
      border-bottom: 1px solid rgba(255,255,255,0.04);
    }
    .verify-details tr { cursor: pointer; }
    .verify-details tr:hover td { background: var(--hover-color, rgba(255,255,255,0.04)); }
    .verify-details tr.selected td { background: rgba(33,150,243,0.1); }

    .mono { font-family: monospace; font-size: 11px; }
    .ts { font-size: 11px; white-space: nowrap; color: var(--text-secondary, #aaa); }
    .presence { font-weight: 600; font-size: 11px; }
    .presence.yes { color: #4caf50; }
    .presence.no { color: #f44336; }
    .presence.na { color: #666; }

    .status-tag {
      display: inline-block; font-size: 10px; font-weight: 700;
      padding: 2px 6px; border-radius: 3px;
      text-transform: uppercase; letter-spacing: 0.3px;
    }
    .st-local_only { background: rgba(33,150,243,0.15); color: #42a5f5; }
    .st-hub_only { background: rgba(156,39,176,0.15); color: #ce93d8; }
    .st-stale_local, .st-stale_hub { background: rgba(255,152,0,0.15); color: #ffb74d; }
    .st-missing_from_sp { background: rgba(244,67,54,0.15); color: #ef5350; }
    .st-sp_only { background: rgba(0,150,136,0.15); color: #4db6ac; }
    .st-mismatch { background: rgba(244,67,54,0.15); color: #ef5350; }

    .actions { white-space: nowrap; }
    .res-btn {
      background: none; border: 1px solid var(--border-color, #444);
      border-radius: 3px; color: var(--text-secondary, #aaa);
      cursor: pointer; padding: 2px 4px; display: inline-flex;
      align-items: center; margin-right: 3px;
    }
    .res-btn:hover { background: var(--hover-color, #333); color: var(--text-primary, #e0e0e0); }
    .res-btn .material-icons { font-size: 14px; }
    .sp-only-row { opacity: 0.6; cursor: default !important; }
    .sp-only-label { font-size: 10px; color: #4db6ac; font-style: italic; }

    /* ---- 3-way diff panel ---- */
    .diff-panel {
      background: var(--card-background, #1a1a2e);
      border-bottom: 2px solid var(--accent-color, #3b82f6);
      max-height: 350px;
      overflow-y: auto;
    }
    .diff-header {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 10px; font-size: 13px; font-weight: 600;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
    }
    .diff-count { font-size: 11px; color: #ffb74d; margin-left: auto; }

    .diff-actions {
      display: flex; gap: 6px; padding: 6px 10px;
      border-bottom: 1px solid var(--border-color);
    }
    .resolve-all-btn {
      background: var(--surface-secondary, #333);
      color: var(--text-primary, #e0e0e0);
      border: 1px solid var(--border-color, #444);
      font-size: 11px; padding: 3px 10px;
    }
    .resolve-all-btn:hover { background: var(--surface-hover, #444); }

    .diff-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .diff-table th {
      text-align: left; padding: 5px 8px; font-weight: 600;
      color: var(--text-secondary); border-bottom: 1px solid var(--border-color);
      position: sticky; top: 0; background: var(--card-background, #1a1a2e);
    }
    .diff-table td {
      padding: 4px 8px; color: var(--text-primary);
      border-bottom: 1px solid rgba(255,255,255,0.04);
      max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .field-name { font-weight: 500; color: var(--text-secondary); white-space: nowrap; }
    .diff-table td.winner { color: #81c784; }
    .diff-table td.diff { color: #ffb74d; background: rgba(255,152,0,0.06); }
  `]
})
export class SpSyncToolbarComponent implements OnInit {
  @Input({ required: true }) entityType!: string;
  @Input() entityIds?: number[];
  @Output() syncComplete = new EventEmitter<void>();

  private syncStatusService = inject(SharePointSyncStatusService);
  private syncCheckService = inject(EntitySyncCheckService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  status = signal<SharePointSyncStatus | null>(null);
  isSyncing = signal(false);
  lastSyncSummary = signal<string>('');
  syncTimeDisplay = signal<string>('Never synced');

  // Verification state
  isVerifying = signal(false);
  verifyResult = signal<VerificationResult | null>(null);
  verifyExpanded = signal(false);
  selectedEntityId = signal<number | null>(null);
  diffResult = signal<ThreeWayFieldDiff | null>(null);

  ngOnInit(): void {
    this.fetchStatus();

    // Poll status from backend every 30s
    interval(30000).pipe(
      switchMap(() => this.syncStatusService.getStatus(this.entityType)),
      tap(status => {
        if (status) {
          this.status.set(status);
          this.updateTimeDisplay();
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();

    // Update time-ago display every 10s (client-side)
    interval(10000).pipe(
      tap(() => this.updateTimeDisplay()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  onSync(): void {
    this.isSyncing.set(true);
    this.syncStatusService.triggerSync(this.entityType).pipe(
      tap(resp => {
        const r = resp.responseData;
        const total = (r?.created ?? 0) + (r?.updated ?? 0) + (r?.autoClosed ?? 0);
        this.messageService.showSuccess(
          `${this.entityType} sync: ${total} changes (${r?.created ?? 0} new, ${r?.updated ?? 0} updated)`
        );
        this.lastSyncSummary.set(
          `${r?.created ?? 0} new, ${r?.updated ?? 0} upd, ${r?.skipped ?? 0} skip`
        );
        this.isSyncing.set(false);
        this.fetchStatus();
        this.syncComplete.emit();
      }),
      catchError(err => {
        this.messageService.showError('Sync failed: ' + (err.error?.message || err.message));
        this.isSyncing.set(false);
        return of(null);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  // ==================== Verification ====================

  runVerification(): void {
    this.isVerifying.set(true);
    this.diffResult.set(null);
    this.syncCheckService.verify(this.entityType, this.entityIds)
      .pipe(
        catchError(err => {
          console.error('[Verify] Failed:', err);
          this.isVerifying.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        this.verifyResult.set(result);
        this.isVerifying.set(false);
      });
  }

  verifyStatusClass(): string {
    const r = this.verifyResult();
    if (!r || !r.hubReachable) return 'error';
    if (r.issueCount === 0) return 'ok';
    if (r.issueCount <= 3) return 'warn';
    return 'error';
  }

  formatStatus(status: string): string {
    return status.replace(/_/g, ' ');
  }

  onIssueRowClick(issue: EntityVerificationStatus): void {
    this.selectedEntityId.set(issue.entityId);
    this.openDiff(issue);
  }

  openDiff(issue: EntityVerificationStatus): void {
    if (issue.entityId == null) return;
    this.selectedEntityId.set(issue.entityId);
    this.syncCheckService.threeWayDiff(this.entityType, issue.entityId)
      .pipe(
        catchError(err => {
          console.error('[Verify] Diff failed:', err);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(diff => this.diffResult.set(diff));
  }

  // ==================== Resolution ====================

  pullFromHub(issue: EntityVerificationStatus): void {
    if (issue.entityId == null) return;
    this.syncCheckService.pullFromHub(this.entityType, issue.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.messageService.showSuccess('Pulled from hub'); this.runVerification(); },
        error: (err) => this.messageService.showError('Pull failed: ' + err.message)
      });
  }

  pushToHub(issue: EntityVerificationStatus): void {
    if (issue.entityId == null) return;
    this.syncCheckService.pushToHub(this.entityType, issue.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.messageService.showSuccess('Pushed to hub'); this.runVerification(); },
        error: (err) => this.messageService.showError('Push failed: ' + err.message)
      });
  }

  acceptFromSp(issue: EntityVerificationStatus): void {
    if (issue.entityId == null) return;
    this.syncCheckService.acceptFromSp(this.entityType, issue.entityId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => { this.messageService.showSuccess('Accepted from SharePoint'); this.runVerification(); },
        error: (err) => this.messageService.showError('Accept SP failed: ' + err.message)
      });
  }

  resolveEntity(source: 'local' | 'hub' | 'sp'): void {
    const entityId = this.selectedEntityId();
    if (!entityId) return;

    let action$;
    if (source === 'local') action$ = this.syncCheckService.pushToHub(this.entityType, entityId);
    else if (source === 'hub') action$ = this.syncCheckService.pullFromHub(this.entityType, entityId);
    else action$ = this.syncCheckService.acceptFromSp(this.entityType, entityId);

    action$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messageService.showSuccess(`Accepted from ${source}`);
        this.diffResult.set(null);
        this.runVerification();
      },
      error: (err) => this.messageService.showError('Resolve failed: ' + err.message)
    });
  }

  // ==================== Private helpers ====================

  private fetchStatus(): void {
    this.syncStatusService.getStatus(this.entityType).pipe(
      tap(status => {
        if (status) {
          this.status.set(status);
          this.updateTimeDisplay();
        }
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe();
  }

  private updateTimeDisplay(): void {
    const s = this.status();
    if (!s || s.lastSyncTimeMs === 0) {
      this.syncTimeDisplay.set('Never synced');
      return;
    }
    const seconds = Math.floor((Date.now() - s.lastSyncTimeMs) / 1000);
    if (seconds < 60) {
      this.syncTimeDisplay.set(`${seconds}s ago`);
    } else if (seconds < 3600) {
      this.syncTimeDisplay.set(`${Math.floor(seconds / 60)}m ago`);
    } else {
      this.syncTimeDisplay.set(`${Math.floor(seconds / 3600)}h ago`);
    }
  }
}
