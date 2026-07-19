import { Component, inject, OnDestroy, OnInit, signal, computed, PLATFORM_ID, ElementRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SyncUpdateService } from '../../services/sync/sync-update.service';
import { SyncStatusService, SyncHealthStatusType, SyncStatus } from '../../services/sync-status.service';
import { DriftService } from '../../services/drift.service';

/**
 * Sync status indicator component for the header.
 * Shows sync server status, sync health, and provides a popover with
 * detailed status, sync toggle, and quick actions.
 *
 * State priority (highest to lowest):
 * 1. Sync disabled (grey) - runtime toggle is off
 * 2. Server unavailable (red) - serverAvailable=false from backend status
 * 3. Connected + health state:
 *    - OUT_OF_SYNC (red)
 *    - POSSIBLY_OUT_OF_SYNC (orange)
 *    - IN_SYNC / UNKNOWN (green)
 */
@Component({
  selector: 'app-sync-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule, MatSlideToggleModule, MatButtonModule, MatDividerModule, FormsModule],
  template: `
    <div class="sync-indicator-wrapper">
      <div class="sync-indicator"
           (click)="onIconClick($event)"
           [class]="iconClass()"
           [matTooltip]="popoverOpen() ? '' : tooltipText()">
        <mat-icon [class.pulse]="shouldPulse()">
          {{ iconName() }}
        </mat-icon>
        @if (recentUpdateCount() > 0) {
          <span class="update-badge">{{ recentUpdateCount() > 99 ? '99+' : recentUpdateCount() }}</span>
        }
        @if (showWarningBadge()) {
          <span class="warning-indicator" [class.error]="syncHealthState() === 'OUT_OF_SYNC'">!</span>
        }
      </div>

      @if (popoverOpen()) {
        <div class="sync-popover"
             [style.top.px]="popoverTop()"
             [style.right.px]="popoverRight()"
             (click)="$event.stopPropagation()">
          <div class="popover-header">
            <span class="popover-title">Sync Status</span>
            <mat-icon class="popover-close" (click)="closePopover()">close</mat-icon>
          </div>

          <div class="popover-body">
            <!-- Status Row -->
            <div class="status-row">
              <mat-icon [class]="statusIconClass()">{{ iconName() }}</mat-icon>
              <div class="status-text">
                <span class="status-label">{{ statusLabel() }}</span>
                <span class="status-detail">{{ statusDetail() }}</span>
              </div>
            </div>

            <mat-divider></mat-divider>

            <!-- Info Grid -->
            <div class="info-grid">
              @if (syncStatus()) {
                <div class="info-item">
                  <span class="info-label">Target</span>
                  <span class="info-value">{{ syncStatus()?.syncMode === 'SERVER' ? 'Hub' : 'Local only' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Local Pending</span>
                  <span class="info-value">{{ syncStatus()?.pendingServerChanges ?? 0 }}</span>
                </div>
              }
              @if (serverPendingCount() > 0) {
                <div class="info-item">
                  <span class="info-label">Server Pending</span>
                  <span class="info-value">{{ serverPendingCount() }}</span>
                </div>
              }
              @if (recentUpdateCount() > 0) {
                <div class="info-item">
                  <span class="info-label">Recent Updates</span>
                  <span class="info-value">{{ recentUpdateCount() }}</span>
                </div>
              }
            </div>

            @if (driftFlagged() > 0 || driftAcknowledged() > 0) {
              <div class="resync-suggestion drift" (click)="goToDrift()"
                   title="Open the Drift Center to review and resolve">
                @if (driftFlagged() > 0) {
                  {{ driftFlagged() }} field{{ driftFlagged() === 1 ? '' : 's' }} drifting from hub / SharePoint — review in Drift Center →
                } @else {
                  {{ driftAcknowledged() }} acknowledged drift{{ driftAcknowledged() === 1 ? '' : 's' }} — review in Drift Center →
                }
              </div>
            }

            <mat-divider></mat-divider>

            <!-- Sync Toggle -->
            <div class="toggle-row">
              <span class="toggle-label">Sync Enabled</span>
              <mat-slide-toggle
                [checked]="syncEnabled()"
                [disabled]="togglingSync()"
                (change)="onSyncToggle($event.checked)">
              </mat-slide-toggle>
            </div>

            @if (!syncEnabled()) {
              <div class="disabled-warning">
                Sync is off. Local changes will not be shared.
              </div>
            }

            <mat-divider></mat-divider>

            <!-- Actions -->
            <div class="popover-actions">
              <button mat-button (click)="syncNow()" [disabled]="!syncEnabled() || syncingNow()">
                <mat-icon>sync</mat-icon>
                {{ syncingNow() ? 'Syncing...' : 'Sync Now' }}
              </button>
              <button mat-button (click)="goToDrift()">
                <mat-icon>rule</mat-icon>
                Drift
              </button>
              <button mat-button (click)="goToDashboard()">
                <mat-icon>dashboard</mat-icon>
                Dashboard
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sync-indicator-wrapper {
      position: relative;
    }

    .sync-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background-color 0.2s ease;
    }

    .sync-indicator:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .sync-indicator.state-connected mat-icon { color: #4caf50; }
    .sync-indicator.state-connecting mat-icon { color: #ff9800; }
    .sync-indicator.state-disconnected mat-icon { color: #f44336; }
    .sync-indicator.state-disabled mat-icon { color: #9e9e9e; }
    .sync-indicator.state-out-of-sync mat-icon { color: #f44336; }
    .sync-indicator.state-possibly-out-of-sync mat-icon { color: #ff9800; }
    .sync-indicator.state-catching-up mat-icon { color: #2196f3; }

    .pulse {
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .update-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      background-color: #2196f3;
      color: white;
      font-size: 10px;
      font-weight: bold;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 14px;
      text-align: center;
    }

    .warning-indicator {
      position: absolute;
      bottom: 2px;
      right: 2px;
      background-color: #ff9800;
      color: white;
      font-size: 9px;
      font-weight: bold;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .warning-indicator.error {
      background-color: #f44336;
      animation: pulse 1s ease-in-out infinite;
    }

    /* Popover */
    .sync-popover {
      position: fixed;
      width: 300px;
      background: var(--card-background, #fff);
      color: var(--primary-text, #333);
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      z-index: 1000;
      overflow: hidden;
    }

    .popover-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
    }

    .popover-title {
      font-weight: 600;
      font-size: 14px;
    }

    .popover-close {
      cursor: pointer;
      font-size: 18px;
      width: 18px;
      height: 18px;
      opacity: 0.6;
    }

    .popover-close:hover { opacity: 1; }

    .popover-body {
      padding: 12px 16px;
    }

    .status-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .status-row mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .status-row .icon-green { color: #4caf50; }
    .status-row .icon-orange { color: #ff9800; }
    .status-row .icon-red { color: #f44336; }
    .status-row .icon-grey { color: #9e9e9e; }
    .status-row .icon-blue { color: #2196f3; }

    .status-text {
      display: flex;
      flex-direction: column;
    }

    .status-label {
      font-weight: 600;
      font-size: 13px;
    }

    .status-detail {
      font-size: 11px;
      opacity: 0.7;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 12px 0;
    }

    .info-item {
      display: flex;
      flex-direction: column;
    }

    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      opacity: 0.5;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 13px;
      font-weight: 500;
    }

    .resync-suggestion {
      background: rgba(255, 152, 0, 0.1);
      border-left: 3px solid #ff9800;
      padding: 8px 12px;
      font-size: 12px;
      margin: 8px 0;
      border-radius: 0 4px 4px 0;
    }

    .resync-suggestion.drift {
      cursor: pointer;
    }

    .resync-suggestion.drift:hover {
      background: rgba(255, 152, 0, 0.18);
    }

    .resync-suggestion.auto-resync-active {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .resync-suggestion.auto-resync-active .spin {
      font-size: 16px;
      width: 16px;
      height: 16px;
      animation: spin 1.5s linear infinite;
    }

    .resync-suggestion.auto-resync-failed {
      background: rgba(244, 67, 54, 0.1);
      border-left-color: #f44336;
    }

    .resync-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 12px 0;
    }

    .toggle-label {
      font-size: 13px;
      font-weight: 500;
    }

    .disabled-warning {
      background: rgba(244, 67, 54, 0.1);
      border-left: 3px solid #f44336;
      padding: 8px 12px;
      font-size: 12px;
      margin: 4px 0 8px;
      border-radius: 0 4px 4px 0;
    }

    .popover-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .popover-actions button {
      flex: 1;
      font-size: 12px;
    }

    .popover-actions mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }
  `]
})
export class SyncIndicatorComponent implements OnInit, OnDestroy {
  private syncUpdateService = inject(SyncUpdateService);
  private syncStatusService = inject(SyncStatusService);
  private driftService = inject(DriftService);
  private platformId = inject(PLATFORM_ID);
  private router = inject(Router);
  private elementRef = inject(ElementRef);
  private subscriptions: Subscription[] = [];
  private isBrowser: boolean;
  private documentClickListener: ((e: MouseEvent) => void) | null = null;

