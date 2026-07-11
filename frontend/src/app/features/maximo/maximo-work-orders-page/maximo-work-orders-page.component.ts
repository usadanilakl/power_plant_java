import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { fromDatetimeLocal, toDatetimeLocal } from '../../../services/maximo/maximo-date.util';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoPersonPickerComponent } from '../maximo-person-picker/maximo-person-picker.component';
import { MaximoAssetPickerComponent } from '../maximo-asset-picker/maximo-asset-picker.component';
import { MaximoLocationPickerComponent } from '../maximo-location-picker/maximo-location-picker.component';
import { MaximoTableComponent } from '../maximo-table/maximo-table.component';
import { MaximoWorkOrder, MaximoWorkOrderCriteria } from '../../../models/maximo/maximo.models';
import { WO_COLUMNS } from '../maximo-table-configs';
import { firstValueFrom } from 'rxjs';

const emptyCriteria = (): MaximoWorkOrderCriteria => ({
  status: '',
  worktype: '',
  assetnum: '',
  location: '',
  priority: '',
  leadCraft: '',
  supervisor: '',
  schedstartFrom: '',
  schedfinishTo: '',
  reportdateFrom: '',
  reportdateTo: '',
  textContains: '',
  wonumContains: '',
  siteid: ''
});

@Component({
  selector: 'app-maximo-work-orders-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoTableComponent, MaximoDetailDialogComponent, MaximoPersonPickerComponent, MaximoAssetPickerComponent, MaximoLocationPickerComponent],
  templateUrl: './maximo-work-orders-page.component.html',
  styleUrl: './maximo-work-orders-page.component.css'
})
export class MaximoWorkOrdersPageComponent {
  private api = inject(MaximoApiService);

  criteria: MaximoWorkOrderCriteria = emptyCriteria();
  pageSize = 50;

  readonly columns = WO_COLUMNS;
  loading = signal(false);
  error = signal<string | null>(null);
  list = signal<MaximoWorkOrder[]>([]);
  loaded = signal(false);

  selectedWo = signal<MaximoWorkOrder | null>(null);
  openDetail(wo: MaximoWorkOrder) { this.selectedWo.set(wo); }
  closeDetail() { this.selectedWo.set(null); }

  // Date picker bridge — picker shows local time, criteria stores ISO with TZ for Maximo.
  toLocal = toDatetimeLocal;
  fromLocal = fromDatetimeLocal;

  readonly statusOptions = ['', 'WAPPR', 'APPR', 'INPRG', 'COMP', 'CLOSE', 'CAN'];
  readonly worktypeOptions = ['', 'CM', 'PM', 'EM', 'INSP'];

  // Plain method (not computed) — criteria is a mutable object, not a signal,
  // so a computed signal would never recompute when fields change via ngModel.
  activeFilterCount(): number {
    const c = this.criteria;
    return [c.status, c.worktype, c.assetnum, c.location, c.priority, c.leadCraft,
      c.supervisor, c.schedstartFrom, c.schedfinishTo, c.reportdateFrom, c.reportdateTo,
      c.textContains, c.wonumContains, c.siteid]
      .filter(v => v != null && v.trim() !== '').length;
  }

  hasAnyCriteria(): boolean {
    return this.activeFilterCount() > 0;
  }

  /** True when the table is showing the unfiltered newest-first default rather than a filtered result. */
  showingLatest = signal(true);

  constructor() {
    // Open on the newest work orders instead of an empty table. With no filters set, the server answers
    // with the latest `pageSize` for the site, ordered by report date.
    this.apply();
  }

  async apply() {
    this.loading.set(true);
    this.error.set(null);
    const filtered = this.hasAnyCriteria();
    try {
      this.list.set(await firstValueFrom(this.api.listWorkOrdersByCriteria(this.criteria, this.pageSize)));
      this.showingLatest.set(!filtered);
      this.loaded.set(true);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? String(e));
    } finally {
      this.loading.set(false);
    }
  }

  clear() {
    this.criteria = emptyCriteria();
    this.error.set(null);
    this.apply();   // back to the newest-first default, not an empty table
  }
}
