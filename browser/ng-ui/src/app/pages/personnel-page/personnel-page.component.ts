import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import {
  PersonnelApiService, PersonnelContact, ShiftDay, ShiftEntry,
  CoverageOpening, CoverageSeatSummary,
} from '../../services/personnel-api.service';
import { PersonnelCacheService } from '../../services/personnel-cache.service';
import { AuthService } from '../../auth/auth.service';
import { GlobalMessageService } from '../../services/global-message.service';
import { PwaChatPanelComponent } from './pwa-chat-panel.component';

type ShiftCode = 'D' | 'N' | 'OCM' | 'P' | 'T' | 'U' | 'L' | 'OFF' | '';

interface MonthPersonRow {
  name: string;
  group: string;                 // canonical group (from first day they appear)
  cells: { date: string; shift: ShiftCode; isWeekend: boolean; isToday: boolean }[];
}

/**
 * PWA Personnel section — Schedule (day + month views), Contacts, and Chat.
 *
 * Schedule tab has two views:
 *   - Day: single-day breakdown by shift (default) with prev/next day nav
 *   - Month: person × day grid across the currently-selected month, with group filter + name
 *     search. Cells are shift-code chips (D/N/OCM/P/T/U) colored per shift; tap a cell to jump
 *     to that day's detail view. Data pulled via getScheduleRange(monthStart, monthEnd).
 *
 * Data fetches from the hub; on network failure the API service transparently falls back to the
 * Supabase mirror.
 */
@Component({
  selector: 'app-personnel-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, PwaChatPanelComponent],
  templateUrl: './personnel-page.component.html',
  styleUrl: './personnel-page.component.css',
})
export class PersonnelPageComponent implements OnInit {
  private api = inject(PersonnelApiService);
  private cache = inject(PersonnelCacheService);

  activeTab = signal<'schedule' | 'contacts' | 'chat'>('schedule');
  scheduleView = signal<'day' | 'month' | 'me' | 'year'>('day');

  private auth = inject(AuthService);
  private msg = inject(GlobalMessageService);

  // ── Day view state ────────────────────────────────────────────────────
  selectedDate = signal<string>(this.todayIso());
  selectedDay = signal<ShiftDay | null>(null);
  onShiftNow = signal<ShiftEntry[]>([]);
  scheduleLoading = signal(false);
  scheduleError = signal<string | null>(null);

  // ── Coverage (help cover a shift) ─────────────────────────────────────
  dayCoverage = signal<CoverageOpening[]>([]);      // open requests on the selected day
  monthCoverage = signal<CoverageSeatSummary[]>([]); // days-with-open-seats across the month
  private mySignups = signal<Set<number>>(new Set()); // coverageRequestIds signed up this session

  /** date → open-seat summary, so the month-grid day headers can badge days that need coverage. */
  monthCoverageByDate = computed(() => {
    const m = new Map<string, CoverageSeatSummary>();
    for (const c of this.monthCoverage()) m.set(c.date, c);
    return m;
  });

  // ── Month view state ──────────────────────────────────────────────────
  monthAnchor = signal<string>(this.firstOfMonth(new Date())); // yyyy-MM-01
  monthDays = signal<ShiftDay[]>([]);
  monthLoading = signal(false);
  monthError = signal<string | null>(null);
  groupFilter = signal<'all' | 'A' | 'B' | 'C' | 'D' | 'Rel' | 'OCM'>('all');
  personSearch = signal<string>('');

  /** Typed group tabs — narrowed so ngModel/signal.set on the click handler stays type-safe. */
  readonly groupTabs = ['A', 'B', 'C', 'D', 'Rel', 'OCM'] as const;

  // ── My Schedule state (personal upcoming shifts + iCal subscribe URL) ─
  myDays = signal<ShiftDay[]>([]);        // last 7 days + next 60
  myLoading = signal(false);
  myError = signal<string | null>(null);
  icalUrl = signal<string | null>(null);
  icalWebcalUrl = signal<string | null>(null);
  icalLoading = signal(false);
  icalCopied = signal(false);

