import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService } from '../services/electron.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon">⚡</span>
          <span class="logo-text">DK Power Manager</span>
        </div>
      </div>

      <div class="header-right">
        <span class="version" *ngIf="version">v{{ version }}</span>
        <div class="window-controls" *ngIf="electronService.isElectron">
          <button class="window-btn" (click)="minimize()" title="Minimize">
            <span>−</span>
          </button>
          <button class="window-btn" (click)="maximize()" title="Maximize">
            <span>□</span>
          </button>
          <button class="window-btn close-btn" (click)="close()" title="Close">
            <span>×</span>
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      padding: 0 16px;
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      -webkit-app-region: drag;
    }

    .header-left,
    .header-right {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      font-size: 20px;
    }

    .logo-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .version {
      font-size: 12px;
      color: var(--text-muted);
    }

    .window-controls {
      display: flex;
      -webkit-app-region: no-drag;
    }

    .window-btn {
      width: 40px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 18px;
      transition: background-color var(--transition-fast);
    }

    .window-btn:hover {
      background-color: var(--bg-card);
    }

    .close-btn:hover {
      background-color: var(--accent-error);
      color: white;
    }
  `]
})
export class HeaderComponent implements OnInit {
  version = '';

  constructor(public electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    this.version = await this.electronService.getAppVersion();
  }

  minimize(): void {
    this.electronService.minimizeWindow();
  }

  maximize(): void {
    this.electronService.maximizeWindow();
  }

  close(): void {
    this.electronService.closeWindow();
  }
}
