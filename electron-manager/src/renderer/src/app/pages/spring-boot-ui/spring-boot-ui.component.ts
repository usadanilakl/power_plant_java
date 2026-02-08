import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus } from '../../services/electron.service';

@Component({
  selector: 'app-spring-boot-ui',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sb-ui" *ngIf="status.state === 'running'; else notRunning">
      <iframe [src]="sbUrl" class="sb-iframe"></iframe>
    </div>

    <ng-template #notRunning>
      <div class="placeholder">
        <div class="placeholder-icon">&#x2699;</div>
        <h2>Spring Boot is not running</h2>
        <p class="placeholder-detail" *ngIf="status.state === 'starting'">Starting up... please wait.</p>
        <p class="placeholder-detail" *ngIf="status.state === 'stopping'">Shutting down...</p>
        <p class="placeholder-detail" *ngIf="status.state === 'error'">{{ status.error }}</p>
        <p class="placeholder-detail" *ngIf="status.state === 'stopped'">Start Spring Boot to view the application.</p>
        <div class="placeholder-actions">
          <button class="btn btn-success"
                  *ngIf="status.state === 'stopped' || status.state === 'error'"
                  (click)="start()">Start Spring Boot</button>
          <a class="btn btn-secondary" routerLink="/">Go to Dashboard</a>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1;
      height: 100%;
    }

    .sb-ui {
      display: flex;
      flex: 1;
      height: 100%;
    }

    .sb-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      gap: 12px;
      padding: 40px;
      text-align: center;
    }

    .placeholder-icon {
      font-size: 48px;
      opacity: 0.3;
    }

    .placeholder h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .placeholder-detail {
      font-size: 14px;
      color: var(--text-muted);
      margin: 0;
    }

    .placeholder-actions {
      display: flex;
      gap: 12px;
      margin-top: 8px;
    }
  `]
})
export class SpringBootUiComponent implements OnInit, OnDestroy {
  status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  sbUrl: SafeResourceUrl;
  private sub?: Subscription;

  constructor(
    private electronService: ElectronService,
    private sanitizer: DomSanitizer
  ) {
    this.sbUrl = this.sanitizer.bypassSecurityTrustResourceUrl('http://localhost:8082/app');
  }

  ngOnInit(): void {
    this.sub = this.electronService.appStatus$.subscribe(s => this.status = s);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async start(): Promise<void> {
    await this.electronService.startApp();
  }
}
