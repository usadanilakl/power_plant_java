import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoPmApiService } from '../../../services/maximo/maximo-pm-api.service';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoFormApiService } from '../../../services/maximo/maximo-form-api.service';
import { MaximoFormTemplate } from '../../../models/maximo/maximo-form.models';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoPersonPickerComponent } from '../maximo-person-picker/maximo-person-picker.component';
import { MaximoWorkOrder } from '../../../models/maximo/maximo.models';
import {
  PmOccurrence,
  PmPendingAssignment,
  RecurrenceCadence,
  RecurringPm,
  ShiftDay,
  ShiftEntry,
  ShiftPreference
} from '../../../models/maximo/pm.models';

type Tab = 'catalog' | 'assignments' | 'schedule';

/** Sortable columns of the Recurring PMs (catalog) table. */
type CatalogSortCol = 'pmnum' | 'pmDescription' | 'occurrenceCount' | 'cadence' | 'shift' | 'preferredDayOfWeek' | 'lastWonum';

/** Crew-letter display order for the schedule grid (then "other", then blank). */
const CREW_ORDER = ['A', 'B', 'C', 'D', 'Rel', 'OCM'];

/** A pivoted schedule grid (people × dates) for one WO's 3-week peek window. */
interface PeekGrid {
  from: string;
  to: string;
  dueDate: string;
  dates: string[];
  people: { name: string; crew: string; isLead: boolean }[];
  codes: Record<string, string>;  // key = `${name}|${date}` → D/N/P/T/U
}

/**
 * PM auto-assignment workspace:
 *  - Catalog: recurring PMs (deduped by pmnum), set day/night shift + cadence.
 *  - Assignments: WAPPR recurring-PM WOs with a proposed shift-based assignee; Approve all / per-item.
 *  - Schedule: who is on day/night shift by date (from the imported Ops Schedule).
 */
@Component({
  selector: 'app-maximo-pm-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoDetailDialogComponent, MaximoPersonPickerComponent],
  templateUrl: './maximo-pm-page.component.html',
  styleUrl: './maximo-pm-page.component.css'
})
export class MaximoPmPageComponent implements OnInit {
  private api = inject(MaximoPmApiService);
  private maximoApi = inject(MaximoApiService);
  private formApi = inject(MaximoFormApiService);

  tab = signal<Tab>('assignments');
  loading = signal(false);
  error = signal<string | null>(null);
  info = signal<string | null>(null);

