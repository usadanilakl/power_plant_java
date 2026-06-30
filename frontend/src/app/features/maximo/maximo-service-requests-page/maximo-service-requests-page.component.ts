import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { fromDatetimeLocal, toDatetimeLocal } from '../../../services/maximo/maximo-date.util';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoPersonPickerComponent } from '../maximo-person-picker/maximo-person-picker.component';
import { MaximoSrSubmitComponent } from '../maximo-sr-submit/maximo-sr-submit.component';
import { MaximoTableComponent } from '../maximo-table/maximo-table.component';
import {
  MaximoServiceRequest,
  MaximoServiceRequestCriteria
} from '../../../models/maximo/maximo.models';
import { SR_COLUMNS } from '../maximo-table-configs';
import { firstValueFrom } from 'rxjs';

const emptyCriteria = (): MaximoServiceRequestCriteria => ({
  status: '',
  assetnum: '',
  location: '',
  priority: '',
  reportedby: '',
  affectedperson: '',
  reportdateFrom: '',
  reportdateTo: '',
  descriptionContains: '',
  longDescriptionContains: '',
  siteid: ''
});

@Component({
  selector: 'app-maximo-service-requests-page',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent,
    MaximoTableComponent, MaximoDetailDialogComponent, MaximoSrSubmitComponent, MaximoPersonPickerComponent
  ],
  templateUrl: './maximo-service-requests-page.component.html',
  styleUrl: './maximo-service-requests-page.component.css'
})
export class MaximoServiceRequestsPageComponent {
  private api = inject(MaximoApiService);

  readonly columns = SR_COLUMNS;
  criteria: MaximoServiceRequestCriteria = emptyCriteria();
  pageSize = 50;

  loading = signal(false);
  error = signal<string | null>(null);
  list = signal<MaximoServiceRequest[]>([]);
  loaded = signal(false);

  showForm = signal(false);

  selectedSr = signal<MaximoServiceRequest | null>(null);
  openDetail(sr: MaximoServiceRequest) { this.selectedSr.set(sr); }
  closeDetail() { this.selectedSr.set(null); }

  // Date picker bridge — picker shows local time, criteria stores ISO with TZ for Maximo.
  toLocal = toDatetimeLocal;
  fromLocal = fromDatetimeLocal;

  readonly statusOptions = ['', 'NEW', 'QUEUED', 'INPROG', 'PENDING', 'RESOLVED', 'CLOSED'];

  // Plain method (not computed) — criteria is a mutable object, not a signal,
  // so a computed signal would never recompute when fields change via ngModel.
  activeFilterCount(): number {
    const c = this.criteria;
    return [c.status, c.assetnum, c.location, c.priority, c.reportedby, c.affectedperson,
      c.reportdateFrom, c.reportdateTo, c.descriptionContains, c.longDescriptionContains, c.siteid]
      .filter(v => v != null && v.trim() !== '').length;
  }

  hasAnyCriteria(): boolean {
    return this.activeFilterCount() > 0;
  }

  async apply() {
    if (!this.hasAnyCriteria()) {
      this.error.set('Set at least one filter before loading.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      this.list.set(await firstValueFrom(this.api.listServiceRequestsByCriteria(this.criteria, this.pageSize)));
      this.loaded.set(true);
    } catch (e: any) {
      this.error.set(e?.error?.message ?? e?.message ?? String(e));
    } finally {
      this.loading.set(false);
    }
  }

  clear() {
    this.criteria = emptyCriteria();
    this.list.set([]);
    this.loaded.set(false);
    this.error.set(null);
  }

  // ---- New SR submission via MaximoSrSubmitComponent --------------------

  onSrSubmitted(sr: MaximoServiceRequest) {
    this.list.update(l => [sr, ...l]);
    this.loaded.set(true);
    this.showForm.set(false);
  }
}
