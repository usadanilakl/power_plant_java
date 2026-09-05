import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { ConversationService } from '../../../services/messaging/conversation.service';
import { ConversationDialogService } from '../../../shared/messaging/conversation-dialog.service';
import { ConversationDto } from '../../../models/messaging/conversation.model';

/**
 * WO Questions inbox — every OPEN Q&A thread anchored to a Maximo work order (inclusive: visible to all operators),
 * questions directed at the signed-in user first. Clicking one opens the shared conversation dialog on that thread.
 * Backed by the cheap local `/ng/conversations/wo-open` query (never re-fetches Maximo).
 */
@Component({
  selector: 'app-maximo-wo-questions-page',
  standalone: true,
  imports: [DatePipe, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout header="Maximo — WO Questions">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="wq-page">
          <div class="wq-head">
            <p class="wq-sub">Open questions on work orders. Directed to you first. Anyone can read and answer.</p>
            <button class="wq-refresh" [disabled]="loading()" (click)="load()">{{ loading() ? 'Loading…' : '↻ Refresh' }}</button>
          </div>

          @if (error()) { <p class="wq-err">{{ error() }}</p> }
          @if (loading() && !questions().length) { <p class="wq-msg">Loading…</p> }
          @else if (!questions().length && !error()) { <p class="wq-msg">No open WO questions. 🎉</p> }
          @else {
            <div class="wq-count">{{ directedCount() }} directed to you · {{ questions().length }} open</div>
            <div class="wq-list">
              @for (q of sorted(); track q.id) {
                <button class="wq-row" [class.mine]="q.directedToMe" (click)="open(q)">
                  <div class="wq-row-top">
                    <span class="wq-subj">{{ q.subject }}</span>
                    @if (q.directedToMe) { <span class="wq-badge">directed to you</span> }
                    @if (q.currentUserUnreadCount > 0) { <span class="wq-unread">{{ q.currentUserUnreadCount }}</span> }
                  </div>
                  <div class="wq-meta">
                    @if (q.maximoWonum) { <span>🔧 {{ q.maximoWonum }}</span> }
                    <span>{{ q.initiatorName || 'Someone' }}</span>
                    <span>{{ q.lastMessageAt | date:'short' }}</span>
                  </div>
                </button>
              }
            </div>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .wq-page { padding: 0.5rem 0.75rem 2rem; max-width: 900px; margin: 0 auto; }
    .wq-head { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin: 0.5rem 0 1rem; }
    .wq-sub { color: var(--secondary-text, #888); font-size: 0.9rem; margin: 0; }
    .wq-refresh { background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); border-radius: 8px; padding: 0.45rem 0.7rem; font-weight: 700; cursor: pointer; }
    .wq-err { background: rgba(239,83,80,0.12); border: 1px solid #ef5350; border-radius: 8px; padding: 0.6rem 0.7rem; color: var(--primary-text); }
    .wq-msg { color: var(--secondary-text, #888); font-size: 0.9rem; }
    .wq-count { color: var(--secondary-text, #888); font-size: 0.78rem; margin-bottom: 0.5rem; }
    .wq-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .wq-row { width: 100%; text-align: left; display: flex; flex-direction: column; gap: 0.25rem; background: var(--secondary-background); border: 1px solid var(--border-color); border-radius: 10px; padding: 0.6rem 0.8rem; cursor: pointer; font-family: inherit; }
    .wq-row.mine { border-color: #2980b9; }
    .wq-row-top { display: flex; align-items: center; gap: 0.5rem; }
    .wq-subj { font-weight: 700; font-size: 0.95rem; color: var(--primary-text); }
    .wq-badge { font-size: 0.66rem; font-weight: 800; color: #fff; background: #2980b9; border-radius: 999px; padding: 0.1rem 0.5rem; text-transform: uppercase; letter-spacing: 0.03em; }
    .wq-unread { font-size: 0.68rem; font-weight: 800; color: #fff; background: #e74c3c; border-radius: 999px; padding: 0.05rem 0.45rem; margin-left: auto; }
    .wq-meta { display: flex; flex-wrap: wrap; gap: 0.8rem; font-size: 0.76rem; color: var(--secondary-text, #888); }
  `]
})
export class MaximoWoQuestionsPageComponent implements OnInit {
  private convo = inject(ConversationService);
  private dialog = inject(ConversationDialogService);

  questions = signal<ConversationDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  directedCount = computed(() => this.questions().filter(q => q.directedToMe).length);
  sorted = computed(() => [...this.questions()].sort((a, b) => {
    const d = (b.directedToMe ? 1 : 0) - (a.directedToMe ? 1 : 0);   // directed-to-me first
    return d !== 0 ? d : (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '');
  }));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.convo.getWoOpenQuestions().subscribe({
      next: r => { this.questions.set((r.responseData ?? []).map(ConversationDto.fromJson)); this.loading.set(false); },
      error: () => { this.error.set('Couldn’t load WO questions — check your connection.'); this.loading.set(false); }
    });
  }

  open(q: ConversationDto): void {
    if (q.entityId) this.dialog.open('MaximoWorkOrder', q.entityId, q.id ?? null);
  }
}
