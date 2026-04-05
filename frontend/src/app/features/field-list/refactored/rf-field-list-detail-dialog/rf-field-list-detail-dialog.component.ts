import { Component, inject, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfFieldListApiService } from '../services/rf-field-list-api.service';
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
    <app-rf-popup-projection (close)="close.emit()">
      <div class="detail-dialog">
        <div class="detail-header">
          <div class="detail-type-badge">{{ item().listTypeName }}</div>
          <div class="detail-status">{{ item().statusName }}</div>
          <div class="detail-actions">
            <button class="action-btn" (click)="edit.emit(item())">Edit</button>
            <button class="action-btn close-btn" (click)="close.emit()">Close</button>
          </div>
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
          <h3>Attachments
            @if (attachments().length > 0) { <span class="att-count">({{ attachments().length }})</span> }
          </h3>
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
                  <div class="attachment-name">{{ att.fileName }}</div>
                </div>
              }
            </div>
          }
        </div>
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
    .detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .detail-type-badge { font-size: 12px; font-weight: 600; text-transform: uppercase;
      padding: 4px 10px; border-radius: 4px; background: var(--accent-color); color: var(--header-text); }
    .detail-status { font-size: 12px; padding: 4px 10px; border-radius: 10px;
      background: var(--secondary-background); color: var(--secondary-text); }
    .detail-actions { margin-left: auto; display: flex; gap: 8px; }
    .action-btn { padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px; }
    .action-btn:hover { background: var(--hover-background); }
    .close-btn { background: none; }
    .detail-title { font-size: 20px; font-weight: 600; color: var(--primary-text); margin: 0 0 16px; }

    .detail-fields { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
    .field-row { display: flex; gap: 12px; align-items: baseline; }
    .field-row.full-width { flex-direction: column; gap: 4px; }
    .field-label { font-size: 12px; font-weight: 600; color: var(--secondary-text); min-width: 100px; text-transform: uppercase; letter-spacing: 0.3px; }
    .field-value { font-size: 14px; color: var(--primary-text); }
    .field-value.notes { background: var(--secondary-background); padding: 8px 12px; border-radius: 6px;
      white-space: pre-wrap; font-size: 13px; width: 100%; box-sizing: border-box; }

    .attachments-section h3 { font-size: 14px; font-weight: 600; color: var(--primary-text); margin: 0 0 12px; }
    .att-count { font-weight: 400; color: var(--secondary-text); }
    .loading, .no-attachments { font-size: 13px; color: var(--secondary-text); padding: 8px 0; }

    .attachment-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
    .attachment-card { border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;
      background: var(--card-background); }
    .attachment-img { width: 100%; height: 120px; object-fit: cover; cursor: pointer; display: block; }
    .attachment-img:hover { opacity: 0.85; }
    .attachment-file { display: flex; flex-direction: column; align-items: center; justify-content: center;
      height: 120px; background: var(--secondary-background); }
    .file-icon { font-size: 32px; }
    .file-name { font-size: 11px; color: var(--secondary-text); text-align: center; padding: 0 8px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 100%; }
    .attachment-name { padding: 6px 8px; font-size: 11px; color: var(--secondary-text);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; border-top: 1px solid var(--border-color); }

    /* Lightbox */
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

  private apiService = inject(RfFieldListApiService);

  attachments = signal<Attachment[]>([]);
  loadingAttachments = signal(false);
  lightboxImage = signal<string | null>(null);

  ngOnInit(): void {
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
