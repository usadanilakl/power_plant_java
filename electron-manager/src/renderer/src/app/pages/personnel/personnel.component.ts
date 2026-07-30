import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElectronService, PersonnelStatus, PersonnelEntry, PersonnelContact, ContractorEntry, ContractorReport, PersonnelConfig, PersonnelStatusMeta } from '../../services/electron.service';
import { ChatPanelComponent } from './chat-panel.component';

/**
 * Build the SharePoint web-viewer URL for THIS year's Ops Schedule — the same file the parser
 * reads (see electron-manager/src/main/managers/personnel.manager.ts::getSchedulePath). Path-based
 * (`:x:/r/<path>?web=1`) so it's always current, not tied to a fragile SharePoint doc GUID that
 * stales when the file is replaced (which is why the old hardcoded ...sourcedoc={GUID}... link
 * opened the wrong / prior year's file).
 */
function getScheduleUrl(): string {
  const year = new Date().getFullYear();
  const path = `sites/JG/External/60 - Operations/60.05 Ops schedule/${year}/OPS Schedule ${year}.xlsx`;
  return `https://jpowerusa.sharepoint.com/:x:/r/${encodeURI(path)}?web=1`;
}

/** Matches CONTACTS_PATH in personnel.manager.ts — kept as a helper so any future rename
 *  updates in one place. */
function getContactsUrl(): string {
  const path = 'sites/JG/External/10 - Administration/PERSONNEL/EMERGENCY CONTACT LIST - EDITED 11_2024.xlsx';
  return `https://jpowerusa.sharepoint.com/:x:/r/${encodeURI(path)}?web=1`;
}

