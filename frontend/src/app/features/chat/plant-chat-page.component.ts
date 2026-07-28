import {
  Component, OnInit, OnDestroy, inject, signal,
  ViewChild, ElementRef, AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import {
  PlantChatService, PlantConversation, PlantChatMessage,
} from '../../services/plant-chat.service';

/**
 * Plant Chat page for the JG Portal desktop web app. Full-featured chat panel with conversation
 * list + thread + compose + create-new-conversation + live-ack tracking. Talks Supabase directly
 * (see {@code project/features/users/communication/plant-chat.md} Option C — hub is not in the
 * chat hot path).
 *
 * The important-message ack modal is mounted globally in the main layout so it fires regardless
 * of which page the user is on; this component only handles the in-panel "N acked" indicator +
 * per-conversation subscriptions.
 */
@Component({
  selector: 'app-plant-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './plant-chat-page.component.html',
  styleUrl: './plant-chat-page.component.css',
})
export class PlantChatPageComponent implements OnInit, OnDestroy, AfterViewChecked {
  chat = inject(PlantChatService);

  conversations = signal<PlantConversation[]>([]);
  activeConversationId = signal<string | null>(null);
  messages = signal<PlantChatMessage[]>([]);
  loadingConversations = signal(false);
  loadingMessages = signal(false);
  sendError = signal<string | null>(null);
  composeText = '';
  composeImportant = false;
  composeRequiresAck = false;

  /** Per-message-id → set of user ids who acked; drives sender-view "N acked" line. */
  ackMap = signal<Map<string, Set<string>>>(new Map());

  // Create-conversation dialog
  showNewConversation = signal(false);
  newConvName = '';
  newConvDescription = '';
  newConvBusy = signal(false);
  newConvError = signal<string | null>(null);

  private messageChannel: RealtimeChannel | null = null;
  private ackChannel: RealtimeChannel | null = null;
  private scrollPending = false;

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
      if (rows.length > 0 && !this.activeConversationId()) {
        await this.selectConversation(rows[0].id);
      }
    } catch (err: any) {
      console.error('[PlantChat] listConversations failed:', err);
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

    this.loadingMessages.set(true);
    this.messages.set([]);
    try {
      const rows = await this.chat.getMessages(id);
      this.messages.set(rows);
      this.scrollPending = true;

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
      console.error('[PlantChat] getMessages failed:', err);
    } finally {
      this.loadingMessages.set(false);
    }
  }

  async send(): Promise<void> {
    const conversationId = this.activeConversationId();
    if (!conversationId || !this.composeText.trim()) return;

    this.sendError.set(null);
    try {
      const msg = await this.chat.sendMessage(conversationId, {
        content: this.composeText.trim(),
        is_important: this.composeImportant || this.composeRequiresAck,
        requires_ack: this.composeRequiresAck,
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
}
