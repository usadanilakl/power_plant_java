import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { PhysicalObjectApiService } from '../../../services/physical/physical-object-api.service';
import { PhysicalObjectNode, poColor } from '../../../models/physical/physical-object.models';
import { PoPickerComponent } from '../po-picker/po-picker.component';
import { RoundsAdminService } from '../services/rounds-admin.service';
import { ANSWER_TYPES, CADENCES, Round, RoundAnswerType, RoundCadence, RoundQuestion, RoundShift, SHIFTS } from '../models/rounds.model';

interface QDraft {
  prompt: string; answerType: RoundAnswerType; unit: string; lowLimit: number | null; highLimit: number | null;
  expectedValue: string; choicesJson: string; trackIssues: boolean; category: string; physicalObjectId: number | null;
  predecessorQuestionId: number | null; showWhenOp: string; showWhenValue: string; reorderCatalogKey: string;
}

/** A display group. {@code rawCat} is the real stored category (null for the ungrouped bucket); {@code key} is a
 *  stable, non-typeable identity so a group literally named "(ungrouped)" never collides with the null bucket. */
interface Group { cat: string; rawCat: string | null; key: string; questions: RoundQuestion[]; }

const SHOW_WHEN_OPS = ['ANSWERED', 'EQUALS', 'NOT_EQUALS'];
const UNGROUPED = '(ungrouped)';
const NULL_KEY = '\u0000ungrouped';

/**
 * Full CRUD editor for a Round — the management tool. Schedule/name/area/active, plus per-question editing (prompt,
 * type, limits, expected, grouping, physical-object binding, and conditional-display dependency). Works group-first:
 * collapse/reorder/assign-object/rename/merge/delete whole groups, reorder questions, add and delete.
 */
