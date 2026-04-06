import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  ElectronService, AppStatus, SyncStatusInfo, StartupAssessment, SyncComponent,
  SyncOptions, SyncExecuteProgress, DeviceConfig, ResourcePackStatus, ElectronUpdateProgress, IpcResult, APP_DISPLAY_NAME
} from '../../services/electron.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sync-updates',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
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
              <tr *ngFor="let pack of assessment.resourcePacks">
                <td class="at-label">{{ pack.name }}</td>
                <td class="at-status">
                  <span [class.status-ok]="pack.localPresent && pack.missingFiles === 0 && pack.updatedFiles === 0"
                        [class.status-warn]="pack.localPresent && (pack.missingFiles > 0 || pack.updatedFiles > 0)"
                        [class.status-missing]="!pack.localPresent">
                    {{ !pack.localPresent ? 'Missing' : (pack.missingFiles + pack.updatedFiles > 0 ? 'Needs sync' : 'OK') }}
                  </span>
                </td>
                <td class="at-detail">
                  {{ pack.totalFiles }} files{{ pack.missingFiles > 0 ? ', ' + pack.missingFiles + ' missing' : '' }}{{ pack.updatedFiles > 0 ? ', ' + pack.updatedFiles + ' changed' : '' }}
                </td>
              </tr>
              <tr *ngIf="assessment.electron">
                <td class="at-label">Electron</td>
                <td class="at-status">
                  <span [class.status-ok]="!assessment.electron.updateAvailable && !assessment.electron.updateStaged"
                        [class.status-warn]="assessment.electron.updateAvailable || assessment.electron.updateStaged">
                    {{ assessment.electron.updateStaged ? 'Staged' : (assessment.electron.updateAvailable ? 'Update' : 'OK') }}
                  </span>
                </td>
                <td class="at-detail">
                  <span *ngIf="assessment.electron.updateStaged">Ready to apply (requires restart)</span>
                  <span *ngIf="assessment.electron.updateAvailable && !assessment.electron.updateStaged">Update available</span>
                  <span *ngIf="!assessment.electron.updateAvailable && !assessment.electron.updateStaged">Up to date</span>
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
            <button class="btn btn-secondary"
                    [disabled]="syncInProgress || !assessment?.serverReachable"
                    (click)="executeSync(['resource-packs'])">
              Sync Resource Packs
            </button>
            <button class="btn btn-primary"
                    [disabled]="syncInProgress || !assessment?.serverReachable"
                    (click)="executeSync(['jar', 'db', 'files', 'resource-packs'])">
              Sync All
            </button>
            <button class="btn btn-warning"
                    [disabled]="syncInProgress || !assessment?.serverReachable || !needsSync"
                    (click)="syncNeeded()">
              Sync Needed
            </button>
            <button class="btn btn-info"
                    [disabled]="syncInProgress || !assessment?.serverReachable"
                    (click)="smartResync()">
              Smart Resync
            </button>
          </div>

          <label class="toggle-option">
            <input type="checkbox" [(ngModel)]="cleanFiles" [disabled]="syncInProgress" />
            Re-download all files (clear local files first)
          </label>

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

      <!-- Section 3: SharePoint Sync shortcut -->
      <section class="card" *ngIf="appRunning">
        <div class="card-header">
          <h2>SharePoint Sync</h2>
          <span class="sp-status" [class.sp-on]="spEnabled" [class.sp-off]="!spEnabled">
            {{ spEnabled ? 'Auto-Sync On' : 'Auto-Sync Off' }}
          </span>
        </div>
        <div class="card-body">
          <p class="hint" style="margin-top:0">Manage SharePoint auto-sync, polling intervals, and trigger manual syncs.</p>
          <div class="card-actions">
            <a class="btn btn-secondary" [routerLink]="['/pid-app']" [queryParams]="{ path: 'sync/sharepoint' }">
              Open SharePoint Sync Settings
            </a>
          </div>
        </div>
      </section>

      <!-- Section 4: Electron Update -->
      <section class="card" *ngIf="assessment?.electron">
        <div class="card-header">
          <h2>Electron App Update</h2>
        </div>
        <div class="card-body">
          <p *ngIf="!assessment?.electron?.updateAvailable && !assessment?.electron?.updateStaged" class="hint">
            Electron app is up to date.
          </p>
          <p *ngIf="assessment?.electron?.updateAvailable && !assessment?.electron?.updateStaged">
            A new version of the Electron app is available on the sync server.
          </p>
          <p *ngIf="assessment?.electron?.updateStaged">
            Update is downloaded and ready to apply. Applying will close the application and restart it automatically.
          </p>

          <div class="card-actions">
            <button class="btn btn-secondary"
                    [disabled]="electronDownloading || !assessment?.electron?.updateAvailable || assessment?.electron?.updateStaged"
                    (click)="downloadElectronUpdate()">
              Download Update
            </button>
            <button class="btn btn-warning"
                    [disabled]="electronDownloading || !assessment?.electron?.updateStaged"
                    (click)="applyElectronUpdate()">
              Apply Update (Restart)
            </button>
          </div>

          <div class="sync-progress" *ngIf="electronProgress">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="electronProgress.percent || 0"></div>
            </div>
            <span class="progress-text">
              {{ electronProgress.phase === 'downloading' ? 'Downloading...' : electronProgress.phase === 'verifying' ? 'Verifying...' : electronProgress.phase }}
              <span *ngIf="electronProgress.percent"> {{ electronProgress.percent }}%</span>
            </span>
          </div>

          <div class="error-msg" *ngIf="electronProgress?.phase === 'error'">
            Download failed: {{ electronProgress?.error }}
          </div>

          <div class="success-msg" *ngIf="electronProgress?.phase === 'staged'">
            Update downloaded and verified. Click "Apply Update" to install.
          </div>
        </div>
      </section>

      <!-- Section 4: Device Identity (kept from before) -->
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

    .toggle-option {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      font-size: 0.85rem;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .toggle-option input[type="checkbox"] {
      accent-color: var(--accent-primary);
    }

    .sp-status {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 12px;
    }

    .sp-on {
      background-color: rgba(80, 200, 120, 0.15);
      color: var(--accent-success);
    }

    .sp-off {
      background-color: var(--bg-secondary);
      color: var(--text-muted);
    }
  `]
})
export class SyncUpdatesComponent implements OnInit, OnDestroy {
  appName = APP_DISPLAY_NAME;
  assessment: StartupAssessment | null = null;
  syncProgress: SyncExecuteProgress | null = null;
  syncInProgress = false;
  cleanFiles = false;
  deviceConfig: DeviceConfig | null = null;

  electronDownloading = false;
  electronProgress: ElectronUpdateProgress | null = null;

  appRunning = false;
  spEnabled = false;

  private statusSub?: Subscription;
  private unsubSyncProgress?: () => void;
  private unsubAssessment?: () => void;
  private unsubElectronProgress?: () => void;

  constructor(private electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    this.statusSub = this.electronService.appStatus$.subscribe(s => {
      const wasRunning = this.appRunning;
      this.appRunning = s.state === 'running' && s.healthStatus === 'healthy';
      if (this.appRunning && !wasRunning) {
        this.loadSpSyncConfig();
      }
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

    this.unsubElectronProgress = this.electronService.onElectronUpdateProgress((progress) => {
      this.electronProgress = progress;
      if (progress.phase === 'staged' || progress.phase === 'error') {
        this.electronDownloading = false;
        if (progress.phase === 'staged') {
          this.refreshAssessment();
        }
      }
    });

    await Promise.all([
      this.loadDeviceConfig(),
      this.loadAssessment(),
      this.loadSpSyncConfig(),
    ]);
  }

  ngOnDestroy(): void {
    this.statusSub?.unsubscribe();
    this.unsubSyncProgress?.();
    this.unsubAssessment?.();
    this.unsubElectronProgress?.();
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

  private async loadSpSyncConfig(): Promise<void> {
    try {
      const resp = await fetch('http://localhost:8082/api/sharepoint-sync/config');
      if (resp.ok) {
        const data = await resp.json();
        this.spEnabled = data?.responseData?.enabled ?? false;
      }
    } catch {
      // Spring Boot not reachable yet
    }
  }

  get needsSync(): boolean {
    if (!this.assessment) return false;
    const a = this.assessment;
    const packsNeedSync = a.resourcePacks?.some(p => !p.localPresent || p.missingFiles > 0 || p.updatedFiles > 0) ?? false;
    return !a.jar.present || a.jar.updateAvailable || !a.db.present || !a.files.present || a.sync.stale || packsNeedSync;
  }

  executeSync(components: SyncComponent[]): void {
    if (this.syncInProgress) return;
    this.syncProgress = null;
    const options: SyncOptions = this.cleanFiles ? { cleanFiles: true } : {};
    this.electronService.executeSync(components, options);
  }

  async smartResync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncProgress = { phase: 'stopping_sb' as any, statusMessage: 'Sending local changes to hub...', progressPercent: 0 };
    this.syncInProgress = true;

    try {
      // Step 1: Tell Spring Boot to send local changes and notify hub
      const resp = await fetch('http://localhost:8082/api/resync/smart-resync', { method: 'POST' });
      const result = await resp.json();

      if (!result.success) {
        this.syncProgress = { phase: 'error', statusMessage: 'Failed: ' + result.message, progressPercent: 0 };
        this.syncInProgress = false;
        return;
      }

      // Step 2: Electron handles shutdown → DB + files sync → restart
      this.syncInProgress = false; // reset so executeSync doesn't skip
      this.executeSync(['db', 'files']);
    } catch (err: any) {
      this.syncProgress = { phase: 'error', statusMessage: 'Smart resync failed: ' + (err?.message || err), progressPercent: 0 };
      this.syncInProgress = false;
    }
  }

  syncNeeded(): void {
    if (!this.assessment || this.syncInProgress) return;
    const components: SyncComponent[] = [];
    if (!this.assessment.jar.present || this.assessment.jar.updateAvailable) components.push('jar');
    if (!this.assessment.db.present || this.assessment.sync.stale) components.push('db');
    if (!this.assessment.files.present) components.push('files');
    const packsNeedSync = this.assessment.resourcePacks?.some(p => !p.localPresent || p.missingFiles > 0 || p.updatedFiles > 0) ?? false;
    if (packsNeedSync) components.push('resource-packs');
    if (components.length === 0) return;
    this.executeSync(components);
  }

  async downloadElectronUpdate(): Promise<void> {
    if (this.electronDownloading) return;
    this.electronDownloading = true;
    this.electronProgress = null;
    const result = await this.electronService.downloadElectronUpdate();
    if (!result.success) {
      this.electronDownloading = false;
      this.electronProgress = { phase: 'error', error: result.error || 'Download failed' };
    }
  }

  async applyElectronUpdate(): Promise<void> {
    const confirmed = confirm(
      'Apply the Electron update? The application will close and restart automatically.\n\nMake sure all work is saved before proceeding.'
    );
    if (!confirmed) return;
    await this.electronService.applyElectronUpdate();
  }

  formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  }
}
