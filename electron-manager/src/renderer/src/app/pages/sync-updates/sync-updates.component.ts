import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ElectronService, AppStatus, SyncStatusInfo, StartupAssessment, SyncComponent,
  SyncExecuteProgress, DeviceConfig, IpcResult, APP_DISPLAY_NAME
} from '../../services/electron.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sync-updates',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1 class="page-title">Sync & Updates</h1>

      <!-- Section 1: Status & Assessment -->
      <section class="card">
        <div class="card-header">
          <h2>Status & Assessment</h2>
          <span class="server-indicator" [class.online]="assessment?.serverReachable">
            {{ assessment?.serverReachable ? 'Server Online' : assessment === null ? 'Checking...' : 'Server Offline' }}
          </span>
        </div>
        <div class="card-body">
          <table class="assessment-table" *ngIf="assessment">
            <tbody>
              <tr>
                <td class="at-label">JAR</td>
                <td class="at-status">
                  <span [class.status-ok]="assessment.jar.present && !assessment.jar.updateAvailable"
                        [class.status-warn]="assessment.jar.present && assessment.jar.updateAvailable"
                        [class.status-missing]="!assessment.jar.present">
                    {{ assessment.jar.present ? 'Present' : 'Missing' }}
                  </span>
                </td>
                <td class="at-detail">
                  <span *ngIf="assessment.jar.updateAvailable">Update available</span>
                  <span *ngIf="assessment.jar.present && !assessment.jar.updateAvailable">Up to date</span>
                </td>
              </tr>
              <tr>
                <td class="at-label">Database</td>
                <td class="at-status">
                  <span [class.status-ok]="assessment.db.present"
                        [class.status-missing]="!assessment.db.present">
                    {{ assessment.db.present ? 'Present' : 'Missing' }}
                  </span>
                </td>
                <td class="at-detail">
                  {{ assessment.db.sizeBytes > 0 ? formatFileSize(assessment.db.sizeBytes) : '' }}
                </td>
              </tr>
              <tr>
                <td class="at-label">Files</td>
                <td class="at-status">
                  <span [class.status-ok]="assessment.files.present"
                        [class.status-missing]="!assessment.files.present">
                    {{ assessment.files.present ? 'Present' : 'Missing' }}
                  </span>
                </td>
                <td class="at-detail">
                  {{ assessment.files.totalSizeBytes > 0 ? formatFileSize(assessment.files.totalSizeBytes) : '' }}
                </td>
              </tr>
              <tr>
                <td class="at-label">Last Sync</td>
                <td class="at-status">
                  <span [class.status-ok]="!assessment.sync.stale"
                        [class.status-warn]="assessment.sync.stale">
                    {{ assessment.sync.stale ? 'Stale' : 'OK' }}
                  </span>
                </td>
                <td class="at-detail">
                  {{ assessment.sync.daysSinceSync !== null ? assessment.sync.daysSinceSync + ' days ago' : 'Never' }}
                </td>
              </tr>
              <tr>
                <td class="at-label">Conflicts</td>
                <td class="at-status">
                  <span [class.status-ok]="!assessment.conflict.detected"
                        [class.status-warn]="assessment.conflict.detected">
                    {{ assessment.conflict.detected ? 'Detected' : 'None' }}
                  </span>
                </td>
                <td class="at-detail">
                  {{ assessment.conflict.details || '' }}
                </td>
              </tr>
            </tbody>
          </table>

          <p class="hint" *ngIf="!assessment">Loading assessment...</p>

          <div class="card-actions" *ngIf="assessment">
            <button class="btn btn-secondary" (click)="refreshAssessment()">
              Refresh
            </button>
          </div>
        </div>
      </section>

      <!-- Section 2: Sync Actions -->
      <section class="card">
        <div class="card-header">
          <h2>Sync Actions</h2>
        </div>
        <div class="card-body">
          <div class="card-actions sync-actions">
            <button class="btn btn-secondary"
                    [disabled]="syncInProgress || !assessment?.serverReachable"
                    (click)="executeSync(['jar'])">
              Sync JAR
            </button>
            <button class="btn btn-secondary"
                    [disabled]="syncInProgress || !assessment?.serverReachable"
                    (click)="executeSync(['db'])">
              Sync Database
            </button>
            <button class="btn btn-secondary"
                    [disabled]="syncInProgress || !assessment?.serverReachable"
                    (click)="executeSync(['files'])">
              Sync Files
            </button>
            <button class="btn btn-primary"
                    [disabled]="syncInProgress || !assessment?.serverReachable"
                    (click)="executeSync(['jar', 'db', 'files'])">
              Sync All
            </button>
            <button class="btn btn-warning"
                    [disabled]="syncInProgress || !assessment?.serverReachable || !needsSync"
                    (click)="syncNeeded()">
              Sync Needed
            </button>
          </div>

          <p class="hint">{{ appName }} will be automatically stopped and restarted when syncing database or files.</p>
          <p class="hint" *ngIf="!assessment?.serverReachable && assessment !== null">
            Sync server must be reachable to perform sync operations.
          </p>

          <!-- Progress -->
          <div class="sync-progress" *ngIf="syncProgress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="syncProgress.progressPercent || 0"></div>
            </div>
            <span class="progress-text">
              {{ syncProgress.statusMessage }}
              <span *ngIf="syncProgress.progressPercent"> {{ syncProgress.progressPercent }}%</span>
            </span>
          </div>

          <div class="error-msg" *ngIf="syncProgress?.phase === 'error'">
            Sync failed: {{ syncProgress?.error }}
          </div>

          <div class="success-msg" *ngIf="syncProgress?.phase === 'done'">
            Sync completed successfully.
          </div>
        </div>
      </section>

      <!-- Section 3: Device Identity (kept from before) -->
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

    /* Assessment table */
    .assessment-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }

    .assessment-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color);
      font-size: 13px;
    }

    .assessment-table tr:last-child td {
      border-bottom: none;
    }

    .at-label {
      font-weight: 600;
      color: var(--text-primary);
      width: 100px;
    }

    .at-status {
      width: 100px;
    }

    .at-detail {
      color: var(--text-muted);
    }

    .status-ok {
      color: var(--accent-success);
      font-weight: 500;
    }

    .status-warn {
      color: var(--accent-warning);
      font-weight: 500;
    }

    .status-missing {
      color: var(--accent-error);
      font-weight: 500;
    }

    /* Sync actions */
    .sync-actions {
      flex-wrap: wrap;
    }

    .sync-progress {
      margin-top: 16px;
    }

    /* Shared styles */
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

    .info-value.mono {
      font-family: monospace;
      font-size: 12px;
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
      margin-top: 12px;
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
  appName = APP_DISPLAY_NAME;
  assessment: StartupAssessment | null = null;
  syncProgress: SyncExecuteProgress | null = null;
  syncInProgress = false;
  deviceConfig: DeviceConfig | null = null;

  private statusSub?: Subscription;
  private unsubSyncProgress?: () => void;
  private unsubAssessment?: () => void;

  constructor(private electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    this.statusSub = this.electronService.appStatus$.subscribe(s => {
      // track app state if needed
    });

    this.unsubSyncProgress = this.electronService.onSyncExecuteProgress((progress) => {
      this.syncProgress = progress;
      this.syncInProgress = progress.phase !== 'done' && progress.phase !== 'error';
      if (progress.phase === 'done' || progress.phase === 'error') {
        setTimeout(() => { this.syncInProgress = false; }, 5000);
      }
    });

    this.unsubAssessment = this.electronService.onStartupAssessment((a) => {
      this.assessment = a;
    });

    await Promise.all([
      this.loadDeviceConfig(),
      this.loadAssessment(),
    ]);
  }

  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
    this.unsubSyncProgress?.();
    this.unsubAssessment?.();
  }

  async loadDeviceConfig(): Promise<void> {
    const result = await this.electronService.getDeviceConfig();
    if (result.success) {
      this.deviceConfig = result.data ?? null;
    }
  }

  async loadAssessment(): Promise<void> {
    const result = await this.electronService.getStartupAssessment();
    if (result.success && result.data) {
      this.assessment = result.data;
    }
  }

  async refreshAssessment(): Promise<void> {
    this.assessment = null;
    await this.loadAssessment();
  }

  get needsSync(): boolean {
    if (!this.assessment) return false;
    const a = this.assessment;
    return !a.jar.present || a.jar.updateAvailable || !a.db.present || !a.files.present || a.sync.stale;
  }

  executeSync(components: SyncComponent[]): void {
    if (this.syncInProgress) return;
    this.syncProgress = null;
    this.electronService.executeSync(components);
  }

  syncNeeded(): void {
    if (!this.assessment || this.syncInProgress) return;
    const components: SyncComponent[] = [];
    if (!this.assessment.jar.present || this.assessment.jar.updateAvailable) components.push('jar');
    if (!this.assessment.db.present || this.assessment.sync.stale) components.push('db');
    if (!this.assessment.files.present) components.push('files');
    if (components.length === 0) return;
    this.executeSync(components);
  }

  formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  }
}
