import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import {
  ScheduleV2ApiService, SchedulePosition, CrewRotation, Crew, CrewAssignment,
  ScheduleEvent, AssignableUser, CoverageRequest, CoverageSignup, ShiftDayView, ShiftEntryView, OnCallRotation,
  PtoRequest, ReliefRotation, ScheduleDayOverride, EligibilityDetail, CrewShiftOverride,
} from '../../../services/schedule-v2-api.service';

type Tab = 'positions' | 'rotations' | 'crews' | 'staffing' | 'events' | 'coverage' | 'schedule' | 'oncall' | 'pto' | 'relief' | 'outages';

/**
 * Schedule v2 manager build tools (admin-gated). Positions → Rotations → Crews → Staffing, plus
 * Events and Coverage. Crew-level rotation (whole crew shares a shift per day); positions are
 * configurable labels; non-rotating day staff + Relief are FIXED/RELIEF staffing assignments.
 * Every save re-materialises ShiftDay server-side (no-op while the flag is off).
 */
@Component({
  selector: 'app-schedule-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './schedule-builder.component.html',
  styleUrl: './schedule-builder.component.css',
})
export class ScheduleBuilderComponent implements OnInit {
  private api = inject(ScheduleV2ApiService);

  readonly SHIFTS = ['', 'D', 'N', 'O'];
  readonly EVENT_TYPES = ['HOLIDAY', 'MEETING', 'PAY_PERIOD_START', 'OUTAGE', 'TRAINING_MANDATORY', 'LEADS_MEETING'];
  readonly SHIFT_AFFINITY = ['BOTH', 'DAY', 'NIGHT'];
  readonly ASSIGNMENT_TYPES = ['ROTATING', 'FIXED', 'RELIEF'];
  readonly FIXED_SHIFTS = ['D', 'N'];
  // Day-staff shift templates — pick one to fill the FIXED fields in a click; "custom" reveals the
  // manual weekday checkboxes (per-person off-days) unchanged.
  readonly FIXED_TEMPLATES = [
    { key: '4x10-mon-thu', label: '4×10 · Mon–Thu', shift: 'D', days: 'MON,TUE,WED,THU' },
    { key: '4x10-tue-fri', label: '4×10 · Tue–Fri', shift: 'D', days: 'TUE,WED,THU,FRI' },
    { key: '5x8-mon-fri',  label: '5×8 · Mon–Fri',  shift: 'D', days: 'MON,TUE,WED,THU,FRI' },
    { key: 'custom',       label: 'Custom…',         shift: '',  days: '' },
  ];
  readonly DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  readonly COVERAGE_SHIFTS = ['DAY', 'NIGHT'];
  readonly COVERAGE_REASONS = ['MANUAL', 'OUTAGE', 'PTO_COVERAGE'];

  activeTab = signal<Tab>('positions');
  active = signal<boolean>(false);
  /** Days before this (yyyy-MM-dd) are locked/frozen — schedule.v2.lock-before-days. The grid greys
   *  them out and blocks the override modal on those date headers. */
  earliestEditable = signal<string | null>(null);
  message = signal<string | null>(null);
  loading = signal(false);
  /** Set around read-only list/preview fetches (reloadAll/loadPreview/loadOnCall/loadRelief/loadPto) —
   *  distinct from `loading`, which gates mutation buttons. Lets empty-state text tell "still loading"
   *  from "genuinely nothing here". */
  fetching = signal(false);

  positions = signal<SchedulePosition[]>([]);
  rotations = signal<CrewRotation[]>([]);
  crews = signal<Crew[]>([]);
  assignments = signal<CrewAssignment[]>([]);
  events = signal<ScheduleEvent[]>([]);
  users = signal<AssignableUser[]>([]);
  coverage = signal<CoverageRequest[]>([]);
  signups = signal<CoverageSignup[]>([]);
  previewDays = signal<ShiftDayView[]>([]);
  scheduleView = signal<'grid' | 'table'>('grid');
  gridSelectedGroups = signal<Set<string>>(new Set());   // empty = show all groups; else the toggled-on set
  gridSearch = signal<string>('');

  // Coverage-needs rows: Ops is split by position (Lead/CRO/AO) with the cover-up hierarchy; others single.
  readonly COVERAGE_ROWS = [
    { disc: 'OPS', pos: 'LEAD', label: 'Ops · Lead' },
    { disc: 'OPS', pos: 'CRO', label: 'Ops · CRO' },
    { disc: 'OPS', pos: 'AO', label: 'Ops · AO' },
    { disc: 'MECHANIC', pos: null as string | null, label: 'Mechanic' },
    { disc: 'IC', pos: null as string | null, label: 'I&C' },
    { disc: 'MANAGER', pos: null as string | null, label: 'Manager' },
  ];
  // Grid overlays: one selectable band under the date headers on top of the always-visible roster.
  // Extensible — add a key here + a <tbody> in the template to introduce a new view later.
  readonly GRID_OVERLAYS = [
    { key: 'none', label: 'Schedule', icon: '📅' },
    { key: 'coverage', label: 'Coverage needed', icon: '🆘' },
    { key: 'signups', label: 'Sign-ups', icon: '✋' },
    { key: 'events', label: 'Events', icon: '📌' },
  ] as const;
  gridOverlay = signal<'none' | 'coverage' | 'signups' | 'events'>('none');
  private coverageNeeds = signal<Record<string, number>>({});    // TOTAL required per cell (menu ranges + inline)
  private coverageInline = signal<Record<string, number>>({});   // the editable single-day MANUAL portion per cell

  // Sign-ups overlay: all signups across the visible month, filtered per cell.
  monthSignups = signal<CoverageSignup[]>([]);
  // Per-person/per-shift open-seat counts across the visible month — the roster grid's seat marker.
  monthSeats = signal<EligibilityDetail[]>([]);
  // Manual per-day overrides (per-day dialog).
  monthOverrides = signal<ScheduleDayOverride[]>([]);
  overrideModalDate = signal<string | null>(null);
  overrideForm: { userId?: number; shift: string; reason: string } = { userId: undefined, shift: 'OFF', reason: '' };
  readonly OVERRIDE_CODES = [
    { code: 'D', label: 'Day' }, { code: 'N', label: 'Night' }, { code: 'OCM', label: 'On-call mgr' },
    { code: 'P', label: 'PTO' }, { code: 'T', label: 'Training' }, { code: 'L', label: 'Light duty' },
    { code: 'OFF', label: 'Off' },
  ];
  previewYear = new Date().getFullYear();
  previewMonth = new Date().getMonth();
  editingOnCall: OnCallRotation | null = null;
  newManagerId?: number;

