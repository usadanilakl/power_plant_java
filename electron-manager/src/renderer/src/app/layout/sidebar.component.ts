import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus, AppState } from '../services/electron.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <span class="logo-icon">&#9889;</span>
        <span class="logo-text">DK Power</span>
      </div>

      <!-- Spring Boot status indicator -->
      <div class="sb-status" [class]="'sb-status-' + appState">
        <span class="sb-dot" [class]="appState"></span>
        <div class="sb-info">
          <span class="sb-label">Spring Boot</span>
          <span class="sb-state">{{ stateLabel }}</span>
        </div>
      </div>

      <nav class="nav-list">
        <a *ngFor="let item of navItems"
           class="nav-item"
           [routerLink]="item.route"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: item.route === '/' }">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <span class="version" *ngIf="version">v{{ version }}</span>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 220px;
      height: 100%;
      display: flex;
      flex-direction: column;
      background-color: var(--bg-secondary);
      border-right: 1px solid var(--border-color);
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      -webkit-app-region: drag;
    }

    .logo-icon {
      font-size: 22px;
    }

    .logo-text {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .sb-status {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 12px 12px;
      padding: 10px 12px;
      border-radius: 8px;
      background-color: var(--bg-primary);
      border: 1px solid var(--border-color);
    }

    .sb-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .sb-dot.running {
      background-color: var(--accent-success);
      box-shadow: 0 0 8px var(--accent-success);
    }

    .sb-dot.starting, .sb-dot.stopping {
      background-color: var(--accent-warning);
      animation: pulse 1.5s infinite;
    }

    .sb-dot.stopped {
      background-color: var(--text-muted);
    }

    .sb-dot.error {
      background-color: var(--accent-error);
    }

    .sb-info {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .sb-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .sb-state {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .nav-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 0 8px;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 6px;
      color: var(--text-secondary);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: all var(--transition-fast);
      cursor: pointer;
    }

    .nav-item:hover {
      background-color: var(--bg-card);
      color: var(--text-primary);
    }

    .nav-item.active {
      background-color: var(--accent-primary);
      color: white;
    }

    .nav-icon {
      font-size: 16px;
      width: 20px;
      text-align: center;
    }

    .nav-label {
      white-space: nowrap;
    }

    .sidebar-footer {
      padding: 12px 16px;
      border-top: 1px solid var(--border-color);
    }

    .version {
      font-size: 11px;
      color: var(--text-muted);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  version = '';
  appState: AppState = 'stopped';
  private sub?: Subscription;

  navItems: NavItem[] = [
    { label: 'Home', route: '/', icon: '\u2302' },
    { label: 'Fire Impairment', route: '/fire-impairment', icon: '\u2622' },
    { label: 'Gate Log', route: '/gate-log', icon: '\u2706' },
    { label: 'Weather', route: '/weather', icon: '\u2601' },
    { label: 'PJM', route: '/pjm', icon: '\u26A1' },
    { label: 'Logs', route: '/logs', icon: '\u2263' },
    { label: 'Settings', route: '/settings', icon: '\u2699' }
  ];

  constructor(private electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    this.version = await this.electronService.getAppVersion();
    this.sub = this.electronService.appStatus$.subscribe(status => {
      this.appState = status.state;
    });
  }

  get stateLabel(): string {
    const labels: Record<AppState, string> = {
      stopped: 'Stopped',
      starting: 'Starting...',
      running: 'Running',
      stopping: 'Stopping...',
      error: 'Error'
    };
    return labels[this.appState] || this.appState;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
