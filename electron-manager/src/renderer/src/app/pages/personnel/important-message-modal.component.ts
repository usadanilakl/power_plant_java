import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseChatService, PlantChatMessage } from '../../services/supabase-chat.service';

/**
 * Global modal that pops up on the Electron desktop whenever an INCOMING important message
 * arrives that this user has not yet acknowledged. Requires an explicit "Acknowledge" click to
 * dismiss — cannot be closed by clicking the backdrop or pressing Escape. Plays a short beep.
 *
 * Mount once at the top of {@code app.component} so it's active regardless of which page the user
 * is on. See {@code project/features/users/communication/plant-chat.md} (Stage 6 polish).
 *
 * Not shown for the sender's own messages, nor for messages the user has already acked (dedup by
 * message id in a local set that resets on window reload — good enough for a control-room desktop
 * that stays open).
 */
@Component({
  selector: 'app-important-message-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (queue().length > 0) {
      <div class="backdrop">
        <div class="modal" role="alertdialog" aria-modal="true">
          <div class="banner">
            <span class="material-icons alert">warning</span>
            {{ current()!.requires_ack ? 'Acknowledgement required' : 'Important message' }}
          </div>
          <div class="meta">
            <strong>{{ current()!.sender_display_name }}</strong>
            <span class="time">{{ current()!.sent_at | date:'short' }}</span>
          </div>
          <div class="body">{{ current()!.content }}</div>
          @if (queue().length > 1) {
            <div class="stack-note">
              + {{ queue().length - 1 }} more waiting
            </div>
          }
          @if (ackError()) {
            <div class="err">{{ ackError() }}</div>
          }
          <div class="actions">
            <button class="btn-primary" (click)="acknowledge()" [disabled]="acking()">
              {{ acking() ? 'Acknowledging…' : 'Acknowledge' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 10000; display: flex; align-items: center; justify-content: center; }
    .modal { background: var(--card-background, #1a1a1a); border: 2px solid #d4a017; border-radius: 8px; padding: 20px; min-width: 380px; max-width: 560px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); }
    .banner { display: flex; align-items: center; gap: 8px; color: #d4a017; font-weight: 600; font-size: 14px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid rgba(212,160,23,0.3); }
    .banner .alert { font-size: 20px; }
    .meta { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 8px; color: var(--text-muted, #999); }
    .meta strong { color: var(--text-primary, #fff); }
    .body { font-size: 14px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; padding: 12px 0; }
    .stack-note { color: var(--text-muted, #999); font-size: 12px; margin-top: 6px; }
    .err { color: #c95252; font-size: 12px; margin-top: 8px; }
    .actions { display: flex; justify-content: flex-end; margin-top: 12px; }
    .btn-primary { padding: 8px 20px; background: #d4a017; color: #000; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
  `],
})
export class ImportantMessageModalComponent implements OnInit, OnDestroy {
  private chat = inject(SupabaseChatService);

  queue = signal<PlantChatMessage[]>([]);
  acking = signal(false);
  ackError = signal<string | null>(null);

  private globalChannel: RealtimeChannel | null = null;
  private handledIds = new Set<string>();

  current(): PlantChatMessage | null {
    const q = this.queue();
    return q.length > 0 ? q[0] : null;
  }

  async ngOnInit(): Promise<void> {
    await this.chat.refreshSession();
    if (!this.chat.ready()) return;
    // Backfill BEFORE opening the subscription — ack-required messages sent while this Electron
    // was closed / offline must still surface so a restart cannot be used to bypass the modal.
    try {
      // unackedRequiredForMe returns oldest-first so the queue processes them chronologically.
      const outstanding = await this.chat.unackedRequiredForMe();
      outstanding.forEach(m => this.enqueueIfImportant(m));
    } catch (err) {
      console.warn('[ImportantMsgModal] backfill failed (will still catch new inserts):', err);
    }
    // Subscribe to ALL new messages plant-wide — filter to important-and-not-mine locally.
    this.globalChannel = await this.chat.subscribeAllMessages(msg => this.enqueueIfImportant(msg));
  }

  async ngOnDestroy(): Promise<void> {
    if (this.globalChannel) await this.chat.unsubscribe(this.globalChannel);
  }

  private enqueueIfImportant(msg: PlantChatMessage): void {
    if (!msg.is_important && !msg.requires_ack) return;
    if (this.handledIds.has(msg.id)) return;
    const me = this.chat.identity?.supabaseUuid;
    if (me && msg.sender_id === me) return; // don't pop up for messages I sent

    this.handledIds.add(msg.id);
    this.queue.update(q => [...q, msg]);
    this.beep();
  }

  async acknowledge(): Promise<void> {
    const msg = this.current();
    if (!msg) return;
    this.acking.set(true);
    this.ackError.set(null);
    try {
      // requires_ack messages get a real ack row; is_important-only gets a self-dismiss and no ack.
      if (msg.requires_ack) await this.chat.ackMessage(msg.id);
      this.queue.update(q => q.slice(1));
    } catch (err: any) {
      this.ackError.set(err?.message ?? 'Acknowledge failed');
    } finally {
      this.acking.set(false);
    }
  }

  private beep(): void {
    try {
      // Short beep via Web Audio — no assets to package.
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start(); osc.stop(ctx.currentTime + 0.4);
    } catch { /* audio blocked — ignore */ }
  }
}
