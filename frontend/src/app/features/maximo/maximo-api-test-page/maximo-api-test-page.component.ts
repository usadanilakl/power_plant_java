import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Observable, firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoAssetLocatorService } from '../../../services/maximo/maximo-asset-locator.service';
import { fromDatetimeLocal, toDatetimeLocal } from '../../../services/maximo/maximo-date.util';
import { MaximoAttachmentParent, CreateMaximoServiceRequest, MaximoServiceRequestCriteria, MaximoWorkOrderCriteria } from '../../../models/maximo/maximo.models';

interface PanelState {
  status: 'idle' | 'loading' | 'ok' | 'error';
  payload?: unknown;
  error?: string;
}

const idle = (): PanelState => ({ status: 'idle' });

@Component({
  selector: 'app-maximo-api-test-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './maximo-api-test-page.component.html',
  styleUrl: './maximo-api-test-page.component.css'
})
export class MaximoApiTestPageComponent {
  private api = inject(MaximoApiService);
  private locator = inject(MaximoAssetLocatorService);

  // 1. Search assets
  searchTag = 'CEM';
  searchSite = 'JG';
  searchSize = 10;
  searchPanel = signal<PanelState>(idle());

  // 2. Get asset by tag
  getTag = '-1-CEM-SS';
  getPanel = signal<PanelState>(idle());
  lastAssetHref = '';

  // 2b. Asset locator (same matching logic the SR submit form uses)
  locatorTag = '-1-CEM-SS';
  locatorPanel = signal<PanelState>(idle());

  // 3. SRs for asset
  srAsset = '-1-CEM-SS';
  srPanel = signal<PanelState>(idle());

  // 3b. SRs by status
  srStatus = 'NEW';
  srStatusSize = 10;
  srStatusPanel = signal<PanelState>(idle());

  // 3c. SRs by criteria (any combination)
  srCriteria: MaximoServiceRequestCriteria = {
    status: '',
    assetnum: '',
    location: '',
    priority: '',
    reportedby: '',
    affectedperson: '',
    reportdateFrom: '',
    reportdateTo: '',
    descriptionContains: '',
    longDescriptionContains: ''
  };
  srCriteriaSize = 10;
  srCriteriaPanel = signal<PanelState>(idle());
  readonly srStatusOptions = ['', 'NEW', 'QUEUED', 'INPROG', 'PENDING', 'RESOLVED', 'CLOSED'];

  // 4. WOs for asset
  woAsset = '-1-CEM-SS';
  woPanel = signal<PanelState>(idle());

  // 4b. WOs by criteria (any combination of status, worktype, assetnum, location, priority)
  woCriteria: MaximoWorkOrderCriteria = {
    status: 'CLOSE',
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
    descriptionContains: '',
    longDescriptionContains: '',
    wonumContains: ''
  };
  woCriteriaSize = 10;
  woCriteriaPanel = signal<PanelState>(idle());
  readonly woStatusOptions = ['', 'WAPPR', 'APPR', 'INPRG', 'COMP', 'CLOSE', 'CAN'];
  readonly woWorktypeOptions = ['', 'CM', 'PM', 'EM', 'INSP'];

  // Date picker bridge.
  toLocal = toDatetimeLocal;
  fromLocal = fromDatetimeLocal;

  // 5. Submit new SR
  newSr: CreateMaximoServiceRequest = {
    description: 'Test SR from API test panel',
    longDescription: 'Submitted via /maximo/api-test for integration verification.',
    assetnum: '-1-CEM-SS',
    siteid: 'JG',
    priority: '3'
  };
  submitPanel = signal<PanelState>(idle());

  // 6. Attachments
  attParent: MaximoAttachmentParent = 'asset';
  attHref = '';
  attDoctype = 'Attachments';
  attPanel = signal<PanelState>(idle());

  runSearch() {
    return this.run(this.searchPanel,
      this.api.searchAssets({ tag: this.searchTag, siteid: this.searchSite, pageSize: this.searchSize }));
  }

  async runGet() {
    const result = await this.run(this.getPanel, this.api.getAsset(this.getTag));
    if (result && (result as any).href) this.lastAssetHref = (result as any).href;
  }

  copyHref() {
    if (!this.lastAssetHref) { alert('Run "Get asset" first.'); return; }
    this.attHref = this.lastAssetHref;
    this.attParent = 'asset';
  }

  /** Runs the same 3-tier locator the SR submit form uses, displays the structured result. */
  async runLocator() {
    const tag = this.locatorTag;
    if (!tag || !tag.trim()) { alert('Tag number required.'); return; }
    this.locatorPanel.set({ status: 'loading' });
    const r = await this.locator.locate(tag);
    if (r.tier === 'error') {
      this.locatorPanel.set({ status: 'error', error: r.errorMessage ?? 'lookup failed', payload: r });
      return;
    }
    // Surface a flattened "what would the SR form prefill" alongside the raw result.
    const suggested = r.asset
      ? { suggestedAsset: r.asset.assetnum, suggestedLocation: r.asset.location, suggestedSite: r.asset.siteid }
      : null;
    this.locatorPanel.set({ status: 'ok', payload: { ...r, ...(suggested ?? {}) } });
  }

  runSrList() { return this.run(this.srPanel, this.api.listServiceRequestsForAsset(this.srAsset)); }
  runSrByStatus() { return this.run(this.srStatusPanel, this.api.listServiceRequestsByStatus(this.srStatus, this.srStatusSize)); }
  runSrByCriteria() { return this.run(this.srCriteriaPanel, this.api.listServiceRequestsByCriteria(this.srCriteria, this.srCriteriaSize)); }
  runWoList() { return this.run(this.woPanel, this.api.listWorkOrdersForAsset(this.woAsset)); }
  runWoByCriteria() { return this.run(this.woCriteriaPanel, this.api.listWorkOrdersByCriteria(this.woCriteria, this.woCriteriaSize)); }
  submitNewSr() { return this.run(this.submitPanel, this.api.createServiceRequest(this.newSr)); }

  listAttachments() {
    if (!this.attHref) { alert('Parent href required.'); return Promise.resolve(null); }
    return this.run(this.attPanel, this.api.listAttachments(this.attParent, this.attHref));
  }

  async uploadAttachment(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!this.attHref) { alert('Parent href required.'); input.value = ''; return; }
    if (!file) return;
    await this.run(this.attPanel,
      this.api.uploadAttachment(this.attParent, this.attHref, file, this.attDoctype || undefined));
    input.value = '';
  }

  pretty(v: unknown): string {
    if (v == null) return '';
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  }

  private async run<T>(
    panel: ReturnType<typeof signal<PanelState>>,
    obs: Observable<T>
  ): Promise<T | null> {
    panel.set({ status: 'loading' });
    try {
      const result = await firstValueFrom(obs);
      panel.set({ status: 'ok', payload: result });
      return result ?? null;
    } catch (e: any) {
      panel.set({ status: 'error', error: e?.error?.message ?? e?.message ?? String(e), payload: e?.error });
      return null;
    }
  }
}
