import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SupabaseClient, createClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

/**
 * JG Portal desktop-web chat client for Plant Chat. Mirrors the Electron renderer's
 * SupabaseChatService shape (fetch a Supabase-verifiable JWT from hub → talk Supabase direct for
 * reads / writes / Realtime). Hub is NOT in the hot path — see
 * {@code project/features/users/communication/plant-chat.md} (Option C).
 *
 * <p>The JG Portal desktop web app is served behind the hub at {@code /angular/browser/}, so
 * the hub session cookie is present on outbound requests; the {@code /api/chat/supabase-session}
 * endpoint accepts any authenticated caller.
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

export interface ChatSupabaseSession {
  token: string;
  expiresIn: number;
  supabaseUuid: string;
  displayName: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

@Injectable({ providedIn: 'root' })
export class PlantChatService {
  private http = inject(HttpClient);

  ready = signal(false);
  errorMessage = signal<string | null>(null);

  private client: SupabaseClient | null = null;
  private session: ChatSupabaseSession | null = null;
  private refreshTimer: any = null;

  get identity(): { supabaseUuid: string; displayName: string } | null {
    if (!this.session) return null;
    return { supabaseUuid: this.session.supabaseUuid, displayName: this.session.displayName };
  }

  async ensureReady(): Promise<SupabaseClient> {
    if (this.client && this.ready()) return this.client;
    await this.refreshSession();
    if (!this.client) throw new Error(this.errorMessage() ?? 'Chat client not available');
    return this.client;
  }

  async refreshSession(): Promise<void> {
    try {
      // JG Portal is same-origin with the hub — session cookie carries auth automatically.
      const url = `${environment.baseApiUrl}/api/chat/supabase-session`;
      const s = await firstValueFrom(
        this.http.get<ChatSupabaseSession>(url, { withCredentials: true }),
      );
      if (!s.supabaseUrl || !s.supabaseAnonKey) {
        this.errorMessage.set('Hub did not return Supabase URL / anon key (config missing).');
        this.ready.set(false);
        return;
      }
      this.session = s;
      this.client = createClient(s.supabaseUrl, s.supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${s.token}` } },
        realtime: { params: { apikey: s.supabaseAnonKey } },
      });
      await this.client.realtime.setAuth(s.token);
      this.errorMessage.set(null);
      this.ready.set(true);
      this.scheduleRefresh(s.expiresIn);
    } catch (err: unknown) {
      const msg = err instanceof HttpErrorResponse
        ? (err.error?.error ?? err.message)
        : (err instanceof Error ? err.message : 'Chat session refresh failed');
      this.errorMessage.set(msg);
      this.ready.set(false);
    }
  }

  private scheduleRefresh(expiresInSec: number): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const delay = Math.max(30_000, Math.floor(expiresInSec * 0.8) * 1000);
    this.refreshTimer = setTimeout(() => { this.refreshSession(); }, delay);
  }

  async createConversation(name: string, description?: string): Promise<PlantConversation> {
    const c = await this.ensureReady();
    const me = this.identity;
    if (!me) throw new Error('No identity — refresh session first');
    const row = {
      name: name.trim(),
      description: description && description.trim() ? description.trim() : null,
      created_by: me.supabaseUuid,
      is_editable: false,
    };
    const { data, error } = await c.from('plant_conversation').insert(row).select().single();
    if (error) throw error;
    return data as PlantConversation;
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
    return (data ?? []).slice().reverse();
  }

  async sendMessage(conversationId: string, input: SendMessageInput): Promise<PlantChatMessage> {
    const c = await this.ensureReady();
    const me = this.identity;
    if (!me) throw new Error('No identity — refresh session first');
    const row = {
      conversation_id: conversationId,
      sender_id: me.supabaseUuid,
      sender_display_name: me.displayName,
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
    const me = this.identity;
    if (!me) throw new Error('No identity — refresh session first');
    const { error } = await c.from('plant_chat_ack').upsert({
      message_id: messageId,
      user_id: me.supabaseUuid,
    }, { onConflict: 'message_id,user_id' });
    if (error) throw error;
  }

  async acksFor(messageId: string): Promise<Array<{ user_id: string; acked_at: string }>> {
    const c = await this.ensureReady();
    const { data, error } = await c.from('plant_chat_ack')
      .select('user_id, acked_at')
      .eq('message_id', messageId);
    if (error) throw error;
    return data ?? [];
  }

  async subscribeMessages(
    conversationId: string,
    onInsert: (msg: PlantChatMessage) => void,
  ): Promise<RealtimeChannel> {
    const c = await this.ensureReady();
    return c.channel(`plant_chat:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'plant_chat_message',
        filter: `conversation_id=eq.${conversationId}`,
      }, payload => onInsert(payload.new as PlantChatMessage))
      .subscribe();
  }

  async subscribeAllMessages(onInsert: (msg: PlantChatMessage) => void): Promise<RealtimeChannel> {
    const c = await this.ensureReady();
    return c.channel('plant_chat:all')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'plant_chat_message',
      }, payload => onInsert(payload.new as PlantChatMessage))
      .subscribe();
  }

  async subscribeAcks(
    conversationId: string,
    onAck: (ack: { message_id: string; user_id: string; acked_at: string }) => void,
  ): Promise<RealtimeChannel> {
    const c = await this.ensureReady();
    return c.channel(`plant_chat_ack:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'plant_chat_ack',
      }, payload => onAck(payload.new as { message_id: string; user_id: string; acked_at: string }))
      .subscribe();
  }

  async unsubscribe(channel: RealtimeChannel): Promise<void> {
    if (this.client) await this.client.removeChannel(channel);
  }

  /** Full paginated anti-join for outstanding ack-required messages this user hasn't seen yet. */
  async unackedRequiredForMe(): Promise<PlantChatMessage[]> {
    const c = await this.ensureReady();
    const me = this.identity?.supabaseUuid;
    if (!me) return [];

    const idRows = await this.fetchAllPaged<{ id: string }>(from =>
      c.from('plant_chat_message')
        .select('id')
        .eq('requires_ack', true)
        .is('deleted_at', null)
        .neq('sender_id', me)
        .order('id', { ascending: true })
        .range(from, from + 999));
    if (idRows.length === 0) return [];

    const ackRows = await this.fetchAllPaged<{ message_id: string }>(from =>
      c.from('plant_chat_ack')
        .select('message_id')
        .eq('user_id', me)
        .order('message_id', { ascending: true })
        .range(from, from + 999));
    const acked = new Set(ackRows.map(a => a.message_id));

    const unackedIds = idRows.map(r => r.id).filter(id => !acked.has(id));
    if (unackedIds.length === 0) return [];

    const CHUNK = 40;
    const out: PlantChatMessage[] = [];
    for (let i = 0; i < unackedIds.length; i += CHUNK) {
      const chunk = unackedIds.slice(i, i + CHUNK);
      const { data, error } = await c.from('plant_chat_message')
        .select('*')
        .in('id', chunk);
      if (error) throw error;
      if (data) out.push(...(data as PlantChatMessage[]));
    }
    out.sort((a, b) => a.sent_at.localeCompare(b.sent_at));
    return out;
  }

  private async fetchAllPaged<T>(
    builder: (from: number) => PromiseLike<{ data: T[] | null; error: any }>,
  ): Promise<T[]> {
    const PAGE = 1000;
    const out: T[] = [];
    let offset = 0;
    for (let i = 0; i < 1000; i++) {
      const { data, error } = await builder(offset);
      if (error) throw error;
      const rows = data ?? [];
      out.push(...rows);
      if (rows.length < PAGE) break;
      offset += PAGE;
    }
    return out;
  }
}
