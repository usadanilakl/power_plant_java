import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ServerApiService } from '../../services/server-api.service';
import { ServerStatusService } from '../../services/server-status.service';
import { SubmissionOrchestratorService } from '../../services/submission-orchestrator.service';
import { UserSetupService } from '../../services/user-setup.service';
import { AuthService } from '../../auth/auth.service';
import { QrScannerService } from '../../shared/qr-scanner/qr-scanner.service';
import { QrScannerComponent } from '../../shared/qr-scanner/qr-scanner.component';
import { ReactiveFormComponent } from '../../shared/forms/reactive-form/reactive-form.component';
import { FormField } from '../../models/inputs/form-field.model';
import { inventoryFormFields, inventoryUsageFormFields } from '../../models/inventory/inventory-item.model';
import { Option } from '../../models/inputs/option.model';
import { BradyPrinterModalService } from '../../shared/brady-printer-manager/brady-printer-modal.service';

type ViewMode = 'select' | 'new' | 'edit' | 'scan-result' | 'list';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormComponent, QrScannerComponent],
  template: `
    @if (qrScannerService.isScannerVisible()) {
      <app-qr-scanner></app-qr-scanner>
    }

    @if (submitState() === 'submitting') {
      <div class="overlay">
        <div class="overlay-card">
          <div class="spinner"></div>
          <p class="overlay-text">Working...</p>
        </div>
      </div>
    }
    @if (submitState() === 'success') {
      <div class="overlay">
        <div class="overlay-card success">
          <span class="overlay-icon">&#10003;</span>
          <p class="overlay-text">{{ submitMessage() }}</p>
          <button class="overlay-btn" (click)="dismissResult()">OK</button>
        </div>
      </div>
    }
    @if (submitState() === 'error') {
      <div class="overlay">
        <div class="overlay-card error">
          <span class="overlay-icon">&#10007;</span>
          <p class="overlay-text">{{ submitMessage() }}</p>
          <button class="overlay-btn" (click)="dismissResult()">OK</button>
        </div>
      </div>
    }

    @if (mode() === 'select') {
      <div class="action-selector">
        <h2 class="action-title">Inventory</h2>
        <p class="action-subtitle">Track tools and equipment with QR codes</p>
        <div class="action-cards">
          <button class="action-card card-scan" (click)="openScanner()">
            <svg class="card-icon" viewBox="0 0 24 24"><rect x="3" y="3" width="6" height="6" fill="none" stroke="#1976d2" stroke-width="2"/><rect x="15" y="3" width="6" height="6" fill="none" stroke="#1976d2" stroke-width="2"/><rect x="3" y="15" width="6" height="6" fill="none" stroke="#1976d2" stroke-width="2"/><rect x="11" y="11" width="2" height="10" fill="#1976d2"/><rect x="11" y="3" width="2" height="6" fill="#1976d2"/></svg>
            <span class="action-card-label">Scan Item</span>
            <span class="action-card-desc">Check out / check in by QR</span>
          </button>
          <button class="action-card card-new" (click)="selectNew()">
            <svg class="card-icon" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" stroke="#fb8c00" stroke-width="3" fill="none"/></svg>
            <span class="action-card-label">Add New Item</span>
            <span class="action-card-desc">Register a tool or part</span>
          </button>
          <button class="action-card card-list" (click)="openList()">
            <svg class="card-icon" viewBox="0 0 24 24"><rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="#26a69a" stroke-width="2"/><path d="M9 8h6M9 12h6M9 16h4" stroke="#26a69a" stroke-width="2"/></svg>
            <span class="action-card-label">View Inventory</span>
            <span class="action-card-desc">{{ serverStatus.isOnline() ? 'Browse all items' : 'View saved items' }}</span>
          </button>
        </div>
      </div>
    }

    @if (mode() === 'new') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">Add New Item</span>
        </div>
        @if (fields().length > 0) {
          <app-reactive-form
            [fields]="fields()"
            [entity]="draftEntity()"
            [layout]="'column'"
            [submitButtonText]="'Save Item'"
            [showAddEditOption]="false"
            (formValueChange)="onDraftChange($event)"
            (formSubmit)="onSubmit($event)">
          </app-reactive-form>
        }
      </div>
    }

    @if (mode() === 'scan-result') {
      <div class="form-wrapper">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">{{ scannedItem()?.title || 'Item' }}</span>
        </div>
        @if (scannedItem()) {
          <div class="item-summary">
            <div class="item-status-badge" [attr.data-status]="scannedItem()!.statusName">
              {{ scannedItem()!.statusName }}
            </div>
            <h3>{{ scannedItem()!.title }}</h3>
            @if (scannedItem()!.serialNumber) { <p class="muted">Serial: {{ scannedItem()!.serialNumber }}</p> }
            @if (scannedItem()!.manufacturer || scannedItem()!.model) {
              <p class="muted">{{ scannedItem()!.manufacturer }} {{ scannedItem()!.model }}</p>
            }
            @if (scannedItem()!.currentHolderName) {
              <p>Currently with: <strong>{{ scannedItem()!.currentHolderName }}</strong></p>
              <p class="muted">Last location: {{ scannedItem()!.currentLocation || '—' }}</p>
            }
          </div>

          <div class="print-row">
            @if (bluetoothAvailable) {
              <button class="btn-print" (click)="printLabel(scannedItem())">
                <svg viewBox="0 0 24 24" width="18" height="18" style="vertical-align: middle; margin-right: 6px;">
                  <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                </svg>
                Print Label
              </button>
            } @else {
              <span class="print-unavailable">Printing not supported on this device</span>
            }
          </div>

          <h4 class="usage-form-title">Record Usage</h4>
          <app-reactive-form
            [fields]="usageFields()"
            [entity]="usageDraft()"
            [layout]="'column'"
            [submitButtonText]="'Submit'"
            [showAddEditOption]="false"
            (formSubmit)="onUsageSubmit($event)">
          </app-reactive-form>
        }
      </div>
    }

    @if (mode() === 'list') {
      <div class="form-wrapper" style="max-width: 900px;">
        <div class="sticky-header">
          <button class="back-button" (click)="backToSelect()">&#x2190; Back</button>
          <span class="header-title">Inventory</span>
        </div>
        @if (loadingList()) {
          <div class="loading-row"><div class="spinner"></div> Loading...</div>
        } @else if (items().length === 0) {
          <div class="empty">No items found.</div>
        } @else {
          <div class="items-list">
            @for (item of items(); track item.id || $index) {
              <div class="list-item-row">
                <button class="list-item" (click)="onItemClick(item)">
                  <div class="list-item-main">
                    <div class="list-item-title">{{ item.title }}</div>
                    <div class="list-item-meta">
                      @if (item.serialNumber) { <span>{{ item.serialNumber }}</span> }
                      @if (item.manufacturer || item.model) { <span>{{ item.manufacturer }} {{ item.model }}</span> }
                    </div>
                  </div>
                  <div class="status-badge" [attr.data-status]="item.statusName">{{ item.statusName }}</div>
                </button>
                @if (bluetoothAvailable && item.qrToken) {
                  <button class="list-item-print" (click)="printLabel(item); $event.stopPropagation()" title="Print label">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="currentColor" d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                    </svg>
                  </button>
                }
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: [`
    :host { display: block; height: 100%; overflow-y: auto; overflow-x: hidden; }
    .action-selector { display: flex; flex-direction: column; align-items: center; padding: 2rem 1rem; }
    .action-title { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.25rem; }
    .action-subtitle { font-size: 1rem; color: var(--secondary-text, #888); margin: 0 0 2rem; }
    .action-cards { display: grid; grid-template-columns: 1fr; gap: 1rem; width: 100%; max-width: 400px; }
    .action-card { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 1.4rem 0.75rem;
      background: var(--card-background); border: 2px solid var(--border-color);
      border-radius: 12px; cursor: pointer; min-height: 120px; font-family: inherit; color: var(--primary-text); }
    .action-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .card-scan { border-color: #1976d2; }
    .card-new { border-color: #fb8c00; }
    .card-list { border-color: #26a69a; }
    .card-icon { width: 40px; height: 40px; }
    .action-card-label { font-size: 1.1rem; font-weight: 600; text-align: center; }
    .action-card-desc { font-size: 0.85rem; color: var(--secondary-text, #888); text-align: center; }
    .form-wrapper { max-width: 600px; margin: 0 auto; padding: 0 16px 16px; box-sizing: border-box; width: 100%; }
    .sticky-header { display: flex; align-items: center; gap: 12px; padding: 12px 0; position: sticky; top: 0;
      background: var(--primary-background); z-index: 10; }
    .back-button { background: none; border: none; color: var(--accent-color); cursor: pointer; font-size: 14px; font-family: inherit; }
    .header-title { font-size: 16px; font-weight: 600; }
    .item-summary { background: var(--card-background); border: 1px solid var(--border-color);
      border-radius: 8px; padding: 16px; margin-bottom: 16px; }
    .item-summary h3 { margin: 8px 0 4px; }
    .muted { color: var(--secondary-text); font-size: 13px; margin: 4px 0; }
    .item-status-badge { display: inline-block; font-size: 11px; padding: 4px 10px; border-radius: 10px; font-weight: 600; }
    .usage-form-title { margin-top: 16px; font-size: 14px; }
    .loading-row { display: flex; align-items: center; gap: 12px; padding: 24px; justify-content: center; color: var(--secondary-text); }
    .empty { padding: 32px; text-align: center; color: var(--secondary-text); }
    .items-list { display: flex; flex-direction: column; gap: 8px; }
    .list-item-row { display: flex; align-items: stretch; gap: 8px; }
    .list-item { flex: 1; display: flex; align-items: center; gap: 12px; padding: 12px 16px;
      border: 1px solid var(--border-color); border-radius: 8px; background: var(--card-background);
      cursor: pointer; text-align: left; font-family: inherit; color: var(--primary-text); }
    .list-item:hover { border-color: var(--accent-color); }
    .list-item-print {
      display: flex; align-items: center; justify-content: center;
      width: 48px; min-height: 44px;
      border: 1px solid var(--border-color); border-radius: 8px;
      background: var(--card-background); color: var(--accent-color);
      cursor: pointer; padding: 0;
    }
    .list-item-print:hover { border-color: var(--accent-color); background: var(--hover-background); }
    .print-row { margin: 12px 0; }
    .btn-print {
      display: inline-flex; align-items: center;
      padding: 10px 16px;
      background: var(--accent-color); color: #ffffff;
      border: none; border-radius: 8px;
      font-size: 14px; font-weight: 500;
      cursor: pointer; min-height: 44px;
    }
    .btn-print:hover { background: var(--accent-color-hover); }
    .print-unavailable {
      display: inline-block;
      padding: 8px 12px;
      font-size: 12px; color: var(--secondary-text);
      background: var(--secondary-background);
      border-radius: 6px;
    }
    .list-item-main { flex: 1; min-width: 0; }
    .list-item-title { font-size: 15px; font-weight: 500; }
    .list-item-meta { font-size: 12px; color: var(--secondary-text); display: flex; gap: 10px; flex-wrap: wrap; }
    .status-badge, .item-status-badge { font-size: 11px; padding: 3px 10px; border-radius: 10px; white-space: nowrap; }
    .status-badge[data-status="Available"], .item-status-badge[data-status="Available"] { background: #e8f5e9; color: #2e7d32; }
    .status-badge[data-status="Checked Out"], .item-status-badge[data-status="Checked Out"] { background: #e3f2fd; color: #1565c0; }
    .status-badge[data-status="Missing"], .item-status-badge[data-status="Missing"] { background: #ffebee; color: #c62828; }
    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex;
      align-items: center; justify-content: center; z-index: 9999; }
    .overlay-card { background: var(--primary-background, #fff); border-radius: 16px; padding: 32px;
      text-align: center; min-width: 280px; max-width: 90vw; box-shadow: 0 8px 32px rgba(0,0,0,0.3); }
    .overlay-card.success .overlay-icon { color: #4caf50; }
    .overlay-card.error .overlay-icon { color: #f44336; }
    .overlay-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .overlay-text { font-size: 16px; margin: 0 0 16px; }
    .overlay-btn { padding: 10px 32px; background: var(--accent-color); color: white; border: none;
      border-radius: 8px; font-size: 15px; cursor: pointer; font-family: inherit; }
    .spinner { width: 40px; height: 40px; border: 4px solid var(--border-color, #ccc);
      border-top-color: var(--accent-color); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class InventoryComponent implements OnInit {
  private serverApi = inject(ServerApiService);
  serverStatus = inject(ServerStatusService);
  private authService = inject(AuthService);
  private orchestrator = inject(SubmissionOrchestratorService);
  private userSetup = inject(UserSetupService);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  qrScannerService = inject(QrScannerService);
  private bradyModal = inject(BradyPrinterModalService);

  // Web Bluetooth is unavailable on iOS Safari / any WebKit-based iOS browser.
  // Show a helpful hint instead of a dead button on those devices.
  bluetoothAvailable = typeof navigator !== 'undefined' && !!(navigator as any).bluetooth;

  mode = signal<ViewMode>('select');
  fields = signal<FormField[]>([]);
  usageFields = signal<FormField[]>(inventoryUsageFormFields());
  draftEntity = signal<any>({});
  usageDraft = signal<any>({ eventType: 'checkout' });
  scannedItem = signal<any>(null);
  items = signal<any[]>([]);
  loadingList = signal(false);
  submitState = signal<SubmitState>('idle');
  submitMessage = signal('');

  private typeOptions: Option[] = [];

  ngOnInit(): void {
    this.loadTypes();
    this.fields.set(inventoryFormFields(this.typeOptions));

    // Deep link: /inventory/form?scan={qrToken} — opened by scanning the QR
    // label with a phone's native camera (hub redirects /qr/inv/{token} here).
    const scanToken = this.route.snapshot.queryParamMap.get('scan');
    if (scanToken) {
      this.handleScan(scanToken);
    }
  }

  private loadTypes(): void {
    const cached = localStorage.getItem('pwa_inventory_types');
    if (cached) {
      try { this.setTypeOptions(JSON.parse(cached)); } catch {}
    }
    if (this.typeOptions.length === 0) {
      this.setTypeOptions([
        { id: 0, name: 'Tools' },
        { id: 0, name: 'Safety Equipment' },
        { id: 0, name: 'Spare Parts' },
        { id: 0, name: 'Test Equipment' }
      ]);
    }
    this.serverApi.getInventoryTypes().subscribe({
      next: types => {
        if (types && types.length > 0) {
          this.setTypeOptions(types);
          localStorage.setItem('pwa_inventory_types', JSON.stringify(types));
        }
      },
      error: () => {
        // Server offline — fall back to static JSON published to GitHub Pages
        this.http.get<{ id: number; name: string }[]>('data/inventory-types.json').subscribe({
          next: types => {
            if (types && types.length > 0) {
              this.setTypeOptions(types);
              localStorage.setItem('pwa_inventory_types', JSON.stringify(types));
            }
          },
          error: () => { /* already showing cached/default values */ }
        });
      }
    });
  }

  private setTypeOptions(types: { id: number; name: string }[]): void {
    this.typeOptions = types.map(t => ({ value: t.name, label: t.name }));
    this.fields.set(inventoryFormFields(this.typeOptions));
  }

  selectNew(): void {
    this.fields.set(inventoryFormFields(this.typeOptions));
    this.draftEntity.set({});
    this.mode.set('new');
  }

  openScanner(): void {
    this.qrScannerService.openScanner().subscribe(result => this.handleScan(result));
  }

  private extractQrToken(scanned: string): string {
    const s = (scanned || '').trim();
    // Format A: current PWA labels — https://<pwa>/inventory/form?scan=<token>
    try {
      const url = new URL(s);
      const scan = url.searchParams.get('scan');
      if (scan) return decodeURIComponent(scan);
    } catch { /* not a URL — fall through */ }
    // Format B: legacy/desktop hub URL — https://<hub>/qr/inv/<token>
    const legacyMatch = s.match(/qr\/inv\/([^/?#]+)/i);
    if (legacyMatch) return decodeURIComponent(legacyMatch[1]);
    // Format C: bare token
    return s;
  }

  private handleScan(result: string): void {
    // Extract token from the scanned payload. Labels printed by this app encode
    //   https://<pwa>/inventory/form?scan=<token>
    // Older/desktop labels encode
    //   https://<hub>/qr/inv/<token>
    // The in-app ZXing scanner passes the raw string here (no router involved),
    // so both must be parsed. Fall back to trimmed raw for a bare token.
    const token = this.extractQrToken(result);

    this.serverApi.getInventoryItemByQr(token).subscribe({
      next: item => {
        if (item) {
          this.scannedItem.set(item);
          // Default eventType based on current status
          this.usageDraft.set({
            eventType: item.statusName === 'Checked Out' ? 'checkin' : 'checkout',
            location: item.currentLocation || ''
          });
          this.mode.set('scan-result');
        } else {
          alert('Item not found for QR token: ' + token);
        }
      },
      error: () => alert('Could not look up item. Server may be offline.')
    });
  }

  openList(): void {
    this.mode.set('list');
    if (!this.authService.isLoggedIn() || !this.serverStatus.isOnline()) {
      this.items.set([]);
      return;
    }
    this.loadingList.set(true);
    this.serverApi.getActiveInventoryItems().subscribe({
      next: items => {
        this.items.set(items || []);
        this.loadingList.set(false);
      },
      error: () => {
        this.items.set([]);
        this.loadingList.set(false);
      }
    });
  }

  onItemClick(item: any): void {
    // Open scan-result view as if scanned
    this.scannedItem.set(item);
    this.usageDraft.set({
      eventType: item.statusName === 'Checked Out' ? 'checkin' : 'checkout',
      location: item.currentLocation || ''
    });
    this.mode.set('scan-result');
  }

  backToSelect(): void {
    this.mode.set('select');
    this.scannedItem.set(null);
  }

  onDraftChange(formData: any): void {
    try {
      const { attachments, ...storable } = formData;
      localStorage.setItem('pwa_inventory_draft', JSON.stringify(storable));
    } catch {}
  }

  onSubmit(formData: any): void {
    this.submitState.set('submitting');
    const userData = this.userSetup.getUserData();

    const payload = {
      localUuid: crypto.randomUUID(),
      itemTypeName: formData.itemTypeName || '',
      statusName: 'Available',
      title: formData.title || '',
      description: formData.description || '',
      serialNumber: formData.serialNumber || '',
      manufacturer: formData.manufacturer || '',
      model: formData.model || '',
      locationName: formData.locationName || '',
      submitterName: userData?.name || '',
      submitterEmail: userData?.email || '',
      submitterPhone: userData?.phone || '',
      attachments: formData.attachments || []
    };

    this.orchestrator.submitInventoryItem(payload).subscribe({
      next: result => {
        if (result.success) {
          localStorage.removeItem('pwa_inventory_draft');
          this.submitState.set('success');
          this.submitMessage.set(result.message || 'Item created successfully');
        } else {
          this.submitState.set('error');
          this.submitMessage.set(result.message || 'Submission failed');
        }
      },
      error: () => {
        this.submitState.set('error');
        this.submitMessage.set('Submission failed. Item saved locally.');
      }
    });
  }

  onUsageSubmit(formData: any): void {
    if (!this.scannedItem()) return;
    this.submitState.set('submitting');
    const userData = this.userSetup.getUserData();

    const payload = {
      localUuid: crypto.randomUUID(),
      qrToken: this.scannedItem().qrToken,
      inventoryItemId: this.scannedItem().id,
      userName: userData?.name || '',
      userEmail: userData?.email || '',
      location: formData.location || '',
      purpose: formData.purpose || '',
      comments: formData.comments || '',
      eventType: formData.eventType || 'checkout',
      scannedAt: new Date().toISOString()
    };

    this.orchestrator.recordInventoryUsage(payload).subscribe({
      next: result => {
        if (result.success) {
          this.submitState.set('success');
          this.submitMessage.set('Usage recorded.');
        } else {
          this.submitState.set('error');
          this.submitMessage.set(result.message || 'Failed to record usage.');
        }
      },
      error: () => {
        this.submitState.set('error');
        this.submitMessage.set('Failed to record usage.');
      }
    });
  }

  dismissResult(): void {
    const wasSuccess = this.submitState() === 'success';
    this.submitState.set('idle');
    this.submitMessage.set('');
    if (wasSuccess) this.backToSelect();
  }

  /**
   * Open the Brady printer modal pre-loaded with this item's label data.
   * Line 1 = serial/title, line 2 = manufacturer + model. QR encodes the
   * PWA deep-link so a phone camera scan reopens this same item.
   */
  printLabel(item: any): void {
    if (!item) return;
    const line1 = item.serialNumber || item.title || '';
    const line2 = [item.manufacturer, item.model].filter(Boolean).join(' ');
    // encodeURIComponent guards against future qrToken formats that contain
    // '&', '#', '+', or non-ASCII — any of which would break the scan URL
    // and can never be corrected on labels that are already printed.
    const qrData = item.qrToken
      ? `https://jacksongeneration.github.io/permits/inventory/form?scan=${encodeURIComponent(item.qrToken)}`
      : undefined;
    this.bradyModal.openWithData({ line1, line2, withQr: !!qrData, qrData });
  }
}
