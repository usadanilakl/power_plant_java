import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { ObjectContextComponent } from '../physical-object/object-context.component';
import { RoundsApiService } from './rounds-api.service';
import { RoundsStore } from './rounds-store.service';
import { RoundsSyncService } from './rounds-sync.service';
import { AnswerHistory, QuestionForPerform, RoundDraft, RoundPerform, isOutOfRange, isQuestionVisible, parseChoices } from './rounds.model';

interface Draft { value: string; comment: string; }

/** Perform a round: answer each check, see live out-of-range flags + known issues, drill into object info, submit. */
@Component({
  selector: 'app-round-perform',
  standalone: true,
  imports: [FormsModule, DatePipe, MainLayoutComponent, ObjectContextComponent],
  template: `
    <app-main-layout [header]="rp()?.name || 'Round'">
      <ng-container main-content>
        <div class="rp">
          <button class="rp-back" (click)="back()">← Rounds</button>

          @if (offline()) {
            <div class="rp-offline">Offline — answers are saved on this device and submit automatically when you reconnect.</div>
          }

          @if (loading()) {
            <p class="rp-msg">Loading…</p>
          } @else if (error() && !rp()) {
            <p class="rp-msg rp-error">{{ error() }}</p>
          } @else if (rp()) {
            @let r = rp()!;
            <div class="rp-progress">{{ answeredCount() }} / {{ visibleCount() }} answered</div>

            @for (q of r.questions; track q.id) {
              @if (isVisible(q)) {
              <div class="rp-q" [class.oor]="live(q)">
                <div class="rp-q-head">
                  <span class="rp-q-cat">{{ q.category }}@if (q.tagCode) {<span class="rp-q-tag"> · {{ q.tagCode }}</span>}</span>
                  <span class="rp-q-actions">
                    <button class="rp-info" (click)="toggleHistory(q.id)">{{ shownHistory() === q.id ? 'Hide' : 'History' }}</button>
                    @if (q.physicalObjectId) {
                      <button class="rp-info" (click)="toggleObj(q.id)">{{ shownObj() === q.id ? 'Hide info' : 'Object info' }}</button>
                    }
                  </span>
                </div>
                <div class="rp-prompt">{{ q.prompt }}</div>

                @if (q.openIssue) {
                  <div class="rp-known">⚠ Known issue since {{ q.openIssue.openedAt | date:'MMM d' }}: {{ q.openIssue.firstComment }}</div>
                }

                @if (shownHistory() === q.id) {
                  <div class="rp-history">
                    @if (history().length) {
                      @for (h of history(); track $index) {
                        <div class="rp-hrow" [class.oor]="h.outOfRange">
                          <span>{{ h.value }}</span>
                          <span class="rp-hmeta">{{ h.answeredAt | date:'MMM d, h:mm a' }}@if (h.instanceShift) { · {{ h.instanceShift }} }</span>
                        </div>
                      }
                    } @else { <div class="rp-hempty">No prior readings.</div> }
                  </div>
                }

                <!-- answer input by type -->
                @switch (q.answerType) {
                  @case ('READING') {
                    <div class="rp-reading">
                      <input type="number" inputmode="decimal" [(ngModel)]="draft[q.id].value" (ngModelChange)="touch()" placeholder="reading" />
                      <span class="rp-unit">{{ q.unit }}</span>
                      @if (q.lowLimit != null || q.highLimit != null) {
                        <span class="rp-limits">({{ q.lowLimit ?? '' }}–{{ q.highLimit ?? '' }})</span>
                      }
                    </div>
                  }
                  @case ('PASS_FAIL') {
                    <div class="rp-toggle">
                      <button [class.on]="draft[q.id].value === passWord(q)" (click)="setVal(q.id, passWord(q))">{{ passWord(q) }}</button>
                      <button class="fail" [class.on]="draft[q.id].value === failWord(q)" (click)="setVal(q.id, failWord(q))">{{ failWord(q) }}</button>
                    </div>
                  }
                  @case ('CHOICE') {
                    <select [(ngModel)]="draft[q.id].value" (ngModelChange)="touch()">
                      <option value="">— select —</option>
                      @for (c of choices(q); track c) { <option [value]="c">{{ c }}</option> }
                    </select>
                  }
                  @case ('SELECTOR') {
                    @if (choices(q).length) {
                      <select [(ngModel)]="draft[q.id].value" (ngModelChange)="touch()">
                        <option value="">— select —</option>
                        @for (c of choices(q); track c) { <option [value]="c">{{ c }}</option> }
                      </select>
                    } @else {
                      <input [(ngModel)]="draft[q.id].value" (ngModelChange)="touch()" placeholder="value" />
                    }
                  }
                  @default {
                    <input [(ngModel)]="draft[q.id].value" (ngModelChange)="touch()" placeholder="answer" />
                  }
                }

                <!-- comment (required for a NEW out-of-range reading) -->
                @if (live(q) || draft[q.id].comment) {
                  <textarea class="rp-comment" rows="2" [(ngModel)]="draft[q.id].comment" (ngModelChange)="touch()"
                            [class.req]="needsComment(q)"
                            [placeholder]="q.openIssue ? 'Add a note (optional — issue already open)' : 'Comment required — what is abnormal?'"></textarea>
                }

                @if (shownObj() === q.id && q.physicalObjectId) {
                  <div class="rp-obj"><app-object-context [objectId]="q.physicalObjectId" /></div>
                }
              </div>
              }
            }

            <div class="rp-foot">
              @if (error()) { <p class="rp-error">{{ error() }}</p> }
              @if (blockers().length) {
                <p class="rp-block">{{ blockers().length }} out-of-range reading(s) need a comment.</p>
              }
              <textarea class="rp-notes" rows="2" [(ngModel)]="notes" placeholder="Round notes (optional)"></textarea>
              <button class="rp-submit" [disabled]="submitting() || blockers().length > 0" (click)="submit()">
                {{ submitting() ? 'Submitting…' : 'Submit round' }}
              </button>
            </div>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .rp { padding: 10px 12px 80px; }
    .rp-back { background: none; border: none; color: #1976d2; padding: 4px 0 10px; font-size: 14px; }
    .rp-offline { background: #fff8e1; color: #8d6e00; border: 1px solid #ffe082; border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 10px; }
    .rp-msg { padding: 20px; text-align: center; color: #777; }
    .rp-error { color: #c62828; }
    .rp-progress { color: #666; font-size: 13px; margin-bottom: 10px; }
    .rp-q { background: #fff; border: 1px solid #e6e6e6; border-radius: 10px; padding: 12px; margin-bottom: 10px; }
    .rp-q.oor { border-color: #ef9a9a; background: #fff5f5; }
    .rp-q-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .rp-q-cat { color: #888; font-size: 12px; text-transform: uppercase; }
    .rp-q-tag { color: #aaa; }
    .rp-q-actions { display: flex; gap: 6px; flex: none; }
    .rp-info { background: #eef4fb; color: #1976d2; border: none; border-radius: 6px; padding: 4px 8px; font-size: 12px; }
    .rp-history { margin: 6px 0 8px; border: 1px solid #eee; border-radius: 6px; overflow: hidden; }
    .rp-hrow { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 12px; border-bottom: 1px solid #f2f2f2; }
    .rp-hrow.oor { background: #fff5f5; color: #c62828; }
    .rp-hmeta { color: #999; }
    .rp-hempty { padding: 8px; color: #999; font-size: 12px; text-align: center; }
    .rp-prompt { font-size: 15px; margin: 4px 0 8px; }
    .rp-known { background: #fff3e0; color: #e65100; border-radius: 6px; padding: 6px 8px; font-size: 12px; margin-bottom: 8px; }
    .rp-reading { display: flex; align-items: center; gap: 8px; }
    .rp-reading input { width: 120px; padding: 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 16px; }
    .rp-unit { color: #666; }
    .rp-limits { color: #999; font-size: 12px; }
    select, .rp-q input[type=text], .rp-q input:not([type]) { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 6px; font-size: 15px; }
    .rp-toggle { display: flex; gap: 8px; }
    .rp-toggle button { flex: 1; padding: 10px; border: 1px solid #cfcfcf; border-radius: 8px; background: #fafafa; font-size: 15px; }
    .rp-toggle button.on { background: #2e7d32; color: #fff; border-color: #2e7d32; }
    .rp-toggle button.fail.on { background: #c62828; border-color: #c62828; }
    .rp-comment { width: 100%; margin-top: 8px; padding: 8px; border: 1px solid #ccc; border-radius: 6px; font: inherit; resize: vertical; }
    .rp-comment.req { border-color: #ef5350; background: #fff5f5; }
    .rp-obj { margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 8px; }
    .rp-foot { position: sticky; bottom: 0; background: #fff; padding: 10px 0; border-top: 1px solid #eee; }
    .rp-block { color: #c62828; font-size: 13px; }
    .rp-notes { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 6px; font: inherit; margin-bottom: 8px; }
    .rp-submit { width: 100%; background: #1976d2; color: #fff; border: none; border-radius: 8px; padding: 13px; font-size: 16px; }
    .rp-submit:disabled { background: #90caf9; }
  `],
})
export class RoundPerformComponent implements OnInit {
  private api = inject(RoundsApiService);
  private store = inject(RoundsStore);
  private sync = inject(RoundsSyncService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  rp = signal<RoundPerform | null>(null);
  loading = signal(false);
  error = signal('');
  submitting = signal(false);
  offline = signal(false);
  shownObj = signal<number | null>(null);
  shownHistory = signal<number | null>(null);
  history = signal<AnswerHistory[]>([]);
  private tick = signal(0); // bump to recompute live/blockers when drafts mutate

  draft: Record<number, Draft> = {};
  notes = '';

  private qById = computed(() => new Map((this.rp()?.questions ?? []).map(q => [q.id, q])));

  /** Questions currently visible given the answers so far (conditional-display dependencies). */
  readonly visibleQuestions = computed<QuestionForPerform[]>(() => {
    this.tick();
    const r = this.rp();
    if (!r) return [];
    const by = this.qById();
    return r.questions.filter(q => isQuestionVisible(q, by, id => this.draft[id]?.value ?? ''));
  });

  answeredCount = computed(() =>
    this.visibleQuestions().filter(q => (this.draft[q.id]?.value ?? '').trim() !== '').length);

  visibleCount = computed(() => this.visibleQuestions().length);

  blockers = computed<QuestionForPerform[]>(() =>
    this.visibleQuestions().filter(q => this.needsComment(q)));

  async ngOnInit(): Promise<void> {
    const roundId = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    try {
      let r = await firstValueFrom(this.api.getRound(roundId));
      if (r && r.instanceId == null) {
        // no live instance — grab one (list normally grabs first, but support deep-link). Grab needs online.
        const g = await firstValueFrom(this.api.grab(roundId));
        r = { ...r, instanceId: g.instanceId };
      }
      if (!r) throw new Error('Round not found');
      this.store.cacheRound(r);
      this.rp.set(r);
    } catch (e: any) {
      // offline / load failed → fall back to the cached round (only usable if it was grabbed while online)
      const cached = this.store.getCachedRound(roundId);
      if (cached?.round && cached.round.instanceId != null) {
        this.rp.set(cached.round);
        this.offline.set(true);
      } else {
        this.error.set('Connect to the network to start this round.');
        this.loading.set(false);
        return;
      }
    }
    // seed draft answers, restoring any autosaved work for this instance
    const r = this.rp()!;
    const existing = r.instanceId != null ? this.store.getDraft(r.instanceId) : null;
    for (const q of r.questions) {
      const saved = existing?.answers?.[q.id];
      this.draft[q.id] = { value: saved?.value ?? '', comment: saved?.comment ?? '' };
    }
    if (existing?.notes) this.notes = existing.notes;
    this.loading.set(false);
  }

  /** The answers to submit: only currently-visible questions with a value (hidden dependents are skipped). */
  private visibleAnswersSnapshot(): Record<number, { value: string; comment: string }> {
    const r = this.rp();
    if (!r) return { ...this.draft };
    const by = this.qById();
    const out: Record<number, { value: string; comment: string }> = {};
    for (const q of r.questions) {
      if (isQuestionVisible(q, by, id => this.draft[id]?.value ?? '') && (this.draft[q.id]?.value ?? '').trim() !== '') {
        out[q.id] = this.draft[q.id];
      }
    }
    return out;
  }

  /**
   * Persist the in-progress answers so a reload / connection loss doesn't lose work. Autosave ('draft') must NOT
   * demote an already-queued 'pending'/'failed' submit — otherwise editing a re-opened offline round would strand the
   * queued submit (it never auto-flushes). When a queued state is preserved, the answers are re-snapshotted to the
   * visible set so the eventual flush never sends a since-hidden answer.
   */
  private persistDraft(status: RoundDraft['status'] = 'draft', answers?: Record<number, { value: string; comment: string }>): RoundDraft | null {
    const r = this.rp();
    if (!r || r.instanceId == null) return null;
    let effective = status;
    if (status === 'draft') {
      const existing = this.store.getDraft(r.instanceId);
      if (existing && (existing.status === 'pending' || existing.status === 'failed')) effective = existing.status;
    }
    const finalAnswers = answers ?? (effective === 'draft' ? this.draft : this.visibleAnswersSnapshot());
    const d: RoundDraft = {
      instanceId: r.instanceId, roundId: r.id, roundName: r.name,
      answers: finalAnswers, notes: this.notes, savedAt: Date.now(), status: effective,
    };
    this.store.saveDraft(d);
    return d;
  }

  choices(q: QuestionForPerform): string[] { return parseChoices(q.choicesJson); }
  passWord(q: QuestionForPerform): string { return q.expectedValue?.trim() || 'PASS'; }
  failWord(q: QuestionForPerform): string {
    const p = this.passWord(q).toUpperCase();
    return p === 'YES' ? 'NO' : p === 'OK' ? 'NOT OK' : 'FAIL';
  }

  isVisible(q: QuestionForPerform): boolean {
    this.tick();
    return isQuestionVisible(q, this.qById(), id => this.draft[id]?.value ?? '');
  }

  live(q: QuestionForPerform): boolean {
    this.tick();
    const d = this.draft[q.id];
    if (!d || d.value.trim() === '') return false;
    return isOutOfRange(q, d.value, null);
  }

  needsComment(q: QuestionForPerform): boolean {
    if (!q.trackIssues) return false;
    const d = this.draft[q.id];
    if (!d || d.value.trim() === '') return false;
    return isOutOfRange(q, d.value, null) && !q.openIssue && d.comment.trim() === '';
  }

  setVal(qid: number, v: string): void { this.draft[qid].value = v; this.touch(); }
  touch(): void { this.tick.update(n => n + 1); this.persistDraft('draft'); }
  toggleObj(qid: number): void { this.shownObj.update(x => x === qid ? null : qid); }

  async toggleHistory(qid: number): Promise<void> {
    if (this.shownHistory() === qid) { this.shownHistory.set(null); return; }
    this.shownHistory.set(qid);
    this.history.set([]);
    try {
      this.history.set(await firstValueFrom(this.api.questionHistory(qid, 10)));
    } catch { /* offline / no history — leave empty */ }
  }

  submit(): void {
    const r = this.rp();
    if (!r || r.instanceId == null) { this.error.set('No active round instance'); return; }
    if (this.blockers().length) { this.error.set('Add comments to out-of-range readings first'); return; }
    this.submitting.set(true);
    this.error.set('');
    // queue only visible questions' answers (hidden dependents are skipped)
    const draft = this.persistDraft('pending', this.visibleAnswersSnapshot());
    if (!draft) { this.submitting.set(false); this.error.set('No active round instance'); return; }

    this.sync.submit(draft).subscribe({
      next: (res) => {
        const parts = [`${res.answersSaved} saved`];
        if (res.issuesOpened) parts.push(`${res.issuesOpened} issue(s) opened`);
        if (res.issuesResolved) parts.push(`${res.issuesResolved} resolved`);
        alert('Round submitted — ' + parts.join(', '));
        this.router.navigate(['/rounds']);
      },
      error: (err) => {
        this.submitting.set(false);
        const status = err?.status;
        if (status === 400 || status === 409) {
          // server rejected (e.g. missing required comment / already submitted) — draft marked 'failed', stay put
          this.error.set(err?.error?.message || 'Submit was rejected — review and try again.');
        } else {
          // network/offline — draft stays queued and auto-flushes on reconnect
          alert('No connection — round saved and will submit automatically when back online.');
          this.router.navigate(['/rounds']);
        }
      },
    });
  }

  back(): void { this.router.navigate(['/rounds']); }
}
