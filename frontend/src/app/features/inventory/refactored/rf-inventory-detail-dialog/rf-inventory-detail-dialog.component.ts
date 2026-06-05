import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfInventoryApiService } from '../services/rf-inventory-api.service';
import { RfInventoryStateService } from '../services/rf-inventory-state.service';
import { BradyPrinterModalService } from '../../../../shared/brady-printer-manager/brady-printer-modal.service';
import { QrCodeService } from '../../../../shared/qr-code/qr-code.service';
import { InventoryItemDto } from '../../../../models/inventory/inventory-item.model';

interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  attachmentType: string;
  base64Content: string;
  createdAt?: string;
}

interface UsageEntry {
  id: number;
  userName: string;
  userEmail: string;
  location: string;
  purpose: string;
  comments: string;
  scannedAt: string;
  returnedAt: string;
  eventType: string;
}

@Component({
  selector: 'app-rf-inventory-detail-dialog',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent],
  template: `
    <app-rf-popup-projection [isOpen]="true" (close)="close.emit()">
      <div class="detail-dialog">
        <div class="detail-header">
          <div class="detail-type-badge">{{ item().itemTypeName || 'Inventory' }}</div>
          <div class="detail-status" [attr.data-status]="item().statusName">{{ item().statusName }}</div>
          <div class="detail-actions">
            <button class="action-btn btn-edit" (click)="edit.emit(item())">Edit</button>
            <button class="action-btn btn-print" (click)="onPrint()">Print Label</button>
            <button class="action-btn btn-delete" (click)="onDelete()">Delete</button>
            <button class="action-btn" (click)="close.emit()">&times;</button>
          </div>
        </div>

        <div class="status-bar">
          <span class="status-label">Status:</span>
          @for (s of statuses; track s) {
            <button class="status-chip" [class.active]="item().statusName === s"
                    (click)="onChangeStatus(s)">{{ s }}</button>
          }
        </div>

        <h2 class="detail-title">{{ item().title }}</h2>

        <div class="detail-fields">
          @if (item().serialNumber) {
            <div class="field-row">
              <span class="field-label">Serial #</span>
              <span class="field-value">{{ item().serialNumber }}</span>
            </div>
          }
          @if (item().manufacturer || item().model) {
            <div class="field-row">
              <span class="field-label">Make / Model</span>
              <span class="field-value">{{ item().manufacturer }} {{ item().model }}</span>
            </div>
          }
          <div class="field-row">
            <span class="field-label">Home Location</span>
            <span class="field-value">{{ item().locationName || '—' }}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Current Location</span>
            <span class="field-value">{{ item().currentLocation || '—' }}</span>
          </div>
          @if (item().currentHolderName) {
            <div class="field-row">
              <span class="field-label">Held By</span>
              <span class="field-value">{{ item().currentHolderName }} <span class="muted">({{ item().currentHolderEmail }})</span></span>
            </div>
          }
          <div class="field-row">
            <span class="field-label">QR Token</span>
            <span class="field-value qr-token">{{ item().qrToken || '—' }}</span>
          </div>
          @if (item().description) {
            <div class="field-row full-width">
              <span class="field-label">Description</span>
              <div class="field-value notes">{{ item().description }}</div>
            </div>
          }
        </div>

        <!-- QR code display -->
        @if (item().qrToken) {
          <div class="qr-section">
            <h3>QR Code</h3>
            <canvas #qrCanvas class="qr-canvas"></canvas>
            <div class="qr-url">{{ qrUrl() }}</div>
          </div>
        }

        <!-- Usage history -->
        <div class="usage-section">
          <h3>Usage History
            @if (usage().length > 0) { <span class="muted">({{ usage().length }})</span> }
          </h3>
          @if (loadingUsage()) {
            <div class="loading">Loading...</div>
          } @else if (usage().length === 0) {
            <div class="no-usage">No usage records yet</div>
          } @else {
            <div class="usage-list">
              @for (u of usage(); track u.id) {
                <div class="usage-row">
                  <span class="usage-event" [class.checkin]="u.eventType === 'checkin'">
                    {{ u.eventType === 'checkin' ? 'IN' : 'OUT' }}
                  </span>
                  <div class="usage-details">
                    <div class="usage-meta">
                      <strong>{{ u.userName || '—' }}</strong>
                      <span class="muted">{{ formatDate(u.scannedAt) }}</span>
                    </div>
                    @if (u.location || u.purpose) {
                      <div class="usage-meta">
                        @if (u.location) { <span>{{ u.location }}</span> }
                        @if (u.purpose) { <span class="muted">— {{ u.purpose }}</span> }
                      </div>
                    }
                    @if (u.comments) {
                      <div class="usage-comment">{{ u.comments }}</div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Attachments -->
        <div class="attachments-section">
          <div class="att-header">
            <h3>Attachments
              @if (attachments().length > 0) { <span class="muted">({{ attachments().length }})</span> }
            </h3>
            <label class="action-btn btn-upload">
              + Add
              <input type="file" hidden multiple accept="image/*,.pdf,.doc,.docx" (change)="onFileSelected($event)">
            </label>
          </div>

          @if (uploading()) {<div class="loading">Uploading...</div>}
          @if (loadingAttachments()) {
            <div class="loading">Loading...</div>
          } @else if (attachments().length === 0) {
            <div class="no-attachments">No attachments</div>
          } @else {
            <div class="attachment-grid">
              @for (att of attachments(); track att.id) {
                <div class="attachment-card">
                  @if (isImage(att)) {
                    <img [src]="getImageSrc(att)" [alt]="att.fileName" class="attachment-img" (click)="openLightbox(att)">
                  } @else {
                    <div class="attachment-file">
                      <span class="file-icon">{{ getFileIcon(att) }}</span>
                      <span class="file-name">{{ att.fileName }}</span>
                    </div>
                  }
                  <div class="attachment-footer">
                    <span class="attachment-name">{{ att.fileName }}</span>
                    <button class="att-delete" (click)="onDeleteAttachment(att)" title="Remove">&times;</button>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        @if (confirmingDelete()) {
          <div class="confirm-overlay">
            <div class="confirm-card">
              <p>Delete this inventory item?</p>
              <p class="confirm-detail">{{ item().title }}</p>
              <div class="confirm-actions">
                <button class="action-btn" (click)="confirmingDelete.set(false)">Cancel</button>
                <button class="action-btn btn-delete" (click)="confirmDelete()">Delete</button>
              </div>
            </div>
          </div>
        }
      </div>
    </app-rf-popup-projection>

    @if (lightboxImage()) {
      <div class="lightbox" (click)="closeLightbox()">
        <img [src]="lightboxImage()!" alt="Full size" class="lightbox-img">
        <button class="lightbox-close" (click)="closeLightbox()">&times;</button>
      </div>
    }
  `,
  styles: [`
    .detail-dialog { padding: 20px; max-height: 80vh; overflow-y: auto; }
    .detail-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .detail-type-badge { font-size: 12px; font-weight: 600; text-transform: uppercase;
      padding: 4px 10px; border-radius: 4px; background: var(--accent-color); color: var(--header-text); }
    .detail-status { font-size: 12px; padding: 4px 10px; border-radius: 10px;
      background: var(--secondary-background); color: var(--secondary-text); }
    .detail-status[data-status="Available"] { background: #e8f5e9; color: #2e7d32; }
    .detail-status[data-status="Checked Out"] { background: #e3f2fd; color: #1565c0; }
    .detail-status[data-status="Missing"] { background: #ffebee; color: #c62828; }
    .detail-status[data-status="Retired"] { background: #eceff1; color: #546e7a; }
    .detail-actions { margin-left: auto; display: flex; gap: 6px; }
    .action-btn { padding: 5px 12px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 12px; }
    .action-btn:hover { background: var(--hover-background, rgba(0,0,0,0.04)); }
    .btn-edit { background: var(--accent-color); color: white; border-color: var(--accent-color); }
    .btn-print { background: #fff8e1; color: #f57f17; border-color: #ffe082; }
    .btn-delete { background: #ffebee; color: #c62828; border-color: #ef9a9a; }
    .btn-upload { display: inline-flex; align-items: center; }

    .status-bar { display: flex; align-items: center; gap: 6px; margin-bottom: 12px; flex-wrap: wrap; }
    .status-label { font-size: 12px; font-weight: 600; color: var(--secondary-text); }
    .status-chip { padding: 3px 10px; border: 1px solid var(--border-color); border-radius: 12px;
      background: var(--card-background); color: var(--secondary-text); cursor: pointer; font-size: 11px; }
    .status-chip:hover { border-color: var(--accent-color); }
    .status-chip.active { background: var(--accent-color); color: white; border-color: var(--accent-color); }

    .detail-title { font-size: 20px; font-weight: 600; color: var(--primary-text); margin: 0 0 16px; }
    .detail-fields { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .field-row { display: flex; gap: 12px; align-items: baseline; }
    .field-row.full-width { flex-direction: column; gap: 4px; }
    .field-label { font-size: 12px; font-weight: 600; color: var(--secondary-text); min-width: 110px;
      text-transform: uppercase; letter-spacing: 0.3px; }
    .field-value { font-size: 14px; color: var(--primary-text); }
    .field-value.qr-token { font-family: monospace; font-size: 13px; color: var(--accent-color); }
    .field-value.notes { background: var(--secondary-background); padding: 8px 12px; border-radius: 6px;
      white-space: pre-wrap; font-size: 13px; width: 100%; box-sizing: border-box; }
    .muted { color: var(--secondary-text); font-weight: 400; }

    .qr-section { background: var(--secondary-background); padding: 16px; border-radius: 8px;
      margin: 16px 0; text-align: center; }
    .qr-section h3 { margin: 0 0 12px; font-size: 14px; color: var(--secondary-text); }
    .qr-canvas { background: white; padding: 8px; border-radius: 4px; }
    .qr-url { font-size: 11px; color: var(--secondary-text); margin-top: 8px; word-break: break-all; }

    .usage-section { margin: 20px 0; }
    .usage-section h3, .attachments-section h3 { font-size: 14px; font-weight: 600;
      color: var(--primary-text); margin: 0 0 12px; }
    .loading, .no-usage, .no-attachments { font-size: 13px; color: var(--secondary-text); padding: 8px 0; }
    .usage-list { display: flex; flex-direction: column; gap: 8px; }
    .usage-row { display: flex; gap: 10px; padding: 10px; border: 1px solid var(--border-color); border-radius: 6px; }
    .usage-event { font-size: 10px; font-weight: 700; padding: 4px 8px; border-radius: 4px;
      background: #e3f2fd; color: #1565c0; align-self: flex-start; min-width: 32px; text-align: center; }
    .usage-event.checkin { background: #e8f5e9; color: #2e7d32; }
    .usage-details { flex: 1; }
    .usage-meta { display: flex; gap: 8px; font-size: 13px; align-items: baseline; }
    .usage-comment { background: var(--secondary-background); padding: 6px 10px; border-radius: 4px;
      font-size: 12px; margin-top: 4px; white-space: pre-wrap; }

    .att-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .attachment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .attachment-card { border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
      background: var(--card-background); }
    .attachment-img { width: 100%; height: 120px; object-fit: cover; cursor: pointer; display: block; }
    .attachment-file { display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 120px; background: var(--secondary-background); }
    .file-icon { font-size: 32px; }
    .file-name { font-size: 11px; color: var(--secondary-text); text-align: center; padding: 0 8px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
    .attachment-footer { display: flex; align-items: center; justify-content: space-between; padding: 4px 8px;
      border-top: 1px solid var(--border-color); }
    .attachment-name { font-size: 11px; color: var(--secondary-text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .att-delete { background: none; border: none; color: #c62828; cursor: pointer; font-size: 16px;
      padding: 0 4px; line-height: 1; }

    .confirm-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5);
      display: flex; align-items: center; justify-content: center; z-index: 10; border-radius: 8px; }
    .confirm-card { background: var(--primary-background, #fff); padding: 24px; border-radius: 12px;
      text-align: center; min-width: 260px; }
    .confirm-card p { margin: 0 0 8px; font-size: 15px; color: var(--primary-text); }
    .confirm-detail { font-size: 13px; color: var(--secondary-text); font-style: italic; }
    .confirm-actions { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }

    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.9); display: flex;
      align-items: center; justify-content: center; z-index: 10000; cursor: pointer; }
    .lightbox-img { max-width: 90vw; max-height: 90vh; object-fit: contain; cursor: default; }
    .lightbox-close { position: fixed; top: 16px; right: 16px; background: none; border: none;
      color: white; font-size: 36px; cursor: pointer; z-index: 10001; }
  `]
})
export class RfInventoryDetailDialogComponent implements OnInit {
  item = input.required<InventoryItemDto>();
  close = output<void>();
  edit = output<InventoryItemDto>();
  deleted = output<number>();

