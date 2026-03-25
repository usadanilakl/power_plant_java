import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { CorrespondenceDialogService } from './correspondence-dialog.service';
import { EmailCorrespondenceService } from '../../services/email-correspondence.service';
import { EmailCorrespondenceDto } from '../../models/base/email-correspondence.model';

@Component({
  selector: 'app-correspondence-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RfPopupProjectionComponent],
  template: `
    @if (dialogService.isVisible()) {
      <app-rf-popup-projection
        [isOpen]="true"
        [title]="getTitle()"
        [zIndex]="20000"
        (close)="close()"
      >
        <div class="correspondence-dialog-content">

          <!-- Filter toolbar -->
          <div class="filter-toolbar">
            <input
              type="text"
              class="search-input"
              placeholder="Search correspondence..."
              [(ngModel)]="searchQuery"
            />
            <select class="filter-select" [(ngModel)]="filterDirection">
              <option value="">All</option>
              <option value="OUTBOUND">Sent</option>
              <option value="INBOUND">Received</option>
            </select>
          </div>

          <!-- Correspondence list -->
          <div class="correspondence-list">
            @if (isLoading()) {
              <div class="loading-state">Loading correspondence...</div>
            } @else if (filteredItems().length === 0) {
              <div class="empty-state">
                {{ correspondence().length === 0 ? 'No correspondence yet' : 'No items match your filters' }}
              </div>
            } @else {
              @for (item of filteredItems(); track item.id) {
                <div class="email-item"
                     [class.outbound]="item.direction === 'OUTBOUND'"
                     [class.inbound]="item.direction === 'INBOUND'"
                     [class.unread]="!item.isRead && item.direction === 'INBOUND'">
                  <div class="email-header">
                    <span class="direction-badge"
                          [class.badge-out]="item.direction === 'OUTBOUND'"
                          [class.badge-in]="item.direction === 'INBOUND'">
                      {{ item.direction === 'OUTBOUND' ? 'Sent' : 'Received' }}
                    </span>
                    @if (!item.isRead && item.direction === 'INBOUND') {
                      <span class="unread-dot"></span>
                    }
                    @if (item.correspondenceType?.name) {
                      <span class="type-badge">{{ item.correspondenceType.name }}</span>
                    }
                    <span class="email-date">{{ formatDate(item.sentDateTime) }}</span>
                  </div>
                  <div class="email-subject">{{ item.subject }}</div>
                  <div class="email-meta">
                    <span><strong>From:</strong> {{ item.sender }}</span>
                    <span class="meta-sep">→</span>
                    <span><strong>To:</strong> {{ item.recipient }}</span>
                  </div>
                  <div class="email-body">{{ formatBody(item.bodyContent) }}</div>
                </div>
              }
            }
          </div>

        </div>
      </app-rf-popup-projection>
    }
  `,
  styles: [`
    .correspondence-dialog-content {
      padding: 16px;
      min-width: 540px;
      max-width: 740px;
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
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      padding: 7px 10px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      background: var(--card-background, #fff);
      color: var(--primary-text, #212529);
      box-sizing: border-box;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--accent-color, #007bff);
      box-shadow: 0 0 0 2px var(--accent-color-shadow, rgba(0,123,255,0.2));
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

    .correspondence-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-right: 4px;
      overflow-y: auto;
      min-height: 0;
      flex: 1;
    }

    .email-item {
      padding: 14px 16px;
      border: 1px solid var(--border-color, #dee2e6);
      border-left-width: 4px;
      border-radius: 6px;
      background: var(--card-background, #fff);
      box-shadow: var(--card-shadow, 0 1px 3px rgba(0,0,0,0.08));
      transition: box-shadow 0.15s ease;
    }

    .email-item:hover {
      box-shadow: var(--card-shadow, 0 2px 6px rgba(0,0,0,0.12));
    }

    .email-item.outbound {
      border-left-color: var(--accent-color, #007bff);
    }

    .email-item.inbound {
      border-left-color: #4caf50;
    }

    .email-item.unread {
      background: var(--secondary-background, #f0f2f5);
    }

    .email-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }

    .direction-badge {
      font-size: 11px;
      padding: 2px 9px;
      border-radius: 10px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .badge-out {
      background: var(--accent-color, #007bff);
      color: #fff;
    }

    .badge-in {
      background: #4caf50;
      color: #fff;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
      flex-shrink: 0;
    }

    .type-badge {
      font-size: 11px;
      padding: 2px 7px;
      background: var(--secondary-background, #f0f2f5);
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      color: var(--secondary-text, #495057);
    }

    .email-date {
      margin-left: auto;
      font-size: 12px;
      color: var(--secondary-text, #6c757d);
      white-space: nowrap;
    }

    .email-subject {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-text, #212529);
      margin-bottom: 5px;
    }

    .email-meta {
      font-size: 12px;
      color: var(--secondary-text, #6c757d);
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .meta-sep {
      color: var(--border-color, #dee2e6);
    }

    .email-body {
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
      color: var(--primary-text, #212529);
      border-top: 1px solid var(--border-color, #dee2e6);
      padding-top: 10px;
      word-break: break-word;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text, #6c757d);
      font-size: 14px;
    }
  `]
})
export class CorrespondenceDialogComponent {
  dialogService = inject(CorrespondenceDialogService);
  private correspondenceService = inject(EmailCorrespondenceService);