  // ── Year state (12 months × ~30 days) ────────────────────────────────
  yearAnchor = signal<number>(new Date().getFullYear());
  yearDays = signal<ShiftDay[]>([]);
  yearLoading = signal(false);
  yearError = signal<string | null>(null);

  // ── Contacts ──────────────────────────────────────────────────────────
  contacts = signal<PersonnelContact[]>([]);
  contactsLoading = signal(false);
  contactsError = signal<string | null>(null);
  contactsSearch = signal('');

  isViewingToday = computed(() => this.selectedDate() === this.todayIso());
  selectedDateLabel = computed(() => {
    const s = this.selectedDate();
    const today = this.todayIso();
    if (s === today) return 'Today';
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (s === this.isoOf(y)) return 'Yesterday';
    const t = new Date(); t.setDate(t.getDate() + 1);
    if (s === this.isoOf(t)) return 'Tomorrow';
    return new Date(s + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long' });
  });

  monthLabel = computed(() => {
    return new Date(this.monthAnchor() + 'T12:00:00')
      .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  });

  monthDayHeaders = computed(() => {
    // Build one header per day-of-month for the selected month.
    const anchor = new Date(this.monthAnchor() + 'T12:00:00');
    const year = anchor.getFullYear();
    const month = anchor.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const today = this.todayIso();
    const out: { iso: string; day: number; weekday: string; isWeekend: boolean; isToday: boolean }[] = [];
    for (let d = 1; d <= lastDay; d++) {
      const date = new Date(year, month, d);
      const iso = this.isoOf(date);
      const wd = date.getDay(); // 0=Sun, 6=Sat
      out.push({
        iso,
        day: d,
        weekday: date.toLocaleDateString(undefined, { weekday: 'narrow' }),
        isWeekend: wd === 0 || wd === 6,
        isToday: iso === today,
      });
    }
    return out;
  });

  /** Reshape the loaded month data into person-row form. Each unique person becomes one row,
   *  their group is the first non-empty group we see for them, and each cell is the shift code
   *  they land in on that date (or '' = off / not on roster). */
  monthPersonRows = computed<MonthPersonRow[]>(() => {
    const days = this.monthDays();
    const headers = this.monthDayHeaders();
    if (days.length === 0 || headers.length === 0) return [];

    const dayByIso = new Map<string, ShiftDay>();
    for (const d of days) dayByIso.set(d.date, d);

    // First pass: collect every person + their canonical group.
    const groupByName = new Map<string, string>();
    const rememberGroup = (list: ShiftEntry[] | undefined) => {
      if (!list) return;
      for (const e of list) {
        if (!e?.name) continue;
        if (!groupByName.has(e.name) && e.group) groupByName.set(e.name, e.group);
        else if (!groupByName.has(e.name)) groupByName.set(e.name, '');
      }
    };
    for (const d of days) {
      rememberGroup(d.dayShift);
      rememberGroup(d.nightShift);
      rememberGroup(d.pto);
      rememberGroup(d.training);
      rememberGroup(d.unscheduled);
      if (d.onCallManagerName) {
        if (!groupByName.has(d.onCallManagerName)) groupByName.set(d.onCallManagerName, 'OCM');
      }
    }

    // Second pass: for each person, walk each day header, resolve their shift code.
    const rows: MonthPersonRow[] = [];
    for (const [name, group] of groupByName) {
      const cells = headers.map(h => ({
        date: h.iso,
        shift: this.resolveShift(dayByIso.get(h.iso), name, null),
        isWeekend: h.isWeekend,
        isToday: h.isToday,
      }));
      rows.push({ name, group, cells });
    }

    // Sort: group order A,B,C,D,Rel,OCM,other; then by name.
    const groupOrder: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, Rel: 4, OCM: 5 };
    rows.sort((a, b) => {
      const ga = groupOrder[a.group] ?? 99;
      const gb = groupOrder[b.group] ?? 99;
      if (ga !== gb) return ga - gb;
      return a.name.localeCompare(b.name);
    });
    return rows;
  });

