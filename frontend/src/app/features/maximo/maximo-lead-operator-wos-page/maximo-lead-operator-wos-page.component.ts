import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent, MaximoTableComponent, MaximoDetailDialogComponent],
  templateUrl: './maximo-lead-operator-wos-page.component.html',
  styleUrl: './maximo-lead-operator-wos-page.component.css'
})
export class MaximoLeadOperatorWosPageComponent {
  private api = inject(MaximoApiService);

  readonly columns = WO_COLUMNS;
  loading = signal(false);
  error = signal<string | null>(null);
  list = signal<MaximoWorkOrder[]>([]);
  loaded = signal(false);
  lastLoaded = signal<Date | null>(null);

  selectedWo = signal<MaximoWorkOrder | null>(null);
  openDetail(wo: MaximoWorkOrder) { this.selectedWo.set(wo); }
  closeDetail() { this.selectedWo.set(null); }

  async load() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.list.set(await firstValueFrom(this.api.listLeadOperatorWorkOrders(100)));
      this.loaded.set(true);
      this.lastLoaded.set(new Date());
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? String(e));
    } finally {
      this.loading.set(false);
    }
  }
}
