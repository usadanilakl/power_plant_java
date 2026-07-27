import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SupabaseClient, createClient, RealtimeChannel } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

/**
 * PWA-side chat client for Plant Chat. Mirrors the shape of the Electron renderer's
 * SupabaseChatService — fetches a Supabase-verifiable session token from the hub, then talks
 * Supabase directly for reads / writes / Realtime. See
 * {@code project/features/users/communication/plant-chat.md} (Option C).
 *
 * Uses the SAME hub endpoint the Electron desktops call: {@code GET /api/chat/supabase-session}.
 * PWA passes its existing JWT (hub-signed or Supabase-signed — both accepted by
 * PwaJwtAuthFilter). Once the session token is in hand, Supabase Realtime works direct.
 */

export interface ChatSupabaseSession {
  token: string;
  expiresIn: number;
  supabaseUuid: string;
  displayName: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

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
export class PwaChatService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

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
      const token = this.auth.getAuthData()?.token;
      if (!token) {
        this.errorMessage.set('Not signed in');
        this.ready.set(false);
        return;
      }
      const url = `${environment.serverUrl}/api/chat/supabase-session`;
      const s = await firstValueFrom(
        this.http.get<ChatSupabaseSession>(url, {
          headers: { Authorization: `Bearer ${token}` },
        }),
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
    const { error } = await c.from('plant_chat_ack').upsert({
      message_id: messageId,
      user_id: id.supabaseUuid,
    }, { onConflict: 'message_id,user_id' });
    if (error) throw error;
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

  async unsubscribe(channel: RealtimeChannel): Promise<void> {
    if (this.client) await this.client.removeChannel(channel);
  }
}
