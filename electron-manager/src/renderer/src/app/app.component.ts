import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { HeaderComponent } from './components/header.component';
import { SidebarComponent } from './layout/sidebar.component';
import { ElectronService, UpdateProgress, ColdResyncProgress } from './services/electron.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent],
  template: `
    <div class="app-container">
      <app-header></app-header>

      <!-- Startup notification banners -->
      <div class="notification-bar update" *ngIf="updateProgress && updateProgress.phase !== 'done' && updateProgress.phase !== 'error'"
           (click)="navigateToSyncUpdates()">
        Downloading update... {{ updateProgress.percent || 0 }}%
      </div>

      <div class="notification-bar update"
           *ngIf="coldResyncProgress && coldResyncProgress.phase !== 'done' && coldResyncProgress.phase !== 'error'"
           (click)="navigateToSyncUpdates()">
        {{ coldResyncProgress.statusMessage }} {{ coldResyncProgress.progressPercent }}%
      </div>

      <div class="notification-bar stale" *ngIf="syncStaleWarning" (click)="navigateToSyncUpdates()">
        {{ syncStaleWarning }}
        <button class="notif-action" (click)="navigateToSyncUpdates(); $event.stopPropagation()">View</button>
        <button class="notif-dismiss" (click)="syncStaleWarning = ''; $event.stopPropagation()">&#x2715;</button>
      </div>

      <div class="notification-bar conflict" *ngIf="deviceConflictWarning" (click)="navigateToSettings()">
        {{ deviceConflictWarning }}
        <button class="notif-action" (click)="navigateToSettings(); $event.stopPropagation()">Settings</button>
        <button class="notif-dismiss" (click)="deviceConflictWarning = ''; $event.stopPropagation()">&#x2715;</button>
      </div>

      <div class="app-body">
        <app-sidebar [collapsed]="sidebarCollapsed" (toggle)="onSidebarToggle()"></app-sidebar>
        <main class="main-content" [class.no-padding]="sidebarCollapsed">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    .app-body {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      transition: padding 200ms ease;
    }

    .main-content.no-padding {
      padding: 0;
      overflow: hidden;
    }

    .notification-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      font-size: 13px;
      cursor: pointer;
      flex-shrink: 0;
    }

    .notification-bar.update {
      background-color: rgba(80, 140, 255, 0.15);
      color: var(--accent-primary);
      border-bottom: 1px solid rgba(80, 140, 255, 0.25);
    }

    .notification-bar.stale {
      background-color: rgba(255, 180, 50, 0.15);
      color: var(--accent-warning);
      border-bottom: 1px solid rgba(255, 180, 50, 0.25);
    }

    .notification-bar.conflict {
      background-color: rgba(255, 80, 80, 0.15);
      color: var(--accent-error);
      border-bottom: 1px solid rgba(255, 80, 80, 0.25);
    }

    .notif-action {
      margin-left: auto;
      background: none;
      border: 1px solid currentColor;
      color: inherit;
      padding: 2px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .notif-dismiss {
      background: none;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 14px;
      padding: 2px 4px;
      opacity: 0.7;
    }

    .notif-dismiss:hover {
      opacity: 1;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'DK Power Manager';
  sidebarCollapsed = false;
  updateProgress: UpdateProgress | null = null;
  coldResyncProgress: ColdResyncProgress | null = null;
  syncStaleWarning = '';
  deviceConflictWarning = '';

  private routerSub?: Subscription;
  private unsubDeviceSetup?: () => void;
  private unsubUpdateProgress?: () => void;
  private unsubSyncStale?: () => void;
  private unsubDeviceConflict?: () => void;
  private unsubColdResyncProgress?: () => void;

  constructor(private router: Router, private electronService: ElectronService) {}

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(event => {
        this.sidebarCollapsed = event.urlAfterRedirects === '/pid-app';
      });

    // Listen for first-run device setup prompt from main process
    this.unsubDeviceSetup = this.electronService.onDeviceNeedsSetup(() => {
      this.router.navigate(['/settings']);
    });

    // Listen for update progress during startup
    this.unsubUpdateProgress = this.electronService.onUpdateProgress((progress) => {
      this.updateProgress = progress;
      if (progress.phase === 'done' || progress.phase === 'error') {
        setTimeout(() => { this.updateProgress = null; }, 5000);
      }
    });

    // Listen for cold resync progress during startup
    this.unsubColdResyncProgress = this.electronService.onColdResyncProgress((progress) => {
      this.coldResyncProgress = progress;
      if (progress.phase === 'done' || progress.phase === 'error') {
        setTimeout(() => { this.coldResyncProgress = null; }, 5000);
      }
    });

    // Listen for sync staleness warning
    this.unsubSyncStale = this.electronService.onSyncStale((data) => {
      this.syncStaleWarning = data.daysSinceSync !== null
        ? `Database sync is ${data.daysSinceSync} days old. Full resync recommended.`
        : 'Database has never been synced. Full resync recommended.';
    });

    // Listen for device conflict warning
    this.unsubDeviceConflict = this.electronService.onDeviceConflict((data) => {
      this.deviceConflictWarning = data.details;
    });
  }

  onSidebarToggle(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  navigateToSyncUpdates(): void {
    this.router.navigate(['/sync-updates']);
  }

  navigateToSettings(): void {
    this.router.navigate(['/settings']);
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.unsubDeviceSetup?.();
    this.unsubUpdateProgress?.();
    this.unsubSyncStale?.();
    this.unsubDeviceConflict?.();
    this.unsubColdResyncProgress?.();
  }
}
