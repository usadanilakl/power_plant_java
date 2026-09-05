import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { PwaConversationDto, ServerApiService } from '../../services/server-api.service';
import { MaximoWoQaComponent } from './maximo-wo-qa.component';
import { MaximoWorkOrder } from './maximo.model';

/**
 * WO Questions inbox (mobile) — every OPEN Q&A thread on a work order, questions directed at you first. Tap one to
 * open that WO's Q&A (reusing {@link MaximoWoQaComponent}, deep-linked to the thread). Backed by the cheap local
 * `/api/pwa/secured/conversations/wo-open` query, so opening this never sweeps Maximo.
 */
@Component({
  selector: 'app-maximo-wo-questions-page',
  standalone: true,
  imports: [DatePipe, MainLayoutComponent, MaximoWoQaComponent],
  template: `
    <app-main-layout [header]="'WO Questions'">
      <ng-container main-content>
        <div class="wq">
          <div class="wq-top">
            <button class="wq-back" (click)="back()">← Maximo</button>
            @if (selectedWo()) { <button class="wq-back" (click)="closeWo()">← All questions</button> }
            <button class="wq-refresh" [disabled]="loading()" (click)="load()">{{ loading() ? '…' : '↻' }}</button>
          </div>

          @if (selectedWo(); as w) {
            <div class="wq-wo">🔧 {{ w.wonum || 'Work order' }}</div>
            <app-maximo-wo-qa [wo]="w" [initialConversationId]="selectedConvId()"></app-maximo-wo-qa>
          } @else {
            <p class="wq-sub">Open questions on work orders. Directed to you first — anyone can read and answer.</p>
            @if (error()) { <p class="wq-err">{{ error() }}</p> }
            @if (loading() && !questions().length) { <p class="wq-msg">Loading…</p> }
            @else if (!questions().length && !error()) { <p class="wq-msg">No open WO questions. 🎉</p> }
            @else {
              <div class="wq-count">{{ directedCount() }} directed to you · {{ questions().length }} open</div>
              @for (q of sorted(); track q.id) {
                <button class="wq-row" [class.mine]="q.directedToMe" (click)="openQ(q)">
                  <div class="wq-row-top">
                    <span class="wq-subj">{{ q.subject }}</span>
                    @if (q.directedToMe) { <span class="wq-badge">for you</span> }
                    @if (q.currentUserUnreadCount > 0) { <span class="wq-unread">{{ q.currentUserUnreadCount }}</span> }
                  </div>
                  <div class="wq-meta">
                    @if (q.maximoWonum) { <span>🔧 {{ q.maximoWonum }}</span> }
                    <span>{{ q.initiatorName || 'Someone' }}</span>
                    <span>{{ q.lastMessageAt | date:'short' }}</span>
                  </div>
                </button>
              }
            }
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .wq { padding: 0.85rem; max-width: 720px; margin: 0 auto; width: 100%; box-sizing: border-box; }
    .wq-top { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.6rem; }
    .wq-back { background: transparent; color: var(--accent-color); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.4rem 0.7rem; font-size: 0.85rem; font-weight: 700; cursor: pointer; font-family: inherit; }
    .wq-refresh { margin-left: auto; background: transparent; border: 1px solid var(--border-color); color: var(--primary-text); border-radius: 8px; padding: 0.4rem 0.6rem; font-weight: 700; cursor: pointer; }
    .wq-sub { color: var(--secondary-text, #888); font-size: 0.85rem; margin: 0 0 0.7rem; }
    .wq-wo { font-weight: 800; color: var(--primary-text); margin-bottom: 0.5rem; }
    .wq-err { color: #e74c3c; font-size: 0.9rem; }
    .wq-msg { color: var(--secondary-text, #888); text-align: center; padding: 1.5rem 1rem; }
    .wq-count { color: var(--secondary-text, #888); font-size: 0.75rem; margin-bottom: 0.5rem; }
    .wq-row { width: 100%; text-align: left; display: flex; flex-direction: column; gap: 0.25rem; background: var(--card-bg, var(--secondary-background)); border: 1px solid var(--border-color); border-radius: 11px; padding: 0.65rem 0.8rem; margin-bottom: 0.45rem; cursor: pointer; font-family: inherit; }
    .wq-row.mine { border-color: #2980b9; }
    .wq-row-top { display: flex; align-items: center; gap: 0.5rem; }
    .wq-subj { font-weight: 700; font-size: 0.92rem; color: var(--primary-text); }
    .wq-badge { font-size: 0.62rem; font-weight: 800; color: #fff; background: #2980b9; border-radius: 999px; padding: 0.1rem 0.45rem; text-transform: uppercase; letter-spacing: 0.03em; }
    .wq-unread { font-size: 0.66rem; font-weight: 800; color: #fff; background: #e74c3c; border-radius: 999px; padding: 0.05rem 0.45rem; margin-left: auto; }
    .wq-meta { display: flex; flex-wrap: wrap; gap: 0.15rem 0.7rem; font-size: 0.74rem; color: var(--secondary-text, #888); }
  `]
})
export class MaximoWoQuestionsPageComponent implements OnInit {
  private api = inject(ServerApiService);
  private router = inject(Router);

  questions = signal<PwaConversationDto[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  selectedWo = signal<MaximoWorkOrder | null>(null);
  selectedConvId = signal<number | undefined>(undefined);

  directedCount = computed(() => this.questions().filter(q => q.directedToMe).length);
  sorted = computed(() => [...this.questions()].sort((a, b) => {
    const d = (b.directedToMe ? 1 : 0) - (a.directedToMe ? 1 : 0);
    return d !== 0 ? d : (b.lastMessageAt || '').localeCompare(a.lastMessageAt || '');
  }));

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set(null);
    this.api.getWoOpenQuestions().subscribe({
      next: list => { this.questions.set(list ?? []); this.loading.set(false); },
      error: () => { this.error.set('Couldn’t load WO questions — check your connection.'); this.loading.set(false); }
    });
  }

  openQ(q: PwaConversationDto): void {
    // MaximoWoQaComponent only reads workorderid + wonum, so a minimal WO shell is enough.
    this.selectedWo.set({ workorderid: q.entityId, wonum: q.maximoWonum || '' } as MaximoWorkOrder);
    this.selectedConvId.set(q.id);
  }
  closeWo(): void { this.selectedWo.set(null); this.selectedConvId.set(undefined); this.load(); }
  back(): void { this.router.navigate(['/maximo']); }
}