  correspondence = signal<EmailCorrespondenceDto[]>([]);
  isLoading = signal(false);

  searchQuery = '';
  filterDirection = '';

  filteredItems = computed(() => {
    let result = this.correspondence();

    if (this.filterDirection) {
      result = result.filter(i => i.direction === this.filterDirection);
    }

    const query = this.searchQuery?.trim().toLowerCase();
    if (query) {
      result = result.filter(i =>
        i.subject?.toLowerCase().includes(query) ||
        i.sender?.toLowerCase().includes(query) ||
        i.recipient?.toLowerCase().includes(query) ||
        i.bodyContent?.toLowerCase().includes(query)
      );
    }

    return result;
  });

  private loadEffect = this.dialogService.onOpen$.subscribe(() => {
    console.log('[Correspondence] onOpen$ fired, isVisible:', this.dialogService.isVisible());
    this.searchQuery = '';
    this.filterDirection = '';
    this.loadCorrespondence();
  });

  getTitle(): string {
    const custom = this.dialogService.dialogTitle();
    if (custom) return custom;
    return 'Email Correspondence — ' + this.dialogService.entityType() + ' #' + this.dialogService.entityId();
  }

  loadCorrespondence(): void {
    // If preloaded items are provided, use them directly
    const preloaded = this.dialogService.preloadedItems();
    if (preloaded) {
      this.correspondence.set(preloaded);
      this.isLoading.set(false);
      this.markAllAsRead(preloaded);
      return;
    }

    const entityType = this.dialogService.entityType();
    const entityId = this.dialogService.entityId();
    if (!entityType || !entityId) return;

    this.isLoading.set(true);
    this.correspondenceService.getForEntity(entityType, entityId).subscribe({
      next: (response) => {
        const items = (response.responseData || []).map(c => EmailCorrespondenceDto.fromJson(c));
        this.correspondence.set(items);
        this.isLoading.set(false);
        this.markAllAsRead(items);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  private markAllAsRead(items: EmailCorrespondenceDto[]): void {
    items
      .filter(c => !c.isRead && c.direction === 'INBOUND')
      .forEach(c => {
        if (c.id) {
          this.correspondenceService.markAsRead(c.id).subscribe();
        }
      });
  }

  close(): void {
    this.dialogService.close();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatBody(html: string): string {
    if (!html) return '';
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/\\r\\n/g, '\n')
      .replace(/\\r/g, '')
      .replace(/\\n/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}