  private apiService = inject(RfInventoryApiService);
  private stateService = inject(RfInventoryStateService);
  private bradyModal = inject(BradyPrinterModalService);
  private qrCodeService = inject(QrCodeService);

  attachments = signal<Attachment[]>([]);
  usage = signal<UsageEntry[]>([]);
  loadingAttachments = signal(false);
  loadingUsage = signal(false);
  uploading = signal(false);
  lightboxImage = signal<string | null>(null);
  confirmingDelete = signal(false);

  readonly statuses = ['Available', 'Checked Out', 'Missing', 'Retired'];

  qrUrl(): string {
    return `https://jgportal.jpowerusa.com/qr/inv/${this.item().qrToken}`;
  }

  ngOnInit(): void {
    this.loadAttachments();
    this.loadUsage();
    setTimeout(() => this.renderQr(), 100);
  }

  private renderQr(): void {
    if (!this.item().qrToken) return;
    const canvas = document.querySelector('.qr-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    this.qrCodeService.toCanvas(canvas, this.qrUrl(), { width: 160, margin: 1 }).catch((e: any) =>
      console.warn('[Inventory] QR render failed:', e?.message));
  }

  private loadAttachments(): void {
    const id = this.item().id;
    if (!id) return;
    this.loadingAttachments.set(true);
    this.apiService.getAttachments(id).subscribe({
      next: res => {
        const raw: Attachment[] = res.responseData || [];
        const seen = new Set<string>();
        this.attachments.set(raw.filter(a => {
          const key = a.fileName || String(a.id);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        }));
        this.loadingAttachments.set(false);
      },
      error: () => this.loadingAttachments.set(false)
    });
  }

