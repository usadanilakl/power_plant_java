import { Injectable, inject } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { MaximoCompletionDraft, MaximoFormTemplate, MaximoGrab, MaximoWorkOrder } from './maximo.model';

/**
 * Offline store for grabbed PMs. When a WO is grabbed (online → marked in-progress on the server), its WO +
 * assigned completion form(s) are cached here so the operator can perform it with no signal; the in-progress
 * completion is saved as a {@link MaximoCompletionDraft} and submitted on reconnect.
 *
 * <p>A grab is keyed by wonum (one per WO). A draft is keyed by wonum AND the form being filled, so a PM that
 * offers several forms keeps an independent in-progress draft per form — switching forms never clobbers another.
 * localStorage-backed (small, no attachments).
 */
@Injectable({ providedIn: 'root' })
export class MaximoOfflineStore {
  private ls = inject(LocalStorageService);

  private readonly GRAB_INDEX = 'maximo-grab-index';
  private readonly DRAFT_INDEX = 'maximo-draft-index';
  private grabKey = (wonum: string) => `maximo-grab-${wonum}`;
  /** Draft storage key = wonum + form discriminator (a form's key, or 'manual'). */
  private draftKey = (composite: string) => `maximo-draft-${composite}`;
  private composite = (wonum: string, disc: string) => `${wonum}__${disc}`;
  private discOf = (d: MaximoCompletionDraft) => d.mode === 'manual' ? 'manual' : (d.templateFormKey || 'form');

  // ── Grabs ───────────────────────────────────────────────────────────────
  saveGrab(wo: MaximoWorkOrder, formTemplates: MaximoFormTemplate[]): void {
    this.ls.setItem<MaximoGrab>(this.grabKey(wo.wonum), { wo, formTemplates, grabbedAt: Date.now() });
    this.grabIndexAdd(wo.wonum);
  }
  getGrab(wonum: string): MaximoGrab | null {
    const g = this.ls.getItem<MaximoGrab>(this.grabKey(wonum));
    if (!g) return null;
    // Back-compat: an older grab cached a single `formTemplate`; normalize to the list shape.
    if (!g.formTemplates) g.formTemplates = g.formTemplate ? [g.formTemplate] : [];
    return g;
  }
  isGrabbed(wonum: string): boolean { return !!this.getGrab(wonum); }
  listGrabs(): MaximoGrab[] {
    return this.grabIndex().map(w => this.getGrab(w)).filter((g): g is MaximoGrab => !!g)
      .sort((a, b) => b.grabbedAt - a.grabbedAt);
  }
  clearGrab(wonum: string): void {
    this.ls.removeItem(this.grabKey(wonum));
    this.clearDraftsFor(wonum);
    this.grabIndexRemove(wonum);
  }

  // ── Completion drafts (per wonum × form) ──────────────────────────────────
  saveDraft(d: MaximoCompletionDraft): void {
    d.updatedAt = Date.now();
    const ck = this.composite(d.wonum, this.discOf(d));
    this.ls.setItem<MaximoCompletionDraft>(this.draftKey(ck), d);
    this.draftIndexAdd(ck);
  }
  /** The draft for a specific form on a WO (formKey blank/undefined = the manual draft). */
  getDraft(wonum: string, formKey?: string | null): MaximoCompletionDraft | null {
    const disc = (formKey && formKey.length) ? formKey : 'manual';
    return this.ls.getItem<MaximoCompletionDraft>(this.draftKey(this.composite(wonum, disc)));
  }
  listDrafts(): MaximoCompletionDraft[] {
    return this.draftIndex().map(ck => this.ls.getItem<MaximoCompletionDraft>(this.draftKey(ck)))
      .filter((d): d is MaximoCompletionDraft => !!d);
  }
  /** All in-progress drafts for a WO (across its forms + manual) — for status badges on the grabbed list. */
  draftsFor(wonum: string): MaximoCompletionDraft[] {
    return this.listDrafts().filter(d => d.wonum === wonum);
  }
  /** Drafts queued while offline or after a retryable failure. */
  listPending(): MaximoCompletionDraft[] {
    return this.listDrafts().filter(d => d.status === 'pending');
  }
  private clearDraftsFor(wonum: string): void {
    const keep: string[] = [];
    for (const ck of this.draftIndex()) {
      if (ck.startsWith(`${wonum}__`)) this.ls.removeItem(this.draftKey(ck));
      else keep.push(ck);
    }
    this.ls.setItem(this.DRAFT_INDEX, keep);
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

  // ── Indexes ───────────────────────────────────────────────────────────────
  private grabIndex(): string[] { return this.ls.getItem<string[]>(this.GRAB_INDEX) ?? []; }
  private grabIndexAdd(wonum: string): void {
    const ix = this.grabIndex();
    if (!ix.includes(wonum)) { ix.push(wonum); this.ls.setItem(this.GRAB_INDEX, ix); }
  }
  private grabIndexRemove(wonum: string): void {
    this.ls.setItem(this.GRAB_INDEX, this.grabIndex().filter(w => w !== wonum));
  }
  private draftIndex(): string[] { return this.ls.getItem<string[]>(this.DRAFT_INDEX) ?? []; }
  private draftIndexAdd(ck: string): void {
    const ix = this.draftIndex();
    if (!ix.includes(ck)) { ix.push(ck); this.ls.setItem(this.DRAFT_INDEX, ix); }
  }
}
