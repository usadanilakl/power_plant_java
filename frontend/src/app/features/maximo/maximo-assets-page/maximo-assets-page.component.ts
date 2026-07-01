import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoTableComponent } from '../maximo-table/maximo-table.component';
import { MaximoLocationPickerComponent } from '../maximo-location-picker/maximo-location-picker.component';
import { MaximoDetailDialogComponent } from '../maximo-detail-dialog/maximo-detail-dialog.component';
import { MaximoSrSubmitComponent } from '../maximo-sr-submit/maximo-sr-submit.component';
import { MaximoAttachmentsComponent } from '../maximo-attachments/maximo-attachments.component';
import { MaximoAsset, MaximoServiceRequest, MaximoWorkOrder } from '../../../models/maximo/maximo.models';
import { ASSET_COLUMNS } from '../maximo-table-configs';
import { firstValueFrom } from 'rxjs';

type Tab = 'sr' | 'wo' | 'att';

/**
 * Asset workbench: search (assetnum/description/location word-bucket) + filters → results table →
 * select an asset to see its Service Requests / Work Orders (drill into the shared detail dialog) and
 * Attachments (shared component with inline preview), and raise a new SR via the shared submit form.
 */
@Component({
  selector: 'app-maximo-assets-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, MaximoTableComponent,
    MaximoLocationPickerComponent, MaximoDetailDialogComponent, MaximoSrSubmitComponent, MaximoAttachmentsComponent],
  templateUrl: './maximo-assets-page.component.html',
  styleUrl: './maximo-assets-page.component.css'
})
export class MaximoAssetsPageComponent {
  private api = inject(MaximoApiService);

  readonly columns = ASSET_COLUMNS;
  readonly statusOptions = ['', 'OPERATING', 'ACTIVE', 'NOT READY', 'INACTIVE'];

  // search + filters
  searchTag = '';
  searchSite = 'JG';
  filterStatus = '';
  filterLocation = '';
  searchSize = 50;
  searching = signal(false);
  searchError = signal<string | null>(null);
  results = signal<MaximoAsset[]>([]);

  // selection + per-asset tabs
  selected = signal<MaximoAsset | null>(null);
  activeTab = signal<Tab>('sr');
  srs = signal<MaximoServiceRequest[]>([]);
  wos = signal<MaximoWorkOrder[]>([]);
  tabLoading = signal(false);
  tabError = signal<string | null>(null);

  // create-SR form + drill-in dialogs
  showSrForm = signal(false);
  selectedSr = signal<MaximoServiceRequest | null>(null);
  selectedWo = signal<MaximoWorkOrder | null>(null);

  async search() {
    this.searching.set(true); this.searchError.set(null);
    try {
      this.results.set(await firstValueFrom(this.api.searchAssets({
        tag: this.searchTag, siteid: this.searchSite,
        status: this.filterStatus || undefined, location: this.filterLocation || undefined,
        pageSize: this.searchSize
      })));
    } catch (e: any) {
      this.searchError.set(this.errMsg(e)); this.results.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  async select(a: MaximoAsset) {
    this.selected.set(a);
    this.showSrForm.set(false);
    this.activeTab.set('sr');
    await this.loadTab('sr');
  }

  async setTab(t: Tab) {
    this.activeTab.set(t);
    if (t !== 'att') await this.loadTab(t);   // attachments component self-loads
  }

  async loadTab(t: Tab) {
    const a = this.selected();
    if (!a) return;
    this.tabLoading.set(true); this.tabError.set(null);
    try {
      if (t === 'sr') this.srs.set(await firstValueFrom(this.api.listServiceRequestsForAsset(a.assetnum)));
      else if (t === 'wo') this.wos.set(await firstValueFrom(this.api.listWorkOrdersForAsset(a.assetnum)));
    } catch (e: any) {
      this.tabError.set(this.errMsg(e));
    } finally {
      this.tabLoading.set(false);
    }
  }

  // ── Create SR (reuses the shared submit form, seeded with the selected asset) ──
  openSrForm() { if (this.selected()) this.showSrForm.set(true); }
  onSrCreated(_sr: MaximoServiceRequest) {
    this.showSrForm.set(false);
    this.activeTab.set('sr');
    this.loadTab('sr');
  }

  // ── Drill into a WO/SR from the history lists → shared detail dialog ──
  openSr(s: MaximoServiceRequest) { this.selectedSr.set(s); }
  openWo(w: MaximoWorkOrder) { this.selectedWo.set(w); }
  closeSr() { this.selectedSr.set(null); this.loadTab('sr'); }
  closeWo() { this.selectedWo.set(null); this.loadTab('wo'); }

  private errMsg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