  private loadUsage(): void {
    const id = this.item().id;
    if (!id) return;
    this.loadingUsage.set(true);
    this.apiService.getUsage(id).subscribe({
      next: res => {
        this.usage.set(res.responseData || []);
        this.loadingUsage.set(false);
      },
      error: () => this.loadingUsage.set(false)
    });
  }

  onChangeStatus(status: string): void {
    if (!this.item().id) return;
    this.apiService.changeStatus(this.item().id!, status).subscribe({
      next: () => this.stateService.loadAll(),
      error: err => console.warn('[Inventory] Status change failed:', err.message)
    });
  }

  onPrint(): void {
    const i = this.item();
    this.bradyModal.openWithData({
      line1: i.serialNumber || i.title || '',
      line2: [i.manufacturer, i.model].filter(Boolean).join(' '),
      withQr: true,
      qrData: i.qrToken ? `https://jgportal.jpowerusa.com/qr/inv/${i.qrToken}` : undefined,
    });
  }

  onDelete(): void { this.confirmingDelete.set(true); }

  confirmDelete(): void {
    const id = this.item().id;
    if (!id) return;
    this.apiService.delete(id).subscribe({
      next: () => {
        this.confirmingDelete.set(false);
        this.deleted.emit(id);
        this.close.emit();
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.item().id) return;
    this.uploading.set(true);
    const files = Array.from(input.files);
    let remaining = files.length;
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        this.apiService.uploadAttachment(this.item().id!, {
          fileName: file.name, contentType: file.type, base64Content: base64
        }).subscribe({
          next: () => {
            remaining--;
            if (remaining === 0) { this.uploading.set(false); this.loadAttachments(); }
          },
          error: () => { remaining--; if (remaining === 0) this.uploading.set(false); }
        });
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  onDeleteAttachment(att: Attachment): void {
    if (!this.item().id) return;
    this.apiService.deleteAttachment(this.item().id!, att.id).subscribe({
      next: () => this.attachments.set(this.attachments().filter(a => a.id !== att.id))
    });
  }

  isImage(att: Attachment): boolean { return att.contentType?.startsWith('image/') ?? false; }

  getImageSrc(att: Attachment): string {
    if (!att.base64Content) return '';
    return att.base64Content.startsWith('data:')
      ? att.base64Content
      : `data:${att.contentType};base64,${att.base64Content}`;
  }

  getFileIcon(att: Attachment): string {
    if (att.contentType?.includes('pdf')) return '\u{1F4C4}';
    return '\u{1F4CE}';
  }

  openLightbox(att: Attachment): void { this.lightboxImage.set(this.getImageSrc(att)); }
  closeLightbox(): void { this.lightboxImage.set(null); }

  formatDate(iso: string): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString();
    } catch { return iso; }
  }
}
