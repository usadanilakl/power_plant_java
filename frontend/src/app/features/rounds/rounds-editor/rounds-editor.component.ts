import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { PhysicalObjectApiService } from '../../../services/physical/physical-object-api.service';
import { PhysicalObjectNode, poColor } from '../../../models/physical/physical-object.models';
import { RoundsAdminService } from '../services/rounds-admin.service';
import { ANSWER_TYPES, CADENCES, Round, RoundAnswerType, RoundCadence, RoundQuestion, RoundShift, SHIFTS } from '../models/rounds.model';

interface QDraft {
  prompt: string; answerType: RoundAnswerType; unit: string; lowLimit: number | null; highLimit: number | null;
  expectedValue: string; choicesJson: string; trackIssues: boolean; category: string; physicalObjectId: number | null;
  predecessorQuestionId: number | null; showWhenOp: string; showWhenValue: string;
}

interface Group { cat: string; questions: RoundQuestion[]; }

const SHOW_WHEN_OPS = ['ANSWERED', 'EQUALS', 'NOT_EQUALS'];
const UNGROUPED = '(ungrouped)';

/**
 * Full CRUD editor for a Round — the management tool. Schedule/name/area/active, plus per-question editing (prompt,
 * type, limits, expected, grouping, physical-object binding, and conditional-display dependency). Works group-first:
 * collapse/reorder/assign-object/rename/merge/delete whole groups, reorder questions, add and delete.
 */
@Component({
  selector: 'app-rounds-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
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
  poQuery = '';

  // add question
  addingPrompt = '';
  addingType: RoundAnswerType = 'TEXT';

  // group UI state
  collapsed = signal<Set<string>>(new Set());
  renamingGroup = signal<string | null>(null);
  renameValue = '';
  groupPoTarget = signal<string | null>(null);
  groupPoQuery = '';

  readonly questions = computed(() => this.round()?.questions ?? []);

  /** Groups by category, in first-appearance order; each collects all its questions in their current order. */
  readonly groups = computed<Group[]>(() => {
    const map = new Map<string, RoundQuestion[]>();
    const order: string[] = [];
    for (const q of this.questions()) {
      const cat = q.category || UNGROUPED;
      if (!map.has(cat)) { map.set(cat, []); order.push(cat); }
      map.get(cat)!.push(q);
    }
    return order.map(cat => ({ cat, questions: map.get(cat)! }));
  });

  /** Predecessor options for the dependency dropdown (every other question, labelled). */
  readonly predecessorOptions = computed(() =>
    this.questions().filter(q => q.id !== this.editingId())
      .map(q => ({ id: q.id, label: `${q.category ? q.category + ' — ' : ''}${q.prompt || '#' + q.id}` })));

  readonly poResults = computed(() => this.searchTree(this.poQuery));
  readonly groupPoResults = computed(() => this.searchTree(this.groupPoQuery));

  private searchTree(query: string): PhysicalObjectNode[] {
    const q = query.trim().toLowerCase();
    const all = this.tree();
    const base = q ? all.filter(n => (n.name || '').toLowerCase().includes(q) || (n.tagNumber || '').toLowerCase().includes(q)) : all;
    return base.slice(0, 30);
  }

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

  // ── collapse ──
  isCollapsed(cat: string): boolean { return this.collapsed().has(cat); }
  toggleCollapse(cat: string): void {
    const s = new Set(this.collapsed());
    if (s.has(cat)) s.delete(cat); else s.add(cat);
    this.collapsed.set(s);
  }
  collapseAll(): void { this.collapsed.set(new Set(this.groups().map(g => g.cat))); }
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

  async moveQuestion(cat: string, qi: number, dir: -1 | 1): Promise<void> {
    const gs = this.groups().map(g => ({ cat: g.cat, questions: [...g.questions] }));
    const g = gs.find(x => x.cat === cat);
    if (!g) return;
    const j = qi + dir;
    if (j < 0 || j >= g.questions.length) return;
    [g.questions[qi], g.questions[j]] = [g.questions[j], g.questions[qi]];
    await this.persistOrder(gs);
  }

  // ── group CRUD ──
  startRenameGroup(cat: string): void { this.renamingGroup.set(cat); this.renameValue = cat === UNGROUPED ? '' : cat; }
  cancelRenameGroup(): void { this.renamingGroup.set(null); }
  async commitRenameGroup(from: string): Promise<void> {
    const to = this.renameValue.trim();
    if (!to || to === from) { this.renamingGroup.set(null); return; }
    const r = this.round();
    if (!r) return;
    try {
      this.setRound(await firstValueFrom(this.api.renameGroup(r.id, from === UNGROUPED ? null : from, to)));
      this.renamingGroup.set(null);
    } catch (e: any) { this.error.set(this.errMsg(e)); }
  }

  async deleteGroup(cat: string): Promise<void> {
    const r = this.round();
    if (!r || !confirm(`Delete the "${cat}" group and all its questions?`)) return;
    try { this.setRound(await firstValueFrom(this.api.deleteGroup(r.id, cat === UNGROUPED ? '' : cat))); }
    catch (e: any) { this.error.set(this.errMsg(e)); }
  }

  // ── group → physical object ──
  openGroupPo(cat: string): void { this.groupPoTarget.set(cat); this.groupPoQuery = ''; }
  closeGroupPo(): void { this.groupPoTarget.set(null); }
  async assignGroupPo(cat: string, poId: number | null): Promise<void> {
    const r = this.round();
    if (!r) return;
    try {
      this.setRound(await firstValueFrom(this.api.assignGroupObject(r.id, cat === UNGROUPED ? null : cat, poId)));
      this.groupPoTarget.set(null);
    } catch (e: any) { this.error.set(this.errMsg(e)); }
  }

  // ── question edit ──
  startEdit(q: RoundQuestion): void {
    this.editingId.set(q.id);
    this.poQuery = '';
    this.draft = {
      prompt: q.prompt || '', answerType: (q.answerType as RoundAnswerType) || 'TEXT', unit: q.unit || '',
      lowLimit: q.lowLimit, highLimit: q.highLimit, expectedValue: q.expectedValue || '',
      choicesJson: q.choicesJson || '', trackIssues: q.trackIssues, category: q.category || '',
      physicalObjectId: q.physicalObjectId,
      predecessorQuestionId: q.predecessorQuestionId, showWhenOp: q.showWhenOp || 'ANSWERED', showWhenValue: q.showWhenValue || '',
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
        showWhenValue: this.draft.predecessorQuestionId != null && this.draft.showWhenOp !== 'ANSWERED'
          ? (this.draft.showWhenValue.trim() || null) : null,
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
      predecessorQuestionId: null, showWhenOp: 'ANSWERED', showWhenValue: '' };
  }

  private errMsg(e: any): string { return e?.error?.message || e?.message || 'Request failed'; }

  back(): void { this.router.navigate(['/rounds/workbench']); }
}
