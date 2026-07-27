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
  private scrollPending = false;

  @ViewChild('threadBottom') threadBottom?: ElementRef<HTMLDivElement>;

  async ngOnInit(): Promise<void> {
    await this.chat.refreshSession();
    if (!this.chat.ready()) return;
    await this.loadConversations();
  }

  async ngOnDestroy(): Promise<void> {
    if (this.messageChannel) await this.chat.unsubscribe(this.messageChannel);
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

    this.loadingMessages.set(true);
    this.messages.set([]);
    try {
      const rows = await this.chat.getMessages(id);
      this.messages.set(rows);
      this.scrollPending = true;

      this.messageChannel = await this.chat.subscribeMessages(id, msg => {
        if (this.messages().some(m => m.id === msg.id)) return;
        this.messages.update(rows2 => [...rows2, msg]);
        this.scrollPending = true;
      });
    } catch (err: any) {
      console.error('[PwaChat] getMessages failed:', err);
    } finally {
      this.loadingMessages.set(false);
    }
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
}
