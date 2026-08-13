import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval, startWith, switchMap, catchError, of, filter } from 'rxjs';

/** Mirrors CentralSyncService.CatchUpStatus (GET /api/field-sync/catchup-status). */
interface CatchUpStatus {
  inProgress: boolean;
  peakPending: number;
  remaining: number;
  applied: number;
  percentComplete: number;
  throughputPerSec: number;
  etaSeconds: number | null;
  elapsedSeconds: number;
}

/**
 * Global banner shown while a reconnected client is draining a sync backlog. Replaces the
 * "always out of sync" indicator with an honest, bounded progress bar: the app stays usable while
 * some data is still loading. Backend data comes from the catch-up session instrumentation added to
 * CentralSyncService. Mounted once at the app root.
 */
@Component({
  selector: 'app-catchup-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (status()?.inProgress) {
      <div class="catchup-banner" role="status" aria-live="polite">
        <div class="catchup-row">
          <span class="catchup-spinner" aria-hidden="true"></span>
          <span class="catchup-text">
            Sync in progress: <strong>{{ status()!.percentComplete }}%</strong>
            — you can keep working; some data may still be loading.
            @if (status()!.etaSeconds != null) {
              <span class="catchup-eta">~{{ status()!.etaSeconds }}s left</span>
            }
          </span>
        </div>
        <div class="catchup-track">
          <div class="catchup-fill" [style.width.%]="status()!.percentComplete"></div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* In-flow at the very top of the app (above <router-outlet>), so it PUSHES the page + its header
       down instead of floating over them. The app headers are position:relative (normal flow), so an
       in-flow bar is the clean, universal fix — no overlap on any page, and it only takes space while
       shown (:host collapses to 0 height when the banner is hidden). */
    :host { display: block; }
    .catchup-banner { position: relative; width: 100%; box-sizing: border-box; z-index: 1;
      background: #1e3a5f; color: #fff; padding: 6px 14px 4px;
      box-shadow: 0 2px 6px rgba(0,0,0,.25); font-size: 13px; }
    .catchup-row { display: flex; align-items: center; gap: 10px; }
    .catchup-text strong { font-variant-numeric: tabular-nums; }
    .catchup-eta { opacity: .8; margin-left: 6px; font-variant-numeric: tabular-nums; }
    .catchup-track { height: 4px; background: rgba(255,255,255,.2); border-radius: 2px;
      margin-top: 5px; overflow: hidden; }
    .catchup-fill { height: 100%; background: #4caf50; transition: width .5s ease; }
    .catchup-spinner { width: 12px; height: 12px; flex: 0 0 auto;
      border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%;
      animation: cu-spin .8s linear infinite; display: inline-block; }
    @keyframes cu-spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .catchup-spinner { animation: none; } }
  `]
})
export class CatchupBannerComponent implements OnInit, OnDestroy {
  status = signal<CatchUpStatus | null>(null);
  private sub?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    // Poll every 4s. The endpoint is cheap (reads volatile counters); returns inProgress=false when idle,
    // which hides the banner. Transient errors are swallowed so a blip never shows a broken banner.
    //
    // /api/field-sync/** is LAN-gated (SecurityConfigSpring lanOnlyMatcher), so an external client —
    // anyone arriving through the public hub URL, e.g. after scanning a QR code — gets a 401 on every
    // single poll. This banner is mounted at app-root, so that was one console error every 4 seconds
    // for the whole session. Auth failures are permanent for that client, not transient: stop asking.
    this.sub = interval(4000).pipe(
      startWith(0),
      filter(() => !this.notPermitted),
      switchMap(() => this.http.get<CatchUpStatus>('/api/field-sync/catchup-status').pipe(
        catchError((err: { status?: number }) => {
          if (err?.status === 401 || err?.status === 403) this.notPermitted = true;
          return of<CatchUpStatus | null>(null);
        })
      ))
    ).subscribe(s => this.status.set(s));
  }

  /** Set once the endpoint answers 401/403 — this client is off-LAN and will never be allowed. */
  private notPermitted = false;

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
