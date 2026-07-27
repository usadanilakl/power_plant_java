import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  SupabaseChatService, PlantConversation, PlantChatMessage,
} from '../../services/supabase-chat.service';

/**
 * Plant Chat panel — used inside the Personnel section's Conversations tab. Loads conversations
 * and messages via {@link SupabaseChatService} (direct to Supabase, hub not in the hot path), plus
 * a Realtime subscription for live inserts.
 *
 * Important-message modal + top-window toast are Stage 6 polish and not yet wired here.
 */
@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.component.html',
  styleUrl: './chat-panel.component.css',
})
export class ChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  chat = inject(SupabaseChatService);

  conversations = signal<PlantConversation[]>([]);
  activeConversationId = signal<string | null>(null);
  messages = signal<PlantChatMessage[]>([]);
  loadingConversations = signal(false);
  loadingMessages = signal(false);
  sendError = signal<string | null>(null);
  composeText = '';
  composeImportant = false;
  composeRequiresAck = false;

  private messageChannel: RealtimeChannel | null = null;
  private ackChannel: RealtimeChannel | null = null;
  private scrollPending = false;

  /** Per-message-id → set of user ids who have acked. Drives the sender-view "N acked" line. */
  ackMap = signal<Map<string, Set<string>>>(new Map());

  // New-conversation dialog state (creator = current user; RLS enforces created_by = auth.uid()).
  showNewConversation = signal(false);
  newConvName = '';
  newConvDescription = '';
  newConvBusy = signal(false);
  newConvError = signal<string | null>(null);

  @ViewChild('threadBottom') threadBottom?: ElementRef<HTMLDivElement>;

  async ngOnInit(): Promise<void> {
    await this.chat.refreshSession();
    if (!this.chat.ready()) return; // Error surfaced in template via chat.errorMessage()
    await this.loadConversations();
  }

  async ngOnDestroy(): Promise<void> {
    if (this.messageChannel) await this.chat.unsubscribe(this.messageChannel);
    if (this.ackChannel) await this.chat.unsubscribe(this.ackChannel);
  }

  ngAfterViewChecked(): void {
    // Auto-scroll to the bottom when a new message arrives / conversation switches.
    if (this.scrollPending && this.threadBottom) {
      this.threadBottom.nativeElement.scrollIntoView({ behavior: 'auto', block: 'end' });
      this.scrollPending = false;
    }
  }

  async loadConversations(): Promise<void> {
    this.loadingConversations.set(true);
    try {
      const rows = await this.chat.listConversations();
      this.conversations.set(rows);
      // Auto-open the first conversation on cold start.
      if (rows.length > 0 && !this.activeConversationId()) {
        await this.selectConversation(rows[0].id);
      }
    } catch (err: any) {
      console.error('[Chat] listConversations failed:', err);
    } finally {
      this.loadingConversations.set(false);
    }
  }

  async selectConversation(id: string): Promise<void> {
    if (this.activeConversationId() === id) return;
    this.activeConversationId.set(id);

    // Tear down previous subscriptions and open the new ones.
    if (this.messageChannel) {
      await this.chat.unsubscribe(this.messageChannel);
      this.messageChannel = null;
    }
    if (this.ackChannel) {
      await this.chat.unsubscribe(this.ackChannel);
      this.ackChannel = null;
    }
    this.ackMap.set(new Map());

    this.loadingMessages.set(true);
    this.messages.set([]);
    try {
      const rows = await this.chat.getMessages(id);
      this.messages.set(rows);
      this.scrollPending = true;

      // Seed ack sets for the messages we just loaded (parallel fetch per message).
      await Promise.all(rows.filter(m => m.is_important).map(async m => {
        try {
          const acks = await this.chat.acksFor(m.id);
          this.ackMap.update(map => {
            const next = new Map(map);
            next.set(m.id, new Set(acks.map(a => a.user_id)));
            return next;
          });
        } catch { /* per-message ack fetch is non-fatal */ }
      }));

      this.messageChannel = await this.chat.subscribeMessages(id, msg => {
        if (this.messages().some(m => m.id === msg.id)) return;
        this.messages.update(rows2 => [...rows2, msg]);
        this.scrollPending = true;
      });
      this.ackChannel = await this.chat.subscribeAcks(id, ack => {
        this.ackMap.update(map => {
          const next = new Map(map);
          const set = next.get(ack.message_id) ?? new Set<string>();
          set.add(ack.user_id);
          next.set(ack.message_id, set);
          return next;
        });
      });
    } catch (err: any) {
      console.error('[Chat] getMessages failed:', err);
    } finally {
      this.loadingMessages.set(false);
    }
  }

  ackCount(messageId: string): number {
    return this.ackMap().get(messageId)?.size ?? 0;
  }

  openNewConversationDialog(): void {
    this.newConvName = '';
    this.newConvDescription = '';
    this.newConvError.set(null);
    this.showNewConversation.set(true);
  }

  cancelNewConversation(): void {
    this.showNewConversation.set(false);
    this.newConvError.set(null);
  }

  async submitNewConversation(): Promise<void> {
    if (!this.newConvName.trim()) {
      this.newConvError.set('Name is required');
      return;
    }
    this.newConvBusy.set(true);
    this.newConvError.set(null);
    try {
      const created = await this.chat.createConversation(this.newConvName, this.newConvDescription);
      this.conversations.update(list => [created, ...list.filter(c => c.id !== created.id)]);
      this.showNewConversation.set(false);
      await this.selectConversation(created.id);
    } catch (err: any) {
      this.newConvError.set(err?.message ?? 'Create failed');
    } finally {
      this.newConvBusy.set(false);
    }
  }

  async send(): Promise<void> {
    const conversationId = this.activeConversationId();
    if (!conversationId || !this.composeText.trim()) return;

    this.sendError.set(null);
    const content = this.composeText.trim();
    const important = this.composeImportant || this.composeRequiresAck;
    const requiresAck = this.composeRequiresAck;

    try {
      const msg = await this.chat.sendMessage(conversationId, {
        content,
        is_important: important,
        requires_ack: requiresAck,
      });
      // Optimistically show the message (Realtime insert will dedup by id).
      if (!this.messages().some(m => m.id === msg.id)) {
        this.messages.update(rows => [...rows, msg]);
      }
      this.composeText = '';
      this.composeImportant = false;
      this.composeRequiresAck = false;
      this.scrollPending = true;
    } catch (err: any) {
      this.sendError.set(err?.message ?? 'Failed to send');
    }
  }

  onComposeKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  senderClass(msg: PlantChatMessage): string {
    const me = this.chat.identity?.supabaseUuid;
    return msg.sender_id === me ? 'me' : 'them';
  }

  activeConversation(): PlantConversation | undefined {
    const id = this.activeConversationId();
    return id ? this.conversations().find(c => c.id === id) : undefined;
  }
}
