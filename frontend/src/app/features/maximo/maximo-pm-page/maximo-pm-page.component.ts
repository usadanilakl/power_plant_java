import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoPmApiService } from '../../../services/maximo/maximo-pm-api.service';
import {
  PmPendingAssignment,
  RecurrenceCadence,
  RecurringPm,
  ShiftDay,
  ShiftEntry,
  ShiftPreference
} from '../../../models/maximo/pm.models';

type Tab = 'catalog' | 'assignments' | 'schedule';

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
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './maximo-pm-page.component.html',
  styleUrl: './maximo-pm-page.component.css'
})
export class MaximoPmPageComponent implements OnInit {
  private api = inject(MaximoPmApiService);

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

  // Assignments
  pending = signal<PmPendingAssignment[]>([]);
  pendingLoaded = signal(false);
  recurringOnly = signal(true);
  visiblePending = computed(() =>
    this.recurringOnly() ? this.pending().filter(p => p.recurring) : this.pending());
  /** chosen assignee personid per WO href (defaults to the proposal). */
  assignee: Record<string, string> = {};
  approving = signal(false);

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
      this.catalog.set(await firstValueFrom(this.api.getCatalog()));
      this.catalogLoaded.set(true);
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
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

  /** Persist the row's current shift/cadence/preferred-day; the dropdowns update the pm object first. */
  async saveClassification(pm: RecurringPm) {
    try {
      const updated = await firstValueFrom(
        this.api.classify(pm.id, pm.shift, pm.cadence, pm.preferredDayOfWeek));
      this.catalog.update(list => list.map(r => r.id === pm.id ? updated : r));
    } catch (e: any) { this.error.set(this.msg(e)); }
  }

  // ── Assignments ─────────────────────────────────────────────────────────
  async loadPending() {
    this.loading.set(true); this.error.set(null);
    try {
      const rows = await firstValueFrom(this.api.getPending());
      this.pending.set(rows);
      for (const r of rows) this.assignee[r.href] = r.proposedPersonid ?? '';
      this.pendingLoaded.set(true);
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  async approve(row: PmPendingAssignment) {
    await this.doAssign([row]);
  }

  async approveAll() {
    await this.doAssign(this.visiblePending());
  }

  private async doAssign(rows: PmPendingAssignment[]) {
    if (!rows.length || this.approving()) return;
    this.approving.set(true); this.error.set(null); this.info.set(null);
    try {
      const items = rows.map(r => ({ href: r.href, personid: this.assignee[r.href] || undefined }));
      const res = await firstValueFrom(this.api.assign({ items, memo: 'PM auto-assignment' }));
      this.info.set(`Approved ${res.approved}${res.errors?.length ? `, ${res.errors.length} failed` : ''}`);
      if (res.errors?.length) this.error.set(res.errors.map(e => e.error).join('; '));
      await this.loadPending();
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.approving.set(false); }
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
