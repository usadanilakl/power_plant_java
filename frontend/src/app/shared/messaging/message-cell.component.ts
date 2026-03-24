import { Component, inject, Input, OnChanges, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConversationService } from '../../services/messaging/conversation.service';
import { ConversationDialogService } from './conversation-dialog.service';

@Component({
  selector: 'app-message-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="message-cell" (click)="openDialog($event)">
      @if (unreadCount() > 0) {
        <span class="unread-badge">{{ unreadCount() }} new</span>
      } @else if (totalCount() > 0) {
        <span class="total-badge">{{ totalCount() }}</span>
      } @else {
        <span class="muted-text">&mdash;</span>
      }
    </div>
  `,
  styles: [`
    .message-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      width: 100%;
    }

    .message-cell:hover {
      opacity: 0.8;
    }

    .unread-badge {
      background: var(--success-color, #388e3c);
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }

    .total-badge {
      background: var(--primary-color, #1976d2);
      color: white;
      border-radius: 50%;
      min-width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
    }

    .muted-text {
      color: var(--text-muted, #aaa);
      font-size: 12px;
    }
  `]
})
export class MessageCellComponent implements OnChanges {
  @Input() entityType = '';
  @Input() entityId = 0;

  private conversationService = inject(ConversationService);
  private dialogService = inject(ConversationDialogService);
  private destroyRef = inject(DestroyRef);

  unreadCount = signal(0);
  totalCount = signal(0);

  constructor() {
    this.dialogService.conversationChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!event || (event.entityType === this.entityType && event.entityId === this.entityId)) {
          if (this.entityType && this.entityId) {
            this.loadCounts();
          }
        }
      });
  }

  ngOnChanges(): void {
    if (this.entityType && this.entityId) {
      this.loadCounts();
    }
  }

  loadCounts(): void {
    this.conversationService.getForEntity(this.entityType, this.entityId).subscribe({
      next: (response) => {
        const items = response.responseData || [];
        this.totalCount.set(items.length);
        const unread = items.reduce((sum: number, c: any) => sum + (c.currentUserUnreadCount || 0), 0);
        this.unreadCount.set(unread);
      }
    });
  }

  openDialog(event: Event): void {
    event.stopPropagation();
    if (!this.entityType || !this.entityId) return;
    this.dialogService.open(this.entityType, this.entityId);
  }
}
