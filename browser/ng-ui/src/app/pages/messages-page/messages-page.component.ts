import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServerApiService, PwaConversationDto, PwaMessageDto } from '../../services/server-api.service';
import { AuthService } from '../../auth/auth.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';

@Component({
  selector: 'app-messages-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout header="Messages">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <div main-content>
        <div class="messages-container">

          @if (!authService.isLoggedIn()) {
            <div class="empty">Sign in to view your messages.</div>
          } @else if (view() === 'list') {
            <!-- Conversation List -->
            <div class="list-header">
              <h2>Conversations</h2>
            </div>

            @if (loading()) {
              <div class="loading">Loading conversations...</div>
            } @else if (conversations().length === 0) {
              <div class="empty">No conversations yet.</div>
            } @else {
              <div class="conversation-list">
                @for (conv of conversations(); track conv.id) {
                  <div class="conversation-card" (click)="openConversation(conv)" [class.unread]="conv.currentUserUnreadCount > 0">
                    <div class="conv-header">
                      <span class="conv-subject">{{ conv.subject }}</span>
                      <div class="conv-meta">
                        @if (conv.currentUserUnreadCount > 0) {
                          <span class="unread-badge">{{ conv.currentUserUnreadCount }}</span>
                        }
                        <span class="conv-status" [class]="conv.status.toLowerCase()">{{ conv.status }}</span>
                      </div>
                    </div>
                    <div class="conv-details">
                      <span class="conv-entity">{{ conv.entityType }}</span>
                      <span class="conv-separator">·</span>
                      <span class="conv-with">{{ getOtherPartyName(conv) }}</span>
                    </div>
                    @if (conv.lastMessageAt) {
                      <div class="conv-time">{{ formatTime(conv.lastMessageAt) }}</div>
                    }
                  </div>
                }
              </div>
            }

          } @else {
            <!-- Thread View -->
            <div class="thread-header">
              <button class="back-btn" (click)="backToList()">← Back</button>
              <div class="thread-info">
                <span class="thread-subject">{{ activeConversation()?.subject }}</span>
                <span class="thread-entity">{{ activeConversation()?.entityType }} · {{ getOtherPartyName(activeConversation()!) }}</span>
              </div>
              @if (activeConversation()?.status === 'OPEN') {
                <span class="thread-open">Open</span>
              } @else {
                <span class="thread-closed">Closed</span>
              }
            </div>

            <div class="message-thread" #threadContainer>
              @if (messagesLoading()) {
                <div class="loading">Loading messages...</div>
              } @else {
                @for (msg of messages(); track msg.id) {
                  <div class="message-bubble" [class.own]="msg.senderId === currentUserId()">
                    <div class="msg-sender">{{ msg.senderName }}</div>
                    <div class="msg-content">{{ msg.content }}</div>
                    <div class="msg-time">{{ formatTime(msg.sentAt) }}</div>
                  </div>
                }
              }
            </div>

            @if (activeConversation()?.status === 'OPEN') {
              <div class="reply-area">
                <textarea
                  class="reply-input"
                  [(ngModel)]="replyText"
                  placeholder="Type a message..."
                  (keydown.enter)="onEnterKey($event)"
                  rows="2"
                ></textarea>
                <button class="send-btn" (click)="sendReply()" [disabled]="sending() || !replyText.trim()">
                  {{ sending() ? 'Sending...' : 'Send' }}
                </button>
              </div>
            } @else {
              <div class="closed-notice">This conversation is closed.</div>
            }
          }
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .messages-container { padding: 1rem; max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; height: 100%; }
    .loading, .empty { text-align: center; padding: 2rem; color: var(--text-secondary, #888); }

    /* List Header */
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
    .list-header h2 { margin: 0; font-size: 1.2rem; color: var(--primary-text); }

    /* Conversation Card */
    .conversation-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .conversation-card {
      background: var(--card-bg, var(--secondary-background, #fff));
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px; padding: 0.75rem 1rem; cursor: pointer;
      transition: box-shadow 0.15s, border-color 0.15s;
    }
    .conversation-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); border-color: var(--accent-color, #007bff); }
    .conversation-card.unread { border-left: 3px solid #4caf50; }

    .conv-header { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
    .conv-subject { font-weight: 600; color: var(--primary-text, #333); font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .conv-meta { display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0; }
    .unread-badge {
      background: #4caf50; color: #fff; border-radius: 10px;
      padding: 1px 7px; font-size: 0.7rem; font-weight: 600; min-width: 18px; text-align: center;
    }
    .conv-status { padding: 1px 6px; border-radius: 10px; font-size: 0.65rem; font-weight: 500; text-transform: uppercase; }
    .conv-status.open { background: #c8e6c9; color: #2e7d32; }
    .conv-status.closed { background: #e0e0e0; color: #757575; }

    .conv-details { font-size: 0.8rem; color: var(--text-secondary, #888); margin-top: 0.25rem; }
    .conv-separator { margin: 0 0.25rem; }
    .conv-time { font-size: 0.7rem; color: var(--text-secondary, #aaa); margin-top: 0.2rem; }

    /* Thread View */
    .thread-header {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.5rem 0; border-bottom: 1px solid var(--border-color, #ddd);
      margin-bottom: 0.5rem;
    }
    .back-btn {
      background: none; border: 1px solid var(--border-color, #ccc); border-radius: 6px;
      padding: 0.35rem 0.75rem; cursor: pointer; color: var(--primary-text); font-size: 0.85rem;
      font-family: inherit;
    }
    .back-btn:hover { background: var(--card-bg, #f5f5f5); }
    .thread-info { flex: 1; min-width: 0; }
    .thread-subject { display: block; font-weight: 600; color: var(--primary-text); font-size: 0.95rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .thread-entity { display: block; font-size: 0.75rem; color: var(--text-secondary, #888); }
    .thread-open { color: #4caf50; font-size: 0.75rem; font-weight: 500; }
    .thread-closed { color: #999; font-size: 0.75rem; font-weight: 500; }

    /* Message Bubbles */
    .message-thread { flex: 1; overflow-y: auto; padding: 0.5rem 0; display: flex; flex-direction: column; gap: 0.5rem; }
    .message-bubble {
      max-width: 80%; padding: 0.6rem 0.8rem; border-radius: 12px;
      background: var(--card-bg, #f0f0f0); align-self: flex-start;
    }
    .message-bubble.own {
      align-self: flex-end;
      background: var(--accent-color, #007bff); color: #fff;
    }
    .msg-sender { font-size: 0.7rem; font-weight: 600; margin-bottom: 2px; opacity: 0.8; }
    .message-bubble.own .msg-sender { color: rgba(255,255,255,0.85); }
    .msg-content { font-size: 0.9rem; line-height: 1.4; white-space: pre-wrap; word-break: break-word; }
    .msg-time { font-size: 0.65rem; opacity: 0.6; margin-top: 3px; text-align: right; }

    /* Reply Area */
    .reply-area {
      display: flex; gap: 0.5rem; padding: 0.75rem 0; border-top: 1px solid var(--border-color, #ddd);
      margin-top: auto;
    }
    .reply-input {
      flex: 1; resize: none; border: 1px solid var(--border-color, #ccc); border-radius: 8px;
      padding: 0.5rem 0.75rem; font-family: inherit; font-size: 0.9rem;
      background: var(--card-bg, #fff); color: var(--primary-text);
    }
    .reply-input:focus { outline: none; border-color: var(--accent-color, #007bff); }
    .send-btn {
      background: var(--accent-color, #007bff); color: #fff; border: none; border-radius: 8px;
      padding: 0.5rem 1.25rem; cursor: pointer; font-family: inherit; font-weight: 500;
      font-size: 0.9rem; align-self: flex-end;
    }
    .send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .send-btn:hover:not(:disabled) { filter: brightness(1.1); }

    .closed-notice {
      text-align: center; padding: 0.75rem; color: var(--text-secondary, #888);
      border-top: 1px solid var(--border-color, #ddd); margin-top: auto; font-size: 0.85rem;
    }

    @media (max-width: 768px) {
      .messages-container { padding: 0.5rem; }
      .message-bubble { max-width: 90%; }
    }
  `]
})
export class MessagesPageComponent implements OnInit {
  authService = inject(AuthService);
  private serverApi = inject(ServerApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  view = signal<'list' | 'thread'>('list');
  loading = signal(true);
  messagesLoading = signal(false);
  sending = signal(false);
  conversations = signal<PwaConversationDto[]>([]);
  activeConversation = signal<PwaConversationDto | null>(null);
  messages = signal<PwaMessageDto[]>([]);
  replyText = '';

  currentUserId = computed(() => this.authService.currentUser()?.id ?? 0);

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.loadConversations();
    } else {
      this.loading.set(false);
    }
  }

  loadConversations(): void {
    this.loading.set(true);
    this.serverApi.getMyConversations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (conversations) => {
          this.conversations.set(conversations);
          this.loading.set(false);
        },
        error: () => {
          this.conversations.set([]);
          this.loading.set(false);
        }
      });
  }

  openConversation(conv: PwaConversationDto): void {
    this.activeConversation.set(conv);
    this.view.set('thread');
    this.messagesLoading.set(true);

    this.serverApi.getConversationMessages(conv.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (messages) => {
          this.messages.set(messages);
          this.messagesLoading.set(false);
          this.scrollToBottom();

          if (conv.currentUserUnreadCount > 0) {
            this.serverApi.markConversationRead(conv.id)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe();
          }
        },
        error: () => {
          this.messages.set([]);
          this.messagesLoading.set(false);
        }
      });
  }

  backToList(): void {
    this.view.set('list');
    this.activeConversation.set(null);
    this.messages.set([]);
    this.replyText = '';
    this.loadConversations();
  }

  sendReply(): void {
    const conv = this.activeConversation();
    if (!conv || !this.replyText.trim()) return;

    this.sending.set(true);
    this.serverApi.sendMessage(conv.id, this.replyText.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (msg) => {
          this.messages.update(msgs => [...msgs, msg]);
          this.replyText = '';
          this.sending.set(false);
          this.scrollToBottom();
        },
        error: () => {
          this.sending.set(false);
        }
      });
  }

  onEnterKey(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      this.sendReply();
    }
  }

  getOtherPartyName(conv: PwaConversationDto): string {
    const userId = this.currentUserId();
    if (conv.initiatorId === userId) {
      return conv.responderName ?? 'Operators';
    }
    return conv.initiatorName;
  }

  formatTime(isoString: string): string {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
    } catch {
      return isoString;
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const el = document.querySelector('.message-thread');
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