const SHIFT_LABELS: Record<string, string> = {
  'D': 'Day Shift', 'N': 'Night Shift', 'U': 'Unscheduled', 'P': 'PTO', 'T': 'Training',
  'OCM': 'On Call Manager', 'L': 'Leads Meeting', 'OFF': 'Off', '': 'Off',
};

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatPanelComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Personnel</h1>
        <div class="header-actions">
          <div class="search-wrap">
            <span class="material-icons search-icon">search</span>
            <input type="text" class="search-input"
                   [placeholder]="searchPlaceholder()"
                   [(ngModel)]="searchQuery"
                   (ngModelChange)="onSearchChange()" />
            <button *ngIf="searchQuery" class="search-clear" (click)="clearSearch()" title="Clear">
              <span class="material-icons">close</span>
            </button>
          </div>
          <button class="btn btn-icon" (click)="openSchedule()" title="Open full schedule on SharePoint">
            <span class="material-icons">open_in_new</span>
          </button>
          <button class="btn btn-icon" (click)="toggleSettings()"
                  [title]="personnelMeta?.autoRefreshEnabled ? ('Auto-refresh every ' + personnelMeta!.refreshIntervalMinutes + ' min') : 'Schedule refresh settings'">
            <span class="material-icons" [class.settings-active]="personnelMeta?.autoRefreshEnabled">
              {{ personnelMeta?.autoRefreshEnabled ? 'schedule' : 'settings' }}
            </span>
          </button>
          <button class="btn btn-primary" (click)="refresh()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- Auto-refresh settings (per-client). Persisted to personnel-config.json in the working dir. -->
      <div class="settings-panel" *ngIf="settingsOpen && personnelConfig">
        <div class="settings-title">
          <span class="material-icons">tune</span>
          Schedule auto-refresh (this desktop only)
        </div>
        <div class="settings-help">
          When enabled, this desktop periodically re-fetches the SharePoint schedule and pushes it
          to the hub. Safe to enable on multiple desktops — writes are idempotent and only actually
          changed rows sync.
        </div>
        <div class="settings-row">
          <label class="settings-inline">
            <input type="checkbox" [(ngModel)]="personnelConfig.autoRefresh" />
            Auto-refresh enabled
          </label>
          <label class="settings-inline">
            Every
            <input type="number" min="5" max="1440" step="5"
                   [(ngModel)]="personnelConfig.intervalMinutes"
                   [disabled]="!personnelConfig.autoRefresh" />
            minutes
          </label>
          <button class="btn btn-primary" (click)="savePersonnelConfig()" [disabled]="savingSettings">
            {{ savingSettings ? 'Saving...' : 'Save' }}
          </button>
          <span class="settings-msg" *ngIf="settingsSaveMessage">{{ settingsSaveMessage }}</span>
        </div>
        <div class="settings-status" *ngIf="personnelMeta">
          <span *ngIf="personnelMeta.isRefreshing" class="status-refreshing">
            <span class="material-icons spin">autorenew</span> Refreshing…
          </span>
          <span *ngIf="personnelMeta.lastRefreshError" class="status-error" [title]="personnelMeta.lastRefreshError">
            Last refresh error: {{ personnelMeta.lastRefreshError }}
          </span>
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
        <button class="tab" [class.active]="activeTab === 'contractors'" (click)="activeTab = 'contractors'; loadContractors()">
          <span class="material-icons tab-icon">engineering</span> Contractors
        </button>
        <button class="tab" [class.active]="activeTab === 'conversations'" (click)="activeTab = 'conversations'">
          <span class="material-icons tab-icon">chat</span> Conversations
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
            <div class="person-chip" *ngFor="let p of filteredOnShiftNow()">
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
            <div class="person-chip" *ngFor="let p of filteredOnCallManagers()">
              <span class="chip-group group-ocm">OCM</span>
              <span class="chip-name">{{ p.name }}</span>
            </div>
          </div>
        </div>

        <!-- Full schedule -->
        <div class="section" *ngIf="status?.status === 'available'">
          <div class="schedule-header-row">
            <h2 class="section-title">
              <span class="material-icons section-icon">event_note</span>
              Schedule
            </h2>
            <div class="schedule-view-toggle">
              <button class="view-toggle-btn" [class.active]="scheduleView === 'month'"
                      (click)="setScheduleView('month')">
                <span class="material-icons view-toggle-icon">calendar_view_month</span>
                Month
              </button>
              <button class="view-toggle-btn" [class.active]="scheduleView === 'year'"
                      (click)="setScheduleView('year')">
                <span class="material-icons view-toggle-icon">calendar_view_week</span>
                Year
              </button>
            </div>
            <div class="month-selector" *ngIf="scheduleView === 'month'">
              <button *ngFor="let m of monthOptions"
                      class="month-btn"
                      [class.active]="m.idx === selectedMonth"
                      (click)="selectMonth(m.idx)">
                {{ m.label }}
              </button>
            </div>
          </div>

          <!-- Year-at-a-glance -->
          <div class="year-view" *ngIf="scheduleView === 'year'">
            <div class="year-controls">
              <label class="year-filter">
                <span class="year-filter-label">Show:</span>
                <select [(ngModel)]="yearPersonFilter" (ngModelChange)="onYearFilterChange()">
                  <option value="">Whole plant (dominant shift per day)</option>
                  <option *ngFor="let p of yearPersonOptions()" [value]="p.name">
                    {{ p.name }}{{ p.group ? ' (' + p.group + ')' : '' }}
                  </option>
                </select>
              </label>
              <div class="year-legend">
                <span class="legend-item"><span class="legend-chip year-D">D</span> Day</span>
                <span class="legend-item"><span class="legend-chip year-N">N</span> Night</span>
                <span class="legend-item"><span class="legend-chip year-OCM">OCM</span> On Call</span>
                <span class="legend-item"><span class="legend-chip year-P">P</span> PTO</span>
                <span class="legend-item"><span class="legend-chip year-T">T</span> Training</span>
                <span class="legend-item"><span class="legend-chip year-L">L</span> Leads</span>
              </div>
            </div>

            <div class="year-grids">
              <div class="mini-month" *ngFor="let g of yearMonthGrids">
                <button class="mini-month-header" (click)="jumpFromYear(g.month)"
                        title="Open month view">
                  {{ g.label }}
                </button>
                <div class="mini-wd-row">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                <div class="mini-cells">
                  <ng-container *ngFor="let c of g.cells; let i = index">
                    <span *ngIf="c.leadingBlank" class="mini-cell blank"></span>
                    <span *ngIf="!c.leadingBlank"
                          class="mini-cell"
                          [class.today]="c.isToday"
                          [class.has-chips]="c.chips.length > 0"
                          [attr.data-shift]="c.shift"
                          [title]="cellTitle(c)">
                      <span class="mini-day">{{ c.day }}</span>
                      <span class="mini-chips" *ngIf="c.chips.length > 0">
                        <span class="mini-chip" *ngFor="let chip of c.chips"
                              [attr.data-shift]="chip.shift">{{ chip.crew }}</span>
                      </span>
                    </span>
                  </ng-container>
                </div>
              </div>
            </div>
          </div>
          <div class="schedule-table-wrap" *ngIf="scheduleView === 'month'">
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
                  <tr *ngFor="let p of filteredGroupMembers(group)" class="person-row">
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
                <tr *ngFor="let c of filteredContacts()">
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

      <!-- Contractors Tab -->
      <div class="tab-content" *ngIf="activeTab === 'contractors'">
        <div class="section">
          <div class="contacts-header">
            <h2 class="section-title">
              <span class="material-icons section-icon">engineering</span>
              Contractor Directory ({{ contractors.length }})
              <span *ngIf="contractorExpiringCount() > 0" class="expiry-badge expiry-soon" style="margin-left: 8px;">
                {{ contractorExpiringCount() }} expiring/expired
              </span>
            </h2>
            <div class="header-actions">
              <button class="btn btn-icon" (click)="loadContractors(true)" title="Refresh from OnLocation" [disabled]="contractorsLoading">
                <span class="material-icons" [class.spin]="contractorsLoading">refresh</span>
              </button>
              <button class="btn btn-primary" (click)="pushContractorsToBackend()" [disabled]="contractorPushing || contractors.length === 0">
                {{ contractorPushing ? 'Pushing...' : 'Push to backend' }}
              </button>
              <button class="btn btn-primary" (click)="scanContractors()" [disabled]="contractorScanning">
                {{ contractorScanning ? 'Scanning...' : 'Scan for changes' }}
              </button>
            </div>
          </div>

          <div *ngIf="contractorActionMessage" class="action-message">{{ contractorActionMessage }}</div>

          <div class="empty-state" *ngIf="contractorsLoading && contractors.length === 0">
            <span class="material-icons spin">sync</span>
            <span>Loading contractors from OnLocation...</span>
          </div>

          <div class="empty-state" *ngIf="!contractorsLoading && contractors.length === 0 && contractorsError">
            <span class="material-icons">error_outline</span>
            <span>{{ contractorsError }}</span>
            <button class="btn btn-primary" (click)="loadContractors(true)">Retry</button>
          </div>

          <div class="contacts-table-wrap" *ngIf="contractors.length > 0">
            <table class="contacts-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of filteredContractors()" [class.row-expired]="expiryClass(c) === 'expired'">
                  <td class="td-contact-name">{{ c.name }}</td>
                  <td class="td-contact-title">{{ c.company }}</td>
                  <td class="td-contact-phone">{{ c.email }}</td>
                  <td class="td-contact-phone">{{ c.phone }}</td>
                  <td><span class="expiry-badge" [class]="'expiry-' + expiryClass(c)">{{ c.validTo || '—' }}</span></td>
                  <td>
                    <span *ngIf="c.status" class="status-pill" [class]="'status-' + c.status.toLowerCase()">
                      {{ c.status }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="section" *ngIf="contractorReports.length > 0">
          <h2 class="section-title">
            <span class="material-icons section-icon">history</span>
            Pending changes
          </h2>
          <div *ngFor="let r of contractorReports" class="report-card">
            <div class="report-head">
              <div>
                <span class="report-status" [class]="'status-' + r.status.toLowerCase()">{{ r.status }}</span>
                <span class="report-when">{{ r.runAt | date:'medium' }}</span>
                <span class="report-summary">{{ r.summary }}</span>
              </div>
              <div *ngIf="r.status === 'PENDING'">
                <button class="btn btn-primary" (click)="acceptReport(r.id)">Accept</button>
                <button class="btn btn-icon" (click)="rejectReport(r.id)">Reject</button>
              </div>
            </div>
            <div class="report-body" *ngIf="(r.added && r.added.length) || (r.removed && r.removed.length) || (r.changed && r.changed.length)">
              <div *ngIf="r.added && r.added.length > 0">
                <strong>Added ({{ r.added.length }}):</strong>
                <span *ngFor="let a of r.added">{{ a.name }} &middot; {{ a.company }}; </span>
              </div>
              <div *ngIf="r.removed && r.removed.length > 0">
                <strong>Removed ({{ r.removed.length }}):</strong>
                <span *ngFor="let a of r.removed">{{ a.name }} &middot; {{ a.company }}; </span>
              </div>
              <div *ngIf="r.changed && r.changed.length > 0">
                <strong>Changed ({{ r.changed.length }}):</strong>
                <span *ngFor="let ch of r.changed">{{ ch.after.name }}; </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Conversations Tab -->
      <div class="tab-content" *ngIf="activeTab === 'conversations'">
        <app-chat-panel></app-chat-panel>
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
    .action-message { padding: 8px 12px; background: var(--surface-2, rgba(255,255,255,0.04));
      border-left: 3px solid var(--accent-primary); margin: 8px 0; font-size: 13px; color: var(--text-muted); }
    .report-card { border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;
      margin-bottom: 8px; background: var(--surface-1, rgba(255,255,255,0.02)); }
    .report-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .report-status { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px;
      font-weight: 600; margin-right: 8px; }
    .status-pending { background: rgba(255, 191, 0, 0.18); color: #d4a017; }
    .status-accepted { background: rgba(63, 184, 117, 0.18); color: #3fb875; }
    .status-rejected { background: rgba(184, 63, 63, 0.18); color: #c95252; }
    .report-when { font-size: 12px; color: var(--text-muted); margin-right: 8px; }
    .report-summary { font-size: 12px; color: var(--text-primary); }
    .report-body { font-size: 12px; color: var(--text-muted); margin-top: 8px; line-height: 1.6; }
    .report-body strong { color: var(--text-primary); margin-right: 6px; }
    .expiry-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px;
      font-weight: 600; font-family: 'Roboto Mono', monospace; }
    .expiry-ok { background: rgba(63, 184, 117, 0.12); color: #3fb875; }
    .expiry-soon { background: rgba(255, 191, 0, 0.18); color: #d4a017; }
    .expiry-expired { background: rgba(184, 63, 63, 0.18); color: #c95252; }
    .row-expired { opacity: 0.75; }
    .status-pill { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px;
      font-weight: 500; text-transform: capitalize; }
    .status-active { background: rgba(63, 184, 117, 0.12); color: #3fb875; }
    .status-inactive { background: rgba(184, 63, 63, 0.12); color: #c95252; }
    .search-wrap { position: relative; display: inline-flex; align-items: center; }
    .search-icon { position: absolute; left: 8px; font-size: 18px; color: var(--text-muted); pointer-events: none; }
    .search-input { padding: 6px 28px 6px 30px; font-size: 13px; border: 1px solid var(--border-color);
      border-radius: 6px; background: var(--surface-1, rgba(255,255,255,0.04)); color: var(--text-primary);
      width: 240px; outline: none; }
    .search-input:focus { border-color: var(--accent-primary); }
    .search-clear { position: absolute; right: 4px; background: transparent; border: none;
      color: var(--text-muted); cursor: pointer; padding: 2px; display: inline-flex; }
    .search-clear:hover { color: var(--text-primary); }
    .search-clear .material-icons { font-size: 16px; }
    .settings-active { color: var(--accent-primary); }
    .settings-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      border-radius: var(--border-radius, 8px);
      padding: 14px 16px;
      margin: 8px 0 14px;
      box-shadow: var(--shadow-sm);
    }
    .settings-title {
      display: flex; align-items: center; gap: 6px;
      font-weight: 600; font-size: 14px;
      color: var(--text-primary);
      margin-bottom: 6px;
    }
    .settings-title .material-icons { font-size: 18px; color: var(--accent-primary); }
    .settings-help { font-size: 12px; color: var(--text-secondary); margin-bottom: 12px; line-height: 1.5; }
    .settings-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: center; }
    .settings-inline {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 13px; color: var(--text-primary);
    }
    .settings-inline input[type="number"] {
      width: 72px; padding: 5px 8px; font-size: 13px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      outline: none;
    }
    .settings-inline input[type="number"]:focus { border-color: var(--accent-primary); }
    .settings-inline input[type="checkbox"] { accent-color: var(--accent-primary); }
    .settings-msg { font-size: 12px; color: var(--accent-success); }
    .settings-status { margin-top: 10px; font-size: 12px; display: flex; gap: 12px; align-items: center; }
    .status-refreshing { display: inline-flex; align-items: center; gap: 4px; color: var(--accent-primary); }
    .status-error { color: var(--accent-error); }
    .spin { animation: spin 1.4s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Year-at-a-glance view ────────────────────────────────────────── */
    .schedule-view-toggle {
      display: inline-flex;
      border: 1px solid var(--border-color);
      border-radius: 8px;
      overflow: hidden;
      margin-right: 12px;
    }
    .view-toggle-btn {
      background: transparent;
      border: none;
      padding: 6px 12px;
      color: var(--text-secondary);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      font-weight: 500;
    }
    .view-toggle-btn:hover:not(.active) { background: var(--bg-card-hover); color: var(--text-primary); }
    .view-toggle-btn.active { background: var(--accent-primary); color: #fff; }
    .view-toggle-btn + .view-toggle-btn { border-left: 1px solid var(--border-color); }
    .view-toggle-icon { font-size: 16px; }

    .year-view { margin-top: 12px; }
    .year-controls {
      display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .year-filter { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); }
    .year-filter select {
      padding: 5px 10px; font-size: 13px;
      background: var(--bg-secondary); color: var(--text-primary);
      border: 1px solid var(--border-color); border-radius: 4px;
      min-width: 240px;
    }
    .year-filter select:focus { outline: none; border-color: var(--accent-primary); }
    .year-filter-label { font-weight: 600; color: var(--text-primary); }
    .year-legend { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; font-size: 11px; color: var(--text-secondary); }
    .legend-item { display: inline-flex; align-items: center; gap: 5px; }
    .legend-chip {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 20px; border-radius: 4px;
      font-size: 10px; font-weight: 700; color: #fff;
    }

    .year-grids {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 12px;
    }
    .mini-month {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 8px 10px;
    }
    .mini-month-header {
      background: transparent; border: none;
      font-size: 13px; font-weight: 700; color: var(--text-primary);
      padding: 4px 6px; margin-bottom: 4px;
      cursor: pointer; width: 100%; text-align: left; border-radius: 4px;
    }
    .mini-month-header:hover { background: var(--bg-card-hover); color: var(--accent-primary); }
    .mini-wd-row {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
      margin-bottom: 3px; padding: 0 2px;
    }
    .mini-wd-row span {
      text-align: center; font-size: 9px; color: var(--text-muted);
      font-weight: 600; text-transform: uppercase;
    }
    .mini-cells {
      display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; padding: 0 2px;
    }
    .mini-cell {
      /* Wider than tall so crew chips fit in a horizontal row under the day number. */
      min-height: 36px;
      display: flex; flex-direction: column;
      align-items: stretch; justify-content: flex-start;
      font-size: 10px; color: var(--text-primary);
      background: var(--bg-secondary);
      border-radius: 3px;
      padding: 2px 3px;
      gap: 1px;
      overflow: hidden;
    }
    .mini-day {
      font-size: 10px;
      font-weight: 600;
      color: var(--text-primary);
      text-align: left;
      line-height: 1;
    }
    .mini-cell.has-chips .mini-day { color: var(--text-secondary); }
    .mini-cell.blank { background: transparent; padding: 0; }
    .mini-cell.today { outline: 2px solid var(--accent-primary); font-weight: 700; }

    /* Row of crew chips under the day number in whole-plant year mode. Wraps if more than
       ~3 crews had work on that day. Each chip = crew letter, background = shift color. */
    .mini-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 1px;
      align-items: center;
    }
    .mini-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 12px;
      height: 12px;
      padding: 0 3px;
      border-radius: 2px;
      font-size: 9px;
      font-weight: 700;
      color: #fff;
      line-height: 1;
      background: var(--text-muted);
    }
    /* Shift-color convention: Day = GREEN, Night = BLUE. Kept distinct so they're readable
       at a glance across dozens of tiny chips in the year view. */
    .mini-chip[data-shift="D"]   { background: #2e7d32; }
    .mini-chip[data-shift="N"]   { background: #1976d2; }
    .mini-chip[data-shift="OCM"] { background: #f57c00; }
    .mini-chip[data-shift="P"]   { background: #78909c; }
    .mini-chip[data-shift="T"]   { background: #7e57c2; }
    .mini-chip[data-shift="L"]   { background: #5c3317; }

    /* Shift color palette on the mini cells (same hues as the JG portal + PWA legends). */
    .mini-cell[data-shift="D"],   .legend-chip.year-D   { background: #2e7d32; color: #fff; }
    .mini-cell[data-shift="N"],   .legend-chip.year-N   { background: #1976d2; color: #fff; }
    .mini-cell[data-shift="OCM"], .legend-chip.year-OCM { background: #f57c00; color: #fff; }
    .mini-cell[data-shift="P"],   .legend-chip.year-P   { background: #78909c; color: #fff; }
    .mini-cell[data-shift="T"],   .legend-chip.year-T   { background: #7e57c2; color: #fff; }
    .mini-cell[data-shift="L"],   .legend-chip.year-L   { background: #5c3317; color: #fff; }
    .mini-cell[data-shift="U"]                          { background: #90a4ae; color: #fff; }
    .mini-cell[data-shift="OFF"]                        { background: var(--bg-secondary); color: var(--text-muted); }
    /* When crew chips are showing, the chips carry the shift colour — reset the cell background
       so the day number + chip strip are readable. */
    .mini-cell.has-chips[data-shift]                    { background: var(--bg-secondary); color: var(--text-primary); }
  `]
})
export class PersonnelComponent implements OnInit {
  status: PersonnelStatus | null = null;
  contacts: PersonnelContact[] = [];
  loading = false;
  contactsLoading = false;
  contactsError = '';
  activeTab: 'schedule' | 'contacts' | 'contractors' | 'conversations' = 'schedule';

  // Header search — scoped to whichever tab is active. Lowercased + cached
  // so the per-row matcher doesn't re-lowercase on every change-detection pass.
  searchQuery = '';
  private searchLower = '';

  // Contractors state
  contractors: ContractorEntry[] = [];
  contractorsLoading = false;
  contractorsError = '';
  contractorReports: ContractorReport[] = [];
  contractorReportsLoading = false;
  contractorScanning = false;
  contractorPushing = false;
  contractorActionMessage = '';

  // Per-client auto-refresh config (persisted in personnel-config.json in the working dir).
  // When enabled, this desktop periodically re-fetches the SharePoint schedule and pushes it
  // to its local Spring Boot → CRDT sync → hub → Supabase mirror. Safe to enable on multiple
  // desktops at different intervals — writes are idempotent.
  personnelConfig: PersonnelConfig | null = null;
  personnelMeta: PersonnelStatusMeta | null = null;
  settingsOpen = false;
  savingSettings = false;
  settingsSaveMessage = '';

  selectedMonth: number = new Date().getMonth();
  monthOptions: { idx: number; label: string }[] = [];

  // Year-at-a-glance view: 12 mini-month grids for the current schedule year, colored per shift.
  scheduleView: 'month' | 'year' = 'month';
  /** Optional person filter for year view. Empty string = "plant year" (colors by dominant shift
   *  per day across the whole roster). Setting a name filters cells to that person only. */
  yearPersonFilter: string = '';
  yearMonthGrids: {
    month: number;
    label: string;
    cells: {
      iso: string;
      day: number;
      shift: string;             // legacy: dominant shift for filtered mode; used for whole-cell tint
      chips: { crew: string; shift: string }[];  // whole-plant mode: which crew is on which shift
      isToday: boolean;
      leadingBlank: boolean;
    }[];
  }[] = [];

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
    void this.loadPersonnelConfig();
  }

  async loadPersonnelConfig(): Promise<void> {
    try {
      const cfg = await this.electronService.personnelGetConfig();
      if (cfg.success && cfg.data) this.personnelConfig = { ...cfg.data };
      const meta = await this.electronService.personnelGetMeta();
      if (meta.success && meta.data) this.personnelMeta = meta.data;
    } catch (err) {
      console.warn('Failed to load personnel config:', err);
    }
  }

  toggleSettings(): void {
    this.settingsOpen = !this.settingsOpen;
    this.settingsSaveMessage = '';
    if (this.settingsOpen) void this.loadPersonnelConfig();
  }

  async savePersonnelConfig(): Promise<void> {
    if (!this.personnelConfig) return;
    this.savingSettings = true;
    this.settingsSaveMessage = '';
    try {
      const result = await this.electronService.personnelSaveConfig(this.personnelConfig);
      if (result.success && result.data) {
        this.personnelConfig = { ...result.data };
        this.settingsSaveMessage = 'Saved';
        void this.loadPersonnelConfig();
      } else {
        this.settingsSaveMessage = result.error || 'Save failed';
      }
    } catch (err: any) {
      this.settingsSaveMessage = err?.message ?? 'Save failed';
    } finally {
      this.savingSettings = false;
    }
  }

  selectMonth(idx: number): void {
    this.selectedMonth = idx;
    this.computeDerived();
  }

  /** Toggle Month/Year view. Building the year grid is cheap (12 × ~30 days) so we compute
   *  eagerly on toggle rather than lazy in a getter. */
  setScheduleView(view: 'month' | 'year'): void {
    this.scheduleView = view;
    if (view === 'year') this.buildYearGrids();
  }

  onYearFilterChange(): void {
    // Person filter changed — rebuild the coloured cells.
    if (this.scheduleView === 'year') this.buildYearGrids();
  }

  /** Everybody the year view can filter to — flat list of all people currently on the roster. */
  yearPersonOptions(): PersonnelEntry[] {
    return this.status?.allPersonnel ?? [];
  }

  /** Compute the 12 mini-month grid cells for the currently selected schedule year. */
  private buildYearGrids(): void {
    const people = this.status?.allPersonnel ?? [];
    if (people.length === 0) {
      this.yearMonthGrids = [];
      return;
    }
    const year = new Date().getFullYear();
    const todayIso = this.isoOfLocal(new Date());
    const filter = this.yearPersonFilter?.trim();

    // Two output maps:
    //   dayShift  → cell background (dominant shift for filtered mode; blank in whole-plant mode)
    //   dayChips  → whole-plant chips: which crew(s) worked which shift(s) each day
    const dayShift = new Map<string, string>();
    const dayChips = new Map<string, { crew: string; shift: string }[]>();

    if (filter) {
      const person = people.find(p => p.name === filter);
      if (person) {
        for (const s of person.schedule || []) {
          if (!s?.date) continue;
          const shift = (s.shift || '').toString().toUpperCase();
          dayShift.set(s.date, shift);
          // Single-person filter: still emit one chip so the crew letter is visible on the cell.
          if (shift && person.group) {
            dayChips.set(s.date, [{ crew: person.group, shift }]);
          }
        }
      }
    } else {
      // Whole-plant mode: for each date, collect the (crew, shift) pairs where at least one
      // person from that crew is on that shift. Skips 'OFF', 'U' and empty — those aren't
      // interesting clips to draw. Deduped so we don't render the same crew-letter twice.
      const seen = new Map<string, Set<string>>(); // iso → set of "crew|shift"
      for (const p of people) {
        if (!p.schedule) continue;
        for (const s of p.schedule) {
          if (!s?.date || !s.shift) continue;
          const shift = s.shift.toString().toUpperCase();
          if (shift === 'OFF' || shift === 'U' || shift === '') continue;
          // Prefer per-month crew (rotation-aware) if we have it; fall back to person's default.
          const monthIdx = new Date(s.date + 'T12:00:00').getMonth();
          const crew = p.groupByMonth?.[String(monthIdx)] || p.group || '';
          if (!crew) continue;
          const key = crew + '|' + shift;
          if (!seen.has(s.date)) seen.set(s.date, new Set());
          if (seen.get(s.date)!.has(key)) continue;
          seen.get(s.date)!.add(key);
          if (!dayChips.has(s.date)) dayChips.set(s.date, []);
          dayChips.get(s.date)!.push({ crew, shift });
        }
      }
      // Sort chips within each day so the visual order is stable: D → N → OCM → T → L → others.
      const shiftRank: Record<string, number> = { D: 0, N: 1, OCM: 2, T: 3, L: 4, P: 5 };
      for (const chips of dayChips.values()) {
        chips.sort((a, b) => {
          const ra = shiftRank[a.shift] ?? 9;
          const rb = shiftRank[b.shift] ?? 9;
          if (ra !== rb) return ra - rb;
          return a.crew.localeCompare(b.crew);
        });
      }
    }

    const grids: typeof this.yearMonthGrids = [];
    const fmt = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    for (let m = 0; m < 12; m++) {
      const first = new Date(year, m, 1);
      const last = new Date(year, m + 1, 0);
      const cells: typeof this.yearMonthGrids[0]['cells'] = [];
      for (let b = 0; b < first.getDay(); b++) {
        cells.push({ iso: '', day: 0, shift: '', chips: [], isToday: false, leadingBlank: true });
      }
      for (let d = 1; d <= last.getDate(); d++) {
        const iso = this.isoOfLocal(new Date(year, m, d));
        cells.push({
          iso,
          day: d,
          shift: dayShift.get(iso) || '',
          chips: dayChips.get(iso) || [],
          isToday: iso === todayIso,
          leadingBlank: false,
        });
      }
      grids.push({ month: m, label: fmt[m], cells });
    }
    this.yearMonthGrids = grids;
  }

  jumpFromYear(monthIdx: number): void {
    this.selectedMonth = monthIdx;
    this.scheduleView = 'month';
    this.computeDerived();
  }

  /** Tooltip for a year-view mini-cell — lists crew:shift pairs for whole-plant mode, or
   *  falls back to the single dominant shift label for filtered mode / no chips. */
  cellTitle(c: { iso: string; shift: string; chips: { crew: string; shift: string }[] }): string {
    if (!c.iso) return '';
    if (c.chips.length === 0) return `${c.iso} — ${c.shift || 'Off'}`;
    return `${c.iso}\n` + c.chips.map(x => `${x.crew}: ${x.shift}`).join('\n');
  }

  private isoOfLocal(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
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
    this.electronService.openExternal(getScheduleUrl());
  }

  openContacts(): void {
    this.electronService.openExternal(getContactsUrl());
  }

  async loadContractors(forceRefresh = false): Promise<void> {
    if (!forceRefresh && (this.contractors.length > 0 || this.contractorsLoading)) {
      this.loadContractorReports();
      return;
    }
    this.contractorsLoading = true;
    this.contractorsError = '';
    try {
      const result = await this.electronService.contractorsGetLive();
      if (result.success && result.data) {
        this.contractors = result.data.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.contractorsError = result.error || 'Failed to load contractors';
      }
    } catch (err: any) {
      this.contractorsError = err.message;
    } finally {
      this.contractorsLoading = false;
    }
    this.loadContractorReports();
  }

  async loadContractorReports(): Promise<void> {
    this.contractorReportsLoading = true;
    try {
      const result = await this.electronService.contractorsListReports('PENDING');
      // Backend wraps in NgApiResponse { responseData, message }
      const payload: any = result.data;
      this.contractorReports = payload?.responseData || [];
    } catch {
      this.contractorReports = [];
    } finally {
      this.contractorReportsLoading = false;
    }
  }

  async pushContractorsToBackend(): Promise<void> {
    this.contractorPushing = true;
    this.contractorActionMessage = '';
    try {
      const result = await this.electronService.contractorsPushToBackend();
      if (result.success) {
        const summary: any = (result.data as any)?.responseData;
        this.contractorActionMessage = summary
          ? `Pushed: created=${summary.created}, linked=${summary.linked}, updated=${summary.updated}, unchanged=${summary.unchanged}`
          : 'Push complete';
      } else {
        this.contractorActionMessage = `Push failed: ${result.error}`;
      }
    } catch (err: any) {
      this.contractorActionMessage = `Push failed: ${err.message}`;
    } finally {
      this.contractorPushing = false;
    }
  }

  async scanContractors(): Promise<void> {
    this.contractorScanning = true;
    this.contractorActionMessage = '';
    try {
      const result = await this.electronService.contractorsScan();
      if (result.success) {
        const report: any = (result.data as any)?.responseData;
        this.contractorActionMessage = report?.summary
          ? `Scan complete — ${report.summary}`
          : 'Scan complete';
        await this.loadContractorReports();
      } else {
        this.contractorActionMessage = `Scan failed: ${result.error}`;
      }
    } catch (err: any) {
      this.contractorActionMessage = `Scan failed: ${err.message}`;
    } finally {
      this.contractorScanning = false;
    }
  }

  async acceptReport(id: number): Promise<void> {
    const result = await this.electronService.contractorsAcceptReport(id);
    this.contractorActionMessage = result.success ? 'Report accepted' : `Accept failed: ${result.error}`;
    await this.loadContractorReports();
  }

  async rejectReport(id: number): Promise<void> {
    const result = await this.electronService.contractorsRejectReport(id);
    this.contractorActionMessage = result.success ? 'Report rejected' : `Reject failed: ${result.error}`;
    await this.loadContractorReports();
  }

  /**
   * 'expired'   → validTo is before today
   * 'soon'      → expires within 30 days
   * 'ok'        → expires later, or no date provided
   */
  expiryClass(c: ContractorEntry): 'expired' | 'soon' | 'ok' {
    if (!c.validTo) return 'ok';
    const expiry = new Date(c.validTo + 'T00:00:00').getTime();
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    if (expiry < now) return 'expired';
    if (expiry - now < thirtyDays) return 'soon';
    return 'ok';
  }

  contractorExpiringCount(): number {
    return this.contractors.filter(c => this.expiryClass(c) !== 'ok').length;
  }

  // ─── Header search ────────────────────────────────────────────────────

  searchPlaceholder(): string {
    switch (this.activeTab) {
      case 'schedule': return 'Search schedule by name…';
      case 'contacts': return 'Search contacts…';
      case 'contractors': return 'Search contractors…';
      case 'conversations': return 'Search…'; // chat panel does its own filtering; header search unused here
    }
  }

  onSearchChange(): void {
    this.searchLower = this.searchQuery.trim().toLowerCase();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchLower = '';
  }

  private matches(...fields: (string | undefined | null)[]): boolean {
    if (!this.searchLower) return true;
    return fields.some(f => f != null && f.toLowerCase().includes(this.searchLower));
  }

  filteredOnShiftNow(): PersonnelEntry[] {
    if (!this.status?.onShiftNow) return [];
    return this.status.onShiftNow.filter(p => this.matches(p.name, p.group));
  }

  filteredOnCallManagers(): PersonnelEntry[] {
    return this.onCallManagerToday.filter(p => this.matches(p.name));
  }

  filteredGroupMembers(group: string): PersonnelEntry[] {
    const all = this.groupMembersMap.get(group) || [];
    return all.filter(p => this.matches(p.name));
  }

  filteredContacts(): PersonnelContact[] {
    return this.contacts.filter(c =>
      this.matches(c.name, c.title, c.phone, c.secondaryPhone, c.emergencyContact, c.emergencyPhone, c.emergencyRelation)
    );
  }

  filteredContractors(): ContractorEntry[] {
    return this.contractors.filter(c =>
      this.matches(c.name, c.company, c.email, c.phone, c.title, c.status)
    );
  }
}