  readonly RELIEF_SLOTS = ['REL', 'A', 'B', 'C', 'D'];
  reliefRotations = signal<ReliefRotation[]>([]);
  editingRelief: ReliefRotation | null = null;
  newReliefMemberId?: number;

  // Outages — temporary per-crew shift pins for a date window (crews hold a shift, no rotation switching).
  crewShiftOverrides = signal<CrewShiftOverride[]>([]);
  readonly OUTAGE_SHIFTS = [
    { code: '', label: '— (rotation)' }, { code: 'D', label: 'Day' }, { code: 'N', label: 'Night' }, { code: 'OFF', label: 'Off' },
  ];
  /** Draft outage: a shared window + label, plus a per-crew shift pick ('' = leave the crew on its rotation). */
  editingOutage: { label: string; startDate?: string; endDate?: string; crewShifts: Record<number, string> } | null = null;

  readonly PTO_STATUSES = ['PENDING_MANUAL_REVIEW', 'PENDING', 'APPROVED', 'REJECTED', ''];
  ptoRequests = signal<PtoRequest[]>([]);
  ptoStatusFilter = signal<string>('PENDING_MANUAL_REVIEW');
  ptoAssign: Record<number, number> = {};   // ptoId → user id chosen in the assign dropdown

  editingPosition: SchedulePosition | null = null;
  editingRotation: CrewRotation | null = null;
  editingCrew: Crew | null = null;
  editingAssignment: CrewAssignment | null = null;
  editingEvent: ScheduleEvent | null = null;
  editingCoverage: CoverageRequest | null = null;
  selectedCoverage: CoverageRequest | null = null;

  ngOnInit(): void {
    this.reloadAll();
    this.api.status().subscribe(r => {
      this.active.set(!!r.responseData?.active);
      this.earliestEditable.set(r.responseData?.earliestEditable ?? null);
    });
  }

  /** Whether a yyyy-MM-dd date is in the locked past (frozen — no edits). ISO strings sort chronologically. */
  isDateLocked(date?: string | null): boolean {
    const lock = this.earliestEditable();
    return !!date && !!lock && date < lock;
  }

  reloadAll(): void {
    this.fetching.set(true);
    forkJoin({
      positions: this.api.listPositions(),
      rotations: this.api.listRotations(),
      crews: this.api.listCrews(),
      assignments: this.api.listAssignments(),
      events: this.api.listEvents(),
      users: this.api.assignableUsers(),
      coverage: this.api.listCoverage(),
    }).subscribe({
      next: r => {
        this.positions.set(r.positions.responseData ?? []);
        this.rotations.set(r.rotations.responseData ?? []);
        this.crews.set(r.crews.responseData ?? []);
        this.assignments.set(r.assignments.responseData ?? []);
        this.events.set(r.events.responseData ?? []);
        this.users.set(r.users.responseData ?? []);
        this.coverage.set(r.coverage.responseData ?? []);
        this.fetching.set(false);
      },
      error: e => { this.fetching.set(false); this.flash('Load failed: ' + this.errText(e)); },
    });
  }

  setTab(t: Tab): void {
    this.activeTab.set(t);
    if (t === 'schedule') this.loadPreview();
    if (t === 'oncall') this.loadOnCall();
    if (t === 'pto') this.loadPto();
    if (t === 'relief') this.loadRelief();
    if (t === 'outages') this.loadOutages();
  }
  private flash(m: string): void { this.message.set(m); setTimeout(() => this.message.set(null), 3500); }
  private errText(e: any): string { return e?.error?.message ?? e?.message ?? 'error'; }
  activePositionNames(): string[] { return this.positions().filter(p => p.isActive !== false).map(p => p.name); }

