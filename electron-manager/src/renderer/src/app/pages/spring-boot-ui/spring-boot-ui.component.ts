import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus, APP_DISPLAY_NAME } from '../../services/electron.service';

@Component({
  selector: 'app-spring-boot-ui',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="sb-ui" *ngIf="status.state === 'running'; else notRunning">
      <iframe #sbIframe [src]="sbUrl" class="sb-iframe"></iframe>
      <button class="refresh-btn" (click)="refreshPage()" title="Refresh page">&#x21BB;</button>
    </div>

    <ng-template #notRunning>
      <div class="placeholder">
        <div class="placeholder-icon">&#x2699;</div>
        <h2>{{ appName }} is not running</h2>
        <p class="placeholder-detail" *ngIf="status.state === 'starting'">Starting up... please wait.</p>
        <p class="placeholder-detail" *ngIf="status.state === 'stopping'">Shutting down...</p>
        <p class="placeholder-detail" *ngIf="status.state === 'error'">{{ status.error }}</p>
        <p class="placeholder-detail" *ngIf="status.state === 'stopped'">Start {{ appName }} to view the application.</p>
        <div class="placeholder-actions">
          <button class="btn btn-success"
                  *ngIf="status.state === 'stopped' || status.state === 'error'"
                  (click)="start()">Start {{ appName }}</button>
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
      position: relative;
    }

    .sb-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .refresh-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      background: var(--bg-card);
      color: var(--text-muted);
      font-size: 18px;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 150ms;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .refresh-btn:hover {
      opacity: 1;
      color: var(--text-primary);
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
  @ViewChild('sbIframe') iframe?: ElementRef<HTMLIFrameElement>;

  appName = APP_DISPLAY_NAME;
  status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  sbUrl: SafeResourceUrl;
  private sub?: Subscription;

  constructor(
    private electronService: ElectronService,
    private sanitizer: DomSanitizer,
    private route: ActivatedRoute
  ) {
    const subPath = this.route.snapshot.queryParamMap.get('path');
    const url = subPath ? `http://localhost:8082/app/${subPath}` : 'http://localhost:8082/app';
    this.sbUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
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

  refreshPage(): void {
    try {
      this.iframe?.nativeElement?.contentWindow?.location.reload();
    } catch {
      // Cross-origin fallback: re-assign src to current value
      if (this.iframe?.nativeElement) {
        this.iframe.nativeElement.src = this.iframe.nativeElement.src;
      }
    }
  }
}
