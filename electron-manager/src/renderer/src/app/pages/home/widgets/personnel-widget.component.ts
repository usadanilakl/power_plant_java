import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ElectronService, PersonnelStatus, PersonnelEntry } from '../../../services/electron.service';

type SizeTier = 'compact' | 'large';

const SHIFT_LABELS: Record<string, string> = {
  'D': 'Day', 'N': 'Night', 'U': 'Off', 'P': 'PTO', 'T': 'Training', '': '-',
};
const SHIFT_COLORS: Record<string, string> = {
  'D': 'shift-day', 'N': 'shift-night', 'U': 'shift-off', 'P': 'shift-pto', 'T': 'shift-training', '': '',
};
const SCHEDULE_URL = 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7BC2B8028F-8473-49EC-8B24-1FEBBB8D1584%7D&file=OPS%20Schedule%202026.xlsx&action=default&mobileredirect=true';

@Component({
  selector: 'app-personnel-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="widget-card" [class.compact]="tier === 'compact'" (click)="navigateToPage($event)">

      <!-- COMPACT (1x1) -->
      <ng-container *ngIf="tier === 'compact'">
        <div class="compact-header">
          <span class="material-icons compact-icon" style="color: #8b5cf6">groups</span>
          <h3>Personnel</h3>
        </div>
        <ng-container *ngIf="status?.status === 'available' && status!.onShiftNow.length > 0">
          <div class="compact-metric">
            <span class="metric-number">{{ status!.onShiftNow.length }}</span>
            <span class="metric-label">{{ status!.currentShiftLabel }}</span>
          </div>
          <div class="compact-names">
            <span *ngFor="let p of status!.onShiftNow.slice(0, 3)">
              <span class="mini-group" [class]="'group-' + p.group.toLowerCase()">{{ p.group.charAt(0) }}</span>
              {{ p.name }}
            </span>
            <span class="more" *ngIf="status!.onShiftNow.length > 3">+{{ status!.onShiftNow.length - 3 }}</span>
          </div>
        </ng-container>
        <div class="compact-status" *ngIf="status?.status === 'loading'">Loading...</div>
        <div class="compact-status" *ngIf="status?.status === 'error'">{{ status!.error }}</div>
        <div class="compact-status" *ngIf="!status">
          <button class="link-btn" (click)="load()" *ngIf="!editMode">Load schedule</button>
        </div>
      </ng-container>

      <!-- LARGE (2x1+) -->
      <ng-container *ngIf="tier === 'large'">
        <div class="header-row">
          <div class="header-left">
            <span class="material-icons header-icon" style="color: #8b5cf6">groups</span>
            <div>
              <h3>Personnel</h3>
              <p class="feature-desc" *ngIf="status?.currentShiftLabel">{{ status!.currentShiftLabel }}</p>
            </div>
          </div>
          <div class="header-actions" *ngIf="!editMode">
            <button class="icon-btn" (click)="refresh()" title="Refresh">
              <span class="material-icons">refresh</span>
            </button>
            <button class="icon-btn" (click)="openSchedule()" title="Open full schedule">
              <span class="material-icons">open_in_new</span>
            </button>
          </div>
        </div>

        <ng-container *ngIf="status?.status === 'available'">
          <!-- On shift now — hero -->
          <div class="on-shift-section" *ngIf="status!.onShiftNow.length > 0">
            <span class="section-label">On Shift Now</span>
            <div class="on-shift-list">
              <div class="person-chip" *ngFor="let p of status!.onShiftNow">
                <span class="person-group" [class]="'group-' + p.group.toLowerCase()">{{ p.group }}</span>
                <span class="person-name">{{ p.name }}</span>
              </div>
            </div>
          </div>

          <!-- Next shift -->
          <div class="on-shift-section next-shift" *ngIf="nextShiftPeople.length > 0">
            <span class="section-label">Next Shift — {{ nextShiftLabel }}</span>
            <div class="on-shift-list">
              <div class="person-chip dimmed" *ngFor="let p of nextShiftPeople">
                <span class="person-group" [class]="'group-' + p.group.toLowerCase()">{{ p.group }}</span>
                <span class="person-name">{{ p.name }}</span>
              </div>
            </div>
          </div>

          <!-- Full roster with schedule -->
          <div class="roster-section" *ngIf="rows >= 2 || (cols >= 2 && rows >= 2)">
            <span class="section-label">Schedule</span>
            <div class="schedule-table">
              <div class="schedule-header">
                <span class="sh-name">Name</span>
                <span class="sh-day" *ngFor="let d of scheduleDays">{{ d }}</span>
              </div>
              <div class="schedule-body">
                <ng-container *ngFor="let group of groups">
                  <div class="group-label">{{ group }}</div>
                  <div class="schedule-row" *ngFor="let p of getGroupMembers(group)">
                    <span class="sr-name">{{ p.name }}</span>
                    <span class="sr-shift" *ngFor="let s of getScheduleSlice(p)"
                          [class]="getShiftClass(s.shift)"
                          [title]="getShiftLabel(s.shift)">
                      {{ s.shift || '-' }}
                    </span>
                  </div>
                </ng-container>
              </div>
            </div>
          </div>
        </ng-container>

        <div class="loading-state" *ngIf="status?.status === 'loading'">
          <span class="material-icons spin">sync</span> Loading schedule...
        </div>

        <div class="empty-state" *ngIf="status?.status === 'error'">
          <span class="material-icons empty-state-icon">error_outline</span>
          <span class="empty-state-title">Failed to load schedule</span>
          <span class="empty-state-desc">{{ status!.error }}</span>
          <button class="retry-btn" (click)="refresh()" *ngIf="!editMode">Retry</button>
        </div>

        <div class="empty-state" *ngIf="!status">
          <span class="material-icons empty-state-icon">groups</span>
          <span class="empty-state-title">Personnel Schedule</span>
          <span class="empty-state-desc">Load the OPS schedule from SharePoint to see who's on shift.</span>
          <button class="retry-btn" (click)="load()" *ngIf="!editMode">Load Schedule</button>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .widget-card {
      display: flex; flex-direction: column; gap: 10px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; height: 100%; box-sizing: border-box; overflow-y: auto;
    }
    .widget-card { cursor: pointer; }
    .widget-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }
    :host { display: block; height: 100%; }

    /* Compact */
    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-metric { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
    .metric-number { font-size: 20px; font-weight: 700; color: var(--text-primary); }
    .metric-label { font-size: 11px; color: var(--text-secondary); }
    .compact-names { display: flex; flex-direction: column; gap: 2px; font-size: 11px; color: var(--text-muted); }
    .mini-group { font-size: 9px; font-weight: 700; color: #fff; padding: 0 3px; border-radius: 2px; margin-right: 3px; }
    .compact-names .more { color: var(--text-muted); }
    .compact-status { font-size: 11px; color: var(--text-muted); }
    .link-btn { background: none; border: none; color: var(--accent-primary); cursor: pointer; font-size: 11px; padding: 0; text-decoration: underline; }

    /* Large — header */
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .header-icon { font-size: 24px; }
    .header-left h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 2px 0 0; }
    .header-actions { display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
    .icon-btn:hover { color: var(--accent-primary); }
    .icon-btn .material-icons { font-size: 18px; }

    /* On shift */
    .section-label { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px; }
    .on-shift-list { display: flex; flex-wrap: wrap; gap: 4px; }
    .person-chip {
      display: flex; align-items: center; gap: 4px; padding: 3px 8px;
      background: var(--bg-secondary); border-radius: 6px; font-size: 11px;
    }
    .person-group { font-weight: 700; font-size: 10px; width: 14px; height: 14px; display: flex; align-items: center; justify-content: center; border-radius: 3px; color: #fff; }
    .group-a { background: #3b82f6; }
    .group-b { background: #22c55e; }
    .group-c { background: #f59e0b; }
    .group-d { background: #ef4444; }
    .group-relief { background: #8b5cf6; }
    .person-name { color: var(--text-secondary); }
    .person-chip.dimmed { opacity: 0.6; }
    .next-shift .section-label { color: var(--text-muted); opacity: 0.8; }

    /* Schedule table */
    .roster-section { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .schedule-table { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .schedule-header {
      display: flex; gap: 2px; padding: 3px 4px; font-size: 9px; font-weight: 600;
      color: var(--text-muted); text-transform: uppercase;
      border-bottom: 1px solid var(--border-color); flex-shrink: 0;
    }
    .sh-name { flex: 2; min-width: 60px; }
    .sh-day { flex: 1; text-align: center; min-width: 24px; }
    .schedule-body { overflow-y: auto; flex: 1; }
    .group-label {
      font-size: 10px; font-weight: 700; color: var(--text-muted); padding: 4px 4px 2px;
      border-top: 1px solid var(--border-color); margin-top: 2px;
    }
    .schedule-row { display: flex; gap: 2px; padding: 2px 4px; font-size: 10px; }
    .schedule-row:hover { background: var(--bg-secondary); }
    .sr-name { flex: 2; min-width: 60px; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sr-shift { flex: 1; text-align: center; min-width: 24px; font-weight: 600; border-radius: 3px; padding: 1px 0; }
    .shift-day { color: #22c55e; background: rgba(34,197,94,0.1); }
    .shift-night { color: #6366f1; background: rgba(99,102,241,0.1); }
    .shift-off { color: var(--text-muted); }
    .shift-pto { color: #3b82f6; background: rgba(59,130,246,0.1); }
    .shift-training { color: #f59e0b; background: rgba(245,158,11,0.1); }

    /* States */
    .loading-state { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); padding: 12px; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; flex: 1; text-align: center; padding: 12px; }
    .empty-state-icon { font-size: 36px; color: var(--text-muted); opacity: 0.3; }
    .empty-state-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
    .empty-state-desc { font-size: 12px; color: var(--text-muted); max-width: 300px; }
    .retry-btn {
      background: var(--accent-primary); color: #fff; border: none; border-radius: 6px;
      padding: 6px 14px; font-size: 12px; cursor: pointer; margin-top: 4px;
    }
  `]
})
export class PersonnelWidgetComponent implements OnInit {
  @Input() cols = 1;
  @Input() rows = 1;
  @Input() editMode = false;

  status: PersonnelStatus | null = null;

  private shiftTimer?: ReturnType<typeof setTimeout>;

  constructor(private electronService: ElectronService, private router: Router) {}

  ngOnInit(): void {
    this.load();
    this.scheduleShiftRefresh();
  }

  ngOnDestroy(): void {
    if (this.shiftTimer) clearTimeout(this.shiftTimer);
  }

  private scheduleShiftRefresh(): void {
    // Schedule refresh at next shift change: 05:00 or 17:00 local time
    const now = new Date();
    const hour = now.getHours();
    const next = new Date(now);
    if (hour < 5) {
      next.setHours(5, 0, 0, 0);
    } else if (hour < 17) {
      next.setHours(17, 0, 0, 0);
    } else {
      next.setDate(next.getDate() + 1);
      next.setHours(5, 0, 0, 0);
    }
    const ms = next.getTime() - now.getTime();
    this.shiftTimer = setTimeout(() => {
      this.refresh();
      this.scheduleShiftRefresh(); // Schedule the next one
    }, ms);
  }

  get nextShiftPeople(): PersonnelEntry[] {
    if (!this.status?.allPersonnel || !this.status.currentShiftLabel) return [];
    const isDayNow = this.status.currentShiftLabel === 'Day Shift';
    const nextCode = isDayNow ? 'N' : 'D';

    if (isDayNow) {
      // Currently day shift → next shift is tonight's night shift → check today's N people
      return this.status.allPersonnel.filter(p => p.todayShift === 'N');
    } else {
      // Currently night shift → next shift is tomorrow's day shift → check tomorrow's schedule
      return this.status.allPersonnel.filter(p => {
        const tomorrow = p.schedule?.[1]; // index 0 = today, 1 = tomorrow
        return tomorrow?.shift === 'D';
      });
    }
  }

  get nextShiftLabel(): string {
    if (!this.status?.currentShiftLabel) return '';
    return this.status.currentShiftLabel === 'Day Shift' ? 'Night Shift' : 'Day Shift';
  }

  get tier(): SizeTier {
    if (this.cols >= 2 || this.rows >= 2) return 'large';
    return 'compact';
  }

  get groups(): string[] {
    if (!this.status?.allPersonnel) return [];
    const g = new Set(this.status.allPersonnel.map(p => p.group).filter(Boolean));
    return Array.from(g).sort();
  }

  get scheduleDays(): string[] {
    const first = this.status?.allPersonnel?.[0];
    if (!first?.schedule?.length) return [];
    return first.schedule.slice(0, 7).map(s => {
      const d = new Date(s.date + 'T12:00:00');
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    });
  }

  getGroupMembers(group: string): PersonnelEntry[] {
    return this.status?.allPersonnel?.filter(p => p.group === group) || [];
  }

  getScheduleSlice(person: PersonnelEntry): { date: string; shift: any }[] {
    return person.schedule.slice(0, 7);
  }

  getShiftLabel(code: string): string { return SHIFT_LABELS[code] || code; }
  getShiftClass(code: string): string { return SHIFT_COLORS[code] || ''; }

  async load(): Promise<void> {
    try {
      const result = await this.electronService.personnelGetStatus();
      if (result.success && result.data) {
        this.status = result.data;
      }
    } catch {}
  }

  async refresh(): Promise<void> {
    this.status = { status: 'loading', onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
    try {
      const result = await this.electronService.personnelRefresh();
      if (result.success && result.data) {
        this.status = result.data;
      } else {
        this.status = { status: 'error', error: result.error || 'Unknown error', onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
      }
    } catch (err: any) {
      this.status = { status: 'error', error: err.message, onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
    }
  }

  navigateToPage(event: Event): void {
    if (this.editMode) return;
    // Don't navigate if clicking a button
    if ((event.target as HTMLElement).closest('button')) return;
    this.router.navigate(['/personnel']);
  }

  openSchedule(): void {
    this.electronService.openExternal(SCHEDULE_URL);
  }
}
