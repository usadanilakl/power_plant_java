import { Component, OnInit, OnDestroy, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RealtimeChannel } from '@supabase/supabase-js';
import {
  PwaChatService, PlantConversation, PlantChatMessage,
} from '../../services/pwa-chat.service';

/**
 * PWA chat panel — mirror of the Electron ChatPanelComponent, adapted for the PWA layout (narrower
 * viewport, no side-by-side split). Same {@link PwaChatService} contract as Electron. Backed by
 * Supabase directly for reads/writes/realtime; hub is NOT in the hot path (Option C — see
 * {@code project/features/users/communication/plant-chat.md}).
 */
@Component({
  selector: 'app-pwa-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pwa-chat-panel.component.html',
  styleUrl: './pwa-chat-panel.component.css',
})
export class PwaChatPanelComponent implements OnInit, OnDestroy, AfterViewChecked {
  chat = inject(PwaChatService);

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

  /** Per-message-id → set of user ids who acked. Drives sender-view "N acked" counter. */
  ackMap = signal<Map<string, Set<string>>>(new Map());
  /** Messages that require ack, not sent by me, not yet acked by me — surfaced as a top banner. */
  pendingAckMessages = signal<PlantChatMessage[]>([]);

  // New-conversation dialog state
  showNewConversation = signal(false);
  newConvName = '';
  newConvDescription = '';
  newConvBusy = signal(false);
  newConvError = signal<string | null>(null);

  @ViewChild('threadBottom') threadBottom?: ElementRef<HTMLDivElement>;

  async ngOnInit(): Promise<void> {
    await this.chat.refreshSession();
    if (!this.chat.ready()) return;
    await this.loadConversations();
  }

  async ngOnDestroy(): Promise<void> {
    if (this.messageChannel) await this.chat.unsubscribe(this.messageChannel);
    if (this.ackChannel) await this.chat.unsubscribe(this.ackChannel);
  }

  ngAfterViewChecked(): void {
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
    } catch (err: any) {
      console.error('[PwaChat] listConversations failed:', err);
    } finally {
      this.loadingConversations.set(false);
    }
  }

  async selectConversation(id: string): Promise<void> {
    if (this.activeConversationId() === id) return;
    this.activeConversationId.set(id);

    if (this.messageChannel) {
      await this.chat.unsubscribe(this.messageChannel);
      this.messageChannel = null;
    }
    if (this.ackChannel) {
      await this.chat.unsubscribe(this.ackChannel);
      this.ackChannel = null;
    }
    this.ackMap.set(new Map());
    this.pendingAckMessages.set([]);

    this.loadingMessages.set(true);
    this.messages.set([]);
    try {
      const rows = await this.chat.getMessages(id);
      this.messages.set(rows);
      this.recomputePendingAcks();
      this.scrollPending = true;

      // Seed ack sets — sender-view "N acked" and my-pending detection both use them.
      await Promise.all(rows.filter(m => m.is_important).map(async m => {
        try {
          const acks = await this.chat.acksFor(m.id);
          this.ackMap.update(map => {
            const next = new Map(map);
            next.set(m.id, new Set(acks.map(a => a.user_id)));
            return next;
          });
        } catch { /* non-fatal */ }
      }));
      this.recomputePendingAcks();

      this.messageChannel = await this.chat.subscribeMessages(id, msg => {
        if (this.messages().some(m => m.id === msg.id)) return;
        this.messages.update(rows2 => [...rows2, msg]);
        this.recomputePendingAcks();
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
        this.recomputePendingAcks();
      });
    } catch (err: any) {
      console.error('[PwaChat] getMessages failed:', err);
    } finally {
      this.loadingMessages.set(false);
    }
  }

  ackCount(messageId: string): number {
    return this.ackMap().get(messageId)?.size ?? 0;
  }

  async ackFromBanner(msg: PlantChatMessage): Promise<void> {
    try {
      await this.chat.ackMessage(msg.id);
      const me = this.chat.identity?.supabaseUuid;
      if (me) {
        this.ackMap.update(map => {
          const next = new Map(map);
          const set = next.get(msg.id) ?? new Set<string>();
          set.add(me);
          next.set(msg.id, set);
          return next;
        });
      }
      this.recomputePendingAcks();
    } catch (err: any) {
      alert('Acknowledge failed: ' + (err?.message ?? 'unknown'));
    }
  }

  private recomputePendingAcks(): void {
    const me = this.chat.identity?.supabaseUuid;
    if (!me) { this.pendingAckMessages.set([]); return; }
    this.pendingAckMessages.set(this.messages().filter(m =>
      m.requires_ack
      && m.sender_id !== me
      && !(this.ackMap().get(m.id)?.has(me))
    ));
  }

  back(): void {
    if (this.messageChannel) {
      this.chat.unsubscribe(this.messageChannel);
      this.messageChannel = null;
    }
    this.activeConversationId.set(null);
    this.messages.set([]);
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
    return msg.sender_id === this.chat.identity?.supabaseUuid ? 'me' : 'them';
  }

  activeConversation(): PlantConversation | undefined {
    const id = this.activeConversationId();
    return id ? this.conversations().find(c => c.id === id) : undefined;
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
      // Prepend to local list so it appears immediately (also fresh-fetch to catch races).
      this.conversations.update(list => [created, ...list.filter(c => c.id !== created.id)]);
      this.showNewConversation.set(false);
      await this.selectConversation(created.id);
    } catch (err: any) {
      this.newConvError.set(err?.message ?? 'Create failed');
    } finally {
      this.newConvBusy.set(false);
    }
  }
}
