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

  /**
   * Create a new plant chat conversation. Any chat-eligible user can create — RLS
   * ({@code plant_conv_eligible_insert}) enforces {@code created_by = auth.uid()}. Returns the
   * newly created row.
   */
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

  /**
   * Paginated fetch — repeatedly issues the caller's query with successive {@code .range()}
   * windows until a short page returns. Works around PostgREST's default 1000-row cap so
   * "give me all rows" is actually all rows. Caller supplies a builder that inserts the range.
   */
  private async fetchAllPaged<T>(
    builder: (from: number) => PromiseLike<{ data: T[] | null; error: any }>,
  ): Promise<T[]> {
    const PAGE = 1000;
    const out: T[] = [];
    let offset = 0;
    // Safety cap on total iterations (unreachable in practice; guards runaway loops).
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

  /**
   * Load every message this user still needs to acknowledge — used by the global important-message
   * modal at startup so restarts cannot bypass ack-required messages. Correct even when many
   * required messages exist and most are already acked: the initial fetch is unbounded on the
   * server side (the {@code requires_ack} population is small by design — it's the "must
   * interrupt" set — so pulling the full id list is cheap).
   *
   * <p>Two-step anti-join keeps every query narrow:
   * <ol>
   *   <li>Fetch all requires_ack, undeleted, not-mine message ids (unbounded — small set).</li>
   *   <li>Fetch all my ack rows (unbounded — small set).</li>
   *   <li>Diff in memory. If any remain, fetch full rows via {@code .in('id', chunk)}, chunked
   *       to stay under PostgREST's URL length limit.</li>
   * </ol>
   */
  async unackedRequiredForMe(): Promise<PlantChatMessage[]> {
    const c = await this.ensureReady();
    const me = this.identity?.supabaseUuid;
    if (!me) return [];

    // 1. All candidate message ids (id only — cheap). PostgREST caps at 1000 rows/request
    // even without .limit(), so page explicitly to catch installs where the requires_ack set
    // has grown past 1000 (rare but possible). Ordering by id (uuid, unique) makes range()
    // pages deterministic — without a stable order the same offset window can return
    // overlapping / skipped rows across calls, letting an older message silently vanish.
    const idRows = await this.fetchAllPaged<{ id: string }>(from =>
      c.from('plant_chat_message')
        .select('id')
        .eq('requires_ack', true)
        .is('deleted_at', null)
        .neq('sender_id', me)
        .order('id', { ascending: true })
        .range(from, from + 999));
    if (idRows.length === 0) return [];

    // 2. My acks (all of them — same pagination concern for a very active user).
    // Order by message_id (part of the composite PK, unique per user) for the same reason.
    const ackRows = await this.fetchAllPaged<{ message_id: string }>(from =>
      c.from('plant_chat_ack')
        .select('message_id')
        .eq('user_id', me)
        .order('message_id', { ascending: true })
        .range(from, from + 999));
    const acked = new Set(ackRows.map(a => a.message_id));

    // 3. Diff → the ids that need the modal.
    const unackedIds = idRows.map(r => r.id).filter(id => !acked.has(id));
    if (unackedIds.length === 0) return [];

    // 4. Fetch full rows in chunks (PostgREST `.in()` becomes a query string; keep each
    // request URL well under typical 8 KB header limits — 40 UUIDs per chunk is safe).
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
    // Oldest-first — the modal enqueues in call order, so the caller sees chronological queue.
    out.sort((a, b) => a.sent_at.localeCompare(b.sent_at));
    return out;
  }

  /**
   * Fetch existing acks for a message (used to seed the sender-view "N acked" line before Realtime
   * takes over for live updates).
   */
  async acksFor(messageId: string): Promise<Array<{ user_id: string; acked_at: string }>> {
    const c = await this.ensureReady();
    const { data, error } = await c.from('plant_chat_ack')
      .select('user_id, acked_at')
      .eq('message_id', messageId);
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Live subscription to INSERTs on {@code plant_chat_ack} for one conversation's messages — the
   * sender's chat view uses this to render an updating "acked by N of M" line under important
   * messages.
   */
  async subscribeAcks(
    conversationId: string,
    onAck: (ack: { message_id: string; user_id: string; acked_at: string }) => void,
  ): Promise<RealtimeChannel> {
    const c = await this.ensureReady();
    // plant_chat_ack has no conversation_id column, but message_id filter isn't possible without
    // knowing the message ids up-front. Simpler: subscribe to all ack inserts and let the caller
    // filter — the shape gives message_id so filtering by conversation is trivial in JS.
    return c.channel(`plant_chat_ack:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'plant_chat_ack',
      }, payload => onAck(payload.new as { message_id: string; user_id: string; acked_at: string }))
      .subscribe();
  }
}
