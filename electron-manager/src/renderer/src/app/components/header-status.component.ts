import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdvisoryService } from '../services/advisory.service';
import { ElectronService, PjmStatus, PjmUnitStep } from '../services/electron.service';

interface DaPillStep {
  label: string;
  type: PjmUnitStep['type'];
  time: string;
}

/**
 * Compact, always-visible weather + day-ahead status shown in the app header.
 * Weather is color-coded from AdvisoryService severity (green=clear, yellow=caution,
 * red=warning/danger, flashing red=lightning standdown). Clicking navigates to the
 * detail page. Day-ahead shows each unit's next transition; full sequence lives on /pjm.
 */
@Component({
  selector: 'app-header-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hdr-status">
      <button class="pill weather {{ weatherClass() }}" (click)="goWeather()" [title]="weatherTitle()">
        <span class="material-icons">{{ weatherIcon() }}</span>
        <span class="pill-main">{{ tempLabel() }}</span>
        <span class="pill-sub">{{ pillLabel() }}</span>
        <span class="pill-count" *ngIf="advisories().length > 1">+{{ advisories().length - 1 }}</span>
      </button>

      <button class="pill da" (click)="goPjm()" *ngIf="daSteps().length" [title]="daTitle()">
        <span class="material-icons">schedule</span>
        <span class="da-item" *ngFor="let d of daSteps()"
              [class.agc]="d.type === 'AGC'" [class.offline]="d.type === 'OFFLINE'">
          <b>{{ d.label }}</b>&nbsp;{{ d.type }}&nbsp;{{ d.time }}
        </span>
      </button>

      <button class="test-btn" (click)="runDemo()" [disabled]="demoRunning()"
              title="Preview advisory color states (test)">
        <span class="material-icons">{{ demoRunning() ? 'hourglass_top' : 'science' }}</span>
      </button>
    </div>
  `,
  styles: [`
    .hdr-status {
      display: flex; align-items: center; gap: 8px;
      min-width: 0; overflow: hidden;
      -webkit-app-region: no-drag;
    }
    .pill {
      display: inline-flex; align-items: center; gap: 6px;
      height: 28px; padding: 0 10px; border-radius: 999px;
      border: 1px solid var(--border-color); background: var(--bg-card);
      color: var(--text-secondary); cursor: pointer; white-space: nowrap;
      font-size: 12px; max-width: 320px; overflow: hidden;
    }
    .pill .material-icons { font-size: 16px; }
    .pill:hover { border-color: var(--text-muted); }
    .pill-main { font-weight: 700; color: var(--text-primary); }
    .pill-sub { color: inherit; overflow: hidden; text-overflow: ellipsis; }
    .pill-count { font-size: 10px; opacity: 0.8; }

    /* Weather severity colors */
    .pill.weather.green  { border-color: rgba(34,197,94,0.5);  color: rgb(34,197,94); }
    .pill.weather.green  .material-icons { color: rgb(34,197,94); }
    .pill.weather.yellow { border-color: rgba(234,179,8,0.6);  color: rgb(234,179,8);  background: rgba(234,179,8,0.10); }
    .pill.weather.yellow .material-icons { color: rgb(234,179,8); }
    .pill.weather.red    { border-color: rgba(239,68,68,0.7);  color: rgb(248,113,113); background: rgba(239,68,68,0.14); }
    .pill.weather.red    .pill-main,
    .pill.weather.red    .material-icons { color: rgb(248,113,113); }
    .pill.weather.flash  { animation: hdr-flash 1s ease-in-out infinite; }

    @keyframes hdr-flash {
      0%, 100% { background: rgba(239,68,68,0.22); box-shadow: 0 0 0 1px rgba(239,68,68,0.6); }
      50%      { background: rgba(239,68,68,0.02); box-shadow: 0 0 0 1px rgba(239,68,68,0.15); }
    }

    /* Day-ahead pill */
    .pill.da { gap: 8px; }
    .da-item { display: inline-flex; align-items: baseline; }
    .da-item b { color: var(--text-muted); font-weight: 700; margin-right: 3px; }
    .da-item.agc { color: rgb(34,197,94); }
    .da-item.offline { color: rgb(248,113,113); }
    .da-item + .da-item { margin-left: 8px; padding-left: 8px; border-left: 1px solid var(--border-color); }

    @media (prefers-reduced-motion: reduce) {
      .pill.weather.flash { animation: none; background: rgba(239,68,68,0.22); }
    }

    .test-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 26px; height: 26px; border-radius: 6px;
      background: transparent; border: 1px solid var(--border-color);
      color: var(--text-muted); cursor: pointer; flex-shrink: 0;
    }
    .test-btn:hover:not(:disabled) { color: var(--text-primary); border-color: var(--text-muted); }
    .test-btn:disabled { opacity: 0.5; cursor: default; }
    .test-btn .material-icons { font-size: 15px; }
  `],
})
export class HeaderStatusComponent implements OnInit, OnDestroy {
  private pjm: PjmStatus | null = null;
  private unsubPjm?: () => void;

  constructor(
    private advisoryService: AdvisoryService,
    private electron: ElectronService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.seedPjm();
    this.unsubPjm = this.electron.onPjmStatusChange(status => { this.pjm = status; });
  }

  ngOnDestroy(): void {
    this.unsubPjm?.();
  }

  private async seedPjm(): Promise<void> {
    try {
      const res = await this.electron.getPjmStatus();
      if (res.success && res.data) this.pjm = res.data;
    } catch { /* nothing to seed */ }
  }

  advisories() { return this.advisoryService.advisories(); }

  /** green (clear) / yellow (caution) / red (warning-danger) / "red flash" (lightning standdown). */
  weatherClass(): string {
    const adv = this.advisories();
    if (adv.some(a => a.kind === 'lightning' && a.severity === 'danger')) return 'red flash';
    const max = this.advisoryService.maxSeverity();
    if (max === 'danger' || max === 'warning') return 'red';
    if (max === 'caution' || max === 'info') return 'yellow';
    return 'green';
  }

  weatherIcon(): string {
    const adv = this.advisories();
    return adv.length ? adv[0].icon : 'wb_sunny';
  }

  tempLabel(): string {
    const c = this.advisoryService.current();
    return c ? `${Math.round(c.temperature)}°` : '—';
  }

  /** Worst-advisory short label, or the current condition when all clear. */
  pillLabel(): string {
    const adv = this.advisories();
    if (!adv.length) return this.advisoryService.conditionLabel() || 'Clear';
    const a = adv[0];
    if (a.kind === 'lightning') return a.title; // "Lightning Alarm" / "Lightning Watch"
    const word: Record<string, string> = { heat: 'Heat', cold: 'Cold', wind: 'Wind', rain: 'Rain', ice: 'Ice' };
    return word[a.kind] ?? a.title;
  }

  weatherTitle(): string {
    const adv = this.advisories();
    if (!adv.length) {
      const c = this.advisoryService.current();
      return c ? `${Math.round(c.temperature)}°F · ${this.advisoryService.conditionLabel()} · all clear` : 'Weather';
    }
    return adv.map(a => `${a.title} — ${a.detail}`).join('\n');
  }

  daSteps(): DaPillStep[] {
    const out: DaPillStep[] = [];
    const push = (label: string, evo?: PjmStatus['unit1Evolution']) => {
      const s = evo?.steps?.[0];
      if (s) out.push({ label, type: s.type, time: s.time });
    };
    push('U1', this.pjm?.unit1Evolution);
    push('U2', this.pjm?.unit2Evolution);
    return out;
  }

  daTitle(): string {
    const u1 = this.pjm?.unit1Evolution;
    const u2 = this.pjm?.unit2Evolution;
    const line = (label: string, evo?: PjmStatus['unit1Evolution']) => {
      if (!evo?.steps?.length) return '';
      return `${label}: ` + evo.steps.map(s => `${s.type} ${s.time}`).join(' → ');
    };
    return [line('U1', u1), line('U2', u2)].filter(Boolean).join('\n') || 'Day-ahead schedule';
  }

  demoRunning(): boolean { return this.advisoryService.demoRunning(); }
  runDemo(): void { this.advisoryService.runDemo(); }

  goWeather(): void { this.router.navigate(['/weather']); }
  goPjm(): void { this.router.navigate(['/pjm']); }
}
