import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { ConversationDialogService } from './conversation-dialog.service';
import { ConversationService } from '../../services/messaging/conversation.service';
import { MessageService } from '../../services/messaging/message.service';
import { AuthService } from '../../services/auth.service';
import { ConversationDto } from '../../models/messaging/conversation.model';
import { MessageDto } from '../../models/messaging/message.model';

@Component({
  selector: 'app-conversation-dialog',
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
        <div class="messaging-dialog-content">

          @if (!dialogService.selectedConversationId()) {
            <div class="conversation-list">
              @if (isLoading()) {
                <div class="loading-state">Loading conversations...</div>
              } @else if (conversations().length === 0) {
                <div class="empty-state">No conversations yet</div>
              } @else {
                @for (conv of conversations(); track conv.id) {
                  <div class="conversation-item"
                       [class.has-unread]="conv.currentUserUnreadCount > 0"
                       (click)="openConversation(conv)">
                    <div class="conv-header">
                      <span class="conv-subject">{{ conv.subject }}</span>
                      <span class="conv-status" [class.status-closed]="conv.status === 'CLOSED'">
                        {{ conv.status }}
                      </span>
                    </div>
                    <div class="conv-meta">
                      <span>{{ conv.initiatorName }} &lt;-&gt; {{ conv.responderName }}</span>
                      @if (conv.lastMessageAt) {
                        <span class="conv-date">{{ formatDate(conv.lastMessageAt) }}</span>
                      }
                    </div>
                    @if (conv.currentUserUnreadCount > 0) {
                      <span class="conv-unread-badge">{{ conv.currentUserUnreadCount }} new</span>
                    }
                  </div>
                }
              }
            </div>

          } @else {
            <div class="thread-view">
              <button class="back-btn" (click)="backToList()">&lt; Back to conversations</button>

              <div class="messages-list">
                @if (isLoadingMessages()) {
                  <div class="loading-state">Loading messages...</div>
                } @else {
                  @for (msg of messages(); track msg.id) {
                    <div class="message-item" [class.own-message]="msg.senderId === currentUserId()">
                      <div class="msg-header">
                        <span class="msg-sender">{{ msg.senderName }}</span>
                        <span class="msg-date">{{ formatDate(msg.sentAt) }}</span>
                      </div>
                      <div class="msg-content">{{ msg.content }}</div>
                    </div>
                  }
                }
              </div>

              @if (activeConversation()?.status === 'OPEN') {
                <div class="reply-bar">
                  <textarea
                    class="reply-input"
                    [(ngModel)]="replyContent"
                    placeholder="Type a message..."
                    rows="2"
                    (keydown.enter)="onEnterKey($event)"
                  ></textarea>
                  <button class="send-btn" (click)="sendMessage()" [disabled]="!replyContent.trim() || isSending()">
                    Send
                  </button>
                </div>
              } @else {
                <div class="closed-notice">This conversation is closed</div>
              }
            </div>
          }

        </div>
      </app-rf-popup-projection>
    }
  `,
  styles: [`
    .messaging-dialog-content {
      padding: 16px;
      min-width: 500px;
      max-width: 700px;
      background: var(--primary-background, #fff);
      color: var(--primary-text, #212529);
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
    }

    .conversation-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      min-height: 0;
      flex: 1;
    }

    .conversation-item {
      padding: 12px 14px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 6px;
      background: var(--card-background, #fff);
      cursor: pointer;
      transition: box-shadow 0.15s ease;
      position: relative;
    }

    .conversation-item:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.12);
    }

    .conversation-item.has-unread {
      border-left: 4px solid var(--success-color, #388e3c);
      background: var(--secondary-background, #f0f2f5);
    }

    .conv-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4px;
    }

    .conv-subject {
      font-weight: 600;
      font-size: 14px;
      color: var(--primary-text, #212529);
    }

    .conv-status {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 10px;
      background: var(--success-color, #388e3c);
      color: #fff;
      font-weight: 600;
    }

    .conv-status.status-closed {
      background: var(--secondary-text, #6c757d);
    }

    .conv-meta {
      font-size: 12px;
      color: var(--secondary-text, #6c757d);
      display: flex;
      justify-content: space-between;
    }

    .conv-date {
      white-space: nowrap;
    }

    .conv-unread-badge {
      position: absolute;
      top: 8px;
      right: 8px;
      background: var(--success-color, #388e3c);
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }

    .thread-view {
      display: flex;
      flex-direction: column;
      min-height: 0;
      flex: 1;
    }

    .back-btn {
      background: none;
      border: none;
      color: var(--accent-color, #007bff);
      cursor: pointer;
      font-size: 13px;
      padding: 4px 0;
      margin-bottom: 10px;
      text-align: left;
      font-family: inherit;
    }

    .back-btn:hover {
      text-decoration: underline;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      padding-right: 4px;
      margin-bottom: 10px;
    }

    .message-item {
      padding: 10px 14px;
      border-radius: 8px;
      background: var(--secondary-background, #f0f2f5);
      max-width: 85%;
    }

    .message-item.own-message {
      align-self: flex-end;
      background: var(--accent-color, #007bff);
      color: #fff;
    }

    .message-item.own-message .msg-header {
      color: rgba(255,255,255,0.8);
    }

    .msg-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 4px;
      font-size: 11px;
      color: var(--secondary-text, #6c757d);
    }

    .msg-sender {
      font-weight: 600;
    }

    .msg-date {
      white-space: nowrap;
    }

    .msg-content {
      font-size: 13px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .reply-bar {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      border-top: 1px solid var(--border-color, #dee2e6);
      padding-top: 10px;
      flex-shrink: 0;
    }

    .reply-input {
      flex: 1;
      padding: 8px 10px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 6px;
      font-size: 13px;
      font-family: inherit;
      background: var(--card-background, #fff);
      color: var(--primary-text, #212529);
      resize: vertical;
      min-height: 36px;
      box-sizing: border-box;
    }

    .reply-input:focus {
      outline: none;
      border-color: var(--accent-color, #007bff);
      box-shadow: 0 0 0 2px var(--accent-color-shadow, rgba(0,123,255,0.2));
    }

    .send-btn {
      padding: 8px 16px;
      background: var(--accent-color, #007bff);
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 13px;
      font-family: inherit;
      font-weight: 600;
      white-space: nowrap;
    }

    .send-btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .closed-notice {
      text-align: center;
      padding: 12px;
      color: var(--secondary-text, #6c757d);
      font-size: 13px;
      font-style: italic;
      border-top: 1px solid var(--border-color, #dee2e6);
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--secondary-text, #6c757d);
      font-size: 14px;
    }
  `]
})
export class ConversationDialogComponent {
  dialogService = inject(ConversationDialogService);
  private conversationService = inject(ConversationService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  conversations = signal<ConversationDto[]>([]);
  messages = signal<MessageDto[]>([]);
  activeConversation = signal<ConversationDto | null>(null);
  isLoading = signal(false);
  isLoadingMessages = signal(false);
  isSending = signal(false);
  currentUserId = signal(0);

  replyContent = '';

  constructor() {
    this.authService.currentUser$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((user) => this.currentUserId.set(user?.id ?? 0));

    this.dialogService.onOpen$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.replyContent = '';
        this.messages.set([]);
        this.activeConversation.set(null);
        this.loadConversations();
      });

    this.dialogService.conversationChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!this.dialogService.isVisible()) return;

        const sameEntity = !event || (
          event.entityType === this.dialogService.entityType() &&
          event.entityId === this.dialogService.entityId()
        );

        if (!sameEntity) return;

        this.loadConversations();
      });
  }

  getTitle(): string {
    if (this.dialogService.selectedConversationId()) {
      return this.activeConversation()?.subject || 'Conversation';
    }
    return 'Messages - ' + this.dialogService.entityType() + ' #' + this.dialogService.entityId();
  }

  loadConversations(): void {
    const entityType = this.dialogService.entityType();
    const entityId = this.dialogService.entityId();
    if (!entityType || !entityId) return;

    this.isLoading.set(true);
    this.conversationService.getForEntity(entityType, entityId).subscribe({
      next: (response) => {
        const items = (response.responseData || []).map((c: any) => ConversationDto.fromJson(c));
        this.conversations.set(items);
        this.syncSelectedConversation(items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  openConversation(conv: ConversationDto): void {
    this.activeConversation.set(conv);
    this.dialogService.openConversation(conv.id);
    this.loadMessages(conv.id);
    this.markConversationReadIfNeeded(conv);
  }

  loadMessages(conversationId: number): void {
    this.isLoadingMessages.set(true);
    this.messageService.getForConversation(conversationId).subscribe({
      next: (response) => {
        const items = (response.responseData || []).map((m: any) => MessageDto.fromJson(m));
        this.messages.set(items);
        this.isLoadingMessages.set(false);
      },
      error: () => this.isLoadingMessages.set(false)
    });
  }

  sendMessage(): void {
    const content = this.replyContent.trim();
    if (!content) return;

    const conversationId = this.dialogService.selectedConversationId();
    if (!conversationId) return;

    this.isSending.set(true);
    const dto = new MessageDto({ conversationId, content } as any);
    this.messageService.sendMessage(dto).subscribe({
      next: () => {
        this.replyContent = '';
        this.isSending.set(false);
        this.loadMessages(conversationId);
        this.dialogService.emitConversationChanged(
          this.dialogService.entityType(),
          this.dialogService.entityId()
        );
      },
      error: () => this.isSending.set(false)
    });
  }

  onEnterKey(event: Event): void {
    const keyEvent = event as KeyboardEvent;
    if (!keyEvent.shiftKey) {
      keyEvent.preventDefault();
      this.sendMessage();
    }
  }

  backToList(): void {
    this.dialogService.backToList();
    this.messages.set([]);
    this.activeConversation.set(null);
    this.loadConversations();
  }

  close(): void {
    this.dialogService.close();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  private syncSelectedConversation(items: ConversationDto[]): void {
    const selectedConversationId = this.dialogService.selectedConversationId();
    if (!selectedConversationId) return;

    const selected = items.find((conv) => conv.id === selectedConversationId) || null;
    this.activeConversation.set(selected);

    if (!selected) {
      this.messages.set([]);
      this.dialogService.backToList();
      return;
    }

    this.loadMessages(selected.id);
    this.markConversationReadIfNeeded(selected);
  }

  private markConversationReadIfNeeded(conv: ConversationDto): void {
    if (conv.currentUserUnreadCount <= 0) return;

    this.conversationService.markRead(conv.id).subscribe(() => {
      conv.currentUserUnreadCount = 0;
      this.dialogService.emitConversationChanged(
        this.dialogService.entityType(),
        this.dialogService.entityId()
      );
    });
  }
}
