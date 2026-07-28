import { Component, EventEmitter, Input, OnChanges, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MaximoPmApiService } from '../../../services/maximo/maximo-pm-api.service';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { ShiftDay, ShiftEntry } from '../../../models/maximo/pm.models';

interface PeekPerson { name: string; crew: string; isLead: boolean; personid: string | null; }
interface PeekGrid {
  dueDate: string;
  dates: string[];
  people: PeekPerson[];
  codes: Record<string, string>;   // key = `${name}|${date}` → D/N/P/T/U
}

/** Crew-letter display order (then "other", then blank) — mirrors the PM page's schedule grid. */
const CREW_ORDER = ['A', 'B', 'C', 'D', 'Rel', 'OCM'];

/**
 * A compact, self-contained shift-roster peek (people × dates grid) centered on a given date, for GUIDANCE
 * when choosing a person (e.g. transferring a WO's lead). Fetches the ShiftDay roster for a 3-week window
 * around {@link date} and flags lead operators. Clicking a person whose Maximo personid is resolvable emits
 * {@link pick}. Independent of the PM page's own peek (which the approval flow depends on).
 */
@Component({
  selector: 'app-maximo-schedule-peek',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="peek">
      <div class="peek-bar">
        <span class="peek-title">Shift schedule around {{ date || '—' }}</span>
        <label class="leads-only">
          <input type="checkbox" [checked]="leadsOnly()" (change)="leadsOnly.set($any($event.target).checked)" />
          Leads only
        </label>
      </div>
      <div class="muted" *ngIf="loading()">Loading schedule…</div>
      <div class="error" *ngIf="error()">{{ error() }}</div>
      <ng-container *ngIf="!loading() && grid() as g">
        <div class="peek-legend muted">
          <span class="c c-D">D</span> day · <span class="c c-N">N</span> night ·
          <span class="c c-P">P</span> PTO · <span class="c c-T">T</span> training ·
          <span class="c c-U">U</span> unscheduled · click a name to choose
        </div>
        <div class="grid-scroll" *ngIf="g.dates.length && visiblePeople(g).length; else noPeek">
          <table class="sched-grid">
            <thead>
              <tr>
                <th class="person-col">Name</th>
                <th *ngFor="let d of g.dates" class="day-col" [class.due]="d === g.dueDate">{{ dayLabel(d) }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of visiblePeople(g)" [class.lead-row]="p.isLead">
                <td class="person-col">
                  <button type="button" class="name-btn" [disabled]="!p.personid"
                          [title]="p.personid ? 'Choose ' + p.name + ' (' + p.personid + ')' : 'No Maximo personid for ' + p.name"
                          (click)="onPick(p)">
                    <span *ngIf="p.isLead" class="lead-tag" title="Lead operator">L</span>
                    {{ p.name }} <span class="crew">{{ p.crew || '—' }}</span>
                  </button>
                </td>
                <td *ngFor="let d of g.dates"
                    [class]="'cell c-' + code(g, p.name, d) + (d === g.dueDate ? ' due' : '')">{{ code(g, p.name, d) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #noPeek>
          <div class="muted peek-empty">
            No schedule imported around {{ date }}{{ leadsOnly() ? ' (or no leads scheduled — uncheck “Leads only”)' : '' }}.
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .peek { border: 1px solid #3a3a3a; border-radius: 4px; padding: 6px 8px; margin-top: 6px; background: #1c1c1c; }
    .peek-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .peek-title { font-size: 12px; color: #bbb; }
    .leads-only { font-size: 12px; color: #bbb; display: inline-flex; align-items: center; gap: 4px; }
    .peek-legend { font-size: 11px; margin: 4px 0; }
    .muted { color: #888; }
    .error { color: #e06c6c; font-size: 12px; }
    .peek-empty { font-size: 12px; padding: 4px 0; }
    .c { display: inline-block; min-width: 14px; text-align: center; border-radius: 2px; padding: 0 3px; font-weight: 600; }
    .c-D { background: #294b6b; color: #cfe4ff; }
    .c-N { background: #3a2f5b; color: #d9ccff; }
    .c-P { background: #4b3a29; color: #ffe0c2; }
    .c-T { background: #294b3a; color: #c2ffd9; }
    .c-U { background: #333; color: #bbb; }
    .grid-scroll { overflow-x: auto; max-height: 320px; overflow-y: auto; }
    .sched-grid { border-collapse: collapse; font-size: 12px; }
    .sched-grid th, .sched-grid td { border: 1px solid #333; padding: 2px 5px; text-align: center; white-space: nowrap; }
    .person-col { text-align: left; position: sticky; left: 0; background: #1c1c1c; }
    .day-col.due, .cell.due { outline: 2px solid #6b9; outline-offset: -2px; }
    .lead-row .person-col { background: #223; }
    .name-btn { background: none; border: 0; color: #e6e6e6; font: inherit; cursor: pointer; text-align: left; padding: 0; }
    .name-btn:disabled { cursor: default; color: #999; }
    .name-btn:not(:disabled):hover { text-decoration: underline; }
    .lead-tag { display: inline-block; background: #6b9; color: #061; font-weight: 700; border-radius: 2px; padding: 0 3px; font-size: 10px; margin-right: 3px; }
    .crew { color: #888; font-size: 11px; }
    .cell { min-width: 22px; }
  `]
})
export class MaximoSchedulePeekComponent implements OnChanges {
  private api = inject(MaximoPmApiService);
  private maximoApi = inject(MaximoApiService);

  /** yyyy-MM-dd the grid is centered on (e.g. the WO's target start). */
  @Input() date: string | null = null;
  /** Emitted with a Maximo personid when a resolvable person is clicked. */
  @Output() pick = new EventEmitter<string>();

  loading = signal(false);
  error = signal<string | null>(null);
  grid = signal<PeekGrid | null>(null);
  leadsOnly = signal(true);

  private leadIds = new Set<number>();
  private leadScheduleNames = new Set<string>();
  private personidByName = new Map<string, string>();

  async ngOnChanges() {
    const date = this.date;
    if (!date || date.length < 10) { this.grid.set(null); return; }
    this.loading.set(true); this.error.set(null);
    try {
      const { from, to } = this.window(date);
      const [days] = await Promise.all([
        firstValueFrom(this.api.getScheduleRange(from, to)),
        this.ensureLeads(),
      ]);
      this.grid.set(this.build(days ?? [], date));
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? String(e));
      this.grid.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  visiblePeople(g: PeekGrid): PeekPerson[] {
    return this.leadsOnly() ? g.people.filter(p => p.isLead) : g.people;
  }

  code(g: PeekGrid, name: string, date: string): string { return g.codes[name + '|' + date] ?? ''; }

  dayLabel(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString(undefined, { weekday: 'short' }) + ' ' + d.getDate();
  }

  onPick(p: PeekPerson) {
    if (p.personid) this.pick.emit(p.personid);
  }

  /** Load lead identity sets (id + normalized scheduleName) + a name→personid map (leads, then labor-people). */
  private async ensureLeads() {
    try {
      const leads = await firstValueFrom(this.api.getLeads());
      for (const l of leads) {
        if (l.id != null) this.leadIds.add(l.id);
        if (l.scheduleName) {
          this.leadScheduleNames.add(this.norm(l.scheduleName));
          if (l.personid) this.personidByName.set(this.norm(l.scheduleName), l.personid);
        }
        if (l.name && l.personid && !this.personidByName.has(this.norm(l.name))) {
          this.personidByName.set(this.norm(l.name), l.personid);
        }
      }
    } catch { /* peek still renders without lead flags */ }
    // Broaden personid resolution with the cached labor-people map (name → personid), so clicking any known
    // plant person (not just leads) sets a personid. Best-effort.
    try {
      const people = await firstValueFrom(this.maximoApi.getLaborPeopleCached());
      for (const p of people) {
        if (p.name && p.personid && !this.personidByName.has(this.norm(p.name))) {
          this.personidByName.set(this.norm(p.name), p.personid);
        }
      }
    } catch { /* best-effort */ }
  }

  private norm(s: string): string { return s.trim().toLowerCase().replace(/\s+/g, ' '); }

  /** 3-week window centered on the given date's ISO week (one week before, that week, one week after). */
  private window(dateStr: string): { from: string; to: string } {
    const due = new Date(dateStr + 'T00:00:00');
    const isoDow = (due.getDay() + 6) % 7;                 // Mon=0 .. Sun=6
    const monday = new Date(due); monday.setDate(due.getDate() - isoDow);
    const from = new Date(monday); from.setDate(monday.getDate() - 7);
    const to = new Date(monday); to.setDate(monday.getDate() + 13);
    return { from: this.isoLocal(from), to: this.isoLocal(to) };
  }

  private isoLocal(d: Date): string {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
  }

  /** Pivot ShiftDay[] into a people×dates grid with crew letters + lead flags + resolved personids. */
  private build(days: ShiftDay[], dueDate: string): PeekGrid {
    const dates = days.map(d => d.date);
    const codes: Record<string, string> = {};
    const crew = new Map<string, string>();
    const userIdByName = new Map<string, number>();
    const people = new Set<string>();
    const put = (entries: ShiftEntry[] | null | undefined, date: string, codeLetter: string) => {
      for (const e of (entries ?? [])) {
        if (!e?.name) continue;
        people.add(e.name);
        codes[e.name + '|' + date] = codeLetter;
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
      if (this.leadScheduleNames.has(this.norm(name))) return true;
      const uid = userIdByName.get(name);
      return uid != null && this.leadIds.has(uid);
    };
    const ordered = [...people]
      .map(n => ({
        name: n, crew: crew.get(n) ?? '', isLead: isLead(n),
        personid: this.personidByName.get(this.norm(n)) ?? null,
      }))
      .sort((a, b) => this.crewRank(a.crew) - this.crewRank(b.crew) || a.name.localeCompare(b.name));
    return { dueDate, dates, people: ordered, codes };
  }

  private crewRank(c: string): number {
    const i = CREW_ORDER.indexOf(c);
    return i < 0 ? CREW_ORDER.length + (c ? 0 : 1) : i;
  }
}
