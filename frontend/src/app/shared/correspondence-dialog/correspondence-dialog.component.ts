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
        [title]="'Email Correspondence - ' + dialogService.entityType() + ' #' + dialogService.entityId()"
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
                    <span class="direction-badge" [class.badge-out]="item.direction === 'OUTBOUND'" [class.badge-in]="item.direction === 'INBOUND'">
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
                  <div class="email-body">{{ stripHtml(item.bodyContent) }}</div>
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
      min-width: 500px;
      max-width: 700px;
    }

    .filter-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .search-input {
      flex: 1;
      padding: 6px 10px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      background: var(--input-bg, #fff);
      color: var(--text-primary, #333);
    }

    .filter-select {
      padding: 6px 10px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      background: var(--bg-color, #fff);
      min-width: 110px;
    }

    .correspondence-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-height: 480px;
      overflow-y: auto;
    }

    .email-item {
      padding: 12px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 6px;
      background: var(--bg-color, #fff);
    }

    .email-item.outbound {
      border-left: 3px solid var(--primary-color, #1976d2);
    }

    .email-item.inbound {
      border-left: 3px solid var(--success-color, #388e3c);
    }

    .email-item.unread {
      background: var(--unread-bg, rgba(56, 142, 60, 0.05));
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
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .badge-out {
      background: var(--primary-light, #e3f2fd);
      color: var(--primary-color, #1976d2);
    }

    .badge-in {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success-color, #388e3c);
      flex-shrink: 0;
    }

    .type-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: var(--secondary-bg, #f5f5f5);
      border-radius: 4px;
      color: var(--text-secondary, #666);
    }

    .email-date {
      margin-left: auto;
      font-size: 12px;
      color: var(--text-secondary, #888);
    }

    .email-subject {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .email-meta {
      font-size: 12px;
      color: var(--text-secondary, #666);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }

    .meta-sep {
      color: var(--text-muted, #aaa);
    }

    .email-body {
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      color: var(--text-primary, #333);
      max-height: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 4;
      -webkit-box-orient: vertical;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 32px;
      color: var(--text-secondary, #888);
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
    this.searchQuery = '';
    this.filterDirection = '';
    this.loadCorrespondence();
  });

  loadCorrespondence(): void {
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

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').trim();
  }
}
