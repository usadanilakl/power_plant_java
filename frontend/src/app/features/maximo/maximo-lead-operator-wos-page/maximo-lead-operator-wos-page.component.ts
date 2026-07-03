import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoTableComponent } from '../maximo-table/maximo-table.component';
import { MaximoOverview, MaximoWorkOrder } from '../../../models/maximo/maximo.models';
import { WO_COLUMNS } from '../maximo-table-configs';

/** The tab keys, in display order. 'appr' is the status-filterable "All" tab; the rest are overview buckets. */
type OverviewTab = 'appr' | 'overdue' | 'completedLastWeek' | 'completedThisWeek' | 'dueThisWeek' | 'upcoming';

/**
 * Bundle view: Maximo work orders for a tracked people set — the Lead Operators (default) or a
 * hand-picked custom selection — split into tabs. The "All" tab is a status-filterable list (defaults
 * to APPR, can be changed or cleared to show every status); the other tabs are due-status buckets
 * (Overdue / Completed last & this week / Due this week / Upcoming), bucketed server-side against the
 * current ISO week. The people filter mirrors the Electron overview widget; it's remembered per-browser.
 *
 * Use /maximo/work-orders for criteria-based exploration.
 */
@Component({
  selector: 'app-maximo-lead-operator-wos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoTableComponent, MaximoDetailDialogComponent],
  templateUrl: './maximo-lead-operator-wos-page.component.html',
  styleUrl: './maximo-lead-operator-wos-page.component.css'
})
export class MaximoLeadOperatorWosPageComponent implements OnInit {
  private api = inject(MaximoApiService);
  private static readonly STORE_KEY = 'maximo-leadop-people-filter';
  /** The "All" tab is one Maximo page; hitting this many rows means results were capped. */
  private static readonly ALL_PAGE_SIZE = 500;

  readonly columns = WO_COLUMNS;
  readonly tabs: { key: OverviewTab; label: string }[] = [
    { key: 'appr', label: 'All' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'completedLastWeek', label: 'Completed last week' },
    { key: 'completedThisWeek', label: 'Completed this week' },
    { key: 'dueThisWeek', label: 'Due this week' },
    { key: 'upcoming', label: 'Upcoming' },
  ];
  /** Status filter for the "All" tab. '' = all statuses. */
  readonly statusOptions = [
    { value: 'APPR', label: 'Approved (APPR)' },
    { value: 'WAPPR', label: 'Waiting approval (WAPPR)' },
    { value: 'INPRG', label: 'In progress (INPRG)' },
    { value: 'COMP', label: 'Completed (COMP)' },
    { value: 'CLOSE', label: 'Closed (CLOSE)' },
    { value: '', label: 'All statuses' },
  ];

  activeTab = signal<OverviewTab>('appr');
  overview = signal<MaximoOverview | null>(null);
  allList = signal<MaximoWorkOrder[]>([]);   // the "All" tab (status-filtered)
  apprStatus = signal<string>('APPR');       // '' = all statuses
  ready = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  lastLoaded = signal<Date | null>(null);

  // People filter (Leads or a custom personid selection).
  mode = signal<'leads' | 'people'>('leads');
  selectedIds = signal<Set<string>>(new Set());
  people = signal<{ name: string; personid: string }[]>([]);
  peopleFilter = signal('');
  showPeople = signal(false);

  /** The WOs for the active tab. */
  list = computed<MaximoWorkOrder[]>(() => {
    if (this.activeTab() === 'appr') return this.allList();
    const o = this.overview();
    return o ? ((o as unknown as Record<string, MaximoWorkOrder[]>)[this.activeTab()] ?? []) : [];
  });

  /** The "All" tab hit the page cap — some WOs are hidden; narrow by status. */
  allTruncated = computed(() => this.allList().length >= MaximoLeadOperatorWosPageComponent.ALL_PAGE_SIZE);

  count(tab: OverviewTab): number {
    if (tab === 'appr') return this.allList().length;
    const o = this.overview();
    return o ? ((o as unknown as Record<string, MaximoWorkOrder[]>)[tab]?.length ?? 0) : 0;
  }

  filteredPeople = computed(() => {
    const q = this.peopleFilter().trim().toLowerCase();
    const all = this.people();
    const list = q ? all.filter(p => (p.name + ' ' + p.personid).toLowerCase().includes(q)) : all;
    return list.slice(0, 300);
  });

  ngOnInit() {
    this.restoreFilter();
    if (this.mode() === 'people') this.ensurePeople();
    this.load();
  }

  /** (Re)load both sources for the current people filter. */
  async load() {
    this.loading.set(true); this.error.set(null);
    try {
      await Promise.all([this.loadOverview(), this.loadAll()]);
      this.lastLoaded.set(new Date());
      this.ready.set(true);
    } catch (e: any) {
      this.error.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadOverview() {
    this.overview.set(await firstValueFrom(this.api.getOverview(this.mode(), [...this.selectedIds()])));
  }
  private async loadAll() {
    this.allList.set(await firstValueFrom(
      this.api.getPeopleWorkOrders(this.mode(), [...this.selectedIds()], this.apprStatus() || undefined)));
  }

  /** Change the "All" tab's status filter — only the All list needs re-fetching. */
  async changeApprStatus(s: string) {
    this.apprStatus.set(s);
    this.loading.set(true); this.error.set(null);
    try { await this.loadAll(); }
    catch (e: any) {
      // Don't leave rows for the previously-loaded status showing under the new selection.
      this.allList.set([]);
      this.error.set(this.msg(e));
    }
    finally { this.loading.set(false); }
  }

  onModeChange(m: 'leads' | 'people') {
    this.mode.set(m);
    this.persistFilter();
    if (m === 'people') { this.ensurePeople(); this.showPeople.set(true); }
    else { this.showPeople.set(false); this.load(); }
  }

  isSelected(id: string): boolean { return this.selectedIds().has(id); }
  togglePerson(id: string) {
    const s = new Set(this.selectedIds());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.selectedIds.set(s);
  }

  applyPeople() {
    this.persistFilter();
    this.showPeople.set(false);
    this.load();
  }

  private async ensurePeople() {
    if (this.people().length) return;
    try { this.people.set(await firstValueFrom(this.api.getLaborPeopleCached())); } catch { /* picker stays empty */ }
  }

  private restoreFilter() {
    try {
      const raw = localStorage.getItem(MaximoLeadOperatorWosPageComponent.STORE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.mode === 'people' || saved.mode === 'leads') this.mode.set(saved.mode);
      if (Array.isArray(saved.personids)) this.selectedIds.set(new Set(saved.personids));
    } catch { /* ignore corrupt saved filter */ }
  }

  private persistFilter() {
    try {
      localStorage.setItem(MaximoLeadOperatorWosPageComponent.STORE_KEY,
        JSON.stringify({ mode: this.mode(), personids: [...this.selectedIds()] }));
    } catch { /* ignore quota / disabled storage */ }
  }

  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }

  // Detail dialog
  selectedWo = signal<MaximoWorkOrder | null>(null);
  openDetail(wo: MaximoWorkOrder) { this.selectedWo.set(wo); }
  closeDetail() { this.selectedWo.set(null); }
}
