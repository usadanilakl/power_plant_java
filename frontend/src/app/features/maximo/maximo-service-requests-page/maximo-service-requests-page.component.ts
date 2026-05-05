import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { CreateMaximoServiceRequest, MaximoServiceRequest } from '../../../models/maximo/maximo.models';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-maximo-service-requests-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './maximo-service-requests-page.component.html',
  styleUrl: './maximo-service-requests-page.component.css'
})
export class MaximoServiceRequestsPageComponent {
  private api = inject(MaximoApiService);

  assetnum = '';
  pageSize = 50;
  loading = signal(false);
  error = signal<string | null>(null);
  list = signal<MaximoServiceRequest[]>([]);

  showForm = signal(false);
  newSr: CreateMaximoServiceRequest = { description: '' };
  submitting = signal(false);
  submitError = signal<string | null>(null);

  async load() {
    if (!this.assetnum) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      this.list.set(await firstValueFrom(this.api.listServiceRequestsForAsset(this.assetnum, this.pageSize)));
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.loading.set(false);
    }
  }

  openForm() {
    this.newSr = {
      description: '',
      longDescription: '',
      assetnum: this.assetnum,
      siteid: 'JG',
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
