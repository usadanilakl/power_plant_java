import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import {
  ScheduleV2ApiService, CrewPattern, CrewAssignment, ScheduleEvent, AssignableUser,
} from '../../../services/schedule-v2-api.service';

type Tab = 'patterns' | 'assignments' | 'events';

/**
 * Schedule v2 manager build tools (admin-gated). Three tabs — crew rotation patterns (role × day
 * grid), crew assignments (person → crew → role → range → offset), and schedule events. Every save
 * re-materialises the ShiftDay rows server-side; while the schedule.v2.enabled flag is off this is
 * a no-op, so the page doubles as a staging surface before cutover.
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

  readonly ROLES = ['LEAD', 'AO', 'RELIEF'];
  readonly SHIFTS = ['', 'D', 'N', 'O', 'R'];
  readonly EVENT_TYPES = ['HOLIDAY', 'MEETING', 'PAY_PERIOD_START', 'OUTAGE', 'TRAINING_MANDATORY', 'LEADS_MEETING'];
  readonly SHIFT_AFFINITY = ['BOTH', 'DAY', 'NIGHT'];

  activeTab = signal<Tab>('patterns');
  active = signal<boolean>(false);
  message = signal<string | null>(null);
  loading = signal(false);

  patterns = signal<CrewPattern[]>([]);
  assignments = signal<CrewAssignment[]>([]);
  events = signal<ScheduleEvent[]>([]);
  users = signal<AssignableUser[]>([]);

  editingPattern: CrewPattern | null = null;
  editingAssignment: CrewAssignment | null = null;
  editingEvent: ScheduleEvent | null = null;

  ngOnInit(): void {
    this.reloadAll();
    this.api.status().subscribe(r => this.active.set(!!r.responseData?.active));
  }

  reloadAll(): void {
    this.api.listPatterns().subscribe(r => this.patterns.set(r.responseData ?? []));
    this.api.listAssignments().subscribe(r => this.assignments.set(r.responseData ?? []));
    this.api.listEvents().subscribe(r => this.events.set(r.responseData ?? []));
    this.api.assignableUsers().subscribe(r => this.users.set(r.responseData ?? []));
  }

  setTab(t: Tab): void { this.activeTab.set(t); }

  private flash(msg: string): void {
    this.message.set(msg);
    setTimeout(() => this.message.set(null), 3500);
  }

  private errText(e: any): string { return e?.error?.message ?? e?.message ?? 'error'; }

  // ---- patterns ----
  newPattern(): void {
    this.editingPattern = { name: '', color: '#42A5F5', patternLengthDays: 28, cells: [], isActive: true };
  }
  editPattern(p: CrewPattern): void {
    this.editingPattern = { ...p, cells: (p.cells ?? []).map(c => ({ ...c })) };
  }
  cancelPattern(): void { this.editingPattern = null; }

  dayRange(): number[] {
    const n = this.editingPattern?.patternLengthDays ?? 0;
    return Array.from({ length: Math.max(0, Math.min(60, n)) }, (_, i) => i);
  }
  cellShift(role: string, day: number): string {
    return this.editingPattern?.cells.find(x => x.role === role && x.dayIndex === day)?.shift ?? '';
  }
  setCell(role: string, day: number, shift: string): void {
    if (!this.editingPattern) return;
    const cells = this.editingPattern.cells;
    const idx = cells.findIndex(x => x.role === role && x.dayIndex === day);
    if (!shift) { if (idx >= 0) cells.splice(idx, 1); return; }
    if (idx >= 0) cells[idx].shift = shift;
    else cells.push({ role, dayIndex: day, shift });
  }
  savePattern(): void {
    if (!this.editingPattern) return;
    const n = this.editingPattern.patternLengthDays ?? 0;
    this.editingPattern.cells = this.editingPattern.cells.filter(c => c.dayIndex < n);
    this.loading.set(true);
    this.api.savePattern(this.editingPattern).subscribe({
      next: () => { this.editingPattern = null; this.loading.set(false); this.flash('Pattern saved'); this.reloadAll(); },
      error: e => { this.loading.set(false); this.flash('Save failed: ' + this.errText(e)); },
    });
  }
  deletePattern(p: CrewPattern): void {
    if (!p.id || !confirm(`Delete pattern "${p.name}"?`)) return;
    this.api.deletePattern(p.id).subscribe(() => { this.flash('Deleted'); this.reloadAll(); });
  }

  // ---- assignments ----
  newAssignment(): void {
    this.editingAssignment = { role: 'AO', patternOffsetDays: 0, isActive: true };
  }
  editAssignment(a: CrewAssignment): void { this.editingAssignment = { ...a }; }
  cancelAssignment(): void { this.editingAssignment = null; }
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

  // ---- events ----
  newEvent(): void {
    this.editingEvent = { eventType: 'HOLIDAY', appliesToShift: 'BOTH', color: '#EF5350' };
  }
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
}