  // Signals for reactive state
  serverAvailable = signal<boolean | null>(null); // null = unknown/not loaded yet
  sseConnected = signal<boolean>(false);
  syncHealthState = signal<SyncHealthStatusType>('UNKNOWN');
  syncHealthMessage = signal<string>('');
  suggestResync = signal<boolean>(false);
  serverPendingCount = signal<number>(0);
  recentUpdateCount = signal<number>(0);
  syncEnabled = signal<boolean>(true);
  syncStatus = signal<SyncStatus | null>(null);
  popoverOpen = signal<boolean>(false);
  togglingSync = signal<boolean>(false);
  syncingNow = signal<boolean>(false);
  private updateTimer: any = null;
  private statusPollTimer: any = null;
  private driftSummaryTimer: any = null;

  // NEW drift signal — the accurate content-hash flagged/acknowledged counts (DriftService.summary), which
  // replace the old count/timestamp "sync health" heuristic that read green while fields were actually drifting.
  driftFlagged = computed(() => this.driftService.summary().flagged);
  driftAcknowledged = computed(() => this.driftService.summary().acknowledged);

  // Computed: determine the effective visual state
  // Uses serverAvailable from backend /api/field-sync/status (NOT frontend SSE connection state)
  effectiveState = computed(() => {
    if (!this.syncEnabled()) return 'disabled' as const;

    const available = this.serverAvailable();
    // If we haven't loaded status yet, show connecting
    if (available === null) return 'connecting' as const;
    // If remote sync server is not available, show disconnected
    if (!available) return 'disconnected' as const;

    // Actively behind — the hub has changes for us we haven't applied yet (e.g. just reconnected
    // after being offline). This is a FRIENDLY, transient "catching up" state, not an error — it
    // avoids a normal reconnect catch-up reading as "Possibly Out of Sync" or silently as green.
    if (this.serverPendingCount() > 0) return 'catching-up' as const;

    // Server is available — decide sync state from the ACCURATE content-hash drift (not the old count/time
    // heuristic): FLAGGED drift needs attention (red); drift that was acknowledged-but-not-resolved is a
    // softer warning (orange); none = green/up-to-date.
    if (this.driftFlagged() > 0) return 'out-of-sync' as const;
    if (this.driftAcknowledged() > 0) return 'possibly-out-of-sync' as const;
    return 'connected' as const;
  });

