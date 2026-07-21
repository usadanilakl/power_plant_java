import { Component, OnDestroy, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvisoryService, LightningState } from '../services/advisory.service';

/**
 * Large, flashing, full-width LIGHTNING STANDDOWN banner. Mounts in the app shell as a
 * flex-shrink:0 sibling so it DISPLACES content (app stays fully usable, nothing covered).
 * Shows only during an active lightning alarm/watch. Alarm = big + flashing + live all-clear
 * countdown; watch = calmer amber strip. The countdown ticks locally every second and re-syncs
 * to Perry's scraped `MM:SS` timer on each update.
 */
@Component({
  selector: 'app-lightning-standdown-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ls-banner" *ngIf="state() as st" [class.alarm]="st.level === 'alarm'" [class.watch]="st.level === 'watch'">
      <span class="material-icons ls-bolt">bolt</span>

      <div class="ls-main">
        <span class="ls-title">{{ st.level === 'alarm' ? 'LIGHTNING STANDDOWN' : 'LIGHTNING WATCH' }}</span>
        <span class="ls-sub">
          {{ st.level === 'alarm' ? 'Suspend outdoor work — seek shelter' : 'Prepare to suspend outdoor work' }}
          <span class="ls-dist" *ngIf="st.distance"> · {{ st.distance }}</span>
        </span>
      </div>

      <div class="ls-countdown" *ngIf="countdownText() as cd">
        <span class="ls-cd-label">ALL CLEAR IN</span>
        <span class="ls-cd-time">{{ cd }}</span>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; flex-shrink: 0; }

    .ls-banner {
      display: flex; align-items: center; gap: 16px;
      padding: 10px 20px; width: 100%; box-sizing: border-box;
      color: #fff;
    }

    /* ALARM — large + flashing */
    .ls-banner.alarm {
      min-height: 64px;
      background: #b91c1c;
      border-bottom: 2px solid #7f1d1d;
      animation: ls-flash 1s steps(1, end) infinite;
    }
    .ls-banner.alarm .ls-bolt { font-size: 40px; }
    .ls-banner.alarm .ls-title { font-size: 26px; font-weight: 800; letter-spacing: 1px; }
    .ls-banner.alarm .ls-sub { font-size: 14px; }
    .ls-banner.alarm .ls-cd-time { font-size: 34px; }

    @keyframes ls-flash {
      0%, 100% { background: #dc2626; box-shadow: inset 0 0 60px rgba(0,0,0,0); }
      50%      { background: #7f1d1d; box-shadow: inset 0 0 60px rgba(0,0,0,0.35); }
    }

    /* WATCH — calmer amber strip */
    .ls-banner.watch {
      min-height: 44px;
      background: #b45309;
      border-bottom: 1px solid #7c2d12;
    }
    .ls-banner.watch .ls-bolt { font-size: 26px; }
    .ls-banner.watch .ls-title { font-size: 16px; font-weight: 800; letter-spacing: 0.6px; }
    .ls-banner.watch .ls-sub { font-size: 12px; }

    .ls-bolt { flex-shrink: 0; }
    .ls-main { display: flex; flex-direction: column; min-width: 0; }
    .ls-title { line-height: 1.15; }
    .ls-sub { opacity: 0.92; }
    .ls-dist { font-weight: 700; }

    .ls-countdown {
      margin-left: auto; flex-shrink: 0;
      display: flex; flex-direction: column; align-items: flex-end; line-height: 1;
    }
    .ls-cd-label { font-size: 10px; letter-spacing: 1px; opacity: 0.85; }
    .ls-cd-time {
      font-weight: 800; font-variant-numeric: tabular-nums;
      font-feature-settings: 'tnum'; letter-spacing: 1px;
    }

    @media (prefers-reduced-motion: reduce) {
      .ls-banner.alarm { animation: none; background: #b91c1c; }
    }
  `],
})
export class LightningStanddownBannerComponent implements OnInit, OnDestroy {
  private readonly remaining = signal<number | null>(null); // seconds
  private lastTimer: string | undefined | null = undefined;
  private tick: ReturnType<typeof setInterval> | null = null;

  constructor(private advisoryService: AdvisoryService) {
    // Re-seed the local countdown whenever Perry pushes a new timer (or lightning clears).
    effect(() => {
      const st = this.state();
      const timer = st?.timer;
      if (timer !== this.lastTimer) {
        this.lastTimer = timer;
        this.remaining.set(this.parseTimer(timer));
      }
      if (!st) this.remaining.set(null);
    });
  }

  ngOnInit(): void {
    this.tick = setInterval(() => {
      this.remaining.update(r => (r == null ? null : Math.max(0, r - 1)));
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.tick) clearInterval(this.tick);
  }

  state(): LightningState | null { return this.advisoryService.lightningState(); }

  countdownText(): string | null {
    const s = this.remaining();
    if (s == null) return null;
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  private parseTimer(str?: string): number | null {
    if (!str) return null;
    const m = str.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
  }
}
