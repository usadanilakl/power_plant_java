import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import {
  CreateMaximoServiceRequest,
  MaximoAsset,
  MaximoDoclink,
  MaximoServiceRequest,
  MaximoWorkOrder
} from '../../../models/maximo/maximo.models';
import { firstValueFrom } from 'rxjs';

type Tab = 'sr' | 'wo' | 'att';

@Component({
  selector: 'app-maximo-assets-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './maximo-assets-page.component.html',
  styleUrl: './maximo-assets-page.component.css'
})
export class MaximoAssetsPageComponent {
  private api = inject(MaximoApiService);

  // search
  searchTag = '';
  searchSite = 'JG';
  searchSize = 25;
  searching = signal(false);
  searchError = signal<string | null>(null);
  results = signal<MaximoAsset[]>([]);

  // selection
  selected = signal<MaximoAsset | null>(null);
  activeTab = signal<Tab>('sr');

  // tab data
  srs = signal<MaximoServiceRequest[]>([]);
  wos = signal<MaximoWorkOrder[]>([]);
  atts = signal<MaximoDoclink[]>([]);
  tabLoading = signal(false);
  tabError = signal<string | null>(null);

  // SR form
  showSrForm = signal(false);
  newSr: CreateMaximoServiceRequest = { description: '' };
  submittingSr = signal(false);
  submitError = signal<string | null>(null);

  // upload
  uploadDoctype = 'Attachments';
  uploading = signal(false);
  uploadError = signal<string | null>(null);

  selectedHasNoData = computed(() => {
    const t = this.activeTab();
    if (t === 'sr') return this.srs().length === 0;
    if (t === 'wo') return this.wos().length === 0;
    return this.atts().length === 0;
  });

  async search() {
    this.searching.set(true);
    this.searchError.set(null);
    try {
      const res = await firstValueFrom(this.api.searchAssets({
        tag: this.searchTag,
        siteid: this.searchSite,
        pageSize: this.searchSize
      }));
      this.results.set(res);
    } catch (e: any) {
      this.searchError.set(this.errMsg(e));
      this.results.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  async select(a: MaximoAsset) {
    this.selected.set(a);
    this.activeTab.set('sr');
    this.showSrForm.set(false);
    this.newSr = { description: '', assetnum: a.assetnum, siteid: a.siteid };
    await this.loadTab('sr');
  }

  async setTab(t: Tab) {
    this.activeTab.set(t);
    await this.loadTab(t);
  }

  async loadTab(t: Tab) {
    const a = this.selected();
    if (!a) return;
    this.tabLoading.set(true);
    this.tabError.set(null);
    try {
      if (t === 'sr') {
        this.srs.set(await firstValueFrom(this.api.listServiceRequestsForAsset(a.assetnum)));
      } else if (t === 'wo') {
        this.wos.set(await firstValueFrom(this.api.listWorkOrdersForAsset(a.assetnum)));
      } else {
        this.atts.set(await firstValueFrom(this.api.listAttachments('asset', a.href)));
      }
    } catch (e: any) {
      this.tabError.set(this.errMsg(e));
    } finally {
      this.tabLoading.set(false);
    }
  }

  openSrForm() {
    const a = this.selected();
    if (!a) return;
    this.newSr = {
      description: '',
      longDescription: '',
      assetnum: a.assetnum,
      siteid: a.siteid,
      priority: '3'
    };
    this.submitError.set(null);
    this.showSrForm.set(true);
  }

  async submitSr() {
    if (!this.newSr.description) {
      this.submitError.set('Description is required.');
      return;
    }
    this.submittingSr.set(true);
    this.submitError.set(null);
    try {
      const created = await firstValueFrom(this.api.createServiceRequest(this.newSr));
      this.showSrForm.set(false);
      this.activeTab.set('sr');
      this.srs.update(list => [created, ...list]);
    } catch (e: any) {
      this.submitError.set(this.errMsg(e));
    } finally {
      this.submittingSr.set(false);
    }
  }

  async onUpload(ev: Event) {
    const a = this.selected();
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!a || !file) return;
    this.uploading.set(true);
    this.uploadError.set(null);
    try {
      const created = await firstValueFrom(
        this.api.uploadAttachment('asset', a.href, file, this.uploadDoctype || undefined));
      this.atts.update(list => [created, ...list]);
    } catch (e: any) {
      this.uploadError.set(this.errMsg(e));
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  private errMsg(e: any): string {
    if (e?.error?.message) return e.error.message;
    if (e?.message) return e.message;
    return String(e);
  }
}