  iconName = computed(() => {
    switch (this.effectiveState()) {
      case 'disabled': return 'sync_disabled';
      case 'disconnected': return 'cloud_off';
      case 'connecting': return 'cloud_sync';
      case 'out-of-sync': return 'sync_problem';
      case 'possibly-out-of-sync': return 'sync';
      case 'catching-up': return 'sync';
      case 'connected': return 'cloud_done';
    }
  });

  iconClass = computed(() => `state-${this.effectiveState()}`);

  shouldPulse = computed(() => {
    const state = this.effectiveState();
    return state === 'connecting' || state === 'out-of-sync' || state === 'catching-up';
  });

  showWarningBadge = computed(() => {
    const state = this.effectiveState();
    // No alarming badge while merely catching up — that's a friendly, transient state.
    return this.syncEnabled() && this.serverAvailable() === true &&
      (state === 'out-of-sync' || state === 'possibly-out-of-sync');
  });

  statusLabel = computed(() => {
    switch (this.effectiveState()) {
      case 'disabled': return 'Sync Disabled';
      case 'disconnected': return 'Server Unavailable';
      case 'connecting': return 'Checking...';
      case 'out-of-sync': return 'Out of Sync';
      case 'possibly-out-of-sync': return 'Possibly Out of Sync';
      case 'catching-up': return 'Syncing…';
      case 'connected': return 'All Up to Date';
    }
  });

