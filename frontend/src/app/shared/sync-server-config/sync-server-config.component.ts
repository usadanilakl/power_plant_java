import { Component, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SyncStatusService, SyncServerConfig, UrlValidationResult, ConfigUpdateResult } from '../../services/sync-status.service';

@Component({
  selector: 'app-sync-server-config',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="sync-config-container">
      <div class="config-header">
        <mat-icon>dns</mat-icon>
        <span>Sync Server Configuration</span>
      </div>

      <div class="config-form">
        <mat-form-field appearance="outline" class="url-field">
          <mat-label>Server URL</mat-label>
          <input matInput
                 [(ngModel)]="serverUrl"
                 placeholder="http://192.168.1.100:8080"
                 [disabled]="saving()">
          <mat-hint>e.g., http://192.168.1.100:8080</mat-hint>
        </mat-form-field>

        <div class="toggle-row">
          <span>Enable Sync</span>
          <mat-slide-toggle
            [(ngModel)]="syncEnabled"
            [disabled]="saving()">
          </mat-slide-toggle>
        </div>

        @if (validationResult()) {
          <div class="validation-result"
               [class.success]="validationResult()?.valid && validationResult()?.reachable"
               [class.warning]="validationResult()?.valid && !validationResult()?.reachable"
               [class.error]="!validationResult()?.valid">
            <mat-icon>
              {{ validationResult()?.valid && validationResult()?.reachable ? 'check_circle' :
                 validationResult()?.valid ? 'warning' : 'error' }}
            </mat-icon>
            <span>{{ validationResult()?.message }}</span>
            @if (validationResult()?.latencyMs) {
              <span class="latency">({{ validationResult()?.latencyMs }}ms)</span>
            }
          </div>
        }

        @if (saveResult()) {
          <div class="save-result"
               [class.success]="saveResult()?.success"
               [class.error]="!saveResult()?.success">
            <mat-icon>{{ saveResult()?.success ? 'check_circle' : 'error' }}</mat-icon>
            <span>{{ saveResult()?.message }}</span>
          </div>
        }

        <div class="action-buttons">
          <button mat-stroked-button
                  (click)="testConnection()"
                  [disabled]="testing() || !serverUrl">
            @if (testing()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              <mat-icon>network_check</mat-icon>
            }
            Test Connection
          </button>

          <div class="spacer"></div>

          <button mat-button (click)="cancel()" [disabled]="saving()">
            Cancel
          </button>

          <button mat-flat-button color="primary"
                  (click)="saveConfig()"
                  [disabled]="saving() || !hasChanges()">
            @if (saving()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              <mat-icon>save</mat-icon>
            }
            Save & Reconnect
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sync-config-container {
      padding: 8px 0;
    }

    .config-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-weight: 500;
      font-size: 14px;
    }

    .config-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      opacity: 0.7;
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .url-field {
      width: 100%;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
    }

    .validation-result, .save-result {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      border-radius: 4px;
      font-size: 12px;
    }

    .validation-result.success, .save-result.success {
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .validation-result.warning {
      background: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }

    .validation-result.error, .save-result.error {
      background: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }

    .validation-result mat-icon, .save-result mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .latency {
      opacity: 0.7;
      font-size: 11px;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .action-buttons button {
      font-size: 12px;
    }

    .action-buttons mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .action-buttons mat-spinner {
      margin-right: 4px;
    }

    .spacer {
      flex: 1;
    }

    @media (max-width: 400px) {
      .action-buttons {
        flex-direction: column;
        align-items: stretch;
      }

      .spacer {
        display: none;
      }

      .action-buttons button {
        width: 100%;
      }
    }
  `]
})
export class SyncServerConfigComponent implements OnInit {
  private syncStatusService = inject(SyncStatusService);

  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  serverUrl = '';
  syncEnabled = true;
  originalUrl = '';
  originalEnabled = true;

  testing = signal(false);
  saving = signal(false);
  validationResult = signal<UrlValidationResult | null>(null);
  saveResult = signal<ConfigUpdateResult | null>(null);

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.syncStatusService.getSyncServerConfig().subscribe({
      next: (config) => {
        this.serverUrl = config.syncServerUrl || '';
        this.syncEnabled = config.syncServerEnabled;
        this.originalUrl = this.serverUrl;
        this.originalEnabled = this.syncEnabled;
      },
      error: (err) => {
        console.error('Failed to load sync config:', err);
      }
    });
  }

  hasChanges(): boolean {
    return this.serverUrl !== this.originalUrl || this.syncEnabled !== this.originalEnabled;
  }

  testConnection(): void {
    if (!this.serverUrl) return;

    this.testing.set(true);
    this.validationResult.set(null);
    this.saveResult.set(null);

    this.syncStatusService.validateSyncServerUrl(this.serverUrl).subscribe({
      next: (result) => {
        this.validationResult.set(result);
        this.testing.set(false);
      },
      error: (err) => {
        this.validationResult.set({
          valid: false,
          reachable: false,
          message: 'Failed to validate: ' + (err.message || 'Unknown error')
        });
        this.testing.set(false);
      }
    });
  }

  saveConfig(): void {
    this.saving.set(true);
    this.saveResult.set(null);
    this.validationResult.set(null);

    this.syncStatusService.updateSyncServerConfig(this.serverUrl, this.syncEnabled).subscribe({
      next: (result) => {
        this.saveResult.set(result);
        this.saving.set(false);

        if (result.success) {
          this.originalUrl = this.serverUrl;
          this.originalEnabled = this.syncEnabled;
          // Emit saved event after a short delay to show success message
          setTimeout(() => this.saved.emit(), 1500);
        }
      },
      error: (err) => {
        this.saveResult.set({
          success: false,
          message: 'Failed to save: ' + (err.error?.message || err.message || 'Unknown error')
        });
        this.saving.set(false);
      }
    });
  }

  cancel(): void {
    this.serverUrl = this.originalUrl;
    this.syncEnabled = this.originalEnabled;
    this.validationResult.set(null);
    this.saveResult.set(null);
    this.cancelled.emit();
  }
}
