import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdvisoryService, LightningState } from '../services/advisory.service';

/**
 * Large, flashing, full-width LIGHTNING STANDDOWN banner. Mounts in the app shell as a
 * flex-shrink:0 sibling so it DISPLACES content (app stays fully usable, nothing covered).
 * Shows only during an active lightning alarm/watch. Alarm = big + flashing + live all-clear
 * countdown; watch = calmer amber strip. The countdown and the "stop flashing" (silence) state
 * are owned by AdvisoryService so this banner and the header pill stay in lock-step.
 */
@Component({
  selector: 'app-lightning-standdown-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ls-banner" *ngIf="state() as st"
         [class.alarm]="st.level === 'alarm'" [class.watch]="st.level === 'watch'" [class.silenced]="silenced()">
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

      <button class="ls-stop" *ngIf="st.level === 'alarm' && !silenced()" (click)="stopFlash()"
              title="Acknowledge — stop the flashing (alert stays visible)">
        <span class="material-icons">notifications_off</span> Stop flashing
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; flex-shrink: 0; }

    .ls-banner {
      display: flex; align-items: center; gap: 16px;
      padding: 10px 20px; width: 100%; box-sizing: border-box;
      color: #fff;
    }

    /* ALARM — large + flashing. Crisp two-state flash (~1 Hz), kept even under reduced-motion:
       a lightning standdown is safety-critical and must be noticed. 1 Hz is far below any
       photosensitivity-strobe threshold. */
    .ls-banner.alarm {
      min-height: 64px;
      background: #ef4444;
      border-bottom: 2px solid #7f1d1d;
      animation: ls-flash 1s infinite;
    }
    /* Acknowledged: stop flashing but keep the banner fully visible. */
    .ls-banner.alarm.silenced { animation: none; background: #b91c1c; }

    .ls-banner.alarm .ls-bolt { font-size: 40px; }
    .ls-banner.alarm .ls-title { font-size: 26px; font-weight: 800; letter-spacing: 1px; }
    .ls-banner.alarm .ls-sub { font-size: 14px; }
    .ls-banner.alarm .ls-cd-time { font-size: 34px; }

    @keyframes ls-flash {
      0%, 49%   { background: #ef4444; }   /* bright red */
      50%, 100% { background: #7f1d1d; }   /* dark red   */
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

    .ls-stop {
      flex-shrink: 0; display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 12px; border-radius: 6px;
      background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.55);
      color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
    }
    .ls-stop:hover { background: rgba(0,0,0,0.45); }
    .ls-stop .material-icons { font-size: 17px; }
    /* When the countdown isn't present, the stop button anchors to the right. */
    .ls-banner .ls-countdown + .ls-stop { margin-left: 0; }
    .ls-banner .ls-main + .ls-stop { margin-left: auto; }
  `],
})
export class LightningStanddownBannerComponent {
  constructor(private advisoryService: AdvisoryService) {}

  state(): LightningState | null { return this.advisoryService.lightningState(); }
  countdownText(): string | null { return this.advisoryService.lightningCountdownText(); }
  silenced(): boolean { return this.advisoryService.flashSilenced(); }
  stopFlash(): void { this.advisoryService.silenceFlash(); }
}