  statusDetail = computed(() => {
    const state = this.effectiveState();
    if (state === 'disabled') return 'Toggle sync on to resume synchronization';
    if (state === 'disconnected') return 'Cannot reach sync server';
    if (state === 'connecting') return 'Checking sync server status...';
    if (state === 'catching-up') {
      const n = this.serverPendingCount();
      return n > 0 ? `Catching up — ${n} change${n === 1 ? '' : 's'} to apply` : 'Catching up…';
    }
    if (state === 'out-of-sync' || state === 'possibly-out-of-sync') {
      const f = this.driftFlagged(); const a = this.driftAcknowledged();
      if (f > 0) return `${f} field${f === 1 ? '' : 's'} drifting from hub / SharePoint — open the Drift Center`;
      if (a > 0) return `${a} acknowledged drift${a === 1 ? '' : 's'} — review in the Drift Center`;
      return this.syncHealthMessage();
    }
    if (state === 'connected') return 'Connected and synchronized';
    return '';
  });

  statusIconClass = computed(() => {
    switch (this.effectiveState()) {
      case 'disabled': return 'icon-grey';
      case 'disconnected':
      case 'out-of-sync': return 'icon-red';
      case 'connecting':
      case 'possibly-out-of-sync': return 'icon-orange';
      case 'catching-up': return 'icon-blue';
      case 'connected': return 'icon-green';
    }
  });

