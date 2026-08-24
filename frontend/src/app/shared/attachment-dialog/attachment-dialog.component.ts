import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { AttachmentDialogService } from './attachment-dialog.service';
import { RfWorkRequestApiService } from '../../features/permit-builder/work-request/refactored/services/rf-work-request-api.service';
import { RfJhaApiService } from '../../features/permit-builder/jha/refactored/services/rf-jha-api.service';

interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  attachmentType: string;
  base64Content: string;
  createdAt: string;
}

@Component({
  selector: 'app-attachment-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RfPopupProjectionComponent],
  template: `
    @if (dialogService.isVisible()) {
      <app-rf-popup-projection
        [isOpen]="true"
        [title]="dialogService.dialogTitle()"
        [zIndex]="20000"
        (close)="close()"
      >
        <div class="attachment-dialog-content">

          <!-- Filter toolbar -->
          <div class="filter-toolbar">
            <select class="filter-select" [(ngModel)]="filterType">
              <option value="">All Types</option>
              <option value="photo">Photos</option>
              <option value="signature">Signatures</option>
              <option value="document">Documents</option>
            </select>
            <span class="count-label">{{ filteredItems().length }} attachment(s)</span>
          </div>

          <!-- Attachment list -->
          <div class="attachment-list">
            @if (isLoading()) {
              <div class="loading-state">Loading attachments...</div>
            } @else if (filteredItems().length === 0) {
              <div class="empty-state">
                {{ attachments().length === 0 ? 'No attachments' : 'No items match your filter' }}
              </div>
            } @else {
              @for (item of filteredItems(); track item.id) {
                <div class="attachment-item" [class.expanded]="expandedId === item.id">
                  <div class="attachment-header" (click)="toggleExpand(item)">
                    <span class="type-badge" [ngClass]="'badge-' + item.attachmentType">
                      {{ item.attachmentType }}
                    </span>
                    <span class="file-name">{{ item.fileName || 'Untitled' }}</span>
                    <span class="attachment-date">{{ formatDate(item.createdAt) }}</span>
                    <div class="action-buttons">
                      <button class="action-btn print-btn" (click)="print(item, $event)" title="Print">&#128438;</button>
                      <button class="action-btn download-btn" (click)="download(item, $event)" title="Download">&#8595;</button>
                    </div>
                  </div>
                  @if (expandedId === item.id) {
                    @if (isImage(item)) {
                      <div class="image-preview">
                        <img [src]="getImageSrc(item)" [alt]="item.fileName" />
                      </div>
                    } @else if (isPdf(item)) {
                      <div class="pdf-preview">
                        <iframe [src]="getPdfSrc(item)" type="application/pdf"></iframe>
                      </div>
                    }
                  }
                </div>
              }
            }
          </div>

        </div>
      </app-rf-popup-projection>
    }
  `,
  styles: [`
    .attachment-dialog-content {
      padding: 16px;
      min-width: 480px;
      max-width: 700px;
      background: var(--primary-background, #fff);
      color: var(--primary-text, #212529);
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
    }

    .filter-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
      align-items: center;
      flex-shrink: 0;
    }

    .filter-select {
      padding: 7px 10px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      background: var(--card-background, #fff);
      color: var(--primary-text, #212529);
      min-width: 120px;
      box-sizing: border-box;
    }

    .filter-select:focus {
      outline: none;
      border-color: var(--accent-color, #007bff);
    }

    .count-label {
      font-size: 12px;
      color: var(--secondary-text, #6c757d);
      margin-left: auto;
    }

    .attachment-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      min-height: 0;
      flex: 1;
      padding-right: 4px;
    }

    .attachment-item {
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 6px;
      background: var(--card-background, #fff);
      box-shadow: var(--card-shadow, 0 1px 3px rgba(0,0,0,0.08));
      overflow: hidden;
    }

    .attachment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      cursor: pointer;
      transition: background 0.15s ease;
    }

    .attachment-header:hover {
      background: var(--secondary-background, #f0f2f5);
    }

    .type-badge {
      font-size: 11px;
      padding: 2px 9px;
      border-radius: 10px;
      font-weight: 600;
      letter-spacing: 0.3px;
      text-transform: capitalize;
    }

    .badge-photo {
      background: var(--accent-color, #007bff);
      color: #fff;
    }

    .badge-signature {
      background: #9c27b0;
      color: #fff;
    }

    .badge-document {
      background: #ff9800;
      color: #fff;
    }

    .file-name {
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-text, #212529);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .attachment-date {
      font-size: 12px;
      color: var(--secondary-text, #6c757d);
      white-space: nowrap;
    }

    .action-buttons {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .action-btn {
      background: none;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      padding: 2px 8px;
      color: var(--accent-color, #007bff);
    }

    .action-btn:hover {
      background: var(--accent-color, #007bff);
      color: #fff;
    }

    .image-preview, .pdf-preview {
      padding: 12px 14px;
      border-top: 1px solid var(--border-color, #dee2e6);
      background: var(--secondary-background, #f8f9fa);
      text-align: center;
    }

    .image-preview img {
      max-width: 100%;
      max-height: 400px;
      border-radius: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }

    .pdf-preview iframe {
      width: 100%;
      height: 500px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text, #6c757d);
      font-size: 14px;
    }
  `]
})
export class AttachmentDialogComponent {
  dialogService = inject(AttachmentDialogService);
  private wrApiService = inject(RfWorkRequestApiService);
  private jhaApiService = inject(RfJhaApiService);
  private sanitizer = inject(DomSanitizer);

