import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus, AppState, APP_DISPLAY_NAME } from '../services/electron.service';

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
    <aside class="sidebar" [class.collapsed]="collapsed">
      <div class="sidebar-header">
        <span class="logo-icon">&#9889;</span>
        <span class="logo-text">DK Power</span>
      </div>

      <!-- Spring Boot status indicator -->
      <div class="sb-status" [class]="'sb-status-' + appState">
        <span class="sb-dot" [class]="appState"></span>
        <div class="sb-info">
          <span class="sb-label">{{ appName }}</span>
          <span class="sb-state">{{ stateLabel }}</span>
        </div>
      </div>

      <nav class="nav-list">
        <a *ngFor="let item of navItems"
           class="nav-item"
           [routerLink]="item.route"
           routerLinkActive="active"
           [routerLinkActiveOptions]="{ exact: item.route === '/' }"
           [title]="collapsed ? item.label : ''">
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </a>
      </nav>

      <div class="sidebar-footer">
        <button class="toggle-btn" (click)="toggle.emit()" [title]="collapsed ? 'Expand sidebar' : 'Collapse sidebar'">
          <span class="toggle-icon">{{ collapsed ? '\u276F' : '\u276E' }}</span>
        </button>
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
      transition: width 200ms ease;
      overflow: hidden;
    }

    .sidebar.collapsed {
      width: 56px;
    }

    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 16px;
      -webkit-app-region: drag;
      min-height: 54px;
    }

    .logo-icon {
      font-size: 22px;
      flex-shrink: 0;
    }

    .logo-text {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      opacity: 1;
      transition: opacity 150ms ease;
    }

    .collapsed .logo-text {
      opacity: 0;
      width: 0;
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
      min-height: 42px;
      overflow: hidden;
      transition: margin 200ms ease, padding 200ms ease;
    }

    .collapsed .sb-status {
      margin: 0 6px 12px;
      padding: 10px 8px;
      justify-content: center;
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
      white-space: nowrap;
      overflow: hidden;
      opacity: 1;
      transition: opacity 150ms ease;
    }

    .collapsed .sb-info {
      opacity: 0;
      width: 0;
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
      transition: padding 200ms ease;
    }

    .collapsed .nav-list {
      padding: 0 4px;
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
      white-space: nowrap;
      overflow: hidden;
    }

    .collapsed .nav-item {
      padding: 10px 8px;
      justify-content: center;
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
      flex-shrink: 0;
    }

    .nav-label {
      white-space: nowrap;
      overflow: hidden;
      opacity: 1;
      transition: opacity 150ms ease;
    }

    .collapsed .nav-label {
      opacity: 0;
      width: 0;
    }

    .sidebar-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      border-top: 1px solid var(--border-color);
      transition: padding 200ms ease;
    }

    .collapsed .sidebar-footer {
      padding: 8px 4px;
      justify-content: center;
    }

    .toggle-btn {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 14px;
      transition: all var(--transition-fast);
    }

    .toggle-btn:hover {
      background-color: var(--bg-card);
      color: var(--text-primary);
    }

    .version {
      font-size: 11px;
      color: var(--text-muted);
      overflow: hidden;
      opacity: 1;
      transition: opacity 150ms ease;
    }

    .collapsed .version {
      opacity: 0;
      width: 0;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class SidebarComponent implements OnInit, OnDestroy {
  @Input() collapsed = false;
  @Output() toggle = new EventEmitter<void>();

  appName = APP_DISPLAY_NAME;
  version = '';
  appState: AppState = 'stopped';
  private sub?: Subscription;

  navItems: NavItem[] = [
    { label: 'Home', route: '/', icon: '\u2302' },
    { label: 'PID App', route: '/pid-app', icon: '\u2756' },
    { label: 'Fire Impairment', route: '/fire-impairment', icon: '\u2622' },
    { label: 'Gate Log', route: '/gate-log', icon: '\u2706' },
    { label: 'Weather', route: '/weather', icon: '\u2601' },
    { label: 'PJM', route: '/pjm', icon: '\u26A1' },
    { label: 'Logs', route: '/logs', icon: '\u2263' },
    { label: 'Sync & Updates', route: '/sync-updates', icon: '\u21BB' },
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