  tooltipText = computed(() => {
    return this.statusLabel();
  });

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) return;

    // Start polling for sync health check (every 60 seconds)
    this.syncStatusService.startHealthCheckPolling(60000);

    // Load initial sync toggle state
    this.loadSyncToggleState();

    // Poll status every 15 seconds for accurate server availability
    this.startStatusPolling();

    // Keep the accurate content-hash drift summary fresh for the badge — initial + every 60s.
    this.driftService.refreshSummary();
    this.driftSummaryTimer = setInterval(() => this.driftService.refreshSummary(), 60000);

    // Subscribe to sync health check updates
    this.subscriptions.push(
      this.syncStatusService.syncHealth$.subscribe(health => {
        if (health) {
          this.syncHealthState.set(health.syncStatus);
          this.syncHealthMessage.set(health.message || '');
          this.suggestResync.set(health.suggestResync || false);
          this.serverPendingCount.set(health.serverPendingChangesForClient ?? 0);
        }
      })
    );

    // Subscribe to entity updates to show recent activity badge
    this.subscriptions.push(
      this.syncUpdateService.entityUpdated$.subscribe(() => {
        this.incrementUpdateCount();
      })
    );

    // Subscribe to sync complete events
    this.subscriptions.push(
      this.syncUpdateService.syncComplete$.subscribe(event => {
        if (event.changesApplied > 0) {
          this.recentUpdateCount.update(count => count + event.changesApplied);
          this.scheduleCountReset();
        }
      })
    );

    // Add document click listener for closing popover
    this.documentClickListener = (event: MouseEvent) => {
      if (this.popoverOpen() && !this.elementRef.nativeElement.contains(event.target)) {
        this.popoverOpen.set(false);
      }
    };
    document.addEventListener('click', this.documentClickListener);
  }

  popoverTop = signal<number>(0);
  popoverRight = signal<number>(0);

  onIconClick(event: MouseEvent): void {
    event.stopPropagation();
    // Calculate position before toggling
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    this.popoverTop.set(rect.bottom + 4);
    this.popoverRight.set(window.innerWidth - rect.right);
    this.popoverOpen.update(open => !open);
    if (this.popoverOpen()) {
      this.loadSyncStatus();
      this.loadSyncToggleState();
    }
  }

  closePopover(): void {
    this.popoverOpen.set(false);
  }

  onSyncToggle(enabled: boolean): void {
    this.togglingSync.set(true);
    this.syncStatusService.setSyncToggle(enabled).subscribe({
      next: (res) => {
        this.syncEnabled.set(res.enabled);
        this.togglingSync.set(false);
        if (!res.enabled) {
          this.serverAvailable.set(null);
        }
        // Refresh status after toggle
        setTimeout(() => this.loadSyncStatus(), 2000);
      },
      error: () => {
        this.togglingSync.set(false);
      }
    });
  }

  syncNow(): void {
    this.syncingNow.set(true);
    this.syncStatusService.triggerSync().subscribe({
      next: () => {
        this.syncingNow.set(false);
        this.loadSyncStatus();
      },
      error: () => {
        this.syncingNow.set(false);
      }
    });
  }

  goToActivity(): void {
    this.closePopover();
    this.router.navigate(['/sync/activity']);
  }

  goToDrift(): void {
    this.closePopover();
    this.router.navigate(['/sync/drift']);
  }

  goToDashboard(): void {
    this.closePopover();
    this.router.navigate(['/sync']);
  }

  private loadSyncToggleState(): void {
    this.syncStatusService.getSyncToggle().subscribe({
      next: (state) => {
        this.syncEnabled.set(state.enabled);
      },
      error: () => {}
    });
  }

  private loadSyncStatus(): void {
    this.syncStatusService.fetchStatus().subscribe({
      next: (status) => {
        if (status) {
          this.syncStatus.set(status);
          // Update serverAvailable from backend status endpoint
          // This reflects whether the REMOTE sync server is reachable
          if (status.serverAvailable !== undefined) {
            this.serverAvailable.set(status.serverAvailable);
          } else if (status.serverSyncEnabled === false) {
            // Sync not enabled in config
            this.serverAvailable.set(false);
          }
        }
      },
      error: () => {
        // Can't even reach local backend
        this.serverAvailable.set(false);
      }
    });
  }

  private startStatusPolling(): void {
    // Initial load
    this.loadSyncStatus();
    // Poll every 15 seconds for responsive server availability detection
    this.statusPollTimer = setInterval(() => {
      this.loadSyncStatus();
    }, 15000);
  }

  private incrementUpdateCount(): void {
    this.recentUpdateCount.update(count => Math.min(count + 1, 99));
    this.scheduleCountReset();
  }

  private scheduleCountReset(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }
    this.updateTimer = setTimeout(() => {
      this.recentUpdateCount.set(0);
    }, 30000);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    if (this.isBrowser) {
      this.syncStatusService.stopHealthCheckPolling();
      if (this.updateTimer) clearTimeout(this.updateTimer);
      if (this.statusPollTimer) clearInterval(this.statusPollTimer);
      if (this.driftSummaryTimer) clearInterval(this.driftSummaryTimer);
      if (this.documentClickListener) {
        document.removeEventListener('click', this.documentClickListener);
      }
    }
  }
}
