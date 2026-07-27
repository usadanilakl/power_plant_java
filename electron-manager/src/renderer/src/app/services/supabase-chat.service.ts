import { Injectable, inject, signal } from '@angular/core';
import { SupabaseClient, createClient, RealtimeChannel } from '@supabase/supabase-js';
import { ElectronService, ChatSupabaseSession } from './electron.service';

/**
 * Chat client. Fetches a Supabase-verifiable JWT from the local hub (which mints one using the
 * Supabase project JWT secret it holds), then talks Supabase directly for reads, writes, and
 * Realtime subscriptions. Hub is NOT in the chat hot path — see
 * {@code project/features/users/communication/plant-chat.md} (Option C).
 */

export interface PlantConversation {
  id: string;
  name: string;
  description?: string | null;
  entity_type?: string | null;
  entity_id?: number | null;
  is_editable: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_at?: string | null;
}

export interface PlantChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_display_name: string;
  content: string;
  is_important: boolean;
  requires_ack: boolean;
  sent_at: string;
  edited_at?: string | null;
  deleted_at?: string | null;
}

export interface SendMessageInput {
  content: string;
  is_important?: boolean;
  requires_ack?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SupabaseChatService {
  private electron = inject(ElectronService);

  /** Live status — the UI reads these to render "loading auth" / "reconnecting" / "chat unavailable". */
  ready = signal(false);
  errorMessage = signal<string | null>(null);

  private client: SupabaseClient | null = null;
  private session: ChatSupabaseSession | null = null;
  private refreshTimer: any = null;

  async ensureReady(): Promise<SupabaseClient> {
    if (this.client && this.ready()) return this.client;
    await this.refreshSession();
    if (!this.client) throw new Error(this.errorMessage() ?? 'Chat client not available');
    return this.client;
  }

  /** Whoami — used by the compose bar to stamp sender_id / sender_display_name. */
  get identity(): { supabaseUuid: string; displayName: string } | null {
    if (!this.session) return null;
    return { supabaseUuid: this.session.supabaseUuid, displayName: this.session.displayName };
  }

  async refreshSession(): Promise<void> {
    try {
      const result = await this.electron.chatGetSupabaseSession();
      if (!result.success || !result.data) {
        this.errorMessage.set(result.error ?? 'Could not obtain Supabase session from hub');
        this.ready.set(false);
        return;
      }
      const s = result.data;
      if (!s.supabaseUrl || !s.supabaseAnonKey) {
        this.errorMessage.set('Hub did not return Supabase URL / anon key (config missing).');
        this.ready.set(false);
        return;
      }
      this.session = s;
      // Recreate the client each refresh so it picks up the fresh JWT. Cheap enough.
      this.client = createClient(s.supabaseUrl, s.supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${s.token}` } },
        realtime: { params: { apikey: s.supabaseAnonKey } },
      });
      // Also plumb the JWT into the Realtime channel so RLS on subscriptions sees the caller.
      await this.client.realtime.setAuth(s.token);
      this.errorMessage.set(null);
      this.ready.set(true);
      this.scheduleRefresh(s.expiresIn);
    } catch (err: any) {
      this.errorMessage.set(err?.message ?? 'Chat session refresh failed');
      this.ready.set(false);
    }
  }

  private scheduleRefresh(expiresInSec: number): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    // Refresh at ~80% of the token lifetime — always ahead of expiry.
    const delay = Math.max(30_000, Math.floor(expiresInSec * 0.8) * 1000);
    this.refreshTimer = setTimeout(() => { this.refreshSession(); }, delay);
  }

  async listConversations(): Promise<PlantConversation[]> {
    const c = await this.ensureReady();
    const { data, error } = await c.from('plant_conversation')
      .select('*')
      .is('archived_at', null)
      .order('name', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async getMessages(conversationId: string, limit = 100): Promise<PlantChatMessage[]> {
    const c = await this.ensureReady();
    const { data, error } = await c.from('plant_chat_message')
      .select('*')
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('sent_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    // Return oldest-first for chat rendering.
    return (data ?? []).slice().reverse();
  }

  async sendMessage(conversationId: string, input: SendMessageInput): Promise<PlantChatMessage> {
    const c = await this.ensureReady();
    const id = this.identity;
    if (!id) throw new Error('No identity — refresh session first');
    const row = {
      conversation_id: conversationId,
      sender_id: id.supabaseUuid,
      sender_display_name: id.displayName,
      content: input.content,
      is_important: !!input.is_important || !!input.requires_ack,
      requires_ack: !!input.requires_ack,
    };
    const { data, error } = await c.from('plant_chat_message').insert(row).select().single();
    if (error) throw error;
    return data as PlantChatMessage;
  }

  async ackMessage(messageId: string): Promise<void> {
    const c = await this.ensureReady();
    const id = this.identity;
    if (!id) throw new Error('No identity — refresh session first');
    // upsert so acking the same message twice is a no-op (composite PK).
    const { error } = await c.from('plant_chat_ack').upsert({
      message_id: messageId,
      user_id: id.supabaseUuid,
    }, { onConflict: 'message_id,user_id' });
    if (error) throw error;
  }

  /**
   * Subscribe to INSERTs on {@code plant_chat_message} for one conversation. Returns the
   * RealtimeChannel — caller unsubscribes when the view is destroyed.
   */
  async subscribeMessages(
    conversationId: string,
    onInsert: (msg: PlantChatMessage) => void,
  ): Promise<RealtimeChannel> {
    const c = await this.ensureReady();
    const channel = c.channel(`plant_chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'plant_chat_message',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => onInsert(payload.new as PlantChatMessage))
      .subscribe();
    return channel;
  }

  /**
   * Subscribe to ALL new messages plant-wide — used by the top-of-window toast that surfaces
   * incoming chat regardless of which conversation the user is looking at.
   */
  async subscribeAllMessages(onInsert: (msg: PlantChatMessage) => void): Promise<RealtimeChannel> {
    const c = await this.ensureReady();
    const channel = c.channel('plant_chat:all')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'plant_chat_message',
      }, payload => onInsert(payload.new as PlantChatMessage))
      .subscribe();
    return channel;
  }

  async unsubscribe(channel: RealtimeChannel): Promise<void> {
    if (this.client) await this.client.removeChannel(channel);
  }
}
