import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import {
  CreateMaximoServiceRequest,
  MaximoServiceRequest,
  MaximoServiceRequestCriteria
} from '../../../models/maximo/maximo.models';
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
  siteid: ''
});

@Component({
  selector: 'app-maximo-service-requests-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoDetailDialogComponent],
  templateUrl: './maximo-service-requests-page.component.html',
  styleUrl: './maximo-service-requests-page.component.css'
})
export class MaximoServiceRequestsPageComponent {
  private api = inject(MaximoApiService);

  criteria: MaximoServiceRequestCriteria = emptyCriteria();
  pageSize = 50;

  loading = signal(false);
  error = signal<string | null>(null);
  list = signal<MaximoServiceRequest[]>([]);
  loaded = signal(false);

  showForm = signal(false);
  newSr: CreateMaximoServiceRequest = { description: '' };
  submitting = signal(false);
  submitError = signal<string | null>(null);

  selectedSr = signal<MaximoServiceRequest | null>(null);
  openDetail(sr: MaximoServiceRequest) { this.selectedSr.set(sr); }
  closeDetail() { this.selectedSr.set(null); }

  readonly statusOptions = ['', 'NEW', 'QUEUED', 'INPROG', 'PENDING', 'RESOLVED', 'CLOSED'];

  // Plain method (not computed) — criteria is a mutable object, not a signal,
  // so a computed signal would never recompute when fields change via ngModel.
  activeFilterCount(): number {
    const c = this.criteria;
    return [c.status, c.assetnum, c.location, c.priority, c.reportedby, c.affectedperson,
      c.reportdateFrom, c.reportdateTo, c.descriptionContains, c.siteid]
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
      this.error.set(this.errMsg(e));
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

  openForm() {
    this.newSr = {
      description: '',
      longDescription: '',
      assetnum: this.criteria.assetnum || '',
      siteid: this.criteria.siteid || 'JG',
      priority: '3'
    };
    this.submitError.set(null);
    this.showForm.set(true);
  }

  async submit() {
    if (!this.newSr.description) {
      this.submitError.set('Description is required.');
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    try {
      const created = await firstValueFrom(this.api.createServiceRequest(this.newSr));
      this.showForm.set(false);
      this.list.update(l => [created, ...l]);
    } catch (e: any) {
      this.submitError.set(this.errMsg(e));
    } finally {
      this.submitting.set(false);
    }
  }

  private errMsg(e: any): string {
    return e?.error?.message ?? e?.message ?? String(e);
  }
}