  // ---- positions ----
  newPosition(): void { this.editingPosition = { name: '', color: '#42A5F5', isActive: true }; }
  editPosition(p: SchedulePosition): void { this.editingPosition = { ...p }; }
  cancelPosition(): void { this.editingPosition = null; }
  savePosition(): void {
    if (!this.editingPosition) return;
    this.loading.set(true);
    this.api.savePosition(this.editingPosition).subscribe({
      next: () => { this.editingPosition = null; this.loading.set(false); this.flash('Position saved'); this.reloadAll(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  deletePosition(p: SchedulePosition): void {
    if (!p.id || !confirm(`Delete position "${p.name}"?`)) return;
    this.api.deletePosition(p.id).subscribe({
      next: () => { this.flash('Deleted'); this.reloadAll(); },
      error: e => this.flash('Delete failed: ' + this.errText(e)),
    });
  }

  // ---- rotations ----
  newRotation(): void { this.editingRotation = { name: '', color: '#42A5F5', patternLengthDays: 28, cells: [], isActive: true }; }
  editRotation(r: CrewRotation): void { this.editingRotation = { ...r, cells: (r.cells ?? []).map(c => ({ ...c })) }; }
  cancelRotation(): void { this.editingRotation = null; }
  dayRange(): number[] {
    const n = this.editingRotation?.patternLengthDays ?? 0;
    return Array.from({ length: Math.max(0, Math.min(60, n)) }, (_, i) => i);
  }
  cellShift(day: number): string { return this.editingRotation?.cells.find(c => c.dayIndex === day)?.shift ?? ''; }
  setCell(day: number, shift: string): void {
    if (!this.editingRotation) return;
    const cells = this.editingRotation.cells;
    const idx = cells.findIndex(c => c.dayIndex === day);
    if (!shift) { if (idx >= 0) cells.splice(idx, 1); return; }
    if (idx >= 0) cells[idx].shift = shift; else cells.push({ dayIndex: day, shift });
  }
  saveRotation(): void {
    if (!this.editingRotation) return;
    const n = this.editingRotation.patternLengthDays ?? 0;
    this.editingRotation.cells = this.editingRotation.cells.filter(c => c.dayIndex < n);
    this.loading.set(true);
    this.api.saveRotation(this.editingRotation).subscribe({
      next: () => { this.editingRotation = null; this.loading.set(false); this.flash('Rotation saved'); this.reloadAll(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  deleteRotation(r: CrewRotation): void {
    if (!r.id || !confirm(`Delete rotation "${r.name}"?`)) return;
    this.api.deleteRotation(r.id).subscribe({
      next: () => { this.flash('Deleted'); this.reloadAll(); },
      error: e => this.flash('Delete failed: ' + this.errText(e)),
    });
  }

  // ---- crews ----
  newCrew(): void { this.editingCrew = { name: '', offsetDays: 0, color: '#42A5F5', isActive: true }; }
  editCrew(c: Crew): void { this.editingCrew = { ...c }; }
  cancelCrew(): void { this.editingCrew = null; }
  saveCrew(): void {
    if (!this.editingCrew) return;
    this.loading.set(true);
    this.api.saveCrew(this.editingCrew).subscribe({
      next: () => { this.editingCrew = null; this.loading.set(false); this.flash('Crew saved'); this.reloadAll(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  deleteCrew(c: Crew): void {
    if (!c.id || !confirm(`Delete crew "${c.name}"?`)) return;
    this.api.deleteCrew(c.id).subscribe({
      next: () => { this.flash('Deleted'); this.reloadAll(); },
      error: e => this.flash('Delete failed: ' + this.errText(e)),
    });
  }
  // crew rotation offset picker (click a rotation day instead of typing a number)
  selectedRotation(): CrewRotation | undefined {
    return this.rotations().find(r => r.id === this.editingCrew?.rotationId);
  }
  offsetRange(): number[] {
    const n = this.selectedRotation()?.patternLengthDays ?? 0;
    return Array.from({ length: Math.max(0, Math.min(60, n)) }, (_, i) => i);
  }
  rotationShiftAt(dayIndex: number): string {
    return this.selectedRotation()?.cells.find(c => c.dayIndex === dayIndex)?.shift ?? '';
  }
  pickOffset(k: number): void { if (this.editingCrew) this.editingCrew.offsetDays = k; }

  // ---- staffing ----
  /** Selected FIXED shift-template key ('custom' reveals the manual weekday controls). */
  fixedTemplateSel = signal<string>('custom');
  newAssignment(): void { this.editingAssignment = { assignmentType: 'ROTATING', position: '', isActive: true }; this.fixedTemplateSel.set('custom'); }
  editAssignment(a: CrewAssignment): void { this.editingAssignment = { ...a }; this.fixedTemplateSel.set(this.currentFixedTemplate()); }
  onFixedTemplateChange(key: string): void { this.fixedTemplateSel.set(key); this.applyFixedTemplate(key); }
  cancelAssignment(): void { this.editingAssignment = null; }
  hasDow(day: string): boolean {
    const csv = this.editingAssignment?.fixedDaysOfWeek ?? '';
    return csv.split(',').map(s => s.trim()).includes(day);
  }
  toggleDow(day: string): void {
    if (!this.editingAssignment) return;
    const set = (this.editingAssignment.fixedDaysOfWeek ?? '').split(',').map(s => s.trim()).filter(Boolean);
    const i = set.indexOf(day);
    if (i >= 0) set.splice(i, 1); else set.push(day);
    this.editingAssignment.fixedDaysOfWeek = this.DOW.filter(d => set.includes(d)).join(',');
  }
  /** Which FIXED template matches the current shift + weekdays (drives the dropdown), else 'custom'. */
  currentFixedTemplate(): string {
    const a = this.editingAssignment;
    if (!a) return 'custom';
    const days = (a.fixedDaysOfWeek ?? '').split(',').map(s => s.trim()).filter(Boolean).sort().join(',');
    const t = this.FIXED_TEMPLATES.find(x => x.key !== 'custom' && x.shift === (a.fixedShift ?? '')
      && x.days.split(',').sort().join(',') === days);
    return t?.key ?? 'custom';
  }
  applyFixedTemplate(key: string): void {
    const t = this.FIXED_TEMPLATES.find(x => x.key === key);
    if (!t || !this.editingAssignment || t.key === 'custom') return;   // custom = leave fields, show manual controls
    this.editingAssignment.fixedShift = t.shift;
    this.editingAssignment.fixedDaysOfWeek = t.days;
  }
  saveAssignment(): void {
    if (!this.editingAssignment) return;
    this.loading.set(true);
    this.api.saveAssignment(this.editingAssignment).subscribe({
      next: () => { this.editingAssignment = null; this.loading.set(false); this.flash('Assignment saved'); this.reloadAll(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  deleteAssignment(a: CrewAssignment): void {
    if (!a.id || !confirm('Delete this assignment?')) return;
    this.api.deleteAssignment(a.id).subscribe({
      next: () => { this.flash('Deleted'); this.reloadAll(); },
      error: e => this.flash('Delete failed: ' + this.errText(e)),
    });
  }
  seedFromSchedule(): void {
    if (!confirm('Seed staffing (crews A–D + relief) from the current schedule?\nSafe to run — users who already have an active assignment are skipped.')) return;
    this.loading.set(true);
    this.api.seedInitial().subscribe({
      next: r => {
        this.loading.set(false);
        const d = r.responseData;
        const notes = d?.notes?.length ? ` — ${d.notes.join('; ')}` : '';
        const msg = (d?.created ?? 0) === 0
          ? `Already staffed — nothing added (${d?.skipped ?? 0} skipped)${notes}`
          : `Seeded: ${d?.created} created, ${d?.skipped ?? 0} skipped${notes}`;
        this.flash(msg);
        this.reloadAll();
      },
      error: e => { this.loading.set(false); this.flash('Seed failed: ' + this.errText(e)); },
    });
  }

  // ---- events ----
  newEvent(): void { this.editingEvent = { eventType: 'HOLIDAY', appliesToShift: 'BOTH', color: '#EF5350' }; }
  editEvent(e: ScheduleEvent): void { this.editingEvent = { ...e }; }
  cancelEvent(): void { this.editingEvent = null; }
  saveEvent(): void {
    if (!this.editingEvent) return;
    this.loading.set(true);
    this.api.saveEvent(this.editingEvent).subscribe({
      next: () => { this.editingEvent = null; this.loading.set(false); this.flash('Event saved'); this.reloadAll(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  deleteEvent(e: ScheduleEvent): void {
    if (!e.id || !confirm('Delete this event?')) return;
    this.api.deleteEvent(e.id).subscribe({
      next: () => { this.flash('Deleted'); this.reloadAll(); },
      error: e2 => this.flash('Delete failed: ' + this.errText(e2)),
    });
  }

  // ---- coverage ----
  newCoverage(): void { this.editingCoverage = { shift: 'DAY', requiredCount: 1, reason: 'MANUAL' }; this.selectedCoverage = null; }
  cancelCoverageEdit(): void { this.editingCoverage = null; }
  saveCoverage(): void {
    if (!this.editingCoverage) return;
    this.loading.set(true);
    this.api.createCoverage(this.editingCoverage).subscribe({
      next: () => { this.editingCoverage = null; this.loading.set(false); this.flash('Coverage created'); this.reloadAll(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  cancelCoverageReq(c: CoverageRequest): void {
    if (!c.id || !confirm('Cancel this coverage request?')) return;
    this.api.cancelCoverage(c.id).subscribe({
      next: () => {
        this.flash('Cancelled');
        if (this.selectedCoverage?.id === c.id) this.closeSignups();
        this.reloadAll();
      },
      error: e => this.flash('Delete failed: ' + this.errText(e)),
    });
  }
  viewSignups(c: CoverageRequest): void { this.selectedCoverage = c; this.editingCoverage = null; this.refreshSignups(); }
  closeSignups(): void { this.selectedCoverage = null; this.signups.set([]); }
  approveSignup(s: CoverageSignup): void {
    if (!s.id) return;
    this.api.approveSignup(s.id).subscribe({
      next: () => { this.flash('Approved'); this.refreshSignups(); this.reloadAll(); },
      error: e => this.flash('Approve failed: ' + this.errText(e)),
    });
  }
  rejectSignup(s: CoverageSignup): void {
    if (!s.id) return;
    this.api.rejectSignup(s.id).subscribe({
      next: () => { this.flash('Rejected'); this.refreshSignups(); this.reloadAll(); },
      error: e => this.flash('Reject failed: ' + this.errText(e)),
    });
  }
  private refreshSignups(): void {
    const id = this.selectedCoverage?.id;
    if (id) this.api.listSignups(id).subscribe(r => this.signups.set(r.responseData ?? []));
  }

  // ---- on-call ----
  loadOnCall(): void {
    this.fetching.set(true);
    this.api.listOnCall().subscribe({
      next: r => {
        const list = r.responseData ?? [];
        this.editingOnCall = list.length
          ? { ...list[0], memberUserIds: [...(list[0].memberUserIds ?? [])] }
          : { name: 'On-Call Managers', daysPerTurn: 7, memberUserIds: [], isActive: true };
        this.fetching.set(false);
      },
      error: e => { this.fetching.set(false); this.flash('Load failed: ' + this.errText(e)); },
    });
  }
  addManager(id?: number): void {
    if (!this.editingOnCall || id == null) return;
    this.editingOnCall.memberUserIds = this.editingOnCall.memberUserIds ?? [];
    if (!this.editingOnCall.memberUserIds.includes(id)) this.editingOnCall.memberUserIds.push(id);
  }
  removeManager(i: number): void { this.editingOnCall?.memberUserIds?.splice(i, 1); }
  moveManager(i: number, dir: number): void {
    const arr = this.editingOnCall?.memberUserIds;
    if (!arr) return;
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  userName(id: number): string { return this.users().find(u => u.id === id)?.name ?? ('User ' + id); }
  saveOnCall(): void {
    if (!this.editingOnCall) return;
    this.loading.set(true);
    this.api.saveOnCall(this.editingOnCall).subscribe({
      next: () => { this.loading.set(false); this.flash('On-call rotation saved'); this.loadOnCall(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }

  // ---- relief-swap rotation ----
  loadRelief(): void {
    this.fetching.set(true);
    this.api.listRelief().subscribe({
      next: r => { this.reliefRotations.set(r.responseData ?? []); this.fetching.set(false); },
      error: e => { this.fetching.set(false); this.flash('Load failed: ' + this.errText(e)); },
    });
  }
  newRelief(): void {
    this.editingRelief = {
      name: 'Relief', position: 'Lead', periodMonths: 3,
      anchorDate: this.todayIso(), reliefDaysOfWeek: 'MON,TUE,WED,THU,FRI',
      lineOrder: [], initialSlots: {}, isActive: true,
    };
  }
  editRelief(r: ReliefRotation): void {
    this.editingRelief = { ...r, lineOrder: [...(r.lineOrder ?? [])], initialSlots: { ...(r.initialSlots ?? {}) } };
  }
  cancelRelief(): void { this.editingRelief = null; }
  addReliefMember(id?: number): void {
    if (!this.editingRelief || id == null) return;
    this.editingRelief.lineOrder = this.editingRelief.lineOrder ?? [];
    if (!this.editingRelief.lineOrder.includes(id)) this.editingRelief.lineOrder.push(id);
  }
  removeReliefMember(i: number): void { this.editingRelief?.lineOrder?.splice(i, 1); }
  moveReliefMember(i: number, dir: number): void {
    const arr = this.editingRelief?.lineOrder;
    if (!arr) return;
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  reliefSlot(slot: string): number | undefined { return this.editingRelief?.initialSlots?.[slot]; }
  setReliefSlot(slot: string, id: any): void {
    if (!this.editingRelief) return;
    this.editingRelief.initialSlots = this.editingRelief.initialSlots ?? {};
    if (id == null || id === '') delete this.editingRelief.initialSlots[slot];
    else this.editingRelief.initialSlots[slot] = Number(id);
  }
  saveRelief(): void {
    if (!this.editingRelief) return;
    this.loading.set(true);
    this.api.saveRelief(this.editingRelief).subscribe({
      next: () => { this.loading.set(false); this.editingRelief = null; this.flash('Relief rotation saved'); this.loadRelief(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  deleteRelief(r: ReliefRotation): void {
    if (r.id == null || !confirm(`Delete "${r.name}"?`)) return;
    this.api.deleteRelief(r.id).subscribe({
      next: () => { this.flash('Deleted'); this.loadRelief(); },
      error: e => this.flash('Delete failed: ' + this.errText(e)),
    });
  }

  // ---- outages (temporary per-crew shift pins) ----
  loadOutages(): void {
    this.fetching.set(true);
    this.api.listCrewShiftOverrides().subscribe({
      next: r => { this.crewShiftOverrides.set(r.responseData ?? []); this.fetching.set(false); },
      error: e => { this.fetching.set(false); this.flash('Load failed: ' + this.errText(e)); },
    });
  }
  newOutage(): void { this.editingOutage = { label: '', startDate: undefined, endDate: undefined, crewShifts: {} }; }
  cancelOutage(): void { this.editingOutage = null; }
  saveOutage(): void {
    const o = this.editingOutage;
    if (!o) return;
    if (!o.startDate || !o.endDate) { this.flash('Pick a start and end date'); return; }
    const rows = this.crews()
      .filter(c => c.id != null && o.crewShifts[c.id!])
      .map(c => this.api.saveCrewShiftOverride({
        label: o.label || 'Outage', startDate: o.startDate, endDate: o.endDate,
        crewId: c.id, shift: o.crewShifts[c.id!], isActive: true,
      }));
    if (!rows.length) { this.flash('Pick a shift for at least one crew'); return; }
    this.loading.set(true);
    forkJoin(rows).subscribe({
      next: () => { this.loading.set(false); this.editingOutage = null; this.flash('Outage saved'); this.loadOutages(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  deleteOutage(o: CrewShiftOverride): void {
    if (o.id == null || !confirm('Remove this crew pin?')) return;
    this.api.deleteCrewShiftOverride(o.id).subscribe({
      next: () => { this.flash('Removed'); this.loadOutages(); },
      error: e => this.flash('Delete failed: ' + this.errText(e)),
    });
  }
  /** Group the flat crew-pins by outage (label + window) for the list. */
  outageGroups = computed(() => {
    const m = new Map<string, CrewShiftOverride[]>();
    for (const o of this.crewShiftOverrides()) {
      const k = (o.label || 'Outage') + '|' + (o.startDate ?? '') + '|' + (o.endDate ?? '');
      const arr = m.get(k); if (arr) arr.push(o); else m.set(k, [o]);
    }
    return Array.from(m.values()).map(rows => ({
      label: rows[0].label || 'Outage', startDate: rows[0].startDate, endDate: rows[0].endDate, rows,
    }));
  });
  outageShiftLabel(code?: string): string {
    return this.OUTAGE_SHIFTS.find(s => s.code === code)?.label ?? (code ?? '');
  }

  // ---- materialize ----
  /** today−7 .. today+180 — the fixed window Regenerate rebuilds. Local-time, matches ymd()/todayIso(). */
  private defaultHorizon(): { from: string; to: string } {
    const today = new Date();
    const fromD = new Date(today.getTime() - 7 * 86400000);
    const toD = new Date(today.getTime() + 180 * 86400000);
    return {
      from: this.ymd(fromD.getFullYear(), fromD.getMonth(), fromD.getDate()),
      to: this.ymd(toD.getFullYear(), toD.getMonth(), toD.getDate()),
    };
  }
  regenerate(): void {
    if (!this.active()) { this.flash('Schedule v2 is staged (flag off) — nothing materialised.'); return; }
    const { from, to } = this.defaultHorizon();
    this.loading.set(true);
    this.api.materialize(from, to).subscribe({
      next: r => { this.loading.set(false); this.flash(`Regenerated ${r.responseData?.rowsWritten ?? 0} day rows`); },
      error: e => { this.loading.set(false); this.flash('Regenerate failed: ' + this.errText(e)); },
    });
  }
  /** Materialise just the viewed month — for navigating outside the default today−7..today+180 window. */
  regenerateThisMonth(): void {
    if (!this.active()) { this.flash('Schedule v2 is staged (flag off) — nothing materialised.'); return; }
    const { from, to } = this.previewRange();
    this.loading.set(true);
    this.api.materialize(from, to).subscribe({
      next: r => {
        this.loading.set(false);
        this.flash(`Materialised ${r.responseData?.rowsWritten ?? 0} day rows for ${this.monthLabel()}`);
        this.loadPreview();
      },
      error: e => { this.loading.set(false); this.flash('Materialise failed: ' + this.errText(e)); },
    });
  }
  /** True when the viewed month doesn't overlap Regenerate's fixed window — Regenerate won't touch it. */
  monthOutsideHorizon(): boolean {
    const { from, to } = this.previewRange();
    const h = this.defaultHorizon();
    return to < h.from || from > h.to;
  }

  // ---- schedule preview ----
  loadPreview(): void {
    const { from, to } = this.previewRange();
    this.fetching.set(true);
    forkJoin({
      preview: this.api.schedulePreview(from, to),
      coverage: this.api.listCoverage(from, to),
      signups: this.api.listSignupsRange(from, to),
      overrides: this.api.listOverrides(from, to),
      seats: this.api.listEligibilityDetail(from, to),
    }).subscribe({
      next: r => {
        this.previewDays.set(r.preview.responseData ?? []);
        this.applyCoverageNeeds(r.coverage.responseData ?? [], from, to);
        this.monthSignups.set(r.signups.responseData ?? []);
        this.monthOverrides.set(r.overrides.responseData ?? []);
        this.monthSeats.set(r.seats.responseData ?? []);
        this.fetching.set(false);
      },
      error: e => { this.fetching.set(false); this.flash('Load failed: ' + this.errText(e)); },
    });
  }

  private previewRange(): { from: string; to: string } {
    const from = this.ymd(this.previewYear, this.previewMonth, 1);
    const lastDay = new Date(this.previewYear, this.previewMonth + 1, 0).getDate();
    return { from, to: this.ymd(this.previewYear, this.previewMonth, lastDay) };
  }

  // ---- grid overlays (coverage / sign-ups / events) — memoised Map lookups, rebuilt only when the
  // underlying signal changes, so per-cell template bindings are O(1) instead of a filter/find per cell. ----
  /** Active (not rejected/withdrawn) signups keyed "date|shift" — the "Sign-ups" overlay cells. */
  signupsByCell = computed(() => {
    const m = new Map<string, CoverageSignup[]>();
    for (const s of this.monthSignups()) {
      if (s.status === 'REJECTED' || s.status === 'WITHDRAWN') continue;
      const key = `${s.date}|${s.shift || ''}`;
      const arr = m.get(key);
      if (arr) arr.push(s); else m.set(key, [s]);
    }
    return m;
  });

  /** Best per-person-per-day coverage-signup status keyed "userId|date" — PENDING/APPROVED only,
   *  APPROVED wins if both exist for the same user+date. Drives the roster grid's status overlay
   *  (recolor the D/N cell to mark coverage) + the inline approve/decline popover. */
  covByUserDate = computed(() => {
    const m = new Map<string, { id: number; shift: string; status: string }>();
    for (const s of this.monthSignups()) {
      if (s.userId == null || !s.date || s.id == null) continue;
      if (s.status !== 'PENDING' && s.status !== 'APPROVED') continue;
      const key = `${s.userId}|${s.date}`;
      const existing = m.get(key);
      if (!existing || s.status === 'APPROVED') {
        m.set(key, { id: s.id, shift: s.shift || '', status: s.status });
      }
    }
    return m;
  });

  /** Open-seat counts keyed "userId|date" — {day,night} open seats this person is off + qualified to
   *  cover on that shift (0 = none). Drives the roster grid's seat marker (precedence below signups). */
  seatByUserDate = computed(() => {
    const m = new Map<string, { day: number; night: number }>();
    for (const s of this.monthSeats()) {
      if (s.userId == null || !s.date) continue;
      m.set(`${s.userId}|${s.date}`, { day: s.day ?? 0, night: s.night ?? 0 });
    }
    return m;
  });

  /** Event flags already materialised onto each day, keyed by date — the "Events" overlay cells. */
  eventsByDate = computed(() => {
    const m = new Map<string, { title?: string; eventType?: string; color?: string }[]>();
    for (const d of this.previewDays()) {
      if (d.date) m.set(d.date, d.eventFlags ?? []);
    }
    return m;
  });

  // ---- per-day manual override dialog ----
  openDayOverride(date: string): void {
    if (this.isDateLocked(date)) { this.flash('That day is locked (past the edit cutoff) and can no longer be changed.'); return; }
    this.overrideModalDate.set(date);
    this.overrideForm = { userId: undefined, shift: 'OFF', reason: '' };
  }
  closeDayOverride(): void { this.overrideModalDate.set(null); }

  /** Manual overrides keyed by date — bound via `.get(date) ?? []` in the template (date header + modal). */
  overridesByDate = computed(() => {
    const m = new Map<string, ScheduleDayOverride[]>();
    for (const o of this.monthOverrides()) {
      if (!o.date) continue;
      const arr = m.get(o.date);
      if (arr) arr.push(o); else m.set(o.date, [o]);
    }
    return m;
  });
  dayRosterFor(date: string): ShiftDayView | undefined {
    return this.previewDays().find(d => d.date === date);
  }
  overrideCodeLabel(code?: string): string {
    return this.OVERRIDE_CODES.find(c => c.code === code)?.label ?? (code ?? '');
  }

  addOverride(): void {
    const date = this.overrideModalDate();
    if (!date) return;
    if (!this.overrideForm.userId) { this.flash('Pick a person'); return; }
    this.loading.set(true);
    this.api.saveOverride({
      date, userId: this.overrideForm.userId, shift: this.overrideForm.shift,
      reason: this.overrideForm.reason || undefined,
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.flash('Override applied');
        this.overrideForm = { userId: undefined, shift: 'OFF', reason: '' };
        this.loadPreview();   // reloads preview + overrides (materialiser already re-ran server-side)
      },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }

  removeOverride(o: ScheduleDayOverride): void {
    if (!o.id) return;
    this.api.deleteOverride(o.id).subscribe({
      next: () => { this.flash('Override removed'); this.loadPreview(); },
      error: e => this.flash('Delete failed: ' + this.errText(e)),
    });
  }

  // ---- inline coverage needs (grid header row) ----
  private needKey(date: string, shift: string, disc: string, pos: string | null): string {
    return `${date}|${shift}|${disc}|${pos ?? ''}`;
  }

  private eachDay(start: string, end: string): string[] {
    const out: string[] = [];
    const e = new Date(end + 'T12:00:00');
    for (let d = new Date(start + 'T12:00:00'); d <= e; d.setDate(d.getDate() + 1)) {
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    return out;
  }

  /** Rebuild the per-cell coverage-needs maps from a coverage-request list (used by loadPreview's
   *  forkJoin, and by reloadCoverageNeeds() to re-sync after a failed/floor-clamped inline edit). */
  private applyCoverageNeeds(list: CoverageRequest[], from: string, to: string): void {
    const total: Record<string, number> = {};
    const inline: Record<string, number> = {};
    for (const c of list) {
      if (!c.startDate || c.status === 'CANCELLED') continue;
      const disc = c.discipline || 'OPS';
      const pos = disc === 'OPS' ? (c.position || null) : null;
      const req = c.requiredCount ?? 0;
      // Expand the request across its date range (clamped to the month) into the per-cell TOTAL —
      // this is what makes multi-day coverage from the Coverage menu show up in the grid.
      for (const d of this.eachDay(c.startDate, c.endDate || c.startDate)) {
        if (d < from || d > to) continue;
        const k = this.needKey(d, c.shift, disc, pos);
        total[k] = (total[k] ?? 0) + req;
      }
      // A single-day MANUAL request is the editable inline portion for that cell.
      if (c.startDate === c.endDate && c.reason === 'MANUAL') {
        inline[this.needKey(c.startDate, c.shift, disc, pos)] = req;
      }
    }
    this.coverageNeeds.set(total);
    this.coverageInline.set(inline);
  }

  /** Re-fetch coverage needs for the viewed month — used to discard an optimistic setNeed() edit
   *  after the server rejects it (or to reconcile a floor that shifted server-side). */
  private reloadCoverageNeeds(): void {
    const { from, to } = this.previewRange();
    this.api.listCoverage(from, to).subscribe({
      next: r => this.applyCoverageNeeds(r.responseData ?? [], from, to),
      error: e => this.flash('Coverage reload failed: ' + this.errText(e)),
    });
  }

  needCount(date: string | undefined, shift: string, disc: string, pos: string | null): number {
    return date ? (this.coverageNeeds()[this.needKey(date, shift, disc, pos)] ?? 0) : 0;
  }

  /** The multi-day/PTO-locked portion of a cell's need — the floor the inline ▼ stepper can't go below. */
  private rangeFloor(date: string, shift: string, disc: string, pos: string | null): number {
    const key = this.needKey(date, shift, disc, pos);
    return Math.max(0, (this.coverageNeeds()[key] ?? 0) - (this.coverageInline()[key] ?? 0));
  }

  /** True once the inline portion is fully spent — the ▼ stepper is at the multi-day/PTO floor. */
  atCoverageFloor(date: string | undefined, shift: string, disc: string, pos: string | null): boolean {
    if (!date) return true;
    const key = this.needKey(date, shift, disc, pos);
    return (this.coverageInline()[key] ?? 0) <= 0;
  }

  /** Set the TOTAL needed for a cell. Multi-day (menu) + PTO coverage is a floor we can't reduce here —
   *  we move only the editable single-day part, so total = rangeFloor + max(0, desired − rangeFloor). */
  setNeed(date: string | undefined, shift: string, disc: string, pos: string | null, value: any): void {
    if (!date) return;
    const desired = Math.max(0, Math.floor(Number(value) || 0));
    const key = this.needKey(date, shift, disc, pos);
    const rangeFloor = this.rangeFloor(date, shift, disc, pos);
    if (desired < rangeFloor) {
      this.flash(`${rangeFloor} seat${rangeFloor === 1 ? '' : 's'} locked by a multi-day/PTO request — edit it on the Coverage tab`);
      return;
    }
    const inlineNew = Math.max(0, desired - rangeFloor);
    this.coverageInline.update(m => ({ ...m, [key]: inlineNew }));
    this.coverageNeeds.update(m => ({ ...m, [key]: rangeFloor + inlineNew }));
    this.api.coverageDayNeed(date, disc, pos, shift, inlineNew).subscribe({
      next: r => {
        // Reconcile with what the server actually stored (e.g. status flipped to CANCELLED at 0).
        const cr = r.responseData;
        const actualInline = cr ? (cr.status === 'CANCELLED' ? 0 : (cr.requiredCount ?? inlineNew)) : inlineNew;
        this.coverageInline.update(m => ({ ...m, [key]: actualInline }));
        this.coverageNeeds.update(m => ({ ...m, [key]: rangeFloor + actualInline }));
      },
      error: e => {
        this.flash('Coverage save failed: ' + this.errText(e));
        this.reloadCoverageNeeds();   // discard the optimistic value
      },
    });
  }

  bumpNeed(date: string | undefined, shift: string, disc: string, pos: string | null, delta: number): void {
    if (!date) return;
    this.setNeed(date, shift, disc, pos, (this.coverageNeeds()[this.needKey(date, shift, disc, pos)] ?? 0) + delta);
  }
  prevMonth(): void { if (--this.previewMonth < 0) { this.previewMonth = 11; this.previewYear--; } this.loadPreview(); }
  nextMonth(): void { if (++this.previewMonth > 11) { this.previewMonth = 0; this.previewYear++; } this.loadPreview(); }
  monthLabel(): string {
    return new Date(this.previewYear, this.previewMonth, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
  }
  weekday(dateStr?: string): string {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleString(undefined, { weekday: 'short' });
  }
  entryLabel(e: ShiftEntryView): string { return e.position ? `${e.name} · ${e.position}` : (e.name ?? ''); }
  private ymd(y: number, m0: number, d: number): string {
    return `${y}-${String(m0 + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // ---- schedule GRID view (person rows × day columns — same shape operators see in the PWA) ----
  private todayIso(): string { const d = new Date(); return this.ymd(d.getFullYear(), d.getMonth(), d.getDate()); }
  private static readonly DOW1 = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  /** Reshape the day-row ShiftDay list into { day headers, person rows with a per-day shift code }. */
  monthGrid = computed(() => {
    const days = this.previewDays();
    const today = this.todayIso();
    const headers = days.map(d => {
      const [y, m, dd] = (d.date ?? '').split('-').map(Number);
      const js = new Date(y || 2000, (m || 1) - 1, dd || 1);
      return { date: d.date ?? '', dom: dd || 0, dow: ScheduleBuilderComponent.DOW1[js.getDay()],
               weekend: js.getDay() === 0 || js.getDay() === 6, today: d.date === today };
    });

    const persons = new Map<string, { name: string; group: string; position: string; userId?: number }>();
    const codes = new Map<string, Map<string, string>>();   // personKey → (date → code)
    const keyOf = (e: ShiftEntryView) => e.userId != null ? 'u' + e.userId : 'n' + (e.name ?? '').toLowerCase().trim();
    const put = (key: string, name: string, group: string, position: string, date: string, code: string, userId?: number) => {
      let p = persons.get(key);
      if (!p) { p = { name, group, position: position || '', userId }; persons.set(key, p); }
      if (!p.position && position) p.position = position;
      let byDate = codes.get(key);
      if (!byDate) { byDate = new Map(); codes.set(key, byDate); }
      byDate.set(date, code);
    };
    for (const d of days) {
      const date = d.date ?? '';
      (d.dayShift ?? []).forEach(e => put(keyOf(e), e.name ?? '', e.group ?? '', e.position ?? '', date, 'D', e.userId));
      (d.nightShift ?? []).forEach(e => put(keyOf(e), e.name ?? '', e.group ?? '', e.position ?? '', date, 'N', e.userId));
      (d.unscheduled ?? []).forEach(e => put(keyOf(e), e.name ?? '', e.group ?? '', e.position ?? '', date, 'U', e.userId));
      (d.pto ?? []).forEach(e => put(keyOf(e), e.name ?? '', e.group ?? '', e.position ?? '', date, 'P', e.userId));
      (d.training ?? []).forEach(e => put(keyOf(e), e.name ?? '', e.group ?? '', e.position ?? '', date, 'T', e.userId));
      if (d.onCallManagerName) put('ocm:' + d.onCallManagerName.toLowerCase(), d.onCallManagerName, 'OCM', 'Manager', date, 'OCM');
    }

    const rank = (g: string) => g === 'OCM' ? 'zzy' : (g && g.trim() ? g.toLowerCase() : 'zzz');
    const posRank = (pos: string) => {
      const p = (pos || '').toLowerCase();
      if (p.includes('lead')) return 0;
      if (p.includes('control room') || p === 'cro') return 1;
      if (p.includes('auxiliary') || p === 'ao') return 2;
      return 9;   // non-ops (mechanic/manager/…) sort by name after the operators
    };
    const rows = Array.from(persons.entries())
      .map(([key, p]) => ({ key, name: p.name, group: p.group, position: p.position, userId: p.userId,
                            cells: headers.map(h => ({ code: codes.get(key)?.get(h.date) ?? '', date: h.date })) }))
      .sort((a, b) => rank(a.group).localeCompare(rank(b.group))
                   || (posRank(a.position) - posRank(b.position))
                   || a.name.localeCompare(b.name));
    return { headers, rows };
  });

  // trackBy fns for the grid's *ngFor loops — gridRows() returns fresh object identities every CD pass,
  // so without these the ~30x31 grid is destroyed/rebuilt on every keystroke in the search box.
  trackByRowKey = (_: number, r: { key: string }): string => r.key;
  trackByIndex = (i: number): number => i;
  trackByDate = (_: number, h: { date: string }): string => h.date;

  /** Distinct crew groups present in the grid + their headcount (drives the filter chips). */
  gridGroups = computed(() => {
    const counts = new Map<string, number>();
    for (const r of this.monthGrid().rows) counts.set(r.group, (counts.get(r.group) ?? 0) + 1);
    return Array.from(counts.entries()).map(([group, count]) => ({ group, count }));
  });

  /** Rows after the (multi-select) group filter + name search, with per-cell coverage-signup status
   *  and open-seat counts. Cell render precedence (template): APPROVED signup > PENDING signup >
   *  open-seat marker (seat) > normal scheduled code/blank. */
  gridRows = computed(() => {
    const sel = this.gridSelectedGroups();
    const s = this.gridSearch().toLowerCase().trim();
    const cov = this.covByUserDate();
    const seats = this.seatByUserDate();
    let prevGroup: string | null = null;
    return this.monthGrid().rows
      .filter(r => (sel.size === 0 || sel.has(r.group)) && (!s || r.name.toLowerCase().includes(s)))
      .map(r => {
        const firstInGroup = r.group !== prevGroup;
        prevGroup = r.group;
        return {
          key: r.key, name: r.name, group: r.group, position: r.position, userId: r.userId, firstInGroup,
          cells: r.cells.map(c => {
            const cs = r.userId != null ? cov.get(`${r.userId}|${c.date}`) : undefined;
            const seat = r.userId != null ? seats.get(`${r.userId}|${c.date}`) : undefined;
            return {
              date: c.date,
              code: c.code,
              cov: cs ?? null,
              seat: seat && (seat.day > 0 || seat.night > 0) ? seat : null,
            };
          }),
        };
      });
  });

  // ---- inline coverage-signup approve/decline (roster grid cells, keyed "rowKey|date") ----
  covActionKey = signal<string | null>(null);
  toggleCovAction(rowKey: string, date: string): void {
    const key = `${rowKey}|${date}`;
    this.covActionKey.update(k => k === key ? null : key);
  }
  approveCovSignup(id: number | null | undefined): void {
    if (id == null) return;
    this.covActionKey.set(null);
    this.api.approveSignup(id).subscribe({
      next: () => { this.flash('Signup approved'); this.loadPreview(); },
      error: e => this.flash('Approve failed: ' + this.errText(e)),
    });
  }
  rejectCovSignup(id: number | null | undefined): void {
    if (id == null) return;
    this.covActionKey.set(null);
    this.api.rejectSignup(id).subscribe({
      next: () => { this.flash('Signup declined'); this.loadPreview(); },
      error: e => this.flash('Decline failed: ' + this.errText(e)),
    });
  }

  /** Toggle a single group on/off — any combination of groups can be shown at once. */
  toggleGridGroup(g: string): void {
    this.gridSelectedGroups.update(set => {
      const next = new Set(set);
      if (next.has(g)) next.delete(g); else next.add(g);
      return next;
    });
  }
  showAllGroups(): void { this.gridSelectedGroups.set(new Set()); }

  // ---- PTO intake review ----
  loadPto(): void {
    this.fetching.set(true);
    this.api.listPto(this.ptoStatusFilter() || undefined).subscribe({
      next: r => { this.ptoRequests.set(r.responseData ?? []); this.fetching.set(false); },
      error: e => { this.fetching.set(false); this.flash('Load failed: ' + this.errText(e)); },
    });
  }
  setPtoFilter(s: string): void { this.ptoStatusFilter.set(s); this.loadPto(); }
  ptoRange(p: PtoRequest): string {
    if (!p.startDate) return '—';
    return p.startDate === p.endDate ? p.startDate : `${p.startDate} → ${p.endDate ?? '?'}`;
  }
  assignPto(p: PtoRequest): void {
    const userId = p.id != null ? this.ptoAssign[p.id] : undefined;
    if (p.id == null || userId == null) return;
    this.loading.set(true);
    this.api.assignPto(p.id, userId).subscribe({
      next: () => { this.loading.set(false); this.flash('User assigned'); this.loadPto(); },
      error: e => { this.loading.set(false); this.flash('Assign failed: ' + this.errText(e)); },
    });
  }
  approvePto(p: PtoRequest): void {
    if (p.id == null) return;
    this.loading.set(true);
    this.api.approvePto(p.id).subscribe({
      next: () => { this.loading.set(false); this.flash('PTO approved — coverage requested'); this.loadPto(); },
      error: e => { this.loading.set(false); this.flash('Approve failed: ' + this.errText(e)); },
    });
  }
  rejectPto(p: PtoRequest): void {
    if (p.id == null || !confirm(`Reject PTO for ${p.userName ?? p.rawName ?? 'this request'}?`)) return;
    this.loading.set(true);
    this.api.rejectPto(p.id).subscribe({
      next: () => { this.loading.set(false); this.flash('PTO rejected'); this.loadPto(); },
      error: e => { this.loading.set(false); this.flash('Reject failed: ' + this.errText(e)); },
    });
  }
}
