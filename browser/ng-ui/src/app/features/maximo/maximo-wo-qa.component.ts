import { Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PwaConversationDto, PwaMessageDto, ServerApiService } from '../../services/server-api.service';
import { ServerStatusService } from '../../services/server-status.service';
import { MaximoQaOutboxService, QaOutboxItem } from './maximo-qa-outbox.service';
import { MaximoWorkOrder } from './maximo.model';

/**
 * WO Q&A (mobile). A question on a work order is an OPEN conversation everyone who can see the WO can read and
 * reply to (anchored by the numeric workorderid on entityType 'MaximoWorkOrder'). Composing/replying goes through
 * {@link MaximoQaOutboxService} so it works offline — the action queues locally and flushes on reconnect.
 */
@Component({
  selector: 'app-maximo-wo-qa',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (!wo.workorderid) {
      <p class="qa-msg">Q&amp;A isn't available for this work order (no numeric id).</p>
    } @else {
      @if (selected(); as t) {
      <!-- Thread view -->
      <button class="qa-back" (click)="closeThread()">← All questions</button>
      <div class="qa-thread-subj">{{ t.subject }}</div>
      @if (messagesLoading()) { <p class="qa-msg">Loading…</p> }
      @for (m of messages(); track m.id) {
        <div class="qa-bubble">
          <div class="qa-bubble-meta">{{ m.senderName || 'Someone' }} · {{ m.sentAt | date:'short' }}</div>
          <div class="qa-bubble-txt">{{ m.content }}</div>
        </div>
      }
      @for (p of outbox.pendingRepliesFor(t.id); track p.id) {
        <div class="qa-bubble qa-pending">
          <div class="qa-bubble-meta">⏳ {{ p.status === 'failed' ? 'failed — ' + (p.error || '') : 'queued (sends on reconnect)' }}</div>
          <div class="qa-bubble-txt">{{ p.content }}</div>
        </div>
      }
      <div class="qa-compose">
        <textarea rows="2" placeholder="Write a reply…" [value]="replyBody()" (input)="replyBody.set($any($event.target).value)"></textarea>
        <button class="qa-send" [disabled]="!replyBody().trim()" (click)="sendReply(t)">Reply</button>
      </div>
    } @else {
      <!-- List view -->
      <div class="qa-new">
        <input class="qa-subj" type="text" placeholder="Subject (optional)" [value]="newSubject()" (input)="newSubject.set($any($event.target).value)">
        <textarea rows="2" placeholder="Ask a question about this work order…" [value]="newBody()" (input)="newBody.set($any($event.target).value)"></textarea>
        <button type="button" class="qa-dir-toggle" (click)="showDirect.set(!showDirect())">
          {{ selectedDirected().size ? ('📣 Directed to ' + selectedDirected().size + ' — everyone still sees it') : '＋ Direct at specific people (optional)' }}
        </button>
        @if (showDirect()) {
          <div class="qa-directed">
            <p class="qa-dir-hint">They'll see it first in their WO Questions — it doesn't hide the question from anyone.</p>
            @for (u of directableUsers(); track u.id) {
              <label class="qa-dir-opt"><input type="checkbox" [checked]="selectedDirected().has(u.id)" (change)="toggleDirected(u.id)"> {{ u.name }}</label>
            }
            @if (!directableUsers().length) { <span class="qa-msg">No people to direct to.</span> }
          </div>
        }
        <button class="qa-send" [disabled]="!newBody().trim()" (click)="ask()">＋ Ask</button>
      </div>
      @if (!online()) { <p class="qa-offline">Offline — your question will send when you're back online.</p> }
      @if (loading()) { <p class="qa-msg">Loading…</p> }
      @else if (error()) { <p class="qa-err">{{ error() }}</p> }
      @else {
        @for (p of outbox.pendingAsksForWo(wo.workorderid!); track p.id) {
          <div class="qa-row qa-pending">
            <div class="qa-row-subj">{{ p.subject || p.content }}</div>
            <div class="qa-row-meta">⏳ {{ p.status === 'failed' ? 'failed — ' + (p.error || '') : 'queued' }}</div>
          </div>
        }
        @for (c of threads(); track c.id) {
          <button class="qa-row" (click)="openThread(c)">
            <div class="qa-row-subj">{{ c.subject }} @if (c.currentUserUnreadCount > 0) { <span class="qa-unread">{{ c.currentUserUnreadCount }}</span> }</div>
            <div class="qa-row-meta">{{ c.initiatorName || 'Someone' }} · {{ c.lastMessageAt | date:'short' }} · {{ c.status }}</div>
          </button>
        }
        @if (!threads().length && !outbox.pendingAsksForWo(wo.workorderid!).length) {
          <p class="qa-msg">No questions yet. Ask the first one above.</p>
        }
      }
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .qa-msg, .qa-offline { color: var(--secondary-text, #888); font-size: 0.85rem; padding: 0.4rem 0; }
    .qa-offline { color: #e08a2e; font-weight: 700; }
    .qa-err { color: #e74c3c; font-size: 0.85rem; padding: 0.4rem 0; }
    .qa-new { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 0.7rem; }
    .qa-subj, .qa-compose textarea, .qa-new textarea { width: 100%; box-sizing: border-box; border: 1px solid var(--border-color); border-radius: 9px; padding: 0.5rem 0.6rem; font-size: 0.9rem; background: var(--card-bg, var(--secondary-background)); color: var(--primary-text); font-family: inherit; resize: vertical; }
    .qa-dir-toggle { align-self: flex-start; background: transparent; border: none; color: var(--accent-color); font-weight: 700; font-size: 0.8rem; cursor: pointer; font-family: inherit; padding: 0.1rem 0; }
    .qa-directed { border: 1px solid var(--border-color); border-radius: 9px; padding: 0.5rem 0.6rem; display: flex; flex-direction: column; gap: 0.3rem; max-height: 200px; overflow-y: auto; }
    .qa-dir-hint { font-size: 0.72rem; color: var(--secondary-text, #888); margin: 0 0 0.2rem; }
    .qa-dir-opt { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--primary-text); }
    .qa-send { align-self: flex-start; background: #2980b9; color: #fff; border: none; border-radius: 9px; padding: 0.5rem 0.9rem; font-weight: 800; font-size: 0.85rem; cursor: pointer; font-family: inherit; }
    .qa-send:disabled { opacity: 0.5; cursor: default; }
    .qa-row { display: flex; flex-direction: column; gap: 0.15rem; width: 100%; text-align: left; background: var(--card-bg, var(--secondary-background)); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.55rem 0.7rem; margin-bottom: 0.4rem; cursor: pointer; font-family: inherit; }
    .qa-row-subj { font-weight: 700; font-size: 0.9rem; color: var(--primary-text); }
    .qa-row-meta { font-size: 0.72rem; color: var(--secondary-text, #888); }
    .qa-unread { font-size: 0.68rem; font-weight: 800; color: #fff; background: #e74c3c; border-radius: 999px; padding: 0.05rem 0.4rem; margin-left: 0.3rem; }
    .qa-pending { opacity: 0.75; border-style: dashed; }
    .qa-back { background: transparent; border: none; color: var(--accent-color); font-weight: 700; font-size: 0.85rem; cursor: pointer; padding: 0.3rem 0; }
    .qa-thread-subj { font-weight: 800; font-size: 0.95rem; color: var(--primary-text); margin: 0.2rem 0 0.5rem; }
    .qa-bubble { border-left: 3px solid #2980b9; background: var(--card-bg, rgba(41,128,185,0.06)); border-radius: 0 8px 8px 0; padding: 0.4rem 0.6rem; margin-bottom: 0.4rem; }
    .qa-bubble-meta { font-size: 0.7rem; color: var(--secondary-text, #888); }
    .qa-bubble-txt { font-size: 0.9rem; color: var(--primary-text); white-space: pre-wrap; margin-top: 0.15rem; }
    .qa-compose { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.6rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); }
  `]
})
export class MaximoWoQaComponent implements OnInit {
  @Input({ required: true }) wo!: MaximoWorkOrder;
  /** When set (e.g. opened from the WO-questions inbox), auto-open this thread once threads load. */
  @Input() initialConversationId?: number;
  private api = inject(ServerApiService);
  private serverStatus = inject(ServerStatusService);
  private destroyRef = inject(DestroyRef);
  outbox = inject(MaximoQaOutboxService);

  threads = signal<PwaConversationDto[]>([]);
  selected = signal<PwaConversationDto | null>(null);
  messages = signal<PwaMessageDto[]>([]);
  loading = signal(false);
  messagesLoading = signal(false);
  error = signal<string | null>(null);
  newSubject = signal('');
  newBody = signal('');
  replyBody = signal('');
  directableUsers = signal<{ id: number; name: string }[]>([]);
  selectedDirected = signal<Set<number>>(new Set());
  showDirect = signal(false);

  online(): boolean { return this.serverStatus.isOnline(); }

  ngOnInit(): void {
    this.loadThreads();
    this.api.getDirectableUsers().subscribe({ next: u => this.directableUsers.set(u ?? []), error: () => {} });
    // When the outbox drains, refresh whatever's on screen so a queued ask/reply lands as a real thread/message.
    this.outbox.flushed$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.loadThreads();
      const t = this.selected();
      if (t) this.loadMessages(t.id);
    });
  }

  toggleDirected(id: number): void {
    const s = new Set(this.selectedDirected());
    if (s.has(id)) s.delete(id); else s.add(id);
    this.selectedDirected.set(s);
  }

  private loadThreads(): void {
    if (!this.wo?.workorderid) return;
    this.loading.set(true); this.error.set(null);
    this.api.getConversationsForEntity('MaximoWorkOrder', this.wo.workorderid).subscribe({
      next: list => {
        this.threads.set(list ?? []);
        this.loading.set(false);
        // Deep-link from the inbox: auto-open the requested thread once (only if nothing is open yet).
        if (this.initialConversationId && !this.selected()) {
          const t = (list ?? []).find(c => c.id === this.initialConversationId);
          if (t) this.openThread(t);
        }
      },
      error: () => { this.error.set('Couldn’t load questions — check your connection.'); this.loading.set(false); }
    });
  }

  openThread(c: PwaConversationDto): void {
    this.selected.set(c);
    this.replyBody.set('');
    this.loadMessages(c.id);
    this.api.markConversationRead(c.id).subscribe({ next: () => {}, error: () => {} });
  }
  closeThread(): void { this.selected.set(null); this.loadThreads(); }

  private loadMessages(conversationId: number): void {
    this.messagesLoading.set(true);
    this.api.getConversationMessages(conversationId).subscribe({
      next: m => { this.messages.set(m ?? []); this.messagesLoading.set(false); },
      error: () => { this.messages.set([]); this.messagesLoading.set(false); }
    });
  }

  ask(): void {
    const body = this.newBody().trim();
    if (!body || !this.wo?.workorderid) return;
    const subject = this.newSubject().trim() || ('WO ' + (this.wo.wonum || '') + ' question');
    const directed = [...this.selectedDirected()].join(',') || undefined;
    this.outbox.enqueueAsk(this.wo.workorderid, this.wo.wonum, subject, body, directed);
    this.newSubject.set(''); this.newBody.set(''); this.selectedDirected.set(new Set()); this.showDirect.set(false);
  }

  sendReply(t: PwaConversationDto): void {
    const body = this.replyBody().trim();
    if (!body) return;
    this.outbox.enqueueReply(t.id, body);
    this.replyBody.set('');
  }
}
