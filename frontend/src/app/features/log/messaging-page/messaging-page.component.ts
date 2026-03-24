import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConversationService } from '../../../services/messaging/conversation.service';
import { ConversationDialogService } from '../../../shared/messaging/conversation-dialog.service';
import { ConversationDto } from '../../../models/messaging/conversation.model';
import { SearchCriteriaDto } from '../../../models/api/search-criteria.model';

@Component({
  selector: 'app-messaging-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messaging-page">
      <div class="page-toolbar">
        <h3 class="page-title">Internal Messages</h3>
        <div class="toolbar-controls">
          <input
            type="text"
            class="search-input"
            placeholder="Search conversations..."
            [(ngModel)]="searchQuery"
            (ngModelChange)="search()"
          />
          <select class="filter-select" [(ngModel)]="filterEntityType" (ngModelChange)="search()">
            <option value="">All Entity Types</option>
            @for (type of entityTypes(); track type) {
              <option [value]="type">{{ type }}</option>
            }
          </select>
          <select class="filter-select" [(ngModel)]="filterStatus" (ngModelChange)="search()">
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button class="refresh-btn" (click)="search()">Refresh</button>
        </div>
      </div>

      <div class="conversations-table">
        @if (isLoading()) {
          <div class="loading-state">Loading conversations...</div>
        } @else if (filteredItems().length === 0) {
          <div class="empty-state">No conversations found</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th (click)="toggleSort('subject')">Subject {{ getSortIndicator('subject') }}</th>
                <th (click)="toggleSort('entityType')">Entity Type {{ getSortIndicator('entityType') }}</th>
                <th>Entity ID</th>
                <th (click)="toggleSort('initiatorName')">Initiator {{ getSortIndicator('initiatorName') }}</th>
                <th (click)="toggleSort('responderName')">Responder {{ getSortIndicator('responderName') }}</th>
                <th (click)="toggleSort('status')">Status {{ getSortIndicator('status') }}</th>
                <th (click)="toggleSort('lastMessageAt')">Last Message {{ getSortIndicator('lastMessageAt') }}</th>
                <th>Unread</th>
              </tr>
            </thead>
            <tbody>
              @for (conv of filteredItems(); track conv.id) {
                <tr class="conv-row"
                    [class.has-unread]="conv.currentUserUnreadCount > 0"
                    (click)="openConversation(conv)">
                  <td class="subject-cell">{{ conv.subject }}</td>
                  <td>{{ conv.entityType }}</td>
                  <td>{{ conv.entityId }}</td>
                  <td>{{ conv.initiatorName }}</td>
                  <td>{{ conv.responderName }}</td>
                  <td>
                    <span class="status-badge" [class.status-closed]="conv.status === 'CLOSED'">
                      {{ conv.status }}
                    </span>
                  </td>
                  <td>{{ formatDate(conv.lastMessageAt) }}</td>
                  <td>
                    @if (conv.currentUserUnreadCount > 0) {
                      <span class="unread-badge">{{ conv.currentUserUnreadCount }}</span>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `,
  styles: [`
    .messaging-page {
      display: flex;
      flex-direction: column;
      height: 100%;
      padding: 16px;
      background: var(--primary-background, #fff);
      color: var(--primary-text, #212529);
    }

    .page-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .page-title {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    .toolbar-controls {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .search-input {
      padding: 7px 10px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      font-size: 13px;
      font-family: inherit;
      background: var(--card-background, #fff);
      color: var(--primary-text, #212529);
      min-width: 200px;
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
    }

    .refresh-btn {
      padding: 7px 14px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      background: var(--card-background, #fff);
      color: var(--primary-text, #212529);
      font-size: 13px;
      font-family: inherit;
      cursor: pointer;
    }

    .refresh-btn:hover {
      background: var(--secondary-background, #f0f2f5);
    }

    .conversations-table {
      flex: 1;
      overflow: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-table th {
      background: var(--secondary-background, #f0f2f5);
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid var(--border-color, #dee2e6);
      cursor: pointer;
      white-space: nowrap;
      user-select: none;
    }

    .data-table th:hover {
      background: var(--border-color, #dee2e6);
    }

    .data-table td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color, #dee2e6);
    }

    .conv-row {
      cursor: pointer;
      transition: background 0.1s;
    }

    .conv-row:hover {
      background: var(--secondary-background, #f0f2f5);
    }

    .conv-row.has-unread {
      font-weight: 600;
    }

    .subject-cell {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-badge {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--success-color, #388e3c);
      color: #fff;
      font-weight: 600;
    }

    .status-badge.status-closed {
      background: var(--secondary-text, #6c757d);
    }

    .unread-badge {
      background: var(--success-color, #388e3c);
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text, #6c757d);
      font-size: 14px;
    }
  `]
})
export class MessagingPageComponent implements OnInit {
  private conversationService = inject(ConversationService);
  private dialogService = inject(ConversationDialogService);
  private destroyRef = inject(DestroyRef);

  items = signal<ConversationDto[]>([]);
  isLoading = signal(false);

  searchQuery = '';
  filterEntityType = '';
  filterStatus = '';
  sortColumn = 'lastMessageAt';
  sortAscending = false;

  entityTypes = computed(() => {
    const types = new Set(this.items().map(i => i.entityType));
    return Array.from(types).sort();
  });

  filteredItems = computed(() => {
    let result = this.items();

    if (this.filterEntityType) {
      result = result.filter(i => i.entityType === this.filterEntityType);
    }
    if (this.filterStatus) {
      result = result.filter(i => i.status === this.filterStatus);
    }
    const query = this.searchQuery?.trim().toLowerCase();
    if (query) {
      result = result.filter(i =>
        i.subject?.toLowerCase().includes(query) ||
        i.initiatorName?.toLowerCase().includes(query) ||
        i.responderName?.toLowerCase().includes(query) ||
        i.entityType?.toLowerCase().includes(query)
      );
    }

    return this.sortItems(result);
  });

  constructor() {
    this.dialogService.conversationChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.search());
  }

  ngOnInit(): void {
    this.search();
  }

  search(): void {
    this.isLoading.set(true);
    const criteria = new SearchCriteriaDto();
    this.conversationService.search(criteria, 1, 200).subscribe({
      next: (response: any) => {
        const data = response.responseData?.content || response.responseData || [];
        const items = (Array.isArray(data) ? data : []).map((c: any) => ConversationDto.fromJson(c));
        this.items.set(items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openConversation(conv: ConversationDto): void {
    this.dialogService.open(conv.entityType, conv.entityId, conv.id);
  }

  toggleSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortColumn = column;
      this.sortAscending = false;
    }
  }

  getSortIndicator(column: string): string {
    if (this.sortColumn !== column) return '';
    return this.sortAscending ? '▲' : '▼';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private sortItems(items: ConversationDto[]): ConversationDto[] {
    return [...items].sort((a, b) => {
      const aVal = (a as any)[this.sortColumn] ?? '';
      const bVal = (b as any)[this.sortColumn] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return this.sortAscending ? cmp : -cmp;
    });
  }
}