  /** Group filter + name search applied to monthPersonRows. */
  filteredMonthRows = computed<MonthPersonRow[]>(() => {
    const gf = this.groupFilter();
    const q = this.personSearch().trim().toLowerCase();
    return this.monthPersonRows().filter(r => {
      if (gf !== 'all' && r.group !== gf) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      return true;
    });
  });

  /** Current user's display name (from AuthService). Null if not signed in — the My view falls
   *  back to a sign-in banner rather than showing an empty list. */
  currentUserName = computed(() => this.auth.currentUser()?.name ?? null);

  /** Current user's hub id. Used as the PRIMARY match key against ShiftEntry.userId so a name
   *  format mismatch (e.g. "Danil Kolakov" vs roster's "Kolakov, Danil W") doesn't drop every
   *  cell in the Mine and Year views. The push side (UserMatchService) resolves names to userIds
   *  at parse time, so if the person is on the roster their id is on every ShiftEntry. */
  currentUserId = computed(() => this.auth.currentUser()?.id ?? null);

  /** For My Schedule — walk the loaded days, extract THIS user's shift on each. */
  mySchedule = computed<{ date: string; iso: string; label: string; shift: ShiftCode; isToday: boolean; isTomorrow: boolean }[]>(() => {
    const name = this.currentUserName();
    const id = this.currentUserId();
    if (!name && id == null) return [];
    const today = this.todayIso();
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowIso = this.isoOf(tomorrow);
    const rows: { date: string; iso: string; label: string; shift: ShiftCode; isToday: boolean; isTomorrow: boolean }[] = [];
    for (const d of this.myDays()) {
      const shift = this.resolveShift(d, name, id);
      const dt = new Date(d.date + 'T12:00:00');
      rows.push({
        date: d.date,
        iso: d.date,
        label: dt.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }),
        shift,
        isToday: d.date === today,
        isTomorrow: d.date === tomorrowIso,
      });
    }
    return rows;
  });

  myUpcomingShifts = computed(() => {
    const today = this.todayIso();
    return this.mySchedule().filter(r => r.iso >= today && r.shift && r.shift !== 'OFF' && r.shift !== 'U').slice(0, 8);
  });

  myNextDaysOff = computed(() => {
    const today = this.todayIso();
    return this.mySchedule().filter(r => r.iso >= today && (!r.shift || r.shift === 'OFF' || r.shift === 'U')).slice(0, 5);
  });

  myMonthStats = computed(() => {
    // Roll-up counts for the CURRENT calendar month only, so the widget shows relevant data.
    const now = new Date();
    const month = now.getMonth();
    const stats: Record<ShiftCode | 'OFF', number> = { D: 0, N: 0, OCM: 0, P: 0, T: 0, U: 0, L: 0, OFF: 0, '': 0 };
    for (const r of this.mySchedule()) {
      const dt = new Date(r.iso + 'T12:00:00');
      if (dt.getMonth() !== month) continue;
      const key = (r.shift || 'OFF') as keyof typeof stats;
      stats[key]++;
    }
    return {
      day: stats.D, night: stats.N, ocm: stats.OCM,
      pto: stats.P, training: stats.T, off: stats.OFF + stats['' as keyof typeof stats] + stats.U,
    };
  });

  /** Year view — build a { monthIdx → { date → shiftCode } } lookup for the signed-in user.
   *  If not signed in, the year view shows a picker for "just show me D/N counts per day". */
  yearGrid = computed(() => {
    const name = this.currentUserName();
    const id = this.currentUserId();
    const signedIn = name != null || id != null;
    const year = this.yearAnchor();
    const days = this.yearDays();
    const map: Record<number, Record<string, ShiftCode>> = {};
    for (let m = 0; m < 12; m++) map[m] = {};
    for (const d of days) {
      const dt = new Date(d.date + 'T12:00:00');
      if (dt.getFullYear() !== year) continue;
      const shift: ShiftCode = signedIn ? this.resolveShift(d, name, id) : this.dominantShift(d);
      map[dt.getMonth()][d.date] = shift;
    }
    return map;
  });

  yearMonthGrids = computed(() => {
    // Precompute all 12 month cell arrays so ngFor can be flat.
    const grid = this.yearGrid();
    const year = this.yearAnchor();
    const today = this.todayIso();
    const out: { month: number; label: string; cells: ({ iso: string; day: number; shift: ShiftCode; isToday: boolean; leadingBlank: boolean; }[]) }[] = [];
    for (let m = 0; m < 12; m++) {
      const first = new Date(year, m, 1);
      const last = new Date(year, m + 1, 0);
      const label = first.toLocaleDateString(undefined, { month: 'short' });
      const cells: { iso: string; day: number; shift: ShiftCode; isToday: boolean; leadingBlank: boolean; }[] = [];
      // Leading blank cells for weekday alignment (0=Sun starts week).
      for (let b = 0; b < first.getDay(); b++) {
        cells.push({ iso: '', day: 0, shift: '', isToday: false, leadingBlank: true });
      }
      for (let d = 1; d <= last.getDate(); d++) {
        const iso = this.isoOf(new Date(year, m, d));
        const shift = (grid[m][iso] ?? '') as ShiftCode;
        cells.push({ iso, day: d, shift, isToday: iso === today, leadingBlank: false });
      }
      out.push({ month: m, label, cells });
    }
    return out;
  });

  // Row counts for the group-filter chips — quick "how many in each group" hint.
  groupCounts = computed(() => {
    const counts: Record<string, number> = { all: 0, A: 0, B: 0, C: 0, D: 0, Rel: 0, OCM: 0 };
    for (const r of this.monthPersonRows()) {
      counts['all']++;
      if (counts[r.group] !== undefined) counts[r.group]++;
    }
    return counts;
  });

  ngOnInit(): void {
    // Cache-first render on Schedule (the default tab).
    const cachedToday = this.cache.readScheduleToday();
    if (cachedToday) this.selectedDay.set(cachedToday.data);
    this.refreshSelectedDate();
  }

  selectTab(tab: 'schedule' | 'contacts' | 'chat'): void {
    this.activeTab.set(tab);
    if (tab === 'contacts' && this.contacts().length === 0) {
      const cached = this.cache.readContacts();
      if (cached) this.contacts.set(cached.data);
      this.refreshContacts();
    }
  }

  setScheduleView(view: 'day' | 'month' | 'me' | 'year'): void {
    this.scheduleView.set(view);
    if (view === 'month' && this.monthDays().length === 0) {
      this.refreshMonth();
    } else if (view === 'me' && this.myDays().length === 0) {
      this.refreshMySchedule();
    } else if (view === 'year' && this.yearDays().length === 0) {
      this.refreshYear();
    }
  }

  // ── My Schedule ───────────────────────────────────────────────────────

  refreshMySchedule(): void {
    this.myLoading.set(true);
    this.myError.set(null);
    // Rolling window: 7 days back for "you finished a shift Y hours ago" context + 52 forward.
    // Server caps a single range call at 60 days (PwaScheduleController.MAX_RANGE_DAYS) so keep
    // the total ≤ 60 — 7 back + 52 forward + today = 60 inclusive.
    const back = new Date(); back.setDate(back.getDate() - 7);
    const fwd  = new Date(); fwd.setDate(fwd.getDate() + 52);
    this.api.getScheduleRange(this.isoOf(back), this.isoOf(fwd)).subscribe({
      next: rows => {
        this.myDays.set(rows.slice().sort((a, b) => a.date.localeCompare(b.date)));
        this.myLoading.set(false);
      },
      error: err => {
        this.myError.set(err?.error?.error ?? 'Could not reach server');
        this.myLoading.set(false);
      },
    });
  }

  loadIcalUrl(): void {
    if (this.icalUrl()) return; // already have it
    this.icalLoading.set(true);
    this.api.getIcalUrl().subscribe({
      next: r => {
        this.icalUrl.set(r.url);
        this.icalWebcalUrl.set(r.subscribeUrl);
        this.icalLoading.set(false);
      },
      error: err => {
        this.myError.set(err?.error?.error ?? 'Could not build calendar subscribe URL');
        this.icalLoading.set(false);
      },
    });
  }

  async copyIcalUrl(): Promise<void> {
    const url = this.icalUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      this.icalCopied.set(true);
      setTimeout(() => this.icalCopied.set(false), 2500);
    } catch {
      // Non-secure context or permission denied — user can still select the visible URL by hand.
    }
  }

  // ── Year view ─────────────────────────────────────────────────────────

  shiftYear(delta: number): void {
    this.yearAnchor.update(y => y + delta);
    this.refreshYear();
  }

  jumpToCurrentYear(): void {
    this.yearAnchor.set(new Date().getFullYear());
    this.refreshYear();
  }

  refreshYear(): void {
    const y = this.yearAnchor();
    this.yearLoading.set(true);
    this.yearError.set(null);
    this.api.getScheduleYear(y).subscribe({
      next: rows => {
        this.yearDays.set(rows);
        this.yearLoading.set(false);
      },
      error: err => {
        this.yearDays.set([]);
        this.yearError.set(err?.error?.error ?? 'Could not reach server');
        this.yearLoading.set(false);
      },
    });
  }

  /** Jump from a year-grid cell back to that day's detail. */
  jumpToDateFromYear(iso: string): void {
    if (!iso) return;
    this.selectedDate.set(iso);
    this.scheduleView.set('day');
    this.refreshSelectedDate();
  }

  /** Jump from a month header in the year view to Month view on that month. */
  jumpToMonthFromYear(monthIdx: number): void {
    const iso = this.isoOf(new Date(this.yearAnchor(), monthIdx, 1));
    this.monthAnchor.set(iso);
    this.scheduleView.set('month');
    this.refreshMonth();
  }

  /** When no user is signed in, the year view colors cells by the dominant shift kind of the day
   *  (Day if anyone was on days, else Night if anyone was on nights, else '' for empty). Rough
   *  visualisation of "when was the plant running which shift". */
  private dominantShift(day: ShiftDay): ShiftCode {
    if (day.dayShift && day.dayShift.length > 0) return 'D';
    if (day.nightShift && day.nightShift.length > 0) return 'N';
    if (day.onCallManagerName) return 'OCM';
    return '';
  }

  // ── Day view ──────────────────────────────────────────────────────────

  shiftDay(deltaDays: number): void {
    const cur = new Date(this.selectedDate() + 'T12:00:00');
    cur.setDate(cur.getDate() + deltaDays);
    this.selectedDate.set(this.isoOf(cur));
    this.refreshSelectedDate();
  }

  jumpToToday(): void {
    this.selectedDate.set(this.todayIso());
    this.refreshSelectedDate();
  }

  refreshSelectedDate(): void {
    const date = this.selectedDate();
    this.scheduleLoading.set(true);
    this.scheduleError.set(null);

    if (date === this.todayIso()) {
      this.api.getScheduleToday().subscribe({
        next: dto => {
          this.selectedDay.set(dto);
          if (dto) this.cache.writeScheduleToday(dto);
          this.scheduleLoading.set(false);
        },
        error: err => {
          this.scheduleError.set(err?.error?.error ?? 'Could not reach server (showing cached data)');
          this.scheduleLoading.set(false);
        },
      });
      this.api.getOnShiftNow().subscribe({
        next: entries => this.onShiftNow.set(entries),
        error: () => { /* covered by scheduleError */ },
      });
    } else {
      this.onShiftNow.set([]);
      this.api.getScheduleRange(date, date).subscribe({
        next: rows => {
          this.selectedDay.set(rows[0] ?? null);
          this.scheduleLoading.set(false);
        },
        error: err => {
          this.selectedDay.set(null);
          this.scheduleError.set(err?.error?.error ?? 'Could not reach server');
          this.scheduleLoading.set(false);
        },
      });
    }
    this.refreshDayCoverage();
  }

  // ── Coverage: help cover a shift ──────────────────────────────────────

  /** Coverage read/signup is gated PLANT/ADMIN/KIOSK server-side; only surface it to plant users. */
  coverageEnabled(): boolean { return this.auth.isPlant(); }

  /** Load the open coverage requests for the currently-selected day. */
  refreshDayCoverage(): void {
    if (!this.coverageEnabled()) { this.dayCoverage.set([]); return; }
    this.api.getCoverageForDay(this.selectedDate()).subscribe({
      next: rows => this.dayCoverage.set(rows.filter(r => (r.openForDate ?? 0) > 0)),
      error: () => this.dayCoverage.set([]),   // hub unreachable / not permitted → just hide the section
    });
  }

  /** Load which days in the current month have open seats — the month-view discovery strip. */
  refreshMonthCoverage(): void {
    if (!this.coverageEnabled()) { this.monthCoverage.set([]); return; }
    const anchor = new Date(this.monthAnchor() + 'T12:00:00');
    const first = this.isoOf(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    const last = this.isoOf(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
    this.api.getOpenCoverage(first, last).subscribe({
      next: rows => this.monthCoverage.set(rows.filter(r => r.dayOpen > 0 || r.nightOpen > 0)),
      error: () => this.monthCoverage.set([]),
    });
  }

  signUpForCoverage(c: CoverageOpening): void {
    if (c.id == null) return;
    this.msg.showLoading('Signing you up…');
    this.api.signUpForCoverage(c.id, this.selectedDate()).subscribe({
      next: () => {
        this.mySignups.update(s => new Set(s).add(c.id));
        this.msg.showSuccess("You're signed up — a manager will approve it.");
        this.refreshDayCoverage();
      },
      error: err => this.msg.showError(err?.error?.error ?? 'Could not sign up. Try again.'),
    });
  }

  alreadyRequested(c: CoverageOpening): boolean { return c.id != null && this.mySignups().has(c.id); }
  coverageShiftLabel(c: CoverageOpening): string { return c.shift === 'NIGHT' ? 'Night' : 'Day'; }
  coverageReasonLabel(c: CoverageOpening): string {
    switch (c.reason) {
      case 'PTO_COVERAGE': return 'PTO coverage';
      case 'OUTAGE': return 'Outage';
      default: return 'Extra coverage';
    }
  }

  // ── Month view ────────────────────────────────────────────────────────

  shiftMonth(deltaMonths: number): void {
    const cur = new Date(this.monthAnchor() + 'T12:00:00');
    cur.setMonth(cur.getMonth() + deltaMonths);
    this.monthAnchor.set(this.firstOfMonth(cur));
    this.refreshMonth();
  }

  jumpToCurrentMonth(): void {
    this.monthAnchor.set(this.firstOfMonth(new Date()));
    this.refreshMonth();
  }

  refreshMonth(): void {
    const anchor = new Date(this.monthAnchor() + 'T12:00:00');
    const first = this.isoOf(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    const last = this.isoOf(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0));
    this.monthLoading.set(true);
    this.monthError.set(null);
    this.api.getScheduleRange(first, last).subscribe({
      next: rows => {
        this.monthDays.set(rows);
        this.monthLoading.set(false);
      },
      error: err => {
        this.monthDays.set([]);
        this.monthError.set(err?.error?.error ?? 'Could not reach server');
        this.monthLoading.set(false);
      },
    });
    this.refreshMonthCoverage();
  }

  /** Jump from a cell in the month grid back to the day-detail view for that date. */
  jumpToDate(iso: string): void {
    this.selectedDate.set(iso);
    this.scheduleView.set('day');
    this.refreshSelectedDate();
  }

  /** Find the shift code for a given person on a given ShiftDay by walking each bucket. Matches
   *  on userId FIRST (exact, guaranteed by UserMatchService on the push side), then falls back
   *  to a normalised name match — the roster stores "Kolakov, Danil W" but AuthService returns
   *  "Danil Kolakov", so raw string equality would drop every cell. */
  private resolveShift(day: ShiftDay | undefined, personName: string | null, userId: number | null): ShiftCode {
    if (!day) return '';
    const targetName = this.normalizeName(personName);
    const hit = (list: ShiftEntry[] | undefined) => list?.some(e => this.entryMatchesMe(e, targetName, userId));
    if (this.ocmMatchesMe(day, targetName, userId)) return 'OCM';
    if (hit(day.dayShift)) return 'D';
    if (hit(day.nightShift)) return 'N';
    if (hit(day.training)) return 'T';
    if (hit(day.pto)) return 'P';
    if (hit(day.unscheduled)) return 'U';
    return '';
  }

  private entryMatchesMe(e: ShiftEntry | undefined, targetName: string, userId: number | null): boolean {
    if (!e) return false;
    if (userId != null && e.userId != null && e.userId === userId) return true;
    if (targetName && e.name && this.normalizeName(e.name) === targetName) return true;
    return false;
  }

  private ocmMatchesMe(day: ShiftDay, targetName: string, userId: number | null): boolean {
    if (userId != null && day.onCallManagerUserId != null && day.onCallManagerUserId === userId) return true;
    if (targetName && day.onCallManagerName && this.normalizeName(day.onCallManagerName) === targetName) return true;
    return false;
  }

  /** Normalise a name for cross-format matching: strip case, punctuation, middle initials, and
   *  reorder "Last, First" → "First Last" so it lines up with app-side display names. Returns a
   *  space-collapsed lowercase key like "danil kolakov". Empty string on null/blank input. */
  private normalizeName(raw: string | null | undefined): string {
    if (!raw) return '';
    let s = raw.trim().toLowerCase();
    // "Kolakov, Danil W" → "Danil W Kolakov"
    const comma = s.indexOf(',');
    if (comma > 0) {
      const last = s.substring(0, comma).trim();
      const rest = s.substring(comma + 1).trim();
      s = rest + ' ' + last;
    }
    // Strip standalone single-letter tokens (middle initials — with or without trailing period).
    s = s.replace(/\b[a-z]\.?(?=\s|$)/g, '');
    // Collapse whitespace + drop remaining punctuation.
    s = s.replace(/[.,]/g, '').replace(/\s+/g, ' ').trim();
    return s;
  }

  shiftLabel(code: ShiftCode): string {
    switch (code) {
      case 'D': return 'Day';
      case 'N': return 'Night';
      case 'OCM': return 'On Call';
      case 'P': return 'PTO';
      case 'T': return 'Training';
      case 'L': return 'Leads Meeting';
      case 'U': return 'Unscheduled';
      case 'OFF': return 'Off';
      default: return 'Off';
    }
  }

  // ── Contacts ──────────────────────────────────────────────────────────

  refreshContacts(): void {
    this.contactsLoading.set(true);
    this.contactsError.set(null);
    this.api.getContacts().subscribe({
      next: rows => {
        this.contacts.set(rows);
        this.cache.writeContacts(rows);
        this.contactsLoading.set(false);
      },
      error: err => {
        this.contactsError.set(err?.error?.error ?? 'Could not reach server (showing cached data)');
        this.contactsLoading.set(false);
      },
    });
  }

  filteredContacts(): PersonnelContact[] {
    const q = this.contactsSearch().trim().toLowerCase();
    if (!q) return this.contacts();
    return this.contacts().filter(c =>
      (c.name && c.name.toLowerCase().includes(q))
      || (c.title && c.title.toLowerCase().includes(q))
      || (c.phone && c.phone.toLowerCase().includes(q))
      || (c.company && c.company.toLowerCase().includes(q))
      || (c.emergencyContact && c.emergencyContact.toLowerCase().includes(q))
    );
  }

  // ── Date helpers ──────────────────────────────────────────────────────

  private todayIso(): string { return this.isoOf(new Date()); }
  private isoOf(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  }
  private firstOfMonth(d: Date): string {
    return this.isoOf(new Date(d.getFullYear(), d.getMonth(), 1));
  }
}
