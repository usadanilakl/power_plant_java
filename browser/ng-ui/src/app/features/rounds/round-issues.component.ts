import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { ObjectContextComponent } from '../physical-object/object-context.component';
import { RoundsApiService } from './rounds-api.service';
import { IssueCommentDto, RoundIssueDto } from './rounds.model';

/** Active Out-of-Range dashboard: every OPEN round issue, grouped by category, with comment / resolve / object-info. */
@Component({
  selector: 'app-round-issues',
  standalone: true,
  imports: [FormsModule, DatePipe, MainLayoutComponent, ObjectContextComponent],
  template: `
    <app-main-layout header="Active Out-of-Range">
      <ng-container main-content>
        <div class="ri">
          <button class="ri-back" (click)="back()">← Rounds</button>
          <label class="ri-toggle"><input type="checkbox" [(ngModel)]="showResolved" (ngModelChange)="reload()" /> include resolved</label>

          @if (loading()) {
            <p class="ri-msg">Loading…</p>
          } @else if (error()) {
            <p class="ri-msg ri-error">{{ error() }}</p>
          } @else if (!issues().length) {
            <p class="ri-msg">✓ Nothing out of range.</p>
          } @else {
            @for (g of grouped(); track g[0]) {
              <div class="ri-group">{{ g[0] }}</div>
              @for (i of g[1]; track i.id) {
                <div class="ri-card" [class.resolved]="i.status === 'RESOLVED'">
                  <div class="ri-head">
                    <span class="ri-prompt">{{ i.questionPrompt }}</span>
                    <span class="ri-badge" [class.res]="i.status === 'RESOLVED'">{{ i.status }}</span>
                  </div>
                  <div class="ri-meta">
                    <span>opened {{ i.openedAt | date:'MMM d' }} · {{ i.openedBy }}</span>
                    @if (i.lastValue) { <span>last: {{ i.lastValue }} {{ i.unit }}</span> }
                  </div>
                  @if (i.firstComment) { <div class="ri-first">“{{ i.firstComment }}”</div> }

                  <div class="ri-actions">
                    @if (i.physicalObjectId) {
                      <button (click)="toggleObj(i.id)">{{ shownObj() === i.id ? 'Hide' : 'Object' }}</button>
                    }
                    <button (click)="toggleComments(i.id)">Comments ({{ i.commentCount }})</button>
                    @if (i.status !== 'RESOLVED') {
                      <button class="ri-resolve" (click)="resolve(i)">Resolve</button>
                    }
                  </div>

                  @if (openComments() === i.id) {
                    <div class="ri-comments">
                      @for (c of comments(); track c.id) {
                        <div class="ri-comment"><span>{{ c.text }}</span><em>{{ c.author }} · {{ c.createdAt | date:'short' }}</em></div>
                      }
                      <div class="ri-addc">
                        <input [(ngModel)]="newComment" placeholder="Add a comment…" />
                        <button [disabled]="!newComment.trim()" (click)="addComment(i)">Add</button>
                      </div>
                    </div>
                  }

                  @if (shownObj() === i.id && i.physicalObjectId) {
                    <div class="ri-obj"><app-object-context [objectId]="i.physicalObjectId" /></div>
                  }
                </div>
              }
            }
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .ri { padding: 10px 12px 60px; }
    .ri-back { background: none; border: none; color: #1976d2; padding: 4px 0; font-size: 14px; }
    .ri-toggle { display: block; margin: 4px 0 12px; font-size: 13px; color: #666; }
    .ri-msg { padding: 20px; text-align: center; color: #777; }
    .ri-error { color: #c62828; }
    .ri-group { font-size: 12px; font-weight: 600; color: #555; text-transform: uppercase; margin: 12px 0 4px; }
    .ri-card { background: #fff; border: 1px solid #ffcdd2; border-left: 4px solid #ef5350; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
    .ri-card.resolved { border-color: #c8e6c9; border-left-color: #66bb6a; opacity: 0.75; }
    .ri-head { display: flex; justify-content: space-between; gap: 8px; }
    .ri-prompt { font-size: 14px; font-weight: 600; }
    .ri-badge { flex: none; background: #ffebee; color: #c62828; border-radius: 4px; padding: 1px 7px; font-size: 11px; height: fit-content; }
    .ri-badge.res { background: #e8f5e9; color: #2e7d32; }
    .ri-meta { display: flex; gap: 10px; color: #999; font-size: 12px; margin-top: 4px; }
    .ri-first { color: #555; font-size: 13px; margin-top: 5px; }
    .ri-actions { display: flex; gap: 8px; margin-top: 8px; }
    .ri-actions button { background: #eef4fb; color: #1976d2; border: none; border-radius: 6px; padding: 6px 10px; font-size: 13px; }
    .ri-actions .ri-resolve { background: #e8f5e9; color: #2e7d32; margin-left: auto; }
    .ri-comments { margin-top: 8px; border-top: 1px dashed #eee; padding-top: 6px; }
    .ri-comment { font-size: 13px; padding: 3px 0; }
    .ri-comment em { display: block; color: #999; font-size: 11px; }
    .ri-addc { display: flex; gap: 6px; margin-top: 6px; }
    .ri-addc input { flex: 1; padding: 6px; border: 1px solid #ccc; border-radius: 6px; }
    .ri-addc button { background: #1976d2; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; }
    .ri-obj { margin-top: 10px; border-top: 1px dashed #ddd; padding-top: 8px; }
  `],
})
export class RoundIssuesComponent implements OnInit {
  private api = inject(RoundsApiService);
  private router = inject(Router);

  issues = signal<RoundIssueDto[]>([]);
  loading = signal(false);
  error = signal('');
  showResolved = false;

  shownObj = signal<number | null>(null);
  openComments = signal<number | null>(null);
  comments = signal<IssueCommentDto[]>([]);
  newComment = '';

  grouped = computed<[string, RoundIssueDto[]][]>(() => {
    const map = new Map<string, RoundIssueDto[]>();
    for (const i of this.issues()) {
      const k = i.category || i.unit || '(other)';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(i);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  });

  ngOnInit(): void { this.reload(); }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.issues.set(await firstValueFrom(this.api.listIssues(!this.showResolved)));
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to load issues');
    } finally {
      this.loading.set(false);
    }
  }

  toggleObj(id: number): void { this.shownObj.update(x => x === id ? null : id); }

  async toggleComments(id: number): Promise<void> {
    if (this.openComments() === id) { this.openComments.set(null); return; }
    this.openComments.set(id);
    this.comments.set([]);
    this.newComment = '';
    try {
      this.comments.set(await firstValueFrom(this.api.issueComments(id)));
    } catch { /* leave empty */ }
  }

  async addComment(i: RoundIssueDto): Promise<void> {
    const text = this.newComment.trim();
    if (!text) return;
    try {
      const c = await firstValueFrom(this.api.addIssueComment(i.id, text));
      this.comments.update(list => [...list, c]);
      this.issues.update(list => list.map(x => x.id === i.id ? { ...x, commentCount: x.commentCount + 1 } : x));
      this.newComment = '';
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to add comment');
    }
  }

  async resolve(i: RoundIssueDto): Promise<void> {
    const note = prompt('Resolution note (optional):') ?? undefined;
    try {
      await firstValueFrom(this.api.resolveIssue(i.id, note));
      this.reload();
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to resolve');
    }
  }

  back(): void { this.router.navigate(['/rounds']); }
}
