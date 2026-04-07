import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfFieldListApiService } from '../services/rf-field-list-api.service';
import { RfFieldListStateService } from '../services/rf-field-list-state.service';
import { FieldListItemDto } from '../../../../models/field-list/field-list-item.model';

interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  attachmentType: string;
  base64Content: string;
  createdAt?: string;
}

@Component({
  selector: 'app-rf-field-list-detail-dialog',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent],
  template: `
    <app-rf-popup-projection [isOpen]="true" (close)="close.emit()">
      <div class="detail-dialog">
        <div class="detail-header">
          <div class="detail-type-badge">{{ item().listTypeName }}</div>
          <div class="detail-status" [attr.data-status]="item().statusName">{{ item().statusName }}</div>
          <div class="detail-actions">
            <button class="action-btn btn-edit" (click)="edit.emit(item())">Edit</button>
            @if (item().statusName !== 'Closed') {
              <button class="action-btn btn-close-item" (click)="onChangeStatus('Closed')">Close Item</button>
            }
            @if (item().statusName === 'Closed') {
              <button class="action-btn" (click)="onChangeStatus('Open')">Reopen</button>
            }
            <button class="action-btn btn-delete" (click)="onDelete()">Delete</button>
            <button class="action-btn" (click)="close.emit()">&times;</button>
          </div>
        </div>

        <!-- Status change bar -->
        <div class="status-bar">
          <span class="status-label">Status:</span>
          @for (s of statuses; track s) {
            <button class="status-chip" [class.active]="item().statusName === s"
                    (click)="onChangeStatus(s)">{{ s }}</button>
          }
        </div>

        <h2 class="detail-title">{{ item().title }}</h2>

        <div class="detail-fields">
          <div class="field-row">
            <span class="field-label">Date / Time</span>
            <span class="field-value">{{ item().dateObserved }} {{ item().timeObserved }}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Location</span>
            <span class="field-value">{{ item().locationName }} {{ item().specificLocation ? '— ' + item().specificLocation : '' }}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Equipment</span>
            <span class="field-value">{{ item().equipmentTag || '—' }}</span>
          </div>
          <div class="field-row">
            <span class="field-label">Submitter</span>
            <span class="field-value">{{ item().submitterName || item().createdBy || '—' }}</span>
          </div>
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
              @if (attachments().length > 0) { <span class="att-count">({{ attachments().length }})</span> }
            </h3>
            <label class="action-btn btn-upload">
              + Add
              <input type="file" hidden multiple accept="image/*,.pdf,.doc,.docx"
                     (change)="onFileSelected($event)">
            </label>
          </div>

          @if (uploading()) {
            <div class="loading">Uploading...</div>
          }

          @if (loadingAttachments()) {
            <div class="loading">Loading attachments...</div>
          } @else if (attachments().length === 0) {
            <div class="no-attachments">No attachments</div>
          } @else {
            <div class="attachment-grid">
              @for (att of attachments(); track att.id) {
                <div class="attachment-card">
                  @if (isImage(att)) {
                    <img [src]="getImageSrc(att)" [alt]="att.fileName"
                         class="attachment-img" (click)="openLightbox(att)">
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

        <!-- Confirm delete -->
        @if (confirmingDelete()) {
          <div class="confirm-overlay">
            <div class="confirm-card">
              <p>Delete this item?</p>
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

    <!-- Lightbox -->
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
    .detail-status[data-status="Open"] { background: #fff3e0; color: #e65100; }
    .detail-status[data-status="In Progress"] { background: #e3f2fd; color: #1565c0; }
    .detail-status[data-status="Resolved"] { background: #e8f5e9; color: #2e7d32; }
    .detail-status[data-status="Closed"] { background: #eceff1; color: #546e7a; }
    .detail-actions { margin-left: auto; display: flex; gap: 6px; }
    .action-btn { padding: 5px 12px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 12px; }
    .action-btn:hover { background: var(--hover-background, rgba(0,0,0,0.04)); }
    .btn-edit { background: var(--accent-color); color: white; border-color: var(--accent-color); }
    .btn-edit:hover { opacity: 0.9; }
    .btn-close-item { background: #e8f5e9; color: #2e7d32; border-color: #a5d6a7; }
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
    .field-label { font-size: 12px; font-weight: 600; color: var(--secondary-text); min-width: 100px;
      text-transform: uppercase; letter-spacing: 0.3px; }
    .field-value { font-size: 14px; color: var(--primary-text); }
    .field-value.notes { background: var(--secondary-background); padding: 8px 12px; border-radius: 6px;
      white-space: pre-wrap; font-size: 13px; width: 100%; box-sizing: border-box; }

    .attachments-section { margin-top: 8px; }
    .att-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
    .att-header h3 { font-size: 14px; font-weight: 600; color: var(--primary-text); margin: 0; }
    .att-count { font-weight: 400; color: var(--secondary-text); }
    .loading, .no-attachments { font-size: 13px; color: var(--secondary-text); padding: 8px 0; }

    .attachment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .attachment-card { border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
      background: var(--card-background); position: relative; }
    .attachment-img { width: 100%; height: 120px; object-fit: cover; cursor: pointer; display: block; }
    .attachment-img:hover { opacity: 0.85; }
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
    .att-delete:hover { background: #ffebee; border-radius: 4px; }

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
export class RfFieldListDetailDialogComponent implements OnInit {
  item = input.required<FieldListItemDto>();
  close = output<void>();
  edit = output<FieldListItemDto>();
  deleted = output<number>();

  private apiService = inject(RfFieldListApiService);
  private stateService = inject(RfFieldListStateService);

  attachments = signal<Attachment[]>([]);
  loadingAttachments = signal(false);
  uploading = signal(false);
  lightboxImage = signal<string | null>(null);
  confirmingDelete = signal(false);

  readonly statuses = ['Open', 'In Progress', 'Resolved', 'Closed'];

  ngOnInit(): void {
    this.loadAttachments();
  }

  private loadAttachments(): void {
    const id = this.item().id;
    if (id) {
      this.loadingAttachments.set(true);
      this.apiService.getAttachments(id).subscribe({
        next: res => {
          this.attachments.set(res.responseData || []);
          this.loadingAttachments.set(false);
        },
        error: () => this.loadingAttachments.set(false)
      });
    }
  }

  // ============ Status ============

  onChangeStatus(status: string): void {
    const id = this.item().id;
    if (!id) return;
    this.apiService.changeStatus(id, status).subscribe({
      next: () => this.stateService.loadAll(),
      error: err => console.warn('[FieldList] Status change failed:', err.message)
    });
  }

  // ============ Delete ============

  onDelete(): void {
    this.confirmingDelete.set(true);
  }

  confirmDelete(): void {
    const id = this.item().id;
    if (!id) return;
    this.apiService.delete(id).subscribe({
      next: () => {
        this.confirmingDelete.set(false);
        this.deleted.emit(id);
        this.close.emit();
      },
      error: err => console.warn('[FieldList] Delete failed:', err.message)
    });
  }

  // ============ Attachments ============

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
          fileName: file.name,
          contentType: file.type,
          base64Content: base64
        }).subscribe({
          next: () => {
            remaining--;
            if (remaining === 0) {
              this.uploading.set(false);
              this.loadAttachments();
            }
          },
          error: () => {
            remaining--;
            if (remaining === 0) this.uploading.set(false);
          }
        });
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  onDeleteAttachment(att: Attachment): void {
    const id = this.item().id;
    if (!id) return;
    this.apiService.deleteAttachment(id, att.id).subscribe({
      next: () => this.attachments.set(this.attachments().filter(a => a.id !== att.id)),
      error: err => console.warn('[FieldList] Attachment delete failed:', err.message)
    });
  }

  // ============ Image helpers ============

  isImage(att: Attachment): boolean {
    return att.contentType?.startsWith('image/') ?? false;
  }

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

  openLightbox(att: Attachment): void {
    this.lightboxImage.set(this.getImageSrc(att));
  }

  closeLightbox(): void {
    this.lightboxImage.set(null);
  }
}
