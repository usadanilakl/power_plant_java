import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ElectronService, APP_DISPLAY_NAME } from '../services/electron.service';
import { HeaderStatusComponent } from './header-status.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, HeaderStatusComponent],
  template: `
    <header class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-icon material-icons">bolt</span>
          <span class="logo-text">DK Power Manager</span>
        </div>

        <!-- Menu bar (replaces native menu) -->
        <div class="menu-bar" *ngIf="electronService.isElectron">
          <button class="menu-btn" (click)="openMenu('file', $event)">File</button>
          <button class="menu-btn" (click)="openMenu('app', $event)">{{ appName }}</button>
          <button class="menu-btn" (click)="openMenu('view', $event)">View</button>
          <button class="menu-btn" (click)="openMenu('help', $event)">Help</button>
        </div>
      </div>

      <!-- Always-visible weather + day-ahead status -->
      <app-header-status class="header-center"></app-header-status>

      <div class="header-right">
        <span class="version" *ngIf="version">v{{ version }}</span>
        <div class="window-controls" *ngIf="electronService.isElectron">
          <button class="window-btn" (click)="minimize()" title="Minimize">
            <span class="material-icons">remove</span>
          </button>
          <button class="window-btn" (click)="maximize()" title="Maximize">
            <span class="material-icons">crop_square</span>
          </button>
          <button class="window-btn close-btn" (click)="close()" title="Close">
            <span class="material-icons">close</span>
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

    .header-center {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      justify-content: center;
      overflow: hidden;
      margin: 0 12px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      font-size: 22px;
      color: var(--accent-primary);
    }

    .logo-text {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .menu-bar {
      display: flex;
      align-items: center;
      gap: 0;
      margin-left: 16px;
      -webkit-app-region: no-drag;
    }

    .menu-btn {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      font-size: 13px;
      padding: 4px 10px;
      border-radius: 4px;
      transition: all var(--transition-fast);
    }

    .menu-btn:hover {
      background-color: var(--bg-card);
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
      transition: background-color var(--transition-fast);
    }

    .window-btn .material-icons {
      font-size: 18px;
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
export class HeaderComponent implements OnInit, OnDestroy {
  version = '';
  appName = APP_DISPLAY_NAME;
  private unsubMenuNav?: () => void;

  constructor(public electronService: ElectronService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    this.version = await this.electronService.getAppVersion();
    this.unsubMenuNav = this.electronService.onMenuNavigate((path) => {
      this.router.navigate([path]);
    });
  }

  openMenu(menuId: string, event: MouseEvent): void {
    const btn = event.target as HTMLElement;
    const rect = btn.getBoundingClientRect();
    this.electronService.popupMenu(menuId, Math.round(rect.left), Math.round(rect.bottom));
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

  ngOnDestroy(): void {
    this.unsubMenuNav?.();
  }
}
