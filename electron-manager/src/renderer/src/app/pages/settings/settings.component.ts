import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../../services/electron.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1 class="page-title">Settings</h1>

      <div class="settings-section">
        <h2 class="section-title">Application</h2>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Relaunch Application</span>
            <span class="setting-desc">Restart the Electron application</span>
          </div>
          <button class="btn btn-secondary" (click)="relaunch()">Relaunch</button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-label">Quit Application</span>
            <span class="setting-desc">Stop Spring Boot and close the application</span>
          </div>
          <button class="btn btn-danger" (click)="quit()">Quit</button>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="section-title">Spring Boot</h2>
        <div class="empty-state">
          <p class="text-muted">Spring Boot configuration settings will be available here.</p>
          <p class="text-muted">JAR path, port, auto-start, Java path, health check URL.</p>
        </div>
      </div>

      <div class="settings-section">
        <h2 class="section-title">Sync Server</h2>
        <div class="empty-state">
          <p class="text-muted">Sync server configuration will be available here.</p>
          <p class="text-muted">Server URL, enable/disable sync, sync schedule.</p>
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

    .empty-state {
      padding: 20px;
      background-color: var(--bg-card);
      border: 1px dashed var(--border-color);
      border-radius: 8px;
      text-align: center;
    }

    .empty-state p {
      margin: 2px 0;
      font-size: 13px;
    }
  `]
})
export class SettingsComponent {
  constructor(private electronService: ElectronService) {}

  relaunch(): void {
    this.electronService.relaunchApp();
  }

  quit(): void {
    this.electronService.quit();
  }
}