  attachments = signal<Attachment[]>([]);
  isLoading = signal(false);
  expandedId: number | null = null;
  filterType = '';

  filteredItems = computed(() => {
    let result = this.attachments();
    if (this.filterType) {
      result = result.filter(a => a.attachmentType === this.filterType);
    }
    return result;
  });

  private loadEffect = this.dialogService.onOpen$.subscribe(() => {
    this.filterType = '';
    this.expandedId = null;
    this.loadAttachments();
  });

  loadAttachments(): void {
    const entityType = this.dialogService.entityType();
    const entityId = this.dialogService.entityId();
    if (!entityType || !entityId) return;

    this.isLoading.set(true);
    // The dialog takes an entityType and then ignored it, always asking the work-request endpoint.
    // Harmless while only work requests opened it; opening it for a JHA would have quietly shown
    // the attachments of whichever work request happened to share that id.
    const source$ = entityType === 'Jha'
      ? this.jhaApiService.getAttachments(entityId)
      : this.wrApiService.getAttachments(entityId);

    source$.subscribe({
      next: (response) => {
        this.attachments.set(response.responseData || []);
        this.isLoading.set(false);
        // Auto-expand first image if only one attachment
        const items = this.attachments();
        if (items.length === 1 && this.isImage(items[0])) {
          this.expandedId = items[0].id;
        }
      },
      error: () => {
        this.attachments.set([]);
        this.isLoading.set(false);
      }
    });
  }

  toggleExpand(item: Attachment): void {
    if (!this.isImage(item) && !this.isPdf(item)) return;
    this.expandedId = this.expandedId === item.id ? null : item.id;
  }

  isImage(item: Attachment): boolean {
    if (item.attachmentType === 'photo' || item.attachmentType === 'signature') return true;
    if (item.contentType?.startsWith('image/')) return true;
    return false;
  }

  isPdf(item: Attachment): boolean {
    if (item.contentType === 'application/pdf') return true;
    if (item.fileName?.toLowerCase().endsWith('.pdf')) return true;
    return false;
  }

  getImageSrc(item: Attachment): string {
    if (!item.base64Content) return '';
    const contentType = item.contentType || 'image/png';
    if (item.base64Content.startsWith('data:')) return item.base64Content;
    return `data:${contentType};base64,${item.base64Content}`;
  }

  getPdfSrc(item: Attachment): SafeResourceUrl {
    if (!item.base64Content) return '';
    let data = item.base64Content;
    if (data.startsWith('data:')) {
      data = data.split(',')[1];
    }
    const dataUrl = `data:application/pdf;base64,${data}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(dataUrl);
  }

  private toBlob(item: Attachment): Blob | null {
    if (!item.base64Content) return null;
    const contentType = item.contentType || 'application/octet-stream';
    let data = item.base64Content;
    if (data.startsWith('data:')) {
      data = data.split(',')[1];
    }
    const byteCharacters = atob(data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: contentType });
  }

  download(item: Attachment, event: Event): void {
    event.stopPropagation();
    const blob = this.toBlob(item);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName || 'attachment';
    a.click();
    URL.revokeObjectURL(url);
  }

  print(item: Attachment, event: Event): void {
    event.stopPropagation();
    const blob = this.toBlob(item);
    if (!blob) return;

    const url = URL.createObjectURL(blob);
    const title = item.fileName || 'Print';
    const win = window.open('', '_blank', 'width=800,height=600');
    if (!win) return;

    if (this.isPdf(item)) {
      win.document.write(
        `<html><head><title>${title}</title></head>` +
        `<body style="margin:0">` +
        `<iframe src="${url}" style="width:100%;height:100%;border:none"></iframe>` +
        `</body></html>`
      );
      win.document.close();
      const iframe = win.document.querySelector('iframe');
      if (iframe) {
        iframe.onload = () => win.print();
      }
    } else if (this.isImage(item)) {
      win.document.write(
        `<html><head><title>${title}</title></head>` +
        `<body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#f5f5f5">` +
        `<img src="${url}" style="max-width:100%;max-height:100vh" onload="window.print()"/>` +
        `</body></html>`
      );
      win.document.close();
    } else {
      win.location.href = url;
    }
  }

  close(): void {
    this.dialogService.close();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
