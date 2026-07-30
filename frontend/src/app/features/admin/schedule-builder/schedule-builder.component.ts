import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import {
  ScheduleV2ApiService, SchedulePosition, CrewRotation, Crew, CrewAssignment,
  ScheduleEvent, AssignableUser, CoverageRequest, CoverageSignup, ShiftDayView, ShiftEntryView,
} from '../../../services/schedule-v2-api.service';

type Tab = 'positions' | 'rotations' | 'crews' | 'staffing' | 'events' | 'coverage' | 'schedule';

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
  readonly DOW = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  readonly COVERAGE_SHIFTS = ['DAY', 'NIGHT'];
  readonly COVERAGE_REASONS = ['MANUAL', 'OUTAGE', 'PTO_COVERAGE'];

  activeTab = signal<Tab>('positions');
  active = signal<boolean>(false);
  message = signal<string | null>(null);
  loading = signal(false);

  positions = signal<SchedulePosition[]>([]);
  rotations = signal<CrewRotation[]>([]);
  crews = signal<Crew[]>([]);
  assignments = signal<CrewAssignment[]>([]);
  events = signal<ScheduleEvent[]>([]);
  users = signal<AssignableUser[]>([]);
  coverage = signal<CoverageRequest[]>([]);
  signups = signal<CoverageSignup[]>([]);
  previewDays = signal<ShiftDayView[]>([]);
  previewYear = new Date().getFullYear();
  previewMonth = new Date().getMonth();

  editingPosition: SchedulePosition | null = null;
  editingRotation: CrewRotation | null = null;
  editingCrew: Crew | null = null;
  editingAssignment: CrewAssignment | null = null;
  editingEvent: ScheduleEvent | null = null;
  editingCoverage: CoverageRequest | null = null;
  selectedCoverage: CoverageRequest | null = null;

  ngOnInit(): void {
    this.reloadAll();
    this.api.status().subscribe(r => this.active.set(!!r.responseData?.active));
  }

  reloadAll(): void {
    this.api.listPositions().subscribe(r => this.positions.set(r.responseData ?? []));
    this.api.listRotations().subscribe(r => this.rotations.set(r.responseData ?? []));
    this.api.listCrews().subscribe(r => this.crews.set(r.responseData ?? []));
    this.api.listAssignments().subscribe(r => this.assignments.set(r.responseData ?? []));
    this.api.listEvents().subscribe(r => this.events.set(r.responseData ?? []));
    this.api.assignableUsers().subscribe(r => this.users.set(r.responseData ?? []));
    this.api.listCoverage().subscribe(r => this.coverage.set(r.responseData ?? []));
  }

  setTab(t: Tab): void { this.activeTab.set(t); if (t === 'schedule') this.loadPreview(); }
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
    this.api.deletePosition(p.id).subscribe(() => { this.flash('Deleted'); this.reloadAll(); });
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
    this.api.deleteRotation(r.id).subscribe(() => { this.flash('Deleted'); this.reloadAll(); });
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
    this.api.deleteCrew(c.id).subscribe(() => { this.flash('Deleted'); this.reloadAll(); });
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
  newAssignment(): void { this.editingAssignment = { assignmentType: 'ROTATING', position: '', isActive: true }; }
  editAssignment(a: CrewAssignment): void { this.editingAssignment = { ...a }; }
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
    this.api.deleteAssignment(a.id).subscribe(() => { this.flash('Deleted'); this.reloadAll(); });
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
    this.api.deleteEvent(e.id).subscribe(() => { this.flash('Deleted'); this.reloadAll(); });
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
    this.api.cancelCoverage(c.id).subscribe(() => {
      this.flash('Cancelled');
      if (this.selectedCoverage?.id === c.id) this.closeSignups();
      this.reloadAll();
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

  // ---- materialize ----
  regenerate(): void {
    const today = new Date();
    const from = this.iso(new Date(today.getTime() - 7 * 86400000));
    const to = this.iso(new Date(today.getTime() + 180 * 86400000));
    this.loading.set(true);
    this.api.materialize(from, to).subscribe({
      next: r => { this.loading.set(false); this.flash(`Regenerated ${r.responseData?.rowsWritten ?? 0} day rows`); },
      error: e => { this.loading.set(false); this.flash('Regenerate failed: ' + this.errText(e)); },
    });
  }
  private iso(d: Date): string { return d.toISOString().slice(0, 10); }

  // ---- schedule preview ----
  loadPreview(): void {
    const from = this.ymd(this.previewYear, this.previewMonth, 1);
    const lastDay = new Date(this.previewYear, this.previewMonth + 1, 0).getDate();
    const to = this.ymd(this.previewYear, this.previewMonth, lastDay);
    this.api.schedulePreview(from, to).subscribe(r => this.previewDays.set(r.responseData ?? []));
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
}
