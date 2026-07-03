import { Component, EventEmitter, Input, Output, OnChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  AppStatus, APP_DISPLAY_NAME,
  ElectronService, MaximoOverview, MaximoWoBrief, MaximoLaborPerson
} from '../../../services/electron.service';

type SectionKey = 'overdue' | 'due' | 'completed' | 'upcoming';

interface OverviewSection {
  key: SectionKey;
  title: string;
  tabLabel: string;   // short label for the tab bar
  items: MaximoWoBrief[];
  cls: string;
}

/**
 * Maximo overview widget — the tracked people's PM work orders split into
 * Overdue / Due this week / Completed this week / Upcoming (bucketed server-side against the current
 * ISO week). Who is tracked is per-device config (Leads, or a hand-picked people list) editable via
 * the ⚙ gear on the widget. Click the card → opens the Spring Boot bundle page.
 *
 * Compact (1x1): icon + overdue count.
 * Standard (2x1+): the four sections in a scrollable area.
 */
@Component({
  selector: 'app-maximo-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="mx-wrap">
      <a class="feature-card"
         [routerLink]="editMode ? null : '/pid-app'"
         [queryParams]="{ path: 'maximo/bundles/lead-operators' }"
         [class.no-navigate]="editMode"
         [class.compact]="isCompact">

        <!-- COMPACT (1x1) -->
        <ng-container *ngIf="isCompact">
          <div class="compact-header">
            <span class="material-icons compact-icon" style="color: #26C6DA">engineering</span>
            <h3>Maximo</h3>
          </div>
          <div class="compact-metric" *ngIf="overdueCount > 0">
            <span class="metric-number over">{{ overdueCount }}</span>
            <span class="metric-label">overdue</span>
          </div>
          <div class="compact-metric" *ngIf="overdueCount === 0">
            <span class="metric-label ok">Nothing overdue</span>
          </div>
          <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
            {{ status.state === 'running' ? 'Click to view' : 'Requires ' + appName }}
          </span>
        </ng-container>

        <!-- STANDARD (2x1+) -->
        <ng-container *ngIf="!isCompact">
          <div class="header-row">
            <span class="material-icons" style="color: #26C6DA">engineering</span>
            <h3>Maximo · Overview</h3>
          </div>
          <p class="feature-desc">{{ trackingLabel }}</p>

          <div class="no-wo" *ngIf="!overview || (!totalItems && status.state === 'running')">
            {{ status.state === 'running' ? 'No work orders for the tracked people' : 'Requires ' + appName }}
          </div>

          <ng-container *ngIf="overview && totalItems > 0">
            <nav class="ov-tabs">
              <button *ngFor="let s of sections" type="button"
                      [class.active]="activeTab === s.key" [ngClass]="s.cls"
                      (click)="selectTab(s.key, $event)" [title]="s.title">
                {{ s.tabLabel }} <span class="ov-count">{{ s.items.length }}</span>
              </button>
            </nav>
            <div class="ov-scroll">
              <div class="wo-row" *ngFor="let w of activeItems">
                <div class="wo-line1">
                  <span class="wonum">{{ w.wonum }}</span>
                  <span class="wo-target" [class.no-target]="!rowDate(w)">
                    {{ rowDate(w) ? fmtDate(rowDate(w)) : 'no date' }}
                  </span>
                  <span class="wo-lead" *ngIf="w.leadCraft">{{ w.leadCraft }}</span>
                </div>
                <div class="wo-desc">{{ w.description }}</div>
              </div>
              <div class="ov-empty" *ngIf="!activeItems.length">Nothing in this tab.</div>
            </div>
          </ng-container>

          <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
            {{ status.state === 'running' ? 'Click to open full table' : 'Requires ' + appName }}
          </span>
        </ng-container>
      </a>

      <!-- ⚙ config (sibling of the card so its clicks never navigate) -->
      <button class="gear-btn" (click)="toggleConfig($event)" title="Configure tracked people">⚙</button>

      <div class="config-panel" *ngIf="showConfig" (click)="$event.stopPropagation()">
        <div class="cfg-head">Tracked people <button class="cfg-x" (click)="showConfig = false">×</button></div>
        <label class="cfg-mode">
          <input type="radio" name="ovmode" [checked]="draftMode === 'leads'" (change)="draftMode = 'leads'" />
          Lead operators
        </label>
        <label class="cfg-mode">
          <input type="radio" name="ovmode" [checked]="draftMode === 'people'" (change)="draftMode = 'people'" />
          Custom people
        </label>

        <div class="cfg-people" *ngIf="draftMode === 'people'">
          <input class="cfg-search" [(ngModel)]="peopleFilter" placeholder="filter people…" />
          <div class="cfg-list">
            <label class="cfg-person" *ngFor="let p of filteredPeople()">
              <input type="checkbox" [checked]="draftIds.has(p.personid)" (change)="togglePerson(p.personid)" />
              {{ p.name }} <span class="cfg-id">({{ p.personid }})</span>
            </label>
            <div class="cfg-empty" *ngIf="!people.length">Loading people…</div>
          </div>
          <div class="cfg-count">{{ draftIds.size }} selected</div>
        </div>

        <div class="cfg-actions">
          <button class="cfg-save" (click)="saveConfig()" [disabled]="savingConfig">
            {{ savingConfig ? 'Saving…' : 'Save' }}
          </button>
          <button (click)="showConfig = false">Cancel</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .mx-wrap { position: relative; height: 100%; }
    .feature-card {
      display: flex; flex-direction: column; gap: 8px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
      height: 100%; box-sizing: border-box; overflow: hidden;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }
    .feature-card.no-navigate { pointer-events: none; }
    .feature-card.compact { gap: 4px; padding: 20px; }

    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-metric { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
    .metric-number { font-size: 20px; font-weight: 700; color: #26C6DA; }
    .metric-number.over { color: #ff6b6b; }
    .metric-label { font-size: 11px; color: var(--text-secondary); }
    .metric-label.ok { color: var(--accent-success); }

    .header-row { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .header-row .material-icons { font-size: 22px; }
    .header-row h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; flex: 1; }
    .feature-desc { font-size: 11px; color: var(--text-muted); margin: 0; flex-shrink: 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); flex-shrink: 0; }
    .feature-status.requires-sb { color: var(--text-muted); }
    .no-wo { font-size: 12px; color: var(--accent-success); }

    .ov-tabs {
      display: flex; gap: 2px; flex-wrap: wrap; flex-shrink: 0;
      border-top: 1px solid var(--border-color); padding-top: 6px;
    }
    .ov-tabs button {
      display: inline-flex; align-items: center; gap: 4px; cursor: pointer;
      background: transparent; border: 0; border-bottom: 2px solid transparent;
      color: var(--text-secondary); font: inherit; font-size: 11px; font-weight: 600;
      padding: 3px 6px; opacity: 0.7;
    }
    .ov-tabs button:hover { opacity: 1; }
    .ov-tabs button.active { opacity: 1; }
    .ov-tabs button.active.sec-overdue { color: #ff6b6b; border-bottom-color: #ff6b6b; }
    .ov-tabs button.active.sec-due { color: #26C6DA; border-bottom-color: #26C6DA; }
    .ov-tabs button.active.sec-done { color: #7ee787; border-bottom-color: #7ee787; }
    .ov-tabs button.active.sec-upcoming { color: var(--text-primary); border-bottom-color: var(--text-muted); }
    .ov-count {
      display: inline-flex; align-items: center; justify-content: center; min-width: 16px; height: 15px;
      padding: 0 4px; border-radius: 8px; font-size: 10px; font-weight: 700;
      color: #fff; background: rgba(255,255,255,0.14);
    }
    .ov-scroll {
      flex: 1; min-height: 0; overflow-y: auto;
      display: flex; flex-direction: column; gap: 2px; padding-top: 4px;
    }
    .ov-empty { font-size: 11px; color: var(--text-muted); padding: 4px 2px; }

    .wo-row { padding: 3px 2px; border-bottom: 1px solid var(--border-color); }
    .wo-row:last-child { border-bottom: 0; }
    .wo-line1 { display: flex; gap: 8px; align-items: baseline; font-size: 11px;
                font-family: ui-monospace, Consolas, monospace; }
    .wonum { color: var(--text-primary); font-weight: 600; }
    .wo-target { color: #26C6DA; }
    .wo-target.no-target { color: var(--text-muted); font-style: italic; }
    .wo-lead { color: var(--text-secondary); margin-left: auto; }
    .wo-desc { font-size: 11px; color: var(--text-muted); margin-top: 1px;
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    /* ⚙ gear + config panel */
    .gear-btn {
      position: absolute; top: 8px; right: 8px; z-index: 5;
      width: 24px; height: 24px; padding: 0; border-radius: 6px; cursor: pointer;
      background: rgba(0,0,0,0.25); border: 1px solid var(--border-color); color: var(--text-secondary);
      font-size: 13px; line-height: 22px; opacity: 0.6;
    }
    .gear-btn:hover { opacity: 1; color: var(--text-primary); }
    .config-panel {
      position: absolute; top: 34px; right: 8px; z-index: 6; width: 240px;
      background: var(--bg-card); border: 1px solid var(--accent-primary); border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5); padding: 10px; display: flex; flex-direction: column; gap: 6px;
    }
    .cfg-head { display: flex; align-items: center; justify-content: space-between;
      font-size: 12px; font-weight: 600; color: var(--text-primary); }
    .cfg-x { background: none; border: 0; color: var(--text-secondary); font-size: 16px; cursor: pointer; line-height: 1; }
    .cfg-mode { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); cursor: pointer; }
    .cfg-search { width: 100%; box-sizing: border-box; background: var(--bg-input, #2a2a2a);
      color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px 6px; font: inherit; }
    .cfg-list { max-height: 180px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; }
    .cfg-person { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-primary); padding: 2px 0; cursor: pointer; }
    .cfg-id { color: var(--text-muted); }
    .cfg-empty { font-size: 11px; color: var(--text-muted); padding: 4px; }
    .cfg-count { font-size: 11px; color: var(--text-secondary); }
    .cfg-actions { display: flex; gap: 6px; }
    .cfg-actions button { flex: 1; padding: 5px; border-radius: 5px; border: 1px solid var(--border-color);
      background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 12px; cursor: pointer; }
    .cfg-actions .cfg-save { background: #26C6DA; border-color: #26C6DA; color: #06232a; font-weight: 600; }
    .cfg-actions button[disabled] { opacity: 0.6; cursor: default; }
  `]
})
export class MaximoWidgetComponent implements OnChanges {
  @Input() status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  @Input() overview: MaximoOverview | null = null;
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;
  /** Emitted after the tracked-people config is saved, so the host reloads the overview. */
  @Output() changed = new EventEmitter<void>();

  appName = APP_DISPLAY_NAME;
  private es = inject(ElectronService);

  sections: OverviewSection[] = [];
  activeTab: SectionKey = 'overdue';
  overdueCount = 0;
  totalItems = 0;

  // Config panel state
  showConfig = false;
  draftMode: 'leads' | 'people' = 'leads';
  draftIds = new Set<string>();
  people: MaximoLaborPerson[] = [];
  peopleFilter = '';
  savingConfig = false;

  get isCompact(): boolean { return this.cols === 1 && this.rows === 1; }

  get trackingLabel(): string {
    if (!this.overview) return 'PM work orders';
    return this.overview.mode === 'people'
      ? `Tracking ${this.overview.personCount} ${this.overview.personCount === 1 ? 'person' : 'people'}`
      : 'Tracking Lead Operators';
  }

  ngOnChanges(): void {
    const o = this.overview;
    this.sections = [
      { key: 'overdue',   title: 'Overdue',             tabLabel: 'Overdue',  items: o?.overdue ?? [],           cls: 'sec-overdue' },
      { key: 'due',       title: 'Due this week',       tabLabel: 'Due',      items: o?.dueThisWeek ?? [],       cls: 'sec-due' },
      { key: 'completed', title: 'Completed this week', tabLabel: 'Done',     items: o?.completedThisWeek ?? [], cls: 'sec-done' },
      { key: 'upcoming',  title: 'Upcoming',            tabLabel: 'Upcoming', items: o?.upcoming ?? [],          cls: 'sec-upcoming' },
    ];
    this.overdueCount = o?.overdue?.length ?? 0;
    this.totalItems = this.sections.reduce((n, s) => n + s.items.length, 0);
    // Land on a useful tab: keep the current one if it still has items, else the first non-empty.
    const cur = this.sections.find(s => s.key === this.activeTab);
    if (!cur || !cur.items.length) {
      this.activeTab = this.sections.find(s => s.items.length)?.key ?? 'overdue';
    }
  }

  /** Items of the currently selected tab. */
  get activeItems(): MaximoWoBrief[] {
    return this.sections.find(s => s.key === this.activeTab)?.items ?? [];
  }

  /** Switch tabs without triggering the card's routerLink (the tabs live inside the <a>). */
  selectTab(key: SectionKey, ev: Event): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.activeTab = key;
  }

  /** Completed rows show their completion date (statusDate); everything else shows target start. */
  rowDate(w: MaximoWoBrief): string {
    return this.activeTab === 'completed' ? (w.statusDate || w.targetStart) : w.targetStart;
  }

  /** ISO datetime → "MMM D". */
  fmtDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  // ── Config panel ──────────────────────────────────────────────────────────
  async toggleConfig(ev: Event): Promise<void> {
    ev.preventDefault();
    ev.stopPropagation();
    this.showConfig = !this.showConfig;
    if (this.showConfig) await this.loadConfigForm();
  }

  private async loadConfigForm(): Promise<void> {
    const cfg = await this.es.maximoGetOverviewConfig();
    if (cfg.success && cfg.data) {
      this.draftMode = cfg.data.mode === 'people' ? 'people' : 'leads';
      this.draftIds = new Set(cfg.data.personids ?? []);
    }
    if (!this.people.length) {
      const pr = await this.es.maximoGetLaborPeople();
      if (pr.success && pr.data) this.people = pr.data;
    }
  }

  filteredPeople(): MaximoLaborPerson[] {
    const q = this.peopleFilter.trim().toLowerCase();
    const list = q ? this.people.filter(p => (p.name + ' ' + p.personid).toLowerCase().includes(q)) : this.people;
    return list.slice(0, 200);
  }

  togglePerson(id: string): void {
    if (this.draftIds.has(id)) this.draftIds.delete(id);
    else this.draftIds.add(id);
  }

  async saveConfig(): Promise<void> {
    if (this.savingConfig) return;
    this.savingConfig = true;
    try {
      await this.es.maximoSaveOverviewConfig({ mode: this.draftMode, personids: [...this.draftIds] });
      this.showConfig = false;
      this.changed.emit();
    } finally {
      this.savingConfig = false;
    }
  }
}
