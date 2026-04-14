import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ShiftConfig {
  dayStart: string;
  nightStart: string;
}

interface TimerItem {
  id: number;
  label: string;
  targetTime: number;
  remaining: string;
  expired: boolean;
  expiredAt: string;
  audioEnabled: boolean;
  audioPlayed: boolean;
}

const SHIFT_STORAGE_KEY = 'dk-widget-shift-config';
const TIMERS_STORAGE_KEY = 'dk-widget-timers';

@Component({
  selector: 'app-clock-widget',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="widget-card" [class.compact]="cols === 1 && rows === 1">
      <div class="widget-header">
        <span class="material-icons widget-icon" style="color: #6366f1">schedule</span>
        <h3>Clock & Timers</h3>
      </div>

      <div class="clock-display">
        <span class="clock-time">{{ currentTime }}</span>
        <span class="clock-date" *ngIf="cols >= 2 || rows >= 2">{{ currentDate }}</span>
      </div>

      <div class="shift-info">
        <span class="shift-label">{{ currentShift }}</span>
        <span class="shift-remaining">{{ shiftRemaining }} left</span>
      </div>

      <div class="shift-config" *ngIf="showConfig">
        <div class="config-row">
          <label>Day shift start:</label>
          <input type="time" [(ngModel)]="shiftConfig.dayStart" (change)="saveShiftConfig()" />
        </div>
        <div class="config-row">
          <label>Night shift start:</label>
          <input type="time" [(ngModel)]="shiftConfig.nightStart" (change)="saveShiftConfig()" />
        </div>
      </div>
      <button class="config-toggle" (click)="showConfig = !showConfig" *ngIf="!editMode">
        <span class="material-icons">{{ showConfig ? 'expand_less' : 'settings' }}</span>
      </button>

      <!-- Timers (expanded view) -->
      <div class="timers-section" *ngIf="rows >= 2 || cols >= 2">
        <div class="timers-header">
          <span class="timers-title">Timers</span>
          <button class="add-timer-btn" (click)="showAddTimer = !showAddTimer" *ngIf="!editMode">
            <span class="material-icons">{{ showAddTimer ? 'close' : 'add' }}</span>
          </button>
        </div>

        <!-- Add timer form -->
        <div class="add-timer-form" *ngIf="showAddTimer">
          <input class="timer-input" type="text" placeholder="Label" [(ngModel)]="newTimerLabel" maxlength="30" />

          <!-- Mode tabs -->
          <div class="mode-tabs">
            <button class="mode-tab" [class.active]="timerMode === 'minutes'" (click)="timerMode = 'minutes'">Minutes</button>
            <button class="mode-tab" [class.active]="timerMode === 'datetime'" (click)="timerMode = 'datetime'">Date/Time</button>
          </div>

          <!-- Minutes mode -->
          <div class="mode-row" *ngIf="timerMode === 'minutes'">
            <input class="timer-input timer-min" type="number" placeholder="Min" [(ngModel)]="newTimerMinutes" min="1" max="9999" />
            <span class="mode-hint">min</span>
          </div>

          <!-- DateTime mode -->
          <div class="mode-row" *ngIf="timerMode === 'datetime'">
            <input class="timer-input" type="date" [(ngModel)]="newTimerDate" />
            <input class="timer-input timer-time" type="time" [(ngModel)]="newTimerTime" />
          </div>

          <div class="form-actions">
            <label class="audio-toggle" title="Play sound on expiry">
              <input type="checkbox" [(ngModel)]="newTimerAudio" />
              <span class="material-icons audio-icon">{{ newTimerAudio ? 'volume_up' : 'volume_off' }}</span>
            </label>
            <button class="add-btn" (click)="addTimer()" [disabled]="!canAddTimer">
              <span class="material-icons">timer</span> Start
            </button>
          </div>
        </div>

        <!-- Timer list -->
        <div class="timer-list">
          <div class="timer-item" *ngFor="let t of timers" [class.expired]="t.expired">
            <div class="timer-info">
              <div class="timer-top-row">
                <span class="timer-label">{{ t.label || 'Timer' }}</span>
                <span class="material-icons audio-badge" *ngIf="t.audioEnabled" [class.played]="t.audioPlayed"
                      title="Audio alert {{ t.audioPlayed ? '(played)' : '(pending)' }}">
                  {{ t.audioPlayed ? 'volume_off' : 'volume_up' }}
                </span>
              </div>
              <span class="timer-remaining">{{ t.remaining }}</span>
              <span class="timer-expired-at" *ngIf="t.expired">Expired {{ t.expiredAt }}</span>
            </div>
            <button class="timer-remove" (click)="removeTimer(t.id)" *ngIf="!editMode">
              <span class="material-icons">close</span>
            </button>
          </div>
          <div class="no-timers" *ngIf="timers.length === 0">No active timers</div>
        </div>
      </div>

      <!-- Compact timer count -->
      <div class="compact-timers" *ngIf="cols === 1 && rows === 1 && timers.length > 0">
        <span class="material-icons timer-icon" [class.has-expired]="hasExpired">timer</span>
        {{ activeTimerCount }} active{{ expiredCount > 0 ? ', ' + expiredCount + ' expired' : '' }}
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      display: flex; flex-direction: column; gap: 8px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; height: 100%; box-sizing: border-box; overflow-y: auto;
    }
    .widget-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }
    :host { display: block; height: 100%; }
    .widget-header { display: flex; align-items: center; gap: 8px; }
    .widget-icon { font-size: 22px; }
    .widget-header h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .clock-display { display: flex; align-items: baseline; gap: 10px; }
    .clock-time { font-size: 28px; font-weight: 700; color: var(--text-primary); font-family: monospace; }
    .compact .clock-time { font-size: 22px; }
    .clock-date { font-size: 12px; color: var(--text-muted); }
    .shift-info { display: flex; align-items: center; gap: 8px; font-size: 12px; }
    .shift-label { color: var(--text-secondary); font-weight: 600; }
    .shift-remaining { color: var(--text-muted); }
    .shift-config { display: flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--bg-secondary); border-radius: 8px; }
    .config-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-secondary); }
    .config-row label { min-width: 110px; }
    .config-row input[type="time"] {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px;
      color: var(--text-primary); padding: 2px 6px; font-size: 12px;
    }
    .config-toggle { align-self: flex-start; background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; }
    .config-toggle:hover { color: var(--text-primary); }
    .config-toggle .material-icons { font-size: 16px; }
    .timers-section { flex: 1; display: flex; flex-direction: column; gap: 6px; min-height: 0; }
    .timers-header { display: flex; justify-content: space-between; align-items: center; }
    .timers-title { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
    .add-timer-btn { background: none; border: none; color: var(--accent-primary); cursor: pointer; padding: 0; }
    .add-timer-btn .material-icons { font-size: 18px; }

    .add-timer-form { display: flex; flex-direction: column; gap: 6px; padding: 8px; background: var(--bg-secondary); border-radius: 8px; }
    .timer-input {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px;
      color: var(--text-primary); padding: 4px 8px; font-size: 12px; min-width: 0;
    }
    .timer-input:focus { border-color: var(--accent-primary); outline: none; }
    .timer-min { width: 60px; }
    .timer-time { width: 90px; }
    .mode-tabs { display: flex; gap: 4px; }
    .mode-tab {
      flex: 1; padding: 4px 8px; font-size: 11px; border: 1px solid var(--border-color);
      border-radius: 4px; background: transparent; color: var(--text-muted); cursor: pointer;
    }
    .mode-tab.active { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
    .mode-row { display: flex; gap: 6px; align-items: center; }
    .mode-hint { font-size: 11px; color: var(--text-muted); }
    .form-actions { display: flex; justify-content: space-between; align-items: center; }
    .audio-toggle { display: flex; align-items: center; cursor: pointer; }
    .audio-toggle input { display: none; }
    .audio-icon { font-size: 18px; color: var(--text-muted); }
    .audio-toggle input:checked + .audio-icon { color: var(--accent-primary); }

    .add-btn {
      display: flex; align-items: center; gap: 2px;
      background: var(--accent-primary); color: #fff; border: none; border-radius: 4px;
      padding: 4px 10px; font-size: 11px; cursor: pointer; white-space: nowrap;
    }
    .add-btn:disabled { opacity: 0.4; cursor: default; }
    .add-btn .material-icons { font-size: 14px; }

    .timer-list { display: flex; flex-direction: column; gap: 4px; overflow-y: auto; flex: 1; }
    .timer-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 6px 8px; background: var(--bg-secondary); border-radius: 6px; font-size: 12px;
    }
    .timer-item.expired { background: rgba(239, 68, 68, 0.15); }
    .timer-info { display: flex; flex-direction: column; gap: 1px; }
    .timer-top-row { display: flex; align-items: center; gap: 4px; }
    .timer-label { color: var(--text-secondary); font-weight: 500; }
    .audio-badge { font-size: 13px; color: var(--accent-primary); }
    .audio-badge.played { color: var(--text-muted); }
    .timer-remaining { font-family: monospace; font-weight: 700; color: var(--text-primary); }
    .timer-item.expired .timer-remaining { color: var(--accent-error); }
    .timer-expired-at { font-size: 10px; color: var(--text-muted); }
    .timer-remove { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0; }
    .timer-remove:hover { color: var(--accent-error); }
    .timer-remove .material-icons { font-size: 16px; }
    .no-timers { font-size: 11px; color: var(--text-muted); text-align: center; padding: 8px; }
    .compact-timers { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 4px; }
    .timer-icon { font-size: 14px; }
    .timer-icon.has-expired { color: var(--accent-error); }
  `]
})
export class ClockWidgetComponent implements OnInit, OnDestroy {
  @Input() cols = 1;
  @Input() rows = 1;
  @Input() editMode = false;

  currentTime = '';
  currentDate = '';
  currentShift = '';
  shiftRemaining = '';
  showConfig = false;
  showAddTimer = false;
  timerMode: 'minutes' | 'datetime' = 'minutes';
  newTimerLabel = '';
  newTimerMinutes: number | null = null;
  newTimerDate = '';
  newTimerTime = '';
  newTimerAudio = false;
  timers: TimerItem[] = [];
  private tickInterval?: ReturnType<typeof setInterval>;
  private nextTimerId = 1;
  private audioCtx?: AudioContext;

  shiftConfig: ShiftConfig = { dayStart: '06:00', nightStart: '18:00' };

  ngOnInit(): void {
    this.loadShiftConfig();
    this.loadTimers();
    this.tick();
    this.tickInterval = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy(): void {
    if (this.tickInterval) clearInterval(this.tickInterval);
  }

  private tick(): void {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.currentDate = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    this.updateShift(now);
    this.updateTimers();
  }

  private updateShift(now: Date): void {
    const [dayH, dayM] = this.shiftConfig.dayStart.split(':').map(Number);
    const [nightH, nightM] = this.shiftConfig.nightStart.split(':').map(Number);
    const dayMinutes = dayH * 60 + dayM;
    const nightMinutes = nightH * 60 + nightM;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let endMinutes: number;
    if (nowMinutes >= dayMinutes && nowMinutes < nightMinutes) {
      this.currentShift = 'Day Shift';
      endMinutes = nightMinutes;
    } else {
      this.currentShift = 'Night Shift';
      endMinutes = nowMinutes >= nightMinutes ? dayMinutes + 24 * 60 : dayMinutes;
    }

    const remainMin = endMinutes - nowMinutes;
    const rh = Math.floor(remainMin / 60);
    const rm = remainMin % 60;
    this.shiftRemaining = `${rh}h ${rm}m`;
  }

  private updateTimers(): void {
    const now = Date.now();
    let needsSave = false;
    for (const t of this.timers) {
      const diff = t.targetTime - now;
      if (diff <= 0) {
        if (!t.expired) {
          // Just expired this tick
          t.expired = true;
          t.expiredAt = new Date(t.targetTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
          if (t.audioEnabled && !t.audioPlayed) {
            this.playAlarm();
            t.audioPlayed = true;
          }
          needsSave = true;
        }
        const elapsed = Math.abs(diff);
        const s = Math.floor(elapsed / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        if (h > 0) t.remaining = `-${h}h ${m % 60}m`;
        else if (m > 0) t.remaining = `-${m}m ${s % 60}s`;
        else t.remaining = `-${s}s`;
      } else {
        const s = Math.floor(diff / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const d = Math.floor(h / 24);
        if (d > 0) t.remaining = `${d}d ${h % 24}h ${m % 60}m`;
        else if (h > 0) t.remaining = `${h}h ${m % 60}m ${s % 60}s`;
        else if (m > 0) t.remaining = `${m}m ${s % 60}s`;
        else t.remaining = `${s}s`;
        t.expired = false;
      }
    }
    if (needsSave) this.saveTimers();
  }

  get activeTimerCount(): number { return this.timers.filter(t => !t.expired).length; }
  get expiredCount(): number { return this.timers.filter(t => t.expired).length; }
  get hasExpired(): boolean { return this.expiredCount > 0; }

  get canAddTimer(): boolean {
    if (this.timerMode === 'minutes') return !!this.newTimerMinutes && this.newTimerMinutes >= 1;
    return !!this.newTimerDate && !!this.newTimerTime;
  }

  addTimer(): void {
    let targetTime: number;
    if (this.timerMode === 'minutes') {
      if (!this.newTimerMinutes || this.newTimerMinutes < 1) return;
      targetTime = Date.now() + this.newTimerMinutes * 60 * 1000;
    } else {
      if (!this.newTimerDate || !this.newTimerTime) return;
      targetTime = new Date(`${this.newTimerDate}T${this.newTimerTime}`).getTime();
      if (isNaN(targetTime)) return;
    }

    const timer: TimerItem = {
      id: this.nextTimerId++,
      label: this.newTimerLabel || 'Timer',
      targetTime,
      remaining: '',
      expired: false,
      expiredAt: '',
      audioEnabled: this.newTimerAudio,
      audioPlayed: false,
    };
    this.timers.push(timer);
    this.newTimerLabel = '';
    this.newTimerMinutes = null;
    this.newTimerDate = '';
    this.newTimerTime = '';
    this.showAddTimer = false;
    this.saveTimers();
  }

  removeTimer(id: number): void {
    this.timers = this.timers.filter(t => t.id !== id);
    this.saveTimers();
  }

  private playAlarm(): void {
    try {
      if (!this.audioCtx) this.audioCtx = new AudioContext();
      // Three ascending beeps
      [0, 200, 400].forEach(delay => {
        const osc = this.audioCtx!.createOscillator();
        const gain = this.audioCtx!.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx!.destination);
        osc.frequency.value = 880 + delay;
        gain.gain.value = 0.3;
        const t = this.audioCtx!.currentTime + delay / 1000;
        osc.start(t);
        osc.stop(t + 0.15);
      });
    } catch {}
  }

  saveShiftConfig(): void {
    localStorage.setItem(SHIFT_STORAGE_KEY, JSON.stringify(this.shiftConfig));
  }

  private loadShiftConfig(): void {
    try {
      const raw = localStorage.getItem(SHIFT_STORAGE_KEY);
      if (raw) this.shiftConfig = { ...this.shiftConfig, ...JSON.parse(raw) };
    } catch {}
  }

  private saveTimers(): void {
    const data = this.timers.map(t => ({
      id: t.id, label: t.label, targetTime: t.targetTime,
      audioEnabled: t.audioEnabled, audioPlayed: t.audioPlayed, expiredAt: t.expiredAt,
    }));
    localStorage.setItem(TIMERS_STORAGE_KEY, JSON.stringify(data));
  }

  private loadTimers(): void {
    try {
      const raw = localStorage.getItem(TIMERS_STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as any[];
      this.timers = data.map(d => ({
        id: d.id, label: d.label, targetTime: d.targetTime, remaining: '', expired: false,
        expiredAt: d.expiredAt || '', audioEnabled: !!d.audioEnabled, audioPlayed: !!d.audioPlayed,
      }));
      this.nextTimerId = this.timers.length > 0 ? Math.max(...this.timers.map(t => t.id)) + 1 : 1;
    } catch {}
  }
}