  readonly shiftOptions: ShiftPreference[] = ['DAY', 'NIGHT', 'EITHER'];
  readonly cadenceOptions: RecurrenceCadence[] = ['DAY', 'WEEK', 'MONTH', 'OTHER'];
  readonly dowOptions = [
    { value: null, label: '—' }, { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' }, { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }, { value: 7, label: 'Sun' }
  ];

  // Catalog
  catalog = signal<RecurringPm[]>([]);
  catalogLoaded = signal(false);
  /** Active electronic form templates, for the per-PM "completion form" dropdown. */
  formTemplates = signal<MaximoFormTemplate[]>([]);
  // Manually add a recurring PM the auto-scan missed (no WO needed).
  showAddPm = signal(false);
  addingPm = signal(false);
  newPmNumber = '';
  newPmDescription = '';
  // Search + column sort for the Recurring PMs table.
  catalogSearch = signal('');
  catalogSort = signal<{ col: CatalogSortCol; dir: 1 | -1 }>({ col: 'pmnum', dir: 1 });
  /** Filtered (by search over pmnum/description/shift/cadence/last-WO) + sorted view of the catalog. */
  visibleCatalog = computed(() => {
    const q = this.catalogSearch().trim().toLowerCase();
    const { col, dir } = this.catalogSort();
    let list = this.catalog();
    if (q) {
      list = list.filter(pm =>
        (pm.pmnum ?? '').toLowerCase().includes(q) ||
        (pm.pmDescription ?? '').toLowerCase().includes(q) ||
        (pm.shift ?? '').toLowerCase().includes(q) ||
        (pm.cadence ?? '').toLowerCase().includes(q) ||
        (pm.lastWonum ?? '').toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => dir * this.catalogCompare(a, b, col));
  });
  // Per-PM occurrence timeline (history + upcoming), lazily loaded on expand.
  expandedPmIds = signal<Set<number>>(new Set());
  occByPm = signal<Record<number, PmOccurrence[]>>({});
  occLoadingIds = signal<Set<number>>(new Set());

  // Assignments
  pending = signal<PmPendingAssignment[]>([]);
  pendingLoaded = signal(false);
  recurringOnly = signal(true);
  visiblePending = computed(() =>
    this.recurringOnly() ? this.pending().filter(p => p.recurring) : this.pending());
  /** chosen assignee personid per WO href (defaults to the proposal). */
  assignee: Record<string, string> = {};
  /** editable Target Start / Target Finish per WO href (seeded from the computed values). */
  startDate: Record<string, string> = {};
  finishDate: Record<string, string> = {};
  /** per WO href: when true the assignee cell shows the free "any person" picker instead of the on-shift dropdown. */
  assignAnyone: Record<string, boolean> = {};
  approving = signal(false);
  savingPref = signal(false);

  // Inline schedule peek: expanded rows + per-DATE 3-week grid cache + in-flight dates.
  expandedHrefs = signal<Set<string>>(new Set());
  peekGridByDate = signal<Record<string, PeekGrid>>({});
  peekLoadingDates = signal<Set<string>>(new Set());
  /** Filter the peek grid to lead operators only (default on — it's who you're assigning). */
  peekLeadsOnly = signal(true);
  /** Lead identity sets for flagging roster people (mirrors backend: scheduleName alias OR matched userId). */
  private leadIds = new Set<number>();
  private leadScheduleNames = new Set<string>();
  private leadsLoaded = false;

  // Schedule
  schedule = signal<ShiftDay[]>([]);
  /** Roster names in range that didn't resolve to any User — need a scheduleName alias. */
  unresolved = signal<string[]>([]);
  schedFrom = '';
  schedTo = '';

  ngOnInit() {
    const today = new Date();
    const to = new Date(); to.setDate(to.getDate() + 13);
    this.schedFrom = today.toISOString().slice(0, 10);
    this.schedTo = to.toISOString().slice(0, 10);
    this.loadPending();
  }

  async setTab(t: Tab) {
    this.tab.set(t);
    this.error.set(null); this.info.set(null);
    if (t === 'catalog' && !this.catalogLoaded()) await this.loadCatalog();
    if (t === 'assignments' && !this.pendingLoaded()) await this.loadPending();
    if (t === 'schedule' && this.schedule().length === 0) await this.loadSchedule();
  }

  // ── Catalog ─────────────────────────────────────────────────────────────
  async loadCatalog() {
    this.loading.set(true); this.error.set(null);
    try {
      const [catalog, templates] = await Promise.all([
        firstValueFrom(this.api.getCatalog()),
        firstValueFrom(this.formApi.listTemplates()),
      ]);
      this.catalog.set(catalog);
      this.formTemplates.set((templates ?? []).filter(t => t.active !== false));
      this.catalogLoaded.set(true);
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  /** The forms currently assigned to a PM (falls back to the legacy single formKey). */
  pmFormKeys(pm: RecurringPm): string[] {
    return pm.formKeys ?? (pm.formKey ? [pm.formKey] : []);
  }

  /** Assign one or more completion forms to a recurring PM (empty clears); persists immediately. The operator
   *  picks one of these when completing a WO. */
  async assignForms(pm: RecurringPm, formKeys: string[]) {
    const next = (formKeys ?? []).filter(k => !!k);
    const cur = this.pmFormKeys(pm);
    if (cur.length === next.length && cur.every(k => next.includes(k))) return;
    try {
      const updated = await firstValueFrom(this.api.assignForms(pm.id, next));
      this.catalog.update(list => list.map(r => r.id === pm.id ? updated : r));
    } catch (e: any) { this.error.set(this.msg(e)); }
  }

  // ── Form-assignment checklist dropdown ──────────────────────────────────
  /** Which PM's form dropdown is open (only one at a time). */
  formMenuOpenId = signal<number | null>(null);
  /** Fixed-position coords for the open panel (from the trigger's rect) so the scroll container can't clip it.
   *  Anchors by top (opens down) or bottom (flips up when there's more room above). */
  formMenuPos = signal<{ top?: number; bottom?: number; left: number; width: number } | null>(null);

  toggleFormMenu(pm: RecurringPm, ev: MouseEvent): void {
    if (this.formMenuOpenId() === pm.id) { this.closeFormMenu(); return; }
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 260 && r.top > spaceBelow;   // flip up only when it genuinely fits better
    this.formMenuPos.set(openUp
      ? { bottom: window.innerHeight - r.top + 2, left: r.left, width: r.width }
      : { top: r.bottom + 2, left: r.left, width: r.width });
    this.formMenuOpenId.set(pm.id);
  }
  closeFormMenu(): void { this.formMenuOpenId.set(null); this.formMenuPos.set(null); }
  /** The PM whose form dropdown is open (looked up from the full catalog by id). */
  openFormPm = computed(() => {
    const id = this.formMenuOpenId();
    return id == null ? null : (this.catalog().find(p => p.id === id) ?? null);
  });

  isFormAssigned(pm: RecurringPm, key: string): boolean { return this.pmFormKeys(pm).includes(key); }

  toggleForm(pm: RecurringPm, key: string, checked: boolean): void {
    const cur = this.pmFormKeys(pm);
    const next = checked ? [...cur, key] : cur.filter(k => k !== key);
    this.assignForms(pm, next);
  }

  /** Collapsed-trigger label: the selected form names, or a placeholder when none. */
  formSummary(pm: RecurringPm): string {
    const keys = this.pmFormKeys(pm);
    if (keys.length === 0) return '— none —';
    return keys.map(k => this.formTemplates().find(t => t.formKey === k)?.formName ?? k).join(', ');
  }

  async refreshCatalog() {
    this.loading.set(true); this.error.set(null); this.info.set(null);
    try {
      const r = await firstValueFrom(this.api.refreshCatalog());
      const pruned = r['pruned'] ?? 0;
      this.info.set(`Scanned ${r['scanned'] ?? 0} WOs → ${r['recurring'] ?? 0} recurring PMs `
        + `(${r['created'] ?? 0} new, ${r['updated'] ?? 0} updated${pruned ? `, ${pruned} pruned` : ''})`);
      this.catalog.set(await firstValueFrom(this.api.getCatalog()));
      this.catalogLoaded.set(true);
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  /**
   * Manually add a recurring PM the auto-scan missed — no WO required. Creates a catalog entry keyed by the
   * PM number (or, if blank, its description) that's kept through refreshes; shift/cadence/day are edited
   * inline on the new row after.
   */
  async addRecurringManual() {
    const desc = this.newPmDescription.trim();
    if (!desc) { this.error.set('A description is required.'); return; }
    if (this.addingPm()) return;
    this.addingPm.set(true); this.error.set(null); this.info.set(null);
    try {
      const created = await firstValueFrom(this.api.makeRecurring({
        pmnum: this.newPmNumber.trim() || undefined,
        description: desc,
      }));
      this.info.set(`Added recurring PM “${created.pmnum || created.pmDescription}”. Set its shift/cadence/day below.`);
      this.newPmNumber = ''; this.newPmDescription = '';
      this.showAddPm.set(false);
      await this.loadCatalog();
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.addingPm.set(false); }
  }

  /** Toggle the sort column (or flip direction if already sorting by it). */
  sortCatalog(col: CatalogSortCol) {
    this.catalogSort.update(s => s.col === col ? { col, dir: (s.dir === 1 ? -1 : 1) } : { col, dir: 1 });
  }
  /** Header arrow for the active sort column. */
  sortIndicator(col: CatalogSortCol): string {
    const s = this.catalogSort();
    return s.col === col ? (s.dir === 1 ? ' ▲' : ' ▼') : '';
  }
  private catalogCompare(a: RecurringPm, b: RecurringPm, col: CatalogSortCol): number {
    if (col === 'occurrenceCount') return (a.occurrenceCount ?? 0) - (b.occurrenceCount ?? 0);
    if (col === 'preferredDayOfWeek') return (a.preferredDayOfWeek ?? 99) - (b.preferredDayOfWeek ?? 99);
    const av = String((a as any)[col] ?? '').toLowerCase();
    const bv = String((b as any)[col] ?? '').toLowerCase();
    return av.localeCompare(bv);
  }

  /** Persist the row's current shift/cadence/preferred-day; the dropdowns update the pm object first. */
  async saveClassification(pm: RecurringPm) {
    try {
      const updated = await firstValueFrom(
        this.api.classify(pm.id, pm.shift, pm.cadence, pm.preferredDayOfWeek));
      this.catalog.update(list => list.map(r => r.id === pm.id ? updated : r));
    } catch (e: any) { this.error.set(this.msg(e)); }
  }

  // ── Per-PM occurrence timeline (history + upcoming) ───────────────────────
  isPmExpanded(id: number): boolean { return this.expandedPmIds().has(id); }
  isOccLoading(id: number): boolean { return this.occLoadingIds().has(id); }
  occLoaded(id: number): boolean { return this.occByPm()[id] != null; }
  /** Upcoming/active items (open WOs), soonest first. */
  occUpcoming(id: number): PmOccurrence[] {
    return (this.occByPm()[id] ?? []).filter(o => o.open)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));
  }
  /** History (completed/terminal WOs), newest first (backend order). */
  occHistory(id: number): PmOccurrence[] {
    return (this.occByPm()[id] ?? []).filter(o => !o.open);
  }

  /** Expand/collapse a PM's occurrence timeline; lazily fetch its real Maximo WOs once. */
  async togglePmHistory(pm: RecurringPm) {
    const set = new Set(this.expandedPmIds());
    if (set.has(pm.id)) { set.delete(pm.id); this.expandedPmIds.set(set); return; }
    set.add(pm.id);
    this.expandedPmIds.set(set);
    if (this.occByPm()[pm.id]) return;                       // cached
    const loading = new Set(this.occLoadingIds()); loading.add(pm.id);
    this.occLoadingIds.set(loading);
    try {
      const occ = await firstValueFrom(this.api.getOccurrences(pm.id));
      this.occByPm.update(m => ({ ...m, [pm.id]: occ }));
    } catch (e: any) {
      this.error.set(this.msg(e));
    } finally {
      const l = new Set(this.occLoadingIds()); l.delete(pm.id);
      this.occLoadingIds.set(l);
    }
  }

  // ── Assignments ─────────────────────────────────────────────────────────
  /**
   * Reload the pending list. By default (re)seeds each row's assignee/date maps from the server proposal.
   * With `opts.preserve`, existing in-progress edits are kept — only brand-new rows and the optional
   * `refreshHref` (the row whose shift/day just changed) are re-seeded — so editing one row's preference
   * doesn't wipe the hand-edits the operator made on other rows before approving. Always prunes UI-state
   * (assignee/date/assignAnyone) for rows no longer pending so stale keys don't linger across reloads.
   */
  async loadPending(opts?: { preserve?: boolean; refreshHref?: string }) {
    this.loading.set(true); this.error.set(null);
    try {
      const rows = await firstValueFrom(this.api.getPending());
      const preserve = opts?.preserve === true;
      for (const r of rows) {
        if (!preserve || r.href === opts?.refreshHref || !(r.href in this.assignee)) {
          this.assignee[r.href] = r.proposedPersonid ?? '';
          this.startDate[r.href] = r.targetDate ?? '';
          this.finishDate[r.href] = r.targetFinish ?? '';
        }
      }
      // Drop per-href UI state for WOs that are no longer pending (e.g. just approved).
      const live = new Set(rows.map(r => r.href));
      for (const href of Object.keys(this.assignee)) {
        if (!live.has(href)) {
          delete this.assignee[href]; delete this.startDate[href];
          delete this.finishDate[href]; delete this.assignAnyone[href];
        }
      }
      this.pending.set(rows);
      this.pendingLoaded.set(true);
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  async approve(row: PmPendingAssignment) {
    await this.doAssign([row]);
  }

  /** Swap the assignee cell between the on-shift suggestions dropdown and the free "any person" picker. */
  toggleAssignAnyone(href: string) {
    this.assignAnyone[href] = !this.assignAnyone[href];
  }

  /**
   * Manually convert a non-recurring WO into a recurring task (auto-detection missed it). Creates a catalog
   * entry from the WO's pmnum/description, then reloads — the row then matches the catalog and becomes
   * recurring (its shift/day editable inline). Also refreshes the catalog list if it was already loaded.
   */
  async makeRecurring(row: PmPendingAssignment) {
    if (row.recurringPmId != null || this.savingPref()) return;
    this.savingPref.set(true); this.error.set(null); this.info.set(null);
    try {
      await firstValueFrom(this.api.makeRecurring({
        pmnum: row.pmnum || undefined, description: row.description,
        lead: row.currentLead || undefined, wonum: row.wonum || undefined,
      }));
      this.info.set(`“${row.description}” is now a recurring task.`);
      this.catalogLoaded.set(false);   // force a fresh catalog fetch next time the tab opens
      await this.loadPending({ preserve: true });   // keep other rows' edits; this row picks up recurringPmId
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.savingPref.set(false); }
  }

  /**
   * Persist a recurring PM's shift/preferred-day edited inline on the Assignments tab (reuses the catalog
   * classify endpoint), then reload — the change moves the effective date and thus the on-shift candidates,
   * so the proposal has to recompute. No-op for non-recurring rows (no catalog row to edit).
   */
  async saveAssignmentPref(row: PmPendingAssignment) {
    if (row.recurringPmId == null || this.savingPref()) return;
    this.savingPref.set(true); this.error.set(null);
    try {
      await firstValueFrom(this.api.classify(row.recurringPmId, row.shift, row.cadence, row.preferredDayOfWeek));
      // Re-seed only THIS row's proposal (its shift/day changed) — keep other rows' in-progress edits.
      await this.loadPending({ preserve: true, refreshHref: row.href });
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.savingPref.set(false); }
  }

  async approveAll() {
    await this.doAssign(this.visiblePending());
  }

  private async doAssign(rows: PmPendingAssignment[]) {
    if (!rows.length || this.approving()) return;
    this.approving.set(true); this.error.set(null); this.info.set(null);
    try {
      // Write the start+finish window only when the date was shifted (preferred day) OR hand-edited;
      // otherwise leave the WO's existing Maximo dates alone.
      const items = rows.map(r => {
        const start = this.startDate[r.href] ?? r.targetDate;
        const finish = this.finishDate[r.href] ?? r.targetFinish;
        const write = r.preferredDayOfWeek != null || start !== r.targetDate || finish !== r.targetFinish;
        return {
          href: r.href,
          personid: this.assignee[r.href] || undefined,
          targetDate: write ? start : undefined,
          targetFinish: write ? finish : undefined,
        };
      });
      const res = await firstValueFrom(this.api.assign({ items, memo: 'PM auto-assignment' }));
      this.info.set(`Approved ${res.approved}${res.errors?.length ? `, ${res.errors.length} failed` : ''}`);
      if (res.errors?.length) this.error.set(res.errors.map(e => e.error).join('; '));
      await this.loadPending();
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.approving.set(false); }
  }

  // ── WO detail dialog (open the full Maximo WO from an Assignments row) ─────
  /** The WO whose detail dialog is open (a full MaximoWorkOrder), or null. */
  selectedWo = signal<MaximoWorkOrder | null>(null);

  /** Hydrate the full WO from its href and open the shared detail dialog (parts-checkout precedent). */
  async openWo(row: PmPendingAssignment) {
    await this.openWoHref(row.href, row.wonum);
  }

  /** Open the WO detail dialog from a bare href (used by the occurrence timeline), hydrating the full WO. */
  async openWoHref(href: string, wonum = '') {
    if (!href) return;
    try {
      const wo = await firstValueFrom(this.maximoApi.getWorkOrder(href));
      this.selectedWo.set(wo ?? { ...this.blankWo(), href, wonum });
    } catch {
      this.selectedWo.set({ ...this.blankWo(), href, wonum });
    }
  }

  closeWo() { this.selectedWo.set(null); }

  /** An all-empty MaximoWorkOrder, for fallback when the header fetch fails. */
  private blankWo(): MaximoWorkOrder {
    return {
      href: '', wonum: '', description: '', longDescription: '', status: '', worktype: '',
      assetnum: '', location: '', siteid: '', reportdate: '', targetStart: '', schedstart: '',
      schedfinish: '', leadCraft: '', supervisor: '', priority: '', pmnum: ''
    };
  }

  // ── Inline schedule peek (per WO row) ─────────────────────────────────────
  isExpanded(href: string): boolean { return this.expandedHrefs().has(href); }
  peekGrid(row: PmPendingAssignment): PeekGrid | undefined { return this.peekGridByDate()[row.targetDate]; }
  peekLoading(row: PmPendingAssignment): boolean { return this.peekLoadingDates().has(row.targetDate); }
  peekCode(g: PeekGrid, name: string, date: string): string { return g.codes[name + '|' + date] ?? ''; }
  /** People shown in a peek grid — leads only by default, or everyone when the toggle is off. */
  visiblePeople(g: PeekGrid) { return this.peekLeadsOnly() ? g.people.filter(p => p.isLead) : g.people; }

  /** Expand/collapse a WO's schedule peek; lazily fetch a 3-week window (due week ±1) and build the grid. */
  async togglePeek(row: PmPendingAssignment) {
    const set = new Set(this.expandedHrefs());
    if (set.has(row.href)) { set.delete(row.href); this.expandedHrefs.set(set); return; }
    set.add(row.href);
    this.expandedHrefs.set(set);

    const date = row.targetDate;
    if (!date || this.peekGridByDate()[date]) return;        // no date, or already cached
    const { from, to } = this.peekWindow(date);
    const loading = new Set(this.peekLoadingDates()); loading.add(date);
    this.peekLoadingDates.set(loading);
    try {
      const [days] = await Promise.all([
        firstValueFrom(this.api.getScheduleRange(from, to)),
        this.ensureLeads(),                                  // so isLead is resolvable before building
      ]);
      this.peekGridByDate.update(m => ({ ...m, [date]: this.buildPeekGrid(days, date) }));
    } catch (e: any) {
      this.error.set(this.msg(e));
    } finally {
      const l = new Set(this.peekLoadingDates()); l.delete(date);
      this.peekLoadingDates.set(l);
    }
  }

  /** Load the lead-operator identity sets once (id + normalized scheduleName). Best-effort. */
  private async ensureLeads() {
    if (this.leadsLoaded) return;
    try {
      const leads = await firstValueFrom(this.api.getLeads());
      for (const l of leads) {
        if (l.id != null) this.leadIds.add(l.id);
        if (l.scheduleName) this.leadScheduleNames.add(this.normName(l.scheduleName));
      }
    } catch { /* leave empty — peek still renders, just without lead flags */ }
    this.leadsLoaded = true;
  }

  private normName(s: string): string { return s.trim().toLowerCase().replace(/\s+/g, ' '); }

  /** 3-week window centered on the WO's due week (one week before, the due week, one week after). */
  private peekWindow(dateStr: string): { from: string; to: string } {
    const due = new Date(dateStr + 'T00:00:00');
    const isoDow = (due.getDay() + 6) % 7;                  // Mon=0 .. Sun=6
    const monday = new Date(due); monday.setDate(due.getDate() - isoDow);
    const from = new Date(monday); from.setDate(monday.getDate() - 7);   // Monday of the week before
    const to = new Date(monday); to.setDate(monday.getDate() + 13);      // Sunday of the week after
    return { from: this.isoLocal(from), to: this.isoLocal(to) };
  }

  private isoLocal(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  /** Pivot ShiftDay[] into a people×dates grid with crew letters + lead flags (mirrors the Schedule tab). */
  private buildPeekGrid(days: ShiftDay[], dueDate: string): PeekGrid {
    const dates = days.map(d => d.date);
    const codes: Record<string, string> = {};
    const crew = new Map<string, string>();
    const userIdByName = new Map<string, number>();
    const people = new Set<string>();
    const put = (entries: ShiftEntry[] | null | undefined, date: string, code: string) => {
      for (const e of (entries ?? [])) {
        if (!e?.name) continue;
        people.add(e.name);
        codes[e.name + '|' + date] = code;
        if (e.group && !crew.get(e.name)) crew.set(e.name, e.group);
        if (e.userId != null && !userIdByName.has(e.name)) userIdByName.set(e.name, e.userId);
      }
    };
    for (const d of days) {
      put(d.dayShift, d.date, 'D');
      put(d.nightShift, d.date, 'N');
      put(d.pto, d.date, 'P');
      put(d.training, d.date, 'T');
      put(d.unscheduled, d.date, 'U');
    }
    const isLead = (name: string): boolean => {
      if (this.leadScheduleNames.has(this.normName(name))) return true;     // explicit alias
      const uid = userIdByName.get(name);
      return uid != null && this.leadIds.has(uid);                          // fuzzy import match
    };
    const ordered = [...people]
      .map(n => ({ name: n, crew: crew.get(n) ?? '', isLead: isLead(n) }))
      .sort((a, b) => this.crewRank(a.crew) - this.crewRank(b.crew) || a.name.localeCompare(b.name));
    return { from: dates[0] ?? '', to: dates[dates.length - 1] ?? '', dueDate, dates, people: ordered, codes };
  }

  /** Sort key: known crews A,B,C,D,Rel,OCM first (in that order), then other letters, then blank. */
  private crewRank(c: string): number {
    const i = CREW_ORDER.indexOf(c);
    return i < 0 ? CREW_ORDER.length + (c ? 0 : 1) : i;
  }

  // ── Schedule ────────────────────────────────────────────────────────────
  async loadSchedule() {
    if (!this.schedFrom || !this.schedTo) return;
    this.loading.set(true); this.error.set(null);
    try {
      const [days, unresolved] = await Promise.all([
        firstValueFrom(this.api.getScheduleRange(this.schedFrom, this.schedTo)),
        firstValueFrom(this.api.getUnresolved(this.schedFrom, this.schedTo)),
      ]);
      this.schedule.set(days);
      this.unresolved.set([...unresolved].sort());
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  /** Reconstruct the spreadsheet-style grid (people rows × date columns, shift code per cell) from ShiftDay. */
  scheduleGrid = computed(() => {
    const days = this.schedule();
    const people = new Set<string>();
    const cell = new Map<string, Record<string, string>>(); // person -> date -> code
    const put = (entries: { name: string }[] | null | undefined, date: string, code: string) => {
      for (const e of (entries ?? [])) {
        if (!e?.name) continue;
        people.add(e.name);
        const row = cell.get(e.name) ?? {};
        row[date] = code;
        cell.set(e.name, row);
      }
    };
    for (const d of days) {
      put(d.dayShift, d.date, 'D');
      put(d.nightShift, d.date, 'N');
      put(d.pto, d.date, 'P');
      put(d.training, d.date, 'T');
      put(d.unscheduled, d.date, 'U');
    }
    return { people: [...people].sort(), dates: days.map(d => d.date), cell };
  });

  codeFor(person: string, date: string): string {
    return this.scheduleGrid().cell.get(person)?.[date] ?? '';
  }

  /** Short header label for a date column, e.g. "Mon 1". */
  dayLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short' }) + ' ' + d.getDate();
  }

  names(entries: { name: string }[] | null | undefined): string {
    return (entries ?? []).map(e => e.name).join(', ') || '—';
  }

  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
