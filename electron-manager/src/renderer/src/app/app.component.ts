import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription, filter } from 'rxjs';
import { HeaderComponent } from './components/header.component';
import { SidebarComponent } from './layout/sidebar.component';
import { AdvisoryBandComponent } from './components/advisory-band/advisory-band.component';
import { LightningStanddownBannerComponent } from './components/lightning-standdown-banner.component';
import { ImportantMessageModalComponent } from './pages/personnel/important-message-modal.component';
import { ElectronService, StartupAssessment, SyncExecuteProgress, SyncComponent } from './services/electron.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SidebarComponent, AdvisoryBandComponent, LightningStanddownBannerComponent, ImportantMessageModalComponent],
  template: `
    <div class="app-container">
      <app-header></app-header>

      <!-- Plant Chat: important-message modal — global, requires explicit ack -->
      <app-important-message-modal></app-important-message-modal>

      <!-- Lightning standdown: highest-priority safety alert, shown on every page -->
      <app-lightning-standdown-banner></app-lightning-standdown-banner>

      <!-- Server unreachable -->
      <div class="notification-bar conflict" *ngIf="serverReachable === false && !syncInProgress">
        Sync server unreachable
        <button class="notif-action" (click)="navigateToSettings()">Settings</button>
      </div>

      <!-- Assessment: something needed -->
      <div class="notification-bar info" *ngIf="assessment && needsSync && !syncInProgress && serverReachable !== false && !assessmentDismissed">
        {{ assessmentSummary }}
        <button class="notif-action" (click)="syncNeeded()">Sync Now</button>
        <button class="notif-action" (click)="navigateToSyncUpdates()">Details</button>
        <button class="notif-dismiss" (click)="assessmentDismissed = true"><span class="material-icons" style="font-size:14px">close</span></button>
      </div>

      <!-- Sync in progress -->
      <div class="notification-bar update" *ngIf="syncInProgress" (click)="navigateToSyncUpdates()">
        {{ syncProgress?.statusMessage }} {{ syncProgress?.progressPercent }}%
      </div>

      <!-- Sync stale (post-startup, from Spring Boot) -->
      <div class="notification-bar stale" *ngIf="syncStaleWarning" (click)="navigateToSyncUpdates()">
        {{ syncStaleWarning }}
        <button class="notif-action" (click)="navigateToSyncUpdates(); $event.stopPropagation()">View</button>
        <button class="notif-dismiss" (click)="syncStaleWarning = ''; $event.stopPropagation()"><span class="material-icons" style="font-size:14px">close</span></button>
      </div>

      <!-- Device conflict (post-startup) -->
      <div class="notification-bar conflict" *ngIf="deviceConflictWarning" (click)="navigateToSettings()">
        {{ deviceConflictWarning }}
        <button class="notif-action" (click)="navigateToSettings(); $event.stopPropagation()">Settings</button>
        <button class="notif-dismiss" (click)="deviceConflictWarning = ''; $event.stopPropagation()"><span class="material-icons" style="font-size:14px">close</span></button>
      </div>

      <!-- Always-visible operations advisory band (hidden on the full-screen PID app) -->
      <app-advisory-band *ngIf="currentUrl !== '/pid-app'"></app-advisory-band>

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

    .notification-bar.info {
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

    .notif-action + .notif-action {
      margin-left: 0;
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
  currentUrl = '';

  // Startup assessment state
  assessment: StartupAssessment | null = null;
  serverReachable: boolean | null = null; // null = not checked yet
  syncProgress: SyncExecuteProgress | null = null;
  syncInProgress = false;
  assessmentDismissed = false;

  // Post-startup warnings (from Spring Boot)
  syncStaleWarning = '';
  deviceConflictWarning = '';

  private routerSub?: Subscription;
  private unsubDeviceSetup?: () => void;
  private unsubStartupAssessment?: () => void;
  private unsubServerStatus?: () => void;
  private unsubSyncProgress?: () => void;
  private unsubSyncStale?: () => void;
  private unsubDeviceConflict?: () => void;

  constructor(private router: Router, private electronService: ElectronService) {}

  ngOnInit(): void {
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(event => {
        this.currentUrl = event.urlAfterRedirects;
        this.sidebarCollapsed = event.urlAfterRedirects === '/pid-app';
      });

    // Listen for first-run device setup prompt from main process
    this.unsubDeviceSetup = this.electronService.onDeviceNeedsSetup(() => {
      this.router.navigate(['/settings']);
    });

    // Listen for startup assessment from main process
    this.unsubStartupAssessment = this.electronService.onStartupAssessment((a) => {
      this.assessment = a;
      this.serverReachable = a.serverReachable;
      this.assessmentDismissed = false;
    });

    // Listen for server reachability changes (polling)
    this.unsubServerStatus = this.electronService.onStartupServerStatus((data) => {
      this.serverReachable = data.reachable;
    });

    // Listen for selective sync progress
    this.unsubSyncProgress = this.electronService.onSyncExecuteProgress((progress) => {
      this.syncProgress = progress;
      this.syncInProgress = progress.phase !== 'done' && progress.phase !== 'error';
      if (progress.phase === 'done' || progress.phase === 'error') {
        setTimeout(() => {
          this.syncProgress = null;
          this.syncInProgress = false;
        }, 5000);
      }
    });

    // Listen for sync staleness warning (post-startup, from Spring Boot)
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

  get needsSync(): boolean {
    if (!this.assessment) return false;
    const a = this.assessment;
    return !a.jar.present || a.jar.updateAvailable || !a.db.present || !a.files.present || a.sync.stale;
  }

  get assessmentSummary(): string {
    if (!this.assessment) return '';
    const items: string[] = [];
    if (!this.assessment.jar.present) items.push('JAR missing');
    else if (this.assessment.jar.updateAvailable) items.push('JAR update available');
    if (!this.assessment.db.present) items.push('Database missing');
    if (!this.assessment.files.present) items.push('Files missing');
    if (this.assessment.sync.stale) {
      items.push(this.assessment.sync.daysSinceSync !== null
        ? `Sync ${this.assessment.sync.daysSinceSync}d old`
        : 'Never synced');
    }
    return items.join(', ');
  }

  syncNeeded(): void {
    if (!this.assessment) return;
    const components: SyncComponent[] = [];
    if (!this.assessment.jar.present || this.assessment.jar.updateAvailable) components.push('jar');
    if (!this.assessment.db.present || this.assessment.sync.stale) components.push('db');
    if (!this.assessment.files.present) components.push('files');
    if (components.length === 0) return;
    this.electronService.executeSync(components);
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
    this.unsubStartupAssessment?.();
    this.unsubServerStatus?.();
    this.unsubSyncProgress?.();
    this.unsubSyncStale?.();
    this.unsubDeviceConflict?.();
  }
}
