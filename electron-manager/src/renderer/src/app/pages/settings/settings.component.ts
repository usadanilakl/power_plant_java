import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ElectronService,
  DeviceConfig,
  DeviceRegistryEntry,
  APP_DISPLAY_NAME,
} from '../../services/electron.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Settings</h1>

      <!-- Device Identity -->
      <div class="settings-section">
        <h2 class="section-title">Device Identity</h2>

        <!-- Configured state -->
        <div *ngIf="deviceConfig" class="device-card">
          <div class="device-header">
            <span class="device-number">#{{ deviceConfig.deviceNumber }}</span>
            <span class="device-name">{{ deviceConfig.deviceName }}</span>
            <span class="device-id">{{ deviceConfig.machineId }}</span>
          </div>
          <div class="device-meta">
            Configured {{ deviceConfig.configuredAt | date:'medium' }}
          </div>
          <button class="btn btn-secondary btn-sm" (click)="showSetup = true" *ngIf="!showSetup">
            Reconfigure
          </button>
        </div>

        <!-- Not configured / Setup mode -->
        <div *ngIf="!deviceConfig || showSetup" class="setup-card">
          <div class="setup-notice" *ngIf="!deviceConfig">
            Device identity is not configured. IDs will use fallback device 9 which may conflict with other machines.
          </div>

          <div class="form-group">
            <label class="form-label">Device Name</label>
            <input class="form-input" [(ngModel)]="setupName" placeholder="e.g. Control Room PC" />
          </div>

          <div class="form-group">
            <label class="form-label">Sync Server URL</label>
            <input class="form-input" [(ngModel)]="setupServerUrl" placeholder="http://10.10.190.122:8090" />
          </div>

          <div class="form-actions">
            <button class="btn btn-primary btn-sm" (click)="checkServer()" [disabled]="checking">
              {{ checking ? 'Checking...' : 'Check Server' }}
            </button>
            <button class="btn btn-secondary btn-sm" (click)="showSetup = false" *ngIf="deviceConfig">
              Cancel
            </button>
          </div>

          <!-- Previously registered device detected -->
          <div *ngIf="existingMatch" class="match-banner">
            This device was previously registered as "{{ existingMatch.deviceName }}" (Device #{{ existingMatch.deviceNumber }}).
            <button class="btn btn-primary btn-sm" (click)="claimExistingDevice(existingMatch)" [disabled]="registering">Reuse Settings</button>
          </div>

          <!-- Server response: device registry -->
          <div *ngIf="registryLoaded" class="registry-panel">
            <div *ngIf="serverError" class="server-error">
              {{ serverError }}
            </div>

            <div *ngIf="!serverError">
              <!-- Use existing device -->
              <div *ngIf="registryDevices.length > 0">
                <h3 class="registry-title">Use Existing Device</h3>
                <p class="text-muted" style="margin-bottom: 8px">Select a previously registered device to use on this machine.</p>
                <table class="registry-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Machine ID</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let d of registryDevices" [class.selected-row]="selectedExisting?.machineId === d.machineId">
                      <td>{{ d.deviceNumber }}</td>
                      <td>{{ d.deviceName }}</td>
                      <td>{{ d.machineId }}</td>
                      <td><span class="status-badge" [class]="'status-' + d.status.toLowerCase()">{{ d.status }}</span></td>
                      <td>
                        <button class="btn btn-sm btn-primary" (click)="claimExistingDevice(d)" [disabled]="registering">
                          Use
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p *ngIf="registryDevices.length === 0" class="text-muted">No devices registered yet.</p>

              <!-- Register new device -->
              <div class="register-section">
                <h3 class="registry-title">Register New Device</h3>
                <div class="form-group">
                  <label class="form-label">Device Number</label>
                  <select class="form-input" [(ngModel)]="setupNumber">
                    <option *ngFor="let n of availableNumbers" [ngValue]="n">{{ n }}{{ n === suggestedNumber ? ' (suggested)' : '' }}</option>
                  </select>
                  <span class="form-hint" *ngIf="availableNumbers.length > 0">Available: {{ availableNumbers.join(', ') }}</span>
                  <span class="form-hint form-error" *ngIf="availableNumbers.length === 0">All numbers (1-9) are taken!</span>
                </div>
                <button class="btn btn-success" (click)="registerWithServer()" [disabled]="registering || !setupName || availableNumbers.length === 0">
                  {{ registering ? 'Registering...' : 'Register & Save' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Offline manual setup -->
          <div *ngIf="!registryLoaded || serverError" class="manual-section">
            <div class="divider" *ngIf="registryLoaded"></div>
            <h3 class="registry-title">Manual Setup (offline)</h3>
            <p class="text-muted" style="margin-bottom: 12px">
              If the sync server is unreachable, you can manually set the device number.
              Make sure no other machine uses the same number!
            </p>
            <div class="form-group">
              <label class="form-label">Device Number (1-9)</label>
              <select class="form-input" [(ngModel)]="setupNumber">
                <option *ngFor="let n of allNumbers" [ngValue]="n">{{ n }}</option>
              </select>
            </div>
            <button class="btn btn-warning" (click)="saveManual()" [disabled]="!setupName || !setupNumber">
              Save Manually
            </button>
          </div>

          <div *ngIf="saveMessage" class="save-message" [class.error]="saveError">{{ saveMessage }}</div>
        </div>
      </div>

      <!-- Application -->
      <div class="settings-section">
        <h2 class="section-title">Application</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Relaunch Application</span>
            <span class="setting-desc">Restart Electron (applies device config changes)</span>
          </div>
          <button class="btn btn-secondary" (click)="relaunch()">Relaunch</button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Quit Application</span>
            <span class="setting-desc">Stop {{ appName }} and close the application</span>
          </div>
          <button class="btn btn-danger" (click)="quit()">Quit</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 700px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 24px;
    }

    .settings-section {
      margin-bottom: 32px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border-color);
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .setting-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .setting-desc {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Device card (configured) */
    .device-card {
      padding: 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .device-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .device-number {
      font-size: 20px;
      font-weight: 700;
      color: var(--accent-primary);
    }

    .device-name {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .device-id {
      font-size: 12px;
      color: var(--text-muted);
      font-family: monospace;
      background: var(--bg-primary);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .device-meta {
      font-size: 12px;
      color: var(--text-muted);
      margin-bottom: 12px;
    }

    /* Setup card */
    .setup-card {
      padding: 20px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .setup-notice {
      padding: 12px;
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 6px;
      color: var(--accent-warning);
      font-size: 13px;
      margin-bottom: 16px;
    }

    .form-group {
      margin-bottom: 12px;
    }

    .form-label {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary);
      margin-bottom: 4px;
    }

    .form-input {
      width: 100%;
      padding: 8px 12px;
      background: var(--bg-primary);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 14px;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--accent-primary);
    }

    .form-hint {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
      display: block;
    }

    .form-error {
      color: var(--accent-error);
    }

    .form-actions {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    /* Registry panel */
    .registry-panel {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color);
    }

    .registry-title {
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 8px;
    }

    .registry-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 16px;
    }

    .registry-table th, .registry-table td {
      padding: 6px 10px;
      text-align: left;
      border-bottom: 1px solid var(--border-color);
    }

    .registry-table th {
      color: var(--text-muted);
      font-weight: 500;
      font-size: 11px;
      text-transform: uppercase;
    }

    .registry-table td {
      color: var(--text-primary);
    }

    .status-badge {
      font-size: 11px;
      padding: 2px 6px;
      border-radius: 4px;
    }

    .status-online, .status-self {
      background: rgba(16, 185, 129, 0.15);
      color: var(--accent-success);
    }

    .status-offline {
      background: var(--bg-primary);
      color: var(--text-muted);
    }

    .server-error {
      padding: 10px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 6px;
      color: var(--accent-error);
      font-size: 13px;
    }

    .register-section {
      margin-top: 16px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
    }

    .manual-section {
      margin-top: 16px;
    }

    .divider {
      border-top: 1px solid var(--border-color);
      margin-bottom: 16px;
    }

    .save-message {
      margin-top: 12px;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      background: rgba(16, 185, 129, 0.1);
      color: var(--accent-success);
    }

    .save-message.error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--accent-error);
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .selected-row {
      background: rgba(99, 102, 241, 0.1);
    }

    .match-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      margin-top: 12px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 6px;
      color: var(--accent-success);
      font-size: 13px;
    }

    .btn-warning {
      background-color: var(--accent-warning);
      color: #000;
    }
  `]
})
export class SettingsComponent implements OnInit {
  appName = APP_DISPLAY_NAME;
  deviceConfig: DeviceConfig | null = null;
  showSetup = false;

  // Setup form
  setupName = '';
  setupServerUrl = 'http://10.10.190.122:8090';
  setupNumber: number | null = null;

  // Server check
  checking = false;
  registryLoaded = false;
  registryDevices: DeviceRegistryEntry[] = [];
  availableNumbers: number[] = [];
  suggestedNumber: number | null = null;
  serverError: string | null = null;

  // Registration
  registering = false;
  saveMessage = '';
  saveError = false;
  selectedExisting: DeviceRegistryEntry | null = null;
  existingMatch: DeviceRegistryEntry | null = null;

  allNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  constructor(private electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    const result = await this.electronService.getDeviceConfig();
    if (result.success && result.data) {
      this.deviceConfig = result.data;
      this.setupName = this.deviceConfig.deviceName;
      this.setupServerUrl = this.deviceConfig.syncServerUrl || this.setupServerUrl;
    }
  }

  async checkServer(): Promise<void> {
    this.checking = true;
    this.serverError = null;
    this.registryLoaded = false;

    const result = await this.electronService.fetchDeviceRegistry(this.setupServerUrl);

    this.checking = false;
    this.registryLoaded = true;

    if (result.success && result.data) {
      this.registryDevices = result.data.devices || [];
      this.availableNumbers = result.data.availableNumbers || [];
      this.suggestedNumber = this.availableNumbers.length > 0 ? this.availableNumbers[0] : null;
      this.setupNumber = this.suggestedNumber;

      // Auto-detect if this device was previously registered (machineId match)
      if (this.setupName) {
        const derivedId = this.setupName.toUpperCase().replace(/\s+/g, '-').replace(/[^A-Z0-9\-]/g, '');
        this.existingMatch = this.registryDevices.find(d => d.machineId === derivedId) || null;
      } else {
        this.existingMatch = null;
      }
    } else {
      this.serverError = result.error || 'Could not reach sync server';
      this.registryDevices = [];
      this.availableNumbers = [];
    }
  }

  async registerWithServer(): Promise<void> {
    if (!this.setupName || !this.setupNumber) return;

    this.registering = true;
    this.saveMessage = '';

    const result = await this.electronService.registerDevice(
      this.setupName, this.setupNumber, this.setupServerUrl
    );

    if (result.success && result.data) {
      // Save locally
      const config: DeviceConfig = {
        ...result.data,
        syncServerUrl: this.setupServerUrl,
        configuredAt: new Date().toISOString()
      };
      const saveResult = await this.electronService.saveDeviceConfig(config);

      if (saveResult.success) {
        this.deviceConfig = config;
        this.showSetup = false;
        this.saveMessage = `Device registered as #${config.deviceNumber} (${config.deviceName}). Relaunch to apply.`;
        this.saveError = false;
      } else {
        this.saveMessage = saveResult.error || 'Failed to save config locally';
        this.saveError = true;
      }
    } else {
      this.saveMessage = result.error || 'Registration failed';
      this.saveError = true;
    }

    this.registering = false;
  }

  async claimExistingDevice(device: DeviceRegistryEntry): Promise<void> {
    this.selectedExisting = device;
    this.registering = true;
    this.saveMessage = '';

    const config: DeviceConfig = {
      deviceNumber: device.deviceNumber,
      deviceName: device.deviceName,
      machineId: device.machineId,
      syncServerUrl: this.setupServerUrl,
      configuredAt: new Date().toISOString()
    };

    const result = await this.electronService.saveDeviceConfig(config);
    if (result.success) {
      this.deviceConfig = config;
      this.showSetup = false;
      this.saveMessage = `Using device #${config.deviceNumber} (${config.deviceName}). Relaunch to apply.`;
      this.saveError = false;
    } else {
      this.saveMessage = result.error || 'Failed to save config';
      this.saveError = true;
    }
    this.registering = false;
    this.selectedExisting = null;
  }

  async saveManual(): Promise<void> {
    if (!this.setupName || !this.setupNumber) return;

    const machineId = this.setupName.toUpperCase()
      .replace(/\s+/g, '-')
      .replace(/[^A-Z0-9\-]/g, '') || 'UNKNOWN';

    const config: DeviceConfig = {
      deviceNumber: this.setupNumber,
      deviceName: this.setupName,
      machineId,
      syncServerUrl: this.setupServerUrl,
      configuredAt: new Date().toISOString()
    };

    const result = await this.electronService.saveDeviceConfig(config);

    if (result.success) {
      this.deviceConfig = config;
      this.showSetup = false;
      this.saveMessage = `Device saved as #${config.deviceNumber} (${config.deviceName}). Relaunch to apply.`;
      this.saveError = false;
    } else {
      this.saveMessage = result.error || 'Failed to save config';
      this.saveError = true;
    }
  }

  relaunch(): void {
    this.electronService.relaunchApp();
  }

  quit(): void {
    this.electronService.quit();
  }
}
