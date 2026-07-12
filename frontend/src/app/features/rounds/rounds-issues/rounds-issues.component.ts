import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { RoundsAdminService } from '../services/rounds-admin.service';
import { RoundIssue, RoundIssueComment } from '../models/rounds.model';

/**
 * Desktop (jg portal) Active Out-of-Range dashboard — every open round issue, grouped by category, with comment /
 * resolve. Read-only monitoring counterpart to the PWA perform flow; hits {@code /ng/rounds-perform}.
 */
@Component({
  selector: 'app-rounds-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './rounds-issues.component.html',
  styleUrl: './rounds-issues.component.css',
})
export class RoundsIssuesComponent implements OnInit {
  private api = inject(RoundsAdminService);

  issues = signal<RoundIssue[]>([]);
  loading = signal(false);
  error = signal('');
  showResolved = false;

  openComments = signal<number | null>(null);
  comments = signal<RoundIssueComment[]>([]);
  newComment = '';

  readonly grouped = computed<[string, RoundIssue[]][]>(() => {
    const map = new Map<string, RoundIssue[]>();
    for (const i of this.issues()) {
      const k = i.category || i.unit || '(other)';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(i);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  });

  readonly openCount = computed(() => this.issues().filter(i => i.status === 'OPEN').length);

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

  async toggleComments(i: RoundIssue): Promise<void> {
    if (this.openComments() === i.id) { this.openComments.set(null); return; }
    this.openComments.set(i.id);
    this.comments.set([]);
    this.newComment = '';
    try {
      this.comments.set(await firstValueFrom(this.api.issueComments(i.id)));
    } catch { /* leave empty */ }
  }

  async addComment(i: RoundIssue): Promise<void> {
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

  async resolve(i: RoundIssue): Promise<void> {
    const note = prompt('Resolution note (optional):') ?? undefined;
    try {
      await firstValueFrom(this.api.resolveIssue(i.id, note));
      this.reload();
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Failed to resolve');
    }
  }
}
