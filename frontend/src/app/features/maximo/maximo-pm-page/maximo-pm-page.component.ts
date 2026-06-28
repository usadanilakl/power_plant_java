import { Component, OnInit, inject, signal } from '@angular/core';
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
  ShiftPreference
} from '../../../models/maximo/pm.models';

type Tab = 'catalog' | 'assignments' | 'schedule';

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

  // Catalog
  catalog = signal<RecurringPm[]>([]);
  catalogLoaded = signal(false);

  // Assignments
  pending = signal<PmPendingAssignment[]>([]);
  pendingLoaded = signal(false);
  /** chosen assignee personid per WO href (defaults to the proposal). */
  assignee: Record<string, string> = {};
  approving = signal(false);

  // Schedule
  schedule = signal<ShiftDay[]>([]);
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
      this.info.set(`Scanned ${r['scanned'] ?? 0} WOs → ${r['pmCount'] ?? 0} PMs (${r['created'] ?? 0} new, ${r['updated'] ?? 0} updated)`);
      this.catalog.set(await firstValueFrom(this.api.getCatalog()));
      this.catalogLoaded.set(true);
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  async onShiftChange(pm: RecurringPm, shift: ShiftPreference) {
    try {
      const updated = await firstValueFrom(this.api.classify(pm.pmnum, shift, pm.cadence ?? undefined));
      this.catalog.update(list => list.map(r => r.pmnum === pm.pmnum ? updated : r));
    } catch (e: any) { this.error.set(this.msg(e)); }
  }

  async onCadenceChange(pm: RecurringPm, cadence: RecurrenceCadence) {
    try {
      const updated = await firstValueFrom(this.api.classify(pm.pmnum, pm.shift, cadence));
      this.catalog.update(list => list.map(r => r.pmnum === pm.pmnum ? updated : r));
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
    await this.doAssign(this.pending());
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

  // ── Schedule ────────────────────────────────────────────────────────────
  async loadSchedule() {
    if (!this.schedFrom || !this.schedTo) return;
    this.loading.set(true); this.error.set(null);
    try {
      this.schedule.set(await firstValueFrom(this.api.getScheduleRange(this.schedFrom, this.schedTo)));
    } catch (e: any) { this.error.set(this.msg(e)); }
    finally { this.loading.set(false); }
  }

  names(entries: { name: string }[] | null | undefined): string {
    return (entries ?? []).map(e => e.name).join(', ') || '—';
  }

  private msg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
