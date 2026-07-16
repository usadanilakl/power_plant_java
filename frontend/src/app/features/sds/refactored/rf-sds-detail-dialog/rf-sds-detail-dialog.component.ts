import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfSdsApiService } from '../services/rf-sds-api.service';
import { RfSdsStateService } from '../services/rf-sds-state.service';
import { RfSdsPrintService } from '../services/rf-sds-print.service';
import { SdsChemicalDto } from '../../../../models/sds/sds-chemical.model';

interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  attachmentType: string;
  base64Content: string;
  createdAt?: string;
}

@Component({
  selector: 'app-rf-sds-detail-dialog',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent],
  template: `
    <app-rf-popup-projection [isOpen]="true" (close)="close.emit()">
      <div class="detail-dialog">
        <div class="detail-header">
          <div class="detail-type-badge">SDS</div>
          <div class="detail-status" [attr.data-status]="item().statusName">{{ item().statusName }}</div>
          <div class="detail-actions">
            @if (item().statusName === 'Incoming' || item().statusName === 'Pending') {
              <button class="action-btn btn-process" (click)="onProcess()">Process</button>
            }
            <button class="action-btn btn-edit" (click)="edit.emit(item())">Edit</button>
            <button class="action-btn btn-print" (click)="onPrintTitleSheet()">Print Title Sheet</button>
            @if (item().sharePointUrl) {
              <a class="action-btn btn-sp" [href]="item().sharePointUrl" target="_blank" rel="noopener noreferrer"
                 title="Open this item in SharePoint">Open in SharePoint</a>
            }
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

        <h2 class="detail-title">{{ item().primaryName || '(unnamed chemical)' }}</h2>

        <div class="detail-fields">
          @if (names().length > 1) {
            <div class="field-row full-width">
              <span class="field-label">All Names</span>
              <div class="field-value">
                <span class="chip" *ngFor="let n of names()">{{ n }}</span>
              </div>
            </div>
          }
          <div class="field-row full-width">
            <span class="field-label">Locations</span>
            <div class="field-value">
              @if (locations().length > 0) {
                <span class="chip" *ngFor="let l of locations()">{{ l }}</span>
              } @else { <span class="muted">—</span> }
            </div>
          </div>
          <div class="field-row">
            <span class="field-label">Book / Section</span>
            <span class="field-value">{{ item().address || '— (not yet filed)' }}</span>
          </div>
          @if (item().sectionNumber != null) {
            <div class="filing-reminder">
              &#9888; Before filing this sheet, confirm the last section already used in
              <strong>Book {{ item().bookNumber }}</strong>. If Section {{ item().sectionNumber }} is
              already taken, bump the Section (Edit) and save before filing the paper.
            </div>
          }
          @if (item().processedByName) {
            <div class="field-row">
              <span class="field-label">Processed By</span>
              <span class="field-value">{{ item().processedByName }}
                @if (item().processedByEmail) { <span class="muted">({{ item().processedByEmail }})</span> }
              </span>
            </div>
          }
          @if (item().notes) {
            <div class="field-row full-width">
              <span class="field-label">Notes</span>
              <div class="field-value notes">{{ item().notes }}</div>
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
                    <div class="attachment-file" (click)="viewAttachment(att)" [title]="'Click to view ' + att.fileName">
                      <span class="file-icon">{{ getFileIcon(att) }}</span>
                      <span class="file-name">{{ att.fileName }}</span>
                    </div>
                  }
                  <div class="attachment-footer">
                    <span class="attachment-name">{{ att.fileName }}</span>
                    <div class="att-actions">
                      @if (!isImage(att)) {
                        <button class="att-btn" (click)="viewAttachment(att)" title="Open in new window">View</button>
                      }
                      <button class="att-delete" (click)="onDeleteAttachment(att)" title="Remove">&times;</button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        @if (confirmingDelete()) {
          <div class="confirm-overlay">
            <div class="confirm-card">
              <p>Delete this SDS chemical?</p>
              <p class="confirm-detail">{{ item().primaryName }}</p>
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
    .detail-status[data-status="Incoming"] { background: var(--status-incomplete); color: var(--primary-text); }
    .detail-status[data-status="Pending"] { background: var(--status-in-progress); color: var(--primary-text); }
    .detail-status[data-status="Filed"] { background: var(--status-complete); color: var(--primary-text); }
    .detail-status[data-status="Removed"] { background: var(--status-not-processed); color: var(--primary-text); }
    .detail-actions { margin-left: auto; display: flex; gap: 6px; }
    .action-btn { padding: 5px 12px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 12px; }
    .action-btn:hover { background: var(--hover-background, rgba(0,0,0,0.04)); }
    .btn-edit { background: var(--accent-color); color: white; border-color: var(--accent-color); }
    .btn-process { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; font-weight: 600; }
    .btn-print { background: #fff8e1; color: #f57f17; border-color: #ffe082; }
    .btn-sp { background: #e3f2fd; color: #1565c0; border-color: #90caf9; text-decoration: none;
      display: inline-flex; align-items: center; }
    .btn-sp:hover { background: #bbdefb; }
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
    .field-value { font-size: 14px; color: var(--primary-text); display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { background: var(--secondary-background); padding: 3px 10px; border-radius: 12px; font-size: 13px; }
    .field-value.notes { background: var(--secondary-background); padding: 8px 12px; border-radius: 6px;
      white-space: pre-wrap; font-size: 13px; width: 100%; box-sizing: border-box; display: block; }
    .muted { color: var(--secondary-text); font-weight: 400; }
    .filing-reminder { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80;
      border-radius: 6px; padding: 8px 12px; font-size: 12px; line-height: 1.4; margin: 4px 0 8px; }

    .attachments-section h3 { font-size: 14px; font-weight: 600; color: var(--primary-text); margin: 0 0 12px; }
    .loading, .no-attachments { font-size: 13px; color: var(--secondary-text); padding: 8px 0; }
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
      border-top: 1px solid var(--border-color); gap: 6px; }
    .attachment-name { font-size: 11px; color: var(--secondary-text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .att-actions { display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
    .att-btn { background: none; border: 1px solid var(--border-color); color: var(--primary-text);
      cursor: pointer; font-size: 11px; padding: 2px 8px; border-radius: 3px; line-height: 1.4; }
    .att-btn:hover { background: var(--secondary-background); }
    .att-delete { background: none; border: none; color: #c62828; cursor: pointer; font-size: 16px;
      padding: 0 4px; line-height: 1; }
    .attachment-file { cursor: pointer; }
    .attachment-file:hover { background: var(--secondary-background); }

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
export class RfSdsDetailDialogComponent implements OnInit {
  item = input.required<SdsChemicalDto>();
  close = output<void>();
  edit = output<SdsChemicalDto>();
  deleted = output<number>();

  private apiService = inject(RfSdsApiService);
  private stateService = inject(RfSdsStateService);
  private printService = inject(RfSdsPrintService);

  attachments = signal<Attachment[]>([]);
  loadingAttachments = signal(false);
  uploading = signal(false);
  lightboxImage = signal<string | null>(null);
  confirmingDelete = signal(false);

  readonly statuses = ['Incoming', 'Pending', 'Filed', 'Removed'];

  names(): string[] {
    return (this.item().names || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  locations(): string[] {
    return (this.item().locations || '').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  ngOnInit(): void {
    this.loadAttachments();
  }

  onPrintTitleSheet(): void {
    this.printService.printTitleSheet(this.item());
  }

  onProcess(): void {
    this.stateService.openWizard(this.item());
    this.close.emit();
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

  onChangeStatus(status: string): void {
    if (!this.item().id) return;
    this.apiService.changeStatus(this.item().id!, status).subscribe({
      next: () => this.stateService.loadAll(),
      error: err => console.warn('[SDS] Status change failed:', err.message)
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

  /**
   * Open the attachment in a new window. Builds a Blob URL from the base64 content so the file
   * is served with the right MIME type (the browser's built-in PDF viewer renders it inline for
   * application/pdf). Used as a "View" affordance on non-image attachments.
   */
  viewAttachment(att: Attachment): void {
    if (!att.base64Content) return;
    try {
      const bytes = atob(att.base64Content);
      const buf = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
      const blob = new Blob([buf], { type: att.contentType || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      // Revoke the blob URL after a delay so the new window has time to load it.
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      if (!w) console.warn('[SDS] window.open blocked; falling back to in-place navigation');
    } catch (err) {
      console.error('[SDS] viewAttachment failed:', err);
    }
  }
}