@Component({
  selector: 'app-rounds-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, PoPickerComponent],
  templateUrl: './rounds-editor.component.html',
  styleUrl: './rounds-editor.component.css',
})
export class RoundsEditorComponent implements OnInit {
  private api = inject(RoundsAdminService);
  private poApi = inject(PhysicalObjectApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  readonly answerTypes = ANSWER_TYPES;
  readonly cadences = CADENCES;
  readonly shifts = SHIFTS;
  readonly showWhenOps = SHOW_WHEN_OPS;
  readonly poColor = poColor;
  readonly UNGROUPED = UNGROUPED;

  round = signal<Round | null>(null);
  tree = signal<PhysicalObjectNode[]>([]);
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  msg = signal('');

  // round header form
  hName = ''; hArea = ''; hCadence: RoundCadence = 'PER_SHIFT'; hShift: RoundShift = 'EITHER';
  hInterval: number | null = null; hActive = true;

  // question edit
  editingId = signal<number | null>(null);
  draft: QDraft = this.blankDraft();

  // add question
  addingPrompt = '';
  addingType: RoundAnswerType = 'TEXT';

  // group UI state
  collapsed = signal<Set<string>>(new Set());
  renamingGroup = signal<string | null>(null);
  renameValue = '';
  groupPoTarget = signal<string | null>(null);

  // merge mode
  mergeMode = signal(false);
  mergeSelected = signal<Set<string>>(new Set());
  mergeName = '';

  readonly questions = computed(() => this.round()?.questions ?? []);

  /** Groups by real category, in first-appearance order; null-category questions form the "(ungrouped)" bucket. */
  readonly groups = computed<Group[]>(() => {
    const map = new Map<string, { rawCat: string | null; questions: RoundQuestion[] }>();
    const order: string[] = [];
    for (const q of this.questions()) {
      const raw = q.category && q.category.trim() ? q.category : null;
      const key = raw ?? NULL_KEY;
      if (!map.has(key)) { map.set(key, { rawCat: raw, questions: [] }); order.push(key); }
      map.get(key)!.questions.push(q);
    }
    return order.map(key => {
      const g = map.get(key)!;
      return { cat: g.rawCat ?? UNGROUPED, rawCat: g.rawCat, key, questions: g.questions };
    });
  });

  /** Predecessor options for the dependency dropdown (every other question, labelled). */
  readonly predecessorOptions = computed(() =>
    this.questions().filter(q => q.id !== this.editingId())
      .map(q => ({ id: q.id, label: `${q.category ? q.category + ' — ' : ''}${q.prompt || '#' + q.id}` })));

  poName(id: number | null): string {
    if (id == null) return '';
    const n = this.tree().find(x => x.id === id);
    return n ? `${n.name}${n.tagNumber ? ' (' + n.tagNumber + ')' : ''}` : `#${id}`;
  }

  questionPrompt(id: number | null): string {
    if (id == null) return '';
    const q = this.questions().find(x => x.id === id);
    return q ? (q.prompt || '#' + id) : '#' + id;
  }

  async ngOnInit(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading.set(true);
    try {
      const [round] = await Promise.all([firstValueFrom(this.api.getRound(id)), this.loadTree()]);
      this.setRound(round);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTree(): Promise<void> {
    try { this.tree.set(await firstValueFrom(this.poApi.getTree())); } catch { /* optional */ }
  }

  private setRound(r: Round | null): void {
    this.round.set(r);
    if (!r) return;
    this.hName = r.name || '';
    this.hArea = r.area || '';
    this.hCadence = (r.cadence as RoundCadence) || 'PER_SHIFT';
    this.hShift = (r.shift as RoundShift) || 'EITHER';
    this.hInterval = r.intervalHours;
    this.hActive = r.active;
  }

  private async reload(): Promise<void> {
    const r = this.round();
    if (!r) return;
    this.setRound(await firstValueFrom(this.api.getRound(r.id)));
  }

  // ── round header ──
  async saveRound(): Promise<void> {
    const r = this.round();
    if (!r) return;
    this.saving.set(true); this.error.set(''); this.msg.set('');
    try {
      await firstValueFrom(this.api.updateRound(r.id, {
        name: this.hName.trim(), area: this.hArea.trim(), cadence: this.hCadence, shift: this.hShift,
        intervalHours: this.hInterval, active: this.hActive,
      }));
      await this.reload();
      this.msg.set('Round saved.');
    } catch (e: any) { this.error.set(this.errMsg(e)); }
    finally { this.saving.set(false); }
  }

  async deleteRound(): Promise<void> {
    const r = this.round();
    if (!r || !confirm(`Delete round "${r.name}"? This hides it and its questions.`)) return;
    try {
      await firstValueFrom(this.api.deleteRound(r.id));
      this.router.navigate(['/rounds/workbench']);
    } catch (e: any) { this.error.set(this.errMsg(e)); }
  }

  // ── collapse (keyed by group key) ──
  isCollapsed(key: string): boolean { return this.collapsed().has(key); }
  toggleCollapse(key: string): void {
    const s = new Set(this.collapsed());
    if (s.has(key)) s.delete(key); else s.add(key);
    this.collapsed.set(s);
  }
  collapseAll(): void { this.collapsed.set(new Set(this.groups().map(g => g.key))); }
  expandAll(): void { this.collapsed.set(new Set()); }

  // ── reorder (persist a contiguous flat order, which normalizes groups) ──
  private async persistOrder(gs: Group[]): Promise<void> {
    const r = this.round();
    if (!r) return;
    const flatIds = gs.flatMap(g => g.questions.map(q => q.id));
    try { this.setRound(await firstValueFrom(this.api.reorderQuestions(r.id, flatIds))); }
    catch (e: any) { this.error.set(this.errMsg(e)); await this.reload(); }
  }

  async moveGroup(gi: number, dir: -1 | 1): Promise<void> {
    const gs = [...this.groups()];
    const j = gi + dir;
    if (j < 0 || j >= gs.length) return;
    [gs[gi], gs[j]] = [gs[j], gs[gi]];
    await this.persistOrder(gs);
  }

  async moveQuestion(key: string, qi: number, dir: -1 | 1): Promise<void> {
    const gs = this.groups().map(g => ({ ...g, questions: [...g.questions] }));
    const g = gs.find(x => x.key === key);
    if (!g) return;
    const j = qi + dir;
    if (j < 0 || j >= g.questions.length) return;
    [g.questions[qi], g.questions[j]] = [g.questions[j], g.questions[qi]];
    await this.persistOrder(gs);
  }

  // ── group CRUD (identity via group key; backend ops use the real rawCat) ──
  startRenameGroup(g: Group): void { this.renamingGroup.set(g.key); this.renameValue = g.rawCat ?? ''; }
  cancelRenameGroup(): void { this.renamingGroup.set(null); }
  async commitRenameGroup(g: Group): Promise<void> {
    const to = this.renameValue.trim();
    if (!to || to === (g.rawCat ?? '')) { this.renamingGroup.set(null); return; }
    const r = this.round();
    if (!r) return;
    try {
      this.setRound(await firstValueFrom(this.api.renameGroup(r.id, g.rawCat, to)));
      this.renamingGroup.set(null);
    } catch (e: any) { this.error.set(this.errMsg(e)); }
  }

  async deleteGroup(g: Group): Promise<void> {
    const r = this.round();
    if (!r || !confirm(`Delete the "${g.cat}" group and all its questions?`)) return;
    try { this.setRound(await firstValueFrom(this.api.deleteGroup(r.id, g.rawCat ?? ''))); }
    catch (e: any) { this.error.set(this.errMsg(e)); }
  }

  // ── merge groups (multi-select → one target) ──
  toggleMergeMode(): void {
    this.mergeMode.update(m => !m);
    this.mergeSelected.set(new Set());
    this.mergeName = '';
  }
  isMergeSelected(key: string): boolean { return this.mergeSelected().has(key); }
  toggleMergeSelect(g: Group): void {
    const s = new Set(this.mergeSelected());
    if (s.has(g.key)) s.delete(g.key); else s.add(g.key);
    this.mergeSelected.set(s);
    if (!this.mergeName.trim() && s.size) {
      const first = this.groups().find(x => s.has(x.key));
      this.mergeName = first && first.rawCat ? first.rawCat : '';
    }
  }
  async doMerge(): Promise<void> {
    const r = this.round();
    const keys = this.mergeSelected();
    const to = this.mergeName.trim();
    if (!r || keys.size < 2) { this.error.set('Select at least two groups to merge.'); return; }
    if (!to) { this.error.set('Enter a name for the merged group.'); return; }
    const froms = this.groups().filter(g => keys.has(g.key)).map(g => g.rawCat);
    this.saving.set(true); this.error.set('');
    try {
      this.setRound(await firstValueFrom(this.api.mergeGroups(r.id, froms, to)));
      this.mergeMode.set(false);
      this.mergeSelected.set(new Set());
      this.mergeName = '';
      this.msg.set('Groups merged.');
    } catch (e: any) { this.error.set(this.errMsg(e)); }
    finally { this.saving.set(false); }
  }

  // ── group → physical object ──
  openGroupPo(g: Group): void { this.groupPoTarget.set(g.key); }
  closeGroupPo(): void { this.groupPoTarget.set(null); }
  async assignGroupPo(g: Group, poId: number | null): Promise<void> {
    const r = this.round();
    if (!r) return;
    try {
      this.setRound(await firstValueFrom(this.api.assignGroupObject(r.id, g.rawCat, poId)));
      this.groupPoTarget.set(null);
    } catch (e: any) { this.error.set(this.errMsg(e)); }
  }

  // ── question edit ──
  startEdit(q: RoundQuestion): void {
    this.editingId.set(q.id);
    this.draft = {
      prompt: q.prompt || '', answerType: (q.answerType as RoundAnswerType) || 'TEXT', unit: q.unit || '',
      lowLimit: q.lowLimit, highLimit: q.highLimit, expectedValue: q.expectedValue || '',
      choicesJson: q.choicesJson || '', trackIssues: q.trackIssues, category: q.category || '',
      physicalObjectId: q.physicalObjectId,
      predecessorQuestionId: q.predecessorQuestionId, showWhenOp: q.showWhenOp || 'ANSWERED', showWhenValue: q.showWhenValue || '',
      reorderCatalogKey: q.reorderCatalogKey || '',
    };
  }

  cancelEdit(): void { this.editingId.set(null); }

  async saveEdit(): Promise<void> {
    const id = this.editingId();
    if (id == null) return;
    this.saving.set(true); this.error.set('');
    try {
      await firstValueFrom(this.api.updateQuestion(id, {
        prompt: this.draft.prompt.trim(), answerType: this.draft.answerType,
        unit: this.draft.unit.trim() || null, category: this.draft.category.trim() || null,
        expectedValue: this.draft.expectedValue.trim() || null,
        choicesJson: this.draft.answerType === 'CHOICE' ? (this.draft.choicesJson.trim() || null) : null,
        lowLimit: this.draft.lowLimit, highLimit: this.draft.highLimit, trackIssues: this.draft.trackIssues,
        physicalObjectId: this.draft.physicalObjectId ?? -1,
        predecessorQuestionId: this.draft.predecessorQuestionId ?? -1,
        showWhenOp: this.draft.predecessorQuestionId != null ? this.draft.showWhenOp : null,
        // send '' (not null) so the backend clears a stale value when the op no longer uses one
        showWhenValue: this.draft.predecessorQuestionId != null && this.draft.showWhenOp !== 'ANSWERED'
          ? (this.draft.showWhenValue.trim() || '') : '',
        reorderCatalogKey: this.draft.reorderCatalogKey.trim(),
      }));
      await this.reload();
      this.editingId.set(null);
    } catch (e: any) { this.error.set(this.errMsg(e)); }
    finally { this.saving.set(false); }
  }

  async deleteQuestion(q: RoundQuestion): Promise<void> {
    if (!confirm('Delete this question?')) return;
    try { await firstValueFrom(this.api.deleteQuestion(q.id)); await this.reload(); }
    catch (e: any) { this.error.set(this.errMsg(e)); }
  }

  // ── add ──
  async addQuestion(cat?: string): Promise<void> {
    const r = this.round();
    if (!r || !this.addingPrompt.trim()) return;
    this.saving.set(true); this.error.set('');
    try {
      const created = await firstValueFrom(this.api.generateAdHoc({
        roundId: r.id, physicalObjectId: null, prompt: this.addingPrompt.trim(), answerType: this.addingType,
      }));
      if (cat && cat !== UNGROUPED && created?.id) {
        await firstValueFrom(this.api.updateQuestion(created.id, { category: cat }));
      }
      this.addingPrompt = ''; this.addingType = 'TEXT';
      await this.reload();
    } catch (e: any) { this.error.set(this.errMsg(e)); }
    finally { this.saving.set(false); }
  }

  private blankDraft(): QDraft {
    return { prompt: '', answerType: 'TEXT', unit: '', lowLimit: null, highLimit: null, expectedValue: '',
      choicesJson: '', trackIssues: true, category: '', physicalObjectId: null,
      predecessorQuestionId: null, showWhenOp: 'ANSWERED', showWhenValue: '', reorderCatalogKey: '' };
  }

  private errMsg(e: any): string { return e?.error?.message || e?.message || 'Request failed'; }

  back(): void { this.router.navigate(['/rounds/workbench']); }
}
