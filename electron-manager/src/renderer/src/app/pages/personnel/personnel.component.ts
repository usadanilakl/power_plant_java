import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService, PersonnelStatus, PersonnelEntry, PersonnelContact } from '../../services/electron.service';

const SCHEDULE_URL = 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7BC2B8028F-8473-49EC-8B24-1FEBBB8D1584%7D&file=OPS%20Schedule%202026.xlsx&action=default&mobileredirect=true';
const CONTACTS_URL = 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7BE445C5F4-C235-45F7-8D29-F0613E875FA0%7D&file=EMERGENCY%20CONTACT%20LIST%20-%20EDITED%2011_2024.xlsx&action=default&mobileredirect=true';

const SHIFT_LABELS: Record<string, string> = {
  'D': 'Day Shift', 'N': 'Night Shift', 'U': 'Off', 'P': 'PTO', 'T': 'Training', 'OCM': 'On Call Manager', '': 'Off',
};

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Personnel</h1>
        <div class="header-actions">
          <button class="btn btn-icon" (click)="openSchedule()" title="Open full schedule on SharePoint">
            <span class="material-icons">open_in_new</span>
          </button>
          <button class="btn btn-primary" (click)="refresh()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'schedule'" (click)="activeTab = 'schedule'">
          <span class="material-icons tab-icon">calendar_month</span> Schedule
        </button>
        <button class="tab" [class.active]="activeTab === 'contacts'" (click)="activeTab = 'contacts'; loadContacts()">
          <span class="material-icons tab-icon">contacts</span> Contacts
        </button>
      </div>

      <!-- Schedule Tab -->
      <div class="tab-content" *ngIf="activeTab === 'schedule'">
        <!-- On shift now -->
        <div class="section" *ngIf="status?.status === 'available' && status!.onShiftNow.length > 0">
          <h2 class="section-title">
            <span class="material-icons section-icon">groups</span>
            On Shift Now &mdash; {{ status!.currentShiftLabel }}
          </h2>
          <div class="on-shift-chips">
            <div class="person-chip" *ngFor="let p of status!.onShiftNow">
              <span class="chip-group" [class]="'group-' + p.group.toLowerCase()">{{ p.group }}</span>
              <span class="chip-name">{{ p.name }}</span>
            </div>
          </div>
        </div>

        <!-- On Call Manager today -->
        <div class="section" *ngIf="status?.status === 'available' && onCallManagerToday.length > 0">
          <h2 class="section-title">
            <span class="material-icons section-icon">support_agent</span>
            On Call Manager
          </h2>
          <div class="on-shift-chips">
            <div class="person-chip" *ngFor="let p of onCallManagerToday">
              <span class="chip-group group-ocm">OCM</span>
              <span class="chip-name">{{ p.name }}</span>
            </div>
          </div>
        </div>

        <!-- Full schedule table -->
        <div class="section" *ngIf="status?.status === 'available'">
          <div class="schedule-header-row">
            <h2 class="section-title">
              <span class="material-icons section-icon">event_note</span>
              Schedule
            </h2>
            <div class="month-selector">
              <button *ngFor="let m of monthOptions"
                      class="month-btn"
                      [class.active]="m.idx === selectedMonth"
                      (click)="selectMonth(m.idx)">
                {{ m.label }}
              </button>
            </div>
          </div>
          <div class="schedule-table-wrap">
            <table class="schedule-table">
              <thead>
                <tr>
                  <th class="th-group">Group</th>
                  <th class="th-name">Name</th>
                  <th *ngFor="let d of scheduleDays" class="th-day" [class.today]="d.isToday">
                    <span class="day-name">{{ d.dayName }}</span>
                    <span class="day-num">{{ d.dayNum }}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <ng-container *ngFor="let group of groups">
                  <tr class="group-separator">
                    <td [attr.colspan]="2 + scheduleDays.length">
                      <span class="group-label" [class]="'group-' + group.toLowerCase()">{{ group }}</span>
                    </td>
                  </tr>
                  <tr *ngFor="let p of getGroupMembers(group)" class="person-row">
                    <td class="td-group">
                      <span class="group-badge" [class]="'group-' + group.toLowerCase()">{{ groupBadge(group) }}</span>
                    </td>
                    <td class="td-name">{{ p.name }}</td>
                    <td *ngFor="let s of getMonthSchedule(p); let i = index"
                        class="td-shift" [class]="getShiftClass(s.shift)"
                        [class.today]="scheduleDays[i] && scheduleDays[i].isToday"
                        [title]="getShiftLabel(s.shift)">
                      {{ s.shift || '-' }}
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
          </div>

          <!-- Legend -->
          <div class="legend">
            <span class="legend-item"><span class="legend-dot" style="background:#22c55e"></span> D — Day Shift</span>
            <span class="legend-item"><span class="legend-dot" style="background:#6366f1"></span> N — Night Shift</span>
            <span class="legend-item"><span class="legend-dot" style="background:#3b82f6"></span> P — PTO</span>
            <span class="legend-item"><span class="legend-dot" style="background:#f59e0b"></span> T — Training</span>
            <span class="legend-item"><span class="legend-dot" style="background:#71717a"></span> U — Unavailable</span>
            <span class="legend-item"><span class="legend-dot" style="background:#ec4899"></span> OCM — On Call Manager</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#fef08a"></span> Outage Dates</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#bbf7d0"></span> Pay Period Start</span>
            <span class="legend-item"><span class="legend-swatch" style="background:#bfdbfe"></span> Holiday</span>
          </div>
        </div>

        <!-- Loading -->
        <div class="empty-state" *ngIf="status?.status === 'loading' || loading">
          <span class="material-icons spin">sync</span>
          <span>Loading schedule from SharePoint...</span>
        </div>

        <!-- Error -->
        <div class="empty-state error" *ngIf="status?.status === 'error'">
          <span class="material-icons">error_outline</span>
          <span>{{ status!.error }}</span>
          <button class="btn btn-primary" (click)="refresh()">Retry</button>
        </div>

        <!-- Not loaded -->
        <div class="empty-state" *ngIf="!status && !loading">
          <span class="material-icons">groups</span>
          <span>Click Refresh to load the schedule from SharePoint</span>
          <button class="btn btn-primary" (click)="refresh()">Load Schedule</button>
        </div>
      </div>

      <!-- Contacts Tab -->
      <div class="tab-content" *ngIf="activeTab === 'contacts'">
        <div class="section" *ngIf="contacts.length > 0">
          <div class="contacts-header">
            <h2 class="section-title">
              <span class="material-icons section-icon">contact_phone</span>
              Emergency Contact List
            </h2>
            <button class="btn btn-icon" (click)="openContacts()" title="Open on SharePoint">
              <span class="material-icons">open_in_new</span>
            </button>
          </div>
          <div class="contacts-table-wrap">
            <table class="contacts-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Title</th>
                  <th>Phone</th>
                  <th>Secondary</th>
                  <th>Emergency Contact</th>
                  <th>Relation</th>
                  <th>Emergency Phone</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of contacts">
                  <td class="td-contact-name">{{ c.name }}</td>
                  <td class="td-contact-title">{{ c.title }}</td>
                  <td class="td-contact-phone">{{ c.phone }}</td>
                  <td class="td-contact-phone">{{ c.secondaryPhone }}</td>
                  <td class="td-contact-name">{{ c.emergencyContact }}</td>
                  <td class="td-contact-title">{{ c.emergencyRelation }}</td>
                  <td class="td-contact-phone">{{ c.emergencyPhone }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="empty-state" *ngIf="contactsLoading">
          <span class="material-icons spin">sync</span>
          <span>Loading contacts from SharePoint...</span>
        </div>

        <div class="empty-state" *ngIf="!contactsLoading && contacts.length === 0 && contactsError">
          <span class="material-icons">error_outline</span>
          <span>{{ contactsError }}</span>
          <button class="btn btn-primary" (click)="loadContacts()">Retry</button>
        </div>

        <div class="empty-state" *ngIf="!contactsLoading && contacts.length === 0 && !contactsError">
          <span class="material-icons">contact_phone</span>
          <span>No contacts loaded</span>
          <button class="btn btn-primary" (click)="loadContacts()">Load Contacts</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-title { font-size: 22px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .btn { padding: 6px 14px; font-size: 12px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: var(--accent-primary); color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-icon { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 6px; padding: 6px; cursor: pointer; }
    .btn-icon:hover { color: var(--text-primary); border-color: var(--text-muted); }
    .btn-icon .material-icons { font-size: 18px; }

    /* Tabs */
    .tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); }
    .tab {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 16px; font-size: 13px; font-weight: 500;
      background: transparent; border: none; border-bottom: 2px solid transparent;
      color: var(--text-muted); cursor: pointer; transition: all 150ms;
    }
    .tab:hover { color: var(--text-primary); }
    .tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
    .tab-icon { font-size: 18px; }

    .tab-content { padding-top: 4px; }

    /* Sections */
    .section { margin-bottom: 24px; }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0 0 12px;
    }
    .section-icon { font-size: 20px; color: var(--text-muted); }

    /* On shift chips */
    .on-shift-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .person-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 12px; background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 8px; font-size: 13px;
    }
    .chip-group {
      font-weight: 700; font-size: 11px; color: #fff; padding: 2px 6px; border-radius: 4px;
    }
    .chip-name { color: var(--text-primary); font-weight: 500; }

    /* Group colors */
    .group-a { background: #3b82f6; }
    .group-b { background: #22c55e; }
    .group-c { background: #f59e0b; }
    .group-d { background: #ef4444; }
    .group-rel { background: #8b5cf6; }
    .group-ocm { background: #ec4899; }

    /* Schedule table */
    .schedule-table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: 10px; }
    .schedule-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .schedule-table thead { background: var(--bg-secondary); }
    .schedule-table th {
      padding: 8px 6px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color); white-space: nowrap;
    }
    .schedule-header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 12px; flex-wrap: wrap; }
    .schedule-header-row .section-title { margin-bottom: 0; }
    .month-selector {
      display: flex; gap: 2px; padding: 2px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; flex-wrap: wrap;
    }
    .month-btn {
      background: transparent; border: none; color: var(--text-muted);
      padding: 5px 10px; font-size: 11px; font-weight: 600; border-radius: 5px;
      cursor: pointer; transition: all 120ms;
    }
    .month-btn:hover { color: var(--text-primary); background: var(--bg-secondary); }
    .month-btn.active { background: var(--accent-primary); color: #fff; }

    .th-group { width: 50px; text-align: center; position: sticky; left: 0; z-index: 2; background: var(--bg-secondary); }
    .th-name { text-align: left; min-width: 100px; position: sticky; left: 50px; z-index: 2; background: var(--bg-secondary); }
    .th-day { text-align: center; min-width: 60px; }
    .th-day.today { background: rgba(59, 130, 246, 0.1); }
    .day-name { display: block; font-size: 10px; }
    .day-num { display: block; font-size: 12px; font-weight: 700; color: var(--text-primary); }

    .group-separator td {
      padding: 8px 10px 4px; font-size: 11px; font-weight: 700;
      border-top: 1px solid var(--border-color); background: var(--bg-secondary);
      position: sticky; left: 0;
    }
    .group-label { padding: 2px 8px; border-radius: 4px; color: #fff; font-size: 11px; }

    .person-row td { padding: 6px; border-bottom: 1px solid rgba(39,39,42,0.3); }
    .person-row:hover td { background: var(--bg-card); }
    .td-group { text-align: center; position: sticky; left: 0; z-index: 1; background: var(--bg-primary); }
    .person-row:hover .td-group { background: var(--bg-card); }
    .group-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 20px; height: 20px; border-radius: 4px; font-size: 10px; font-weight: 700; color: #fff;
    }
    .td-name { font-weight: 500; color: var(--text-primary); position: sticky; left: 50px; z-index: 1; background: var(--bg-primary); }
    .person-row:hover .td-name { background: var(--bg-card); }
    .td-shift {
      text-align: center; font-weight: 700; font-size: 12px; border-radius: 4px;
    }
    .td-shift.today { background: rgba(59, 130, 246, 0.08); }
    .shift-day { color: #22c55e; }
    .shift-night { color: #6366f1; }
    .shift-off { color: var(--text-muted); }
    .shift-pto { color: #3b82f6; }
    .shift-training { color: #f59e0b; }
    .shift-ocm { color: #ec4899; font-size: 9px; }

    /* Contacts table */
    .contacts-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .contacts-header .section-title { margin-bottom: 0; }
    .contacts-table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: 10px; }
    .contacts-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .contacts-table thead { background: var(--bg-secondary); }
    .contacts-table th {
      padding: 8px 12px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;
      text-align: left; border-bottom: 1px solid var(--border-color);
    }
    .contacts-table td { padding: 8px 12px; border-bottom: 1px solid rgba(39,39,42,0.3); }
    .contacts-table tr:hover td { background: var(--bg-card); }
    .td-contact-name { font-weight: 500; color: var(--text-primary); white-space: nowrap; }
    .td-contact-title { color: var(--text-secondary); }
    .td-contact-phone { color: var(--text-primary); font-family: monospace; white-space: nowrap; }
    .td-contact-email { color: var(--accent-primary); }

    /* Legend */
    .legend { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 10px; padding: 8px 12px; background: var(--bg-card); border-radius: 8px; border: 1px solid var(--border-color); }
    .legend-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: var(--text-secondary); }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .legend-swatch { width: 14px; height: 10px; border-radius: 2px; flex-shrink: 0; }

    /* States */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 40px; color: var(--text-muted); font-size: 14px;
    }
    .empty-state .material-icons { font-size: 40px; opacity: 0.3; }
    .empty-state.error .material-icons { color: var(--accent-error); opacity: 0.6; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class PersonnelComponent implements OnInit {
  status: PersonnelStatus | null = null;
  contacts: PersonnelContact[] = [];
  loading = false;
  contactsLoading = false;
  contactsError = '';
  activeTab: 'schedule' | 'contacts' = 'schedule';

  selectedMonth: number = new Date().getMonth();
  monthOptions: { idx: number; label: string }[] = [];

  // Pre-computed for the selected month to avoid recalculation on every change detection
  groups: string[] = [];
  scheduleDays: { date: string; dayName: string; dayNum: string; isToday: boolean }[] = [];
  groupMembersMap: Map<string, PersonnelEntry[]> = new Map();
  /** Per-person, schedule slice that matches scheduleDays for the selected month. */
  private personMonthSchedule: Map<string, { date: string; shift: any }[]> = new Map();

  constructor(private electronService: ElectronService) {
    const fmt = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    this.monthOptions = fmt.map((label, idx) => ({ idx, label }));
  }

  ngOnInit(): void {
    this.loadSchedule();
  }

  selectMonth(idx: number): void {
    this.selectedMonth = idx;
    this.computeDerived();
  }

  private computeDerived(): void {
    if (!this.status?.allPersonnel) {
      this.groups = [];
      this.scheduleDays = [];
      this.groupMembersMap = new Map();
      this.personMonthSchedule = new Map();
      return;
    }

    const monthKey = String(this.selectedMonth);
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    // Build scheduleDays for the selected month from any one person's full-year schedule
    const first = this.status.allPersonnel[0];
    const monthEntries = first?.schedule?.filter(s => {
      const d = new Date(s.date + 'T12:00:00');
      return d.getMonth() === this.selectedMonth;
    }) || [];

    this.scheduleDays = monthEntries.map(s => {
      const d = new Date(s.date + 'T12:00:00');
      return {
        date: s.date,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate().toString(),
        isToday: s.date === todayStr,
      };
    });

    // Each person's schedule slice for the selected month, mapped by name
    this.personMonthSchedule = new Map();
    for (const p of this.status.allPersonnel) {
      const slice = p.schedule.filter(s => {
        const d = new Date(s.date + 'T12:00:00');
        return d.getMonth() === this.selectedMonth;
      });
      this.personMonthSchedule.set(p.name, slice);
    }

    // Group people by their group for the SELECTED month
    const groupsByPerson = new Map<string, string>();
    for (const p of this.status.allPersonnel) {
      const grp = p.groupByMonth?.[monthKey] || p.group;
      if (grp) groupsByPerson.set(p.name, grp);
    }

    const uniqueGroups = new Set(groupsByPerson.values());
    this.groups = Array.from(uniqueGroups).sort();

    // Sort each group's members by the selected month's row index so the order
    // matches the Excel layout for that month (top=lead, middle=CRO, bottom=AO).
    // People not in the selected month's roster sort to the end.
    this.groupMembersMap = new Map();
    for (const group of this.groups) {
      const members = this.status.allPersonnel
        .filter(p => groupsByPerson.get(p.name) === group)
        .sort((a, b) => {
          const aIdx = a.monthOrder?.[monthKey] ?? Number.MAX_SAFE_INTEGER;
          const bIdx = b.monthOrder?.[monthKey] ?? Number.MAX_SAFE_INTEGER;
          return aIdx - bIdx;
        });
      this.groupMembersMap.set(group, members);
    }
  }

  getGroupMembers(group: string): PersonnelEntry[] {
    return this.groupMembersMap.get(group) || [];
  }

  getMonthSchedule(person: PersonnelEntry): { date: string; shift: any }[] {
    return this.personMonthSchedule.get(person.name) || [];
  }

  groupBadge(group: string): string {
    if (group === 'OCM') return 'O';
    if (group === 'Rel') return 'R';
    return group.charAt(0);
  }

  get onCallManagerToday(): PersonnelEntry[] {
    return this.status?.allPersonnel?.filter(p => p.todayShift === 'OCM') || [];
  }

  getShiftClass(code: string): string {
    const map: Record<string, string> = { 'D': 'shift-day', 'N': 'shift-night', 'U': 'shift-off', 'P': 'shift-pto', 'T': 'shift-training', 'OCM': 'shift-ocm' };
    return map[code] || 'shift-off';
  }

  getShiftLabel(code: string): string {
    return SHIFT_LABELS[code] || code || 'Off';
  }

  async loadSchedule(): Promise<void> {
    this.loading = true;
    try {
      const result = await this.electronService.personnelGetStatus();
      if (result.success && result.data) {
        this.status = result.data;
        this.computeDerived();
      }
    } catch {} finally {
      this.loading = false;
    }
  }

  async refresh(): Promise<void> {
    this.loading = true;
    try {
      const result = await this.electronService.personnelRefresh();
      if (result.success && result.data) {
        this.status = result.data;
        this.computeDerived();
      } else {
        this.status = { status: 'error', error: result.error || 'Unknown error', onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
        this.computeDerived();
      }
    } catch (err: any) {
      this.status = { status: 'error', error: err.message, onShiftNow: [], allPersonnel: [], currentShiftLabel: '' };
      this.computeDerived();
    } finally {
      this.loading = false;
    }
  }

  async loadContacts(): Promise<void> {
    if (this.contacts.length > 0 || this.contactsLoading) return;
    this.contactsLoading = true;
    this.contactsError = '';
    try {
      const result = await this.electronService.personnelGetContacts();
      if (result.success && result.data) {
        this.contacts = result.data;
      } else {
        this.contactsError = result.error || 'Failed to load contacts';
      }
    } catch (err: any) {
      this.contactsError = err.message;
    } finally {
      this.contactsLoading = false;
    }
  }

  openSchedule(): void {
    this.electronService.openExternal(SCHEDULE_URL);
  }

  openContacts(): void {
    this.electronService.openExternal(CONTACTS_URL);
  }
}
