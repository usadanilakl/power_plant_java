import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService, PersonnelStatus, PersonnelEntry, PersonnelContact } from '../../services/electron.service';

const SCHEDULE_URL = 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7BC2B8028F-8473-49EC-8B24-1FEBBB8D1584%7D&file=OPS%20Schedule%202026.xlsx&action=default&mobileredirect=true';
const CONTACTS_URL = 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7BE445C5F4-C235-45F7-8D29-F0613E875FA0%7D&file=EMERGENCY%20CONTACT%20LIST%20-%20EDITED%2011_2024.xlsx&action=default&mobileredirect=true';

const SHIFT_LABELS: Record<string, string> = {
  'D': 'Day Shift', 'N': 'Night Shift', 'U': 'Off', 'P': 'PTO', 'T': 'Training', '': 'Off',
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

        <!-- Full schedule table -->
        <div class="section" *ngIf="status?.status === 'available'">
          <h2 class="section-title">
            <span class="material-icons section-icon">event_note</span>
            Schedule
          </h2>
          <div class="schedule-table-wrap">
            <table class="schedule-table">
              <thead>
                <tr class="month-row">
                  <th class="th-group th-month-spacer" colspan="2"></th>
                  <th *ngFor="let m of monthHeaders" [attr.colspan]="m.span" class="th-month">{{ m.name }}</th>
                </tr>
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
                      <span class="group-badge" [class]="'group-' + p.group.toLowerCase()">{{ p.group.charAt(0) }}</span>
                    </td>
                    <td class="td-name">{{ p.name }}</td>
                    <td *ngFor="let s of p.schedule; let i = index"
                        class="td-shift" [class]="getShiftClass(s.shift)"
                        [class.today]="scheduleDays[i]?.isToday || false"
                        [title]="getShiftLabel(s.shift)">
                      {{ s.shift || '-' }}
                    </td>
                  </tr>
                </ng-container>
              </tbody>
            </table>
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
    .group-relief { background: #8b5cf6; }

    /* Schedule table */
    .schedule-table-wrap { overflow-x: auto; border: 1px solid var(--border-color); border-radius: 10px; }
    .schedule-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .schedule-table thead { background: var(--bg-secondary); }
    .schedule-table th {
      padding: 8px 6px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color); white-space: nowrap;
    }
    .month-row .th-month-spacer { position: sticky; left: 0; z-index: 3; background: var(--bg-secondary); }
    .th-month {
      text-align: center; font-size: 12px; font-weight: 700; color: var(--accent-primary);
      padding: 6px 4px; border-bottom: 2px solid var(--accent-primary);
      background: var(--bg-secondary); letter-spacing: 0.5px;
    }
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

  // Pre-computed to avoid recalculation on every change detection
  groups: string[] = [];
  scheduleDays: { dayName: string; dayNum: string; isToday: boolean; month: string }[] = [];
  monthHeaders: { name: string; span: number }[] = [];
  groupMembersMap: Map<string, PersonnelEntry[]> = new Map();

  constructor(private electronService: ElectronService) {}

  ngOnInit(): void {
    this.loadSchedule();
  }

  private computeDerived(): void {
    if (!this.status?.allPersonnel) {
      this.groups = [];
      this.scheduleDays = [];
      this.groupMembersMap = new Map();
      return;
    }

    const g = new Set(this.status.allPersonnel.map(p => p.group).filter(Boolean));
    this.groups = Array.from(g).sort();

    const first = this.status.allPersonnel[0];
    const today = new Date().toISOString().split('T')[0];
    this.scheduleDays = first?.schedule?.map(s => {
      const d = new Date(s.date + 'T12:00:00');
      return {
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate().toString(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        isToday: s.date === today,
      };
    }) || [];

    // Build month header spans
    this.monthHeaders = [];
    let currentMonth = '';
    for (const day of this.scheduleDays) {
      if (day.month !== currentMonth) {
        this.monthHeaders.push({ name: day.month, span: 1 });
        currentMonth = day.month;
      } else {
        this.monthHeaders[this.monthHeaders.length - 1].span++;
      }
    }

    this.groupMembersMap = new Map();
    for (const group of this.groups) {
      this.groupMembersMap.set(group, this.status.allPersonnel.filter(p => p.group === group));
    }
  }

  getGroupMembers(group: string): PersonnelEntry[] {
    return this.groupMembersMap.get(group) || [];
  }

  getShiftClass(code: string): string {
    const map: Record<string, string> = { 'D': 'shift-day', 'N': 'shift-night', 'U': 'shift-off', 'P': 'shift-pto', 'T': 'shift-training' };
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
