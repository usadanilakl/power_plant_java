import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ElectronService, AppStatus, SyncStatusInfo, UpdateInfo, UpdateProgress, ColdResyncProgress, IpcResult
} from '../../services/electron.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sync-updates',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1 class="page-title">Sync & Updates</h1>

      <!-- Sync Status Section -->
      <section class="card">
        <div class="card-header">
          <h2>Database Sync</h2>
          <span class="server-indicator" [class.online]="syncStatus?.serverAvailable">
            {{ syncStatus?.serverAvailable ? 'Server Online' : 'Server Offline' }}
          </span>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Last Sync</span>
              <span class="info-value" [class.stale]="isSyncStale">
                {{ syncStatus && syncStatus.lastSyncTime ? formatRelativeTime(syncStatus.lastSyncTime) : 'Never' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Pending Changes</span>
              <span class="info-value">{{ syncStatus?.pendingChanges ?? 0 }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">SSE Connection</span>
              <span class="info-value" [class.connected]="syncStatus?.sseConnected">
                {{ syncStatus?.sseConnected ? 'Connected' : 'Disconnected' }}
              </span>
            </div>
            <div class="info-item" *ngIf="syncStatus?.syncInProgress">
              <span class="info-label">Status</span>
              <span class="info-value syncing">Syncing...</span>
            </div>
          </div>

          <div class="stale-warning" *ngIf="isSyncStale">
            Database sync is {{ staleDays !== null ? staleDays + ' days' : '' }} old. A full resync is recommended.
          </div>

          <div class="resync-progress" *ngIf="resyncInProgress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: 100%"></div>
            </div>
            <span class="progress-text">Full resync in progress...</span>
          </div>

          <div class="card-actions">
            <button class="btn btn-primary"
                    [disabled]="appState !== 'running' || resyncInProgress"
                    (click)="refreshSyncStatus()">
              Refresh Status
            </button>
            <button class="btn btn-warning"
                    [disabled]="appState !== 'running' || resyncInProgress"
                    (click)="triggerResync()">
              Full Resync
            </button>
          </div>
          <p class="hint" *ngIf="appState !== 'running'">Spring Boot must be running for sync operations.</p>
          <p class="success-msg" *ngIf="resyncMessage">{{ resyncMessage }}</p>
        </div>
      </section>

      <!-- Download from Server (Cold Resync) Section -->
      <section class="card">
        <div class="card-header">
          <h2>Download from Server</h2>
          <span class="server-indicator" [class.online]="syncStatus?.serverAvailable">
            {{ syncStatus?.serverAvailable ? 'Server Online' : 'Server Offline' }}
          </span>
        </div>
        <div class="card-body">
          <p class="hint" style="margin-top: 0; margin-bottom: 12px">
            Download the full database and all files directly from the sync server.
            Spring Boot must be stopped before downloading.
          </p>

          <div class="stale-warning" *ngIf="appState === 'running' && !coldResyncInProgress">
            Stop Spring Boot before downloading. The database cannot be replaced while it is running.
          </div>

          <div class="resync-progress" *ngIf="coldResyncProgress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="coldResyncProgress.progressPercent || 0"></div>
            </div>
            <span class="progress-text">
              {{ coldResyncProgress.statusMessage }}
              <span *ngIf="coldResyncProgress.progressPercent"> {{ coldResyncProgress.progressPercent }}%</span>
              <span *ngIf="coldResyncProgress.filesDownloaded && coldResyncProgress.filesTotal">
                ({{ coldResyncProgress.filesDownloaded }}/{{ coldResyncProgress.filesTotal }} files)
              </span>
            </span>
          </div>

          <div class="error-msg" *ngIf="coldResyncProgress?.phase === 'error'">
            Download failed: {{ coldResyncProgress?.error }}
          </div>

          <div class="success-msg" *ngIf="coldResyncProgress?.phase === 'done'" style="margin-bottom: 12px">
            Database and files downloaded successfully. Start Spring Boot to use the new data.
          </div>

          <div class="card-actions">
            <button class="btn btn-primary"
                    [disabled]="appState === 'running' || coldResyncInProgress || !deviceConfig"
                    (click)="triggerColdResync()">
              Download from Server
            </button>
            <button class="btn btn-secondary"
                    *ngIf="coldResyncProgress?.phase === 'done'"
                    (click)="startAfterColdResync()">
              Start Spring Boot
            </button>
          </div>
          <p class="hint" *ngIf="!deviceConfig">Device identity must be configured first.</p>
          <p class="success-msg" *ngIf="coldResyncMessage">{{ coldResyncMessage }}</p>
        </div>
      </section>

      <!-- Application Update Section -->
      <section class="card">
        <div class="card-header">
          <h2>Application Update</h2>
        </div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Current JAR</span>
              <span class="info-value">power_plant_java-1.jar</span>
            </div>
            <div class="info-item" *ngIf="updateInfo">
              <span class="info-label">Server JAR</span>
              <span class="info-value">{{ updateInfo.fileName }}</span>
            </div>
            <div class="info-item" *ngIf="updateInfo">
              <span class="info-label">Size</span>
              <span class="info-value">{{ formatFileSize(updateInfo.fileSize) }}</span>
            </div>
            <div class="info-item" *ngIf="updateInfo">
              <span class="info-label">Server Modified</span>
              <span class="info-value">{{ formatRelativeTime(updateInfo.lastModified) }}</span>
            </div>
          </div>

          <div class="update-available" *ngIf="updateInfo?.isNewer">
            A newer version is available on the server.
          </div>

          <div class="update-progress" *ngIf="updateProgress && updateProgress.phase !== 'done' && updateProgress.phase !== 'error'">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="updateProgress.percent || 0"></div>
            </div>
            <span class="progress-text">
              {{ updatePhaseLabel }}
              <span *ngIf="updateProgress.percent">{{ updateProgress.percent }}%</span>
              <span *ngIf="updateProgress.bytesDownloaded && updateProgress.totalBytes">
                ({{ formatFileSize(updateProgress.bytesDownloaded) }} / {{ formatFileSize(updateProgress.totalBytes) }})
              </span>
            </span>
          </div>

          <div class="error-msg" *ngIf="updateProgress?.phase === 'error'">
            Update failed: {{ updateProgress?.error }}
          </div>

          <div class="success-msg" *ngIf="updateProgress?.phase === 'done'">
            Update downloaded successfully. Restart to apply.
          </div>

          <div class="card-actions">
            <button class="btn btn-secondary"
                    [disabled]="isUpdating"
                    (click)="checkForUpdate()">
              Check for Update
            </button>
            <button class="btn btn-primary"
                    *ngIf="updateInfo?.isNewer"
                    [disabled]="isUpdating"
                    (click)="downloadUpdate()">
              Download & Update
            </button>
            <button class="btn btn-warning"
                    *ngIf="updateProgress?.phase === 'done'"
                    (click)="restartApp()">
              Restart to Apply
            </button>
          </div>
          <p class="hint" *ngIf="updateCheckMessage">{{ updateCheckMessage }}</p>
        </div>
      </section>

      <!-- Device Identity & Conflicts Section -->
      <section class="card">
        <div class="card-header">
          <h2>Device Identity</h2>
        </div>
        <div class="card-body">
          <div class="info-grid" *ngIf="deviceConfig">
            <div class="info-item">
              <span class="info-label">Device Name</span>
              <span class="info-value">{{ deviceConfig.deviceName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Device Number</span>
              <span class="info-value">#{{ deviceConfig.deviceNumber }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Machine ID</span>
              <span class="info-value mono">{{ deviceConfig.machineId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Sync Server</span>
              <span class="info-value mono">{{ deviceConfig.syncServerUrl }}</span>
            </div>
          </div>
          <p *ngIf="!deviceConfig" class="hint">Device identity not configured. Go to Settings to set up.</p>

          <div class="conflict-warning" *ngIf="conflictDetails">
            {{ conflictDetails }}
          </div>

          <div class="card-actions" *ngIf="deviceConfig">
            <button class="btn btn-secondary" (click)="checkConflict()">
              Check for Conflicts
            </button>
          </div>
          <p class="success-msg" *ngIf="conflictCheckMessage">{{ conflictCheckMessage }}</p>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 20px;
    }

    .card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-color);
    }

    .card-header h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .card-body {
      padding: 20px;
    }

    .server-indicator {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 12px;
      background-color: rgba(255, 80, 80, 0.15);
      color: var(--accent-error);
    }

    .server-indicator.online {
      background-color: rgba(80, 200, 120, 0.15);
      color: var(--accent-success);
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .info-value.stale {
      color: var(--accent-warning);
    }

    .info-value.connected {
      color: var(--accent-success);
    }

    .info-value.syncing {
      color: var(--accent-primary);
    }

    .info-value.mono {
      font-family: monospace;
      font-size: 12px;
    }

    .stale-warning, .conflict-warning {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .stale-warning {
      background-color: rgba(255, 180, 50, 0.12);
      color: var(--accent-warning);
      border: 1px solid rgba(255, 180, 50, 0.25);
    }

    .conflict-warning {
      background-color: rgba(255, 80, 80, 0.12);
      color: var(--accent-error);
      border: 1px solid rgba(255, 80, 80, 0.25);
    }

    .update-available {
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
      background-color: rgba(80, 140, 255, 0.12);
      color: var(--accent-primary);
      border: 1px solid rgba(80, 140, 255, 0.25);
    }

    .progress-bar {
      height: 6px;
      background-color: var(--bg-secondary);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background-color: var(--accent-primary);
      border-radius: 3px;
      transition: width 300ms ease;
    }

    .progress-text {
      font-size: 12px;
      color: var(--text-muted);
    }

    .resync-progress, .update-progress {
      margin-bottom: 16px;
    }

    .card-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .hint {
      font-size: 12px;
      color: var(--text-muted);
      margin-top: 8px;
      margin-bottom: 0;
    }

    .error-msg {
      font-size: 13px;
      color: var(--accent-error);
      margin-bottom: 12px;
    }

    .success-msg {
      font-size: 13px;
      color: var(--accent-success);
      margin-top: 8px;
      margin-bottom: 0;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: var(--accent-primary);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      filter: brightness(1.1);
    }

    .btn-secondary {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: var(--bg-card);
    }

    .btn-warning {
      background-color: var(--accent-warning);
      color: #1a1a1a;
    }

    .btn-warning:hover:not(:disabled) {
      filter: brightness(1.1);
    }
  `]
})
export class SyncUpdatesComponent implements OnInit, OnDestroy {
  appState = 'stopped';
  syncStatus: SyncStatusInfo | null = null;
  updateInfo: UpdateInfo | null = null;
  updateProgress: UpdateProgress | null = null;
  deviceConfig: any = null;
  conflictDetails: string | null = null;

  resyncInProgress = false;
  resyncMessage = '';
  coldResyncProgress: ColdResyncProgress | null = null;
  coldResyncInProgress = false;
  coldResyncMessage = '';
  isUpdating = false;
  updateCheckMessage = '';
  conflictCheckMessage = '';
  isSyncStale = false;
  staleDays: number | null = null;

  private statusSub?: Subscription;
  private unsubProgress?: () => void;
  private unsubColdResyncProgress?: () => void;

  constructor(private electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    this.statusSub = this.electronService.appStatus$.subscribe(s => {
      this.appState = s.state;
    });

    this.unsubProgress = this.electronService.onUpdateProgress((progress) => {
      this.updateProgress = progress;
    });

    this.unsubColdResyncProgress = this.electronService.onColdResyncProgress((progress) => {
      this.coldResyncProgress = progress;
      if (progress.phase === 'done' || progress.phase === 'error') {
        this.coldResyncInProgress = false;
      }
    });

    // Load initial data
    await Promise.all([
      this.loadDeviceConfig(),
      this.refreshSyncStatus(),
    ]);
  }

  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
    this.unsubProgress?.();
    this.unsubColdResyncProgress?.();
  }

  async loadDeviceConfig(): Promise<void> {
    const result = await this.electronService.getDeviceConfig();
    if (result.success) {
      this.deviceConfig = result.data;
    }
  }

  async refreshSyncStatus(): Promise<void> {
    const result = await this.electronService.getSyncStatus();
    if (result.success && result.data) {
      this.syncStatus = result.data;
      this.conflictDetails = result.data.deviceConflict ? (result.data.conflictDetails || 'Device number conflict detected') : null;

      // Calculate staleness
      if (result.data.lastSyncTime) {
        const days = Math.round((Date.now() - new Date(result.data.lastSyncTime).getTime()) / (1000 * 60 * 60 * 24));
        this.staleDays = days;
        this.isSyncStale = days > 14;
      } else {
        this.staleDays = null;
        this.isSyncStale = true;
      }
    }
  }

  async triggerResync(): Promise<void> {
    this.resyncInProgress = true;
    this.resyncMessage = '';
    const result = await this.electronService.triggerResync();
    if (result.success) {
      this.resyncMessage = 'Full resync triggered. This may take several minutes.';
      // Poll for completion
      const poll = setInterval(async () => {
        const status = await this.electronService.getResyncStatus();
        if (status.success && status.data && !status.data.inProgress) {
          clearInterval(poll);
          this.resyncInProgress = false;
          this.resyncMessage = 'Full resync completed.';
          await this.refreshSyncStatus();
        }
      }, 5000);
      // Safety timeout
      setTimeout(() => { clearInterval(poll); this.resyncInProgress = false; }, 600000);
    } else {
      this.resyncInProgress = false;
      this.resyncMessage = `Resync failed: ${result.error}`;
    }
  }

  async triggerColdResync(): Promise<void> {
    this.coldResyncInProgress = true;
    this.coldResyncMessage = '';
    this.coldResyncProgress = null;
    const result = await this.electronService.triggerColdResync();
    if (result.success) {
      this.coldResyncMessage = 'Download complete.';
    } else {
      this.coldResyncInProgress = false;
      this.coldResyncMessage = `Download failed: ${result.error}`;
    }
  }

  async startAfterColdResync(): Promise<void> {
    this.coldResyncProgress = null;
    this.coldResyncMessage = '';
    await this.electronService.startApp();
  }

  async checkForUpdate(): Promise<void> {
    this.updateCheckMessage = '';
    this.updateInfo = null;
    this.isUpdating = true;
    const result = await this.electronService.checkForUpdate(this.deviceConfig?.syncServerUrl);
    this.isUpdating = false;
    if (result.success && result.data) {
      this.updateInfo = result.data;
      this.updateCheckMessage = result.data.isNewer
        ? 'Update available!'
        : 'Application is up to date.';
    } else if (result.success) {
      this.updateCheckMessage = 'No update available on server.';
    } else {
      this.updateCheckMessage = `Check failed: ${result.error}`;
    }
  }

  async downloadUpdate(): Promise<void> {
    this.isUpdating = true;
    this.updateProgress = { phase: 'checking' };
    const result = await this.electronService.downloadUpdate(this.deviceConfig?.syncServerUrl);
    this.isUpdating = false;
    if (!result.success) {
      this.updateProgress = { phase: 'error', error: result.error };
    }
  }

  restartApp(): void {
    this.electronService.relaunchApp();
  }

  async checkConflict(): Promise<void> {
    this.conflictCheckMessage = '';
    this.conflictDetails = null;
    // Re-fetch sync status which includes conflict info
    await this.refreshSyncStatus();
    if (!this.conflictDetails) {
      this.conflictCheckMessage = 'No device number conflicts detected.';
    }
  }

  formatRelativeTime(isoDate: string): string {
    const ms = Date.now() - new Date(isoDate).getTime();
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} min ago`;
    return 'Just now';
  }

  formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  }

  get updatePhaseLabel(): string {
    const labels: Record<string, string> = {
      checking: 'Checking...',
      downloading: 'Downloading...',
      verifying: 'Verifying checksum...',
      applying: 'Applying update...',
      done: 'Done',
      error: 'Error'
    };
    return labels[this.updateProgress?.phase || ''] || '';
  }
}
