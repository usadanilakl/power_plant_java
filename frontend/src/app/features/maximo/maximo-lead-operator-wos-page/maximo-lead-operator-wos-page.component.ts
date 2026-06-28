import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoTableComponent } from '../maximo-table/maximo-table.component';
import { MaximoWorkOrder } from '../../../models/maximo/maximo.models';
import { WO_COLUMNS } from '../maximo-table-configs';

/**
 * Bundle view: all Maximo work orders assigned to any local user with the
 * LEAD_OPERATOR role. Read-only — no filter panel because the bundle's purpose
 * is a pre-defined "what should I be looking at" view, not ad-hoc search.
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

  /** Auto-load on open so the user lands on the work orders without an extra click. */
  ngOnInit() { this.load(); }

  /**
   * Larger than a typical open-WO count so a single status fits in one page. The bundle is a single
   * Maximo call with no pagination, so a hit at exactly this size means results were truncated.
   */
  private static readonly PAGE_SIZE = 500;

  readonly columns = WO_COLUMNS;
  /** Status filter — default APPR (actionable). '' = all statuses (includes historical CLOSE/COMP). */
  status = 'APPR';
  readonly statusOptions = [
    { value: 'APPR', label: 'Approved (APPR)' },
    { value: 'WAPPR', label: 'Waiting approval (WAPPR)' },
    { value: 'INPRG', label: 'In progress (INPRG)' },
    { value: 'COMP', label: 'Completed (COMP)' },
    { value: '', label: 'All statuses' }
  ];

  loading = signal(false);
  error = signal<string | null>(null);
  list = signal<MaximoWorkOrder[]>([]);
  loaded = signal(false);
  lastLoaded = signal<Date | null>(null);
  /** True when the result hit the page cap — the bundle has no pagination, so some WOs are hidden. */
  truncated = computed(() => this.list().length >= MaximoLeadOperatorWosPageComponent.PAGE_SIZE);

  selectedWo = signal<MaximoWorkOrder | null>(null);
  openDetail(wo: MaximoWorkOrder) { this.selectedWo.set(wo); }
  closeDetail() { this.selectedWo.set(null); }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.list.set(await firstValueFrom(this.api.listLeadOperatorWorkOrders(
        MaximoLeadOperatorWosPageComponent.PAGE_SIZE, this.status || undefined)));
      this.loaded.set(true);
      this.lastLoaded.set(new Date());
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? String(e));
    } finally {
      this.loading.set(false);
    }
  }
}
