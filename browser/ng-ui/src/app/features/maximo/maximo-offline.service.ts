import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { MaximoCompletionDraft, MaximoFormTemplate, MaximoGrab, MaximoWorkOrder } from './maximo.model';

/**
 * Offline store for grabbed PMs. When a WO is grabbed (online → marked in-progress on the server), its WO +
 * completion form are cached here so the operator can perform it with no signal; the in-progress completion is
 * saved as a {@link MaximoCompletionDraft} and submitted on reconnect. localStorage-backed (small, no attachments).
 */
@Injectable({ providedIn: 'root' })
export class MaximoOfflineStore {
  private ls = inject(LocalStorageService);

  private readonly INDEX = 'maximo-grab-index';
  private grabKey = (wonum: string) => `maximo-grab-${wonum}`;
  private draftKey = (wonum: string) => `maximo-draft-${wonum}`;

  // ── Grabs ───────────────────────────────────────────────────────────────
  saveGrab(wo: MaximoWorkOrder, formTemplate: MaximoFormTemplate | null): void {
    this.ls.setItem<MaximoGrab>(this.grabKey(wo.wonum), { wo, formTemplate, grabbedAt: Date.now() });
    this.indexAdd(wo.wonum);
  }
  getGrab(wonum: string): MaximoGrab | null { return this.ls.getItem<MaximoGrab>(this.grabKey(wonum)); }
  isGrabbed(wonum: string): boolean { return !!this.getGrab(wonum); }
  listGrabs(): MaximoGrab[] {
    return this.index().map(w => this.getGrab(w)).filter((g): g is MaximoGrab => !!g)
      .sort((a, b) => b.grabbedAt - a.grabbedAt);
  }
  clearGrab(wonum: string): void {
    this.ls.removeItem(this.grabKey(wonum));
    this.ls.removeItem(this.draftKey(wonum));
    this.indexRemove(wonum);
  }

  // ── Completion drafts ─────────────────────────────────────────────────────
  saveDraft(d: MaximoCompletionDraft): void {
    d.updatedAt = Date.now();
    this.ls.setItem<MaximoCompletionDraft>(this.draftKey(d.wonum), d);
    this.indexAdd(d.wonum);
  }
  getDraft(wonum: string): MaximoCompletionDraft | null { return this.ls.getItem<MaximoCompletionDraft>(this.draftKey(wonum)); }

  listDrafts(): MaximoCompletionDraft[] {
    return this.index().map(w => this.getDraft(w)).filter((d): d is MaximoCompletionDraft => !!d);
  }
  /** Drafts queued while offline or after a retryable failure. */
  listPending(): MaximoCompletionDraft[] {
    return this.listDrafts().filter(d => d.status === 'pending');
  }

  // ── Task-completion queue (offline "Done" on a child task) ────────────────
  private readonly TASK_QUEUE = 'maximo-task-queue';
  queueTask(href: string, wonum: string): void {
    const q = this.taskQueue();
    if (!q.some(t => t.wonum === wonum)) { q.push({ href, wonum }); this.ls.setItem(this.TASK_QUEUE, q); }
  }
  listTaskQueue(): { href: string; wonum: string }[] { return this.taskQueue(); }
  dequeueTask(wonum: string): void { this.ls.setItem(this.TASK_QUEUE, this.taskQueue().filter(t => t.wonum !== wonum)); }
  private taskQueue(): { href: string; wonum: string }[] {
    return this.ls.getItem<{ href: string; wonum: string }[]>(this.TASK_QUEUE) ?? [];
  }

  private index(): string[] { return this.ls.getItem<string[]>(this.INDEX) ?? []; }
  private indexAdd(wonum: string): void {
    const ix = this.index();
    if (!ix.includes(wonum)) { ix.push(wonum); this.ls.setItem(this.INDEX, ix); }
  }
  private indexRemove(wonum: string): void {
    this.ls.setItem(this.INDEX, this.index().filter(w => w !== wonum));
  }
}
