import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { PhysicalObjectApiService } from '../../../services/physical/physical-object-api.service';
import { PhysicalObjectNode, PO_TYPE_OPTIONS, poColor } from '../../../models/physical/physical-object.models';
import { RoundsAdminService } from '../services/rounds-admin.service';
import {
  ANSWER_TYPES,
  CADENCES,
  GenerateQuestionRequest,
  ImportedRoundQuestion,
  Round,
  RoundAnswerType,
  RoundCadence,
  RoundQuestion,
  RoundShift,
  SHIFTS,
  StagingStatus,
} from '../models/rounds.model';

type StatusTab = StagingStatus | 'ALL';

/**
 * Rounds processing workbench (hub-served admin). Import WebView-AMS round columns into staging, then process them —
 * one at a time (detailed edit) or a whole system/tag group at once (multi-select → bind one PhysicalObject + Round →
 * generate all). Also create rounds and ad-hoc questions manually (no import). Original WebView headers are never
 * mutated; generated questions are fully editable.
 */
@Component({
  selector: 'app-rounds-workbench',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  templateUrl: './rounds-workbench.component.html',
  styleUrl: './rounds-workbench.component.css',
})
export class RoundsWorkbenchComponent implements OnInit {
  private api = inject(RoundsAdminService);
  private poApi = inject(PhysicalObjectApiService);
  private router = inject(Router);

  readonly answerTypes = ANSWER_TYPES;
  readonly cadences = CADENCES;
  readonly shifts = SHIFTS;
  readonly poTypes = PO_TYPE_OPTIONS;
  readonly poColor = poColor;

  // ── data ──
  staging = signal<ImportedRoundQuestion[]>([]);
  rounds = signal<Round[]>([]);
  tree = signal<PhysicalObjectNode[]>([]);

  statusTab = signal<StatusTab>('NEW');
  loading = signal(false);
  importMsg = signal<string>('');
  errorMsg = signal<string>('');

  selected = signal<ImportedRoundQuestion | null>(null);
  selectedIds = signal<Set<number>>(new Set());
  collapsedGroups = signal<Set<string>>(new Set());

  // ── generate form (single detailed processing) ──
  fPrompt = '';
  fType: RoundAnswerType = 'TEXT';
  fUnit = '';
  fLow: number | null = null;
  fHigh: number | null = null;
  fExpected = '';
  fTrackIssues = true;
  fChoices = '';

  // ── shared physical-object binding (single + batch) ──
  poQuery = '';
  poSelectedId: number | null = null;
  poCreating = false;
  newPoName = '';
  newPoType = 'EQUIPMENT';
  newPoParentId: number | null = null;
  newPoTag = '';

  // ── shared round binding (single + batch) ──
  roundSelectedId: number | null = null;
  roundCreating = false;
  newRoundName = '';
  newRoundArea = '';
  newRoundCadence: RoundCadence = 'PER_SHIFT';
  newRoundShift: RoundShift = 'EITHER';

  // ── manual create modals ──
  showNewRound = signal(false);
  nrName = '';
  nrArea = '';
  nrCadence: RoundCadence = 'PER_SHIFT';
  nrShift: RoundShift = 'EITHER';

  showNewQuestion = signal(false);
  nqRoundId: number | null = null;
  nqPrompt = '';
  nqType: RoundAnswerType = 'TEXT';
  nqUnit = '';
  nqLow: number | null = null;
  nqHigh: number | null = null;
  nqExpected = '';
  nqChoices = '';
  nqTrackIssues = true;
  nqPoId: number | null = null;

  expandedRoundId = signal<number | null>(null);
  saving = signal(false);

  readonly counts = computed(() => {
    const all = this.staging();
    return {
      NEW: all.filter(s => s.status === 'NEW').length,
      PROCESSED: all.filter(s => s.status === 'PROCESSED').length,
      IGNORED: all.filter(s => s.status === 'IGNORED').length,
      ALL: all.length,
    };
  });

  readonly filteredStaging = computed(() => {
    const tab = this.statusTab();
    const rows = this.staging();
    return tab === 'ALL' ? rows : rows.filter(r => r.status === tab);
  });

  /** Staging grouped by category (the system/tag) for the list. */
  readonly grouped = computed(() => {
    const map = new Map<string, ImportedRoundQuestion[]>();
    for (const r of this.filteredStaging()) {
      const k = r.category || '(uncategorized)';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  });

  readonly selectedCount = computed(() => this.selectedIds().size);

  readonly poResults = computed(() => {
    const q = this.poQuery.trim().toLowerCase();
    const all = this.tree();
    const base = q
      ? all.filter(n =>
          (n.name || '').toLowerCase().includes(q) ||
          (n.tagNumber || '').toLowerCase().includes(q))
      : all;
    return base.slice(0, 40);
  });

  readonly poSelectedNode = computed(() =>
    this.tree().find(n => n.id === this.poSelectedId) ?? null);

  async ngOnInit(): Promise<void> {
    await Promise.all([this.reloadStaging(), this.reloadRounds(), this.reloadTree()]);
  }

  // ── loaders ──
  async reloadStaging(): Promise<void> {
    this.loading.set(true);
    try {
      this.staging.set(await firstValueFrom(this.api.listStaging()));
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    } finally {
      this.loading.set(false);
    }
  }

  async reloadRounds(): Promise<void> {
    try {
      this.rounds.set(await firstValueFrom(this.api.listRounds()));
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    }
  }

  async reloadTree(): Promise<void> {
    try {
      this.tree.set(await firstValueFrom(this.poApi.getTree()));
    } catch {
      /* PhysicalObject tree is optional for authoring */
    }
  }

  /** Import a manually-exported rounds Excel file (the primary source). */
  async onExcelFile(ev: Event): Promise<void> {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.loading.set(true);
    this.importMsg.set('');
    this.errorMsg.set('');
    try {
      const r = await firstValueFrom(this.api.importExcel(file));
      this.importMsg.set(`Imported ${r.round ?? 'round'}: ${r.created} new, ${r.updated} updated.`);
      await this.reloadStaging();
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    } finally {
      this.loading.set(false);
      input.value = '';
    }
  }

  // ── batch selection ──
  isSelected(id: number): boolean { return this.selectedIds().has(id); }

  toggleSelect(row: ImportedRoundQuestion): void {
    const s = new Set(this.selectedIds());
    if (s.has(row.id)) s.delete(row.id); else s.add(row.id);
    this.selectedIds.set(s);
  }

  /** True when every NEW row in the group is selected. */
  groupAllSelected(rows: ImportedRoundQuestion[]): boolean {
    const news = rows.filter(r => r.status === 'NEW');
    return news.length > 0 && news.every(r => this.selectedIds().has(r.id));
  }

  toggleGroupSelect(rows: ImportedRoundQuestion[]): void {
    const s = new Set(this.selectedIds());
    const news = rows.filter(r => r.status === 'NEW');
    const all = this.groupAllSelected(rows);
    for (const r of news) { if (all) s.delete(r.id); else s.add(r.id); }
    this.selectedIds.set(s);
  }

  clearSelection(): void { this.selectedIds.set(new Set()); }

  /** Select every NEW row in the current view — build a whole round in one batch, then refine in the editor. */
  selectAllNew(): void {
    const s = new Set(this.selectedIds());
    for (const r of this.filteredStaging()) if (r.status === 'NEW') s.add(r.id);
    this.selectedIds.set(s);
  }

  // ── collapsible groups ──
  isCollapsed(cat: string): boolean { return this.collapsedGroups().has(cat); }
  toggleGroupCollapse(cat: string): void {
    const s = new Set(this.collapsedGroups());
    if (s.has(cat)) s.delete(cat); else s.add(cat);
    this.collapsedGroups.set(s);
  }
  collapseAll(): void { this.collapsedGroups.set(new Set(this.grouped().map(g => g[0]))); }
  expandAll(): void { this.collapsedGroups.set(new Set()); }

  // ── single-row detail selection ──
  select(row: ImportedRoundQuestion): void {
    this.selected.set(row);
    this.errorMsg.set('');
    this.fPrompt = row.prompt || '';
    this.fType = row.suggestedType || 'TEXT';
    this.fUnit = row.unit || '';
    this.fLow = row.lowLimit;
    this.fHigh = row.highLimit;
    this.fExpected = '';
    this.fTrackIssues = true;
    this.fChoices = '';
    this.poQuery = '';
    this.poSelectedId = null;
    this.poCreating = false;
    this.newPoName = row.tagCode ? `${row.tagCode}` : (row.category || '');
    this.newPoTag = row.tagCode || '';
    this.roundCreating = false;
  }

  clearDetail(): void { this.selected.set(null); }

  // ── shared resolvers (round + physical object) ──
  private async resolveRoundId(): Promise<number> {
    if (this.roundCreating) {
      if (!this.newRoundName.trim()) throw new Error('New round needs a name.');
      const created = await firstValueFrom(this.api.createRound({
        name: this.newRoundName.trim(), area: this.newRoundArea.trim() || null,
        cadence: this.newRoundCadence, shift: this.newRoundShift,
      }));
      await this.reloadRounds();
      this.roundSelectedId = created.id;
      this.roundCreating = false;
      return created.id;
    }
    if (!this.roundSelectedId) throw new Error('Pick a round (or create one) first.');
    return this.roundSelectedId;
  }

  private async resolvePoId(): Promise<number | null> {
    if (this.poCreating) {
      if (!this.newPoName.trim()) throw new Error('New physical object needs a name.');
      const node = await firstValueFrom(this.poApi.createNode({
        name: this.newPoName.trim(), type: this.newPoType,
        tagNumber: this.newPoTag.trim() || undefined, parentId: this.newPoParentId,
      }));
      await this.reloadTree();
      this.poSelectedId = node?.id ?? null;
      this.poCreating = false;
    }
    return this.poSelectedId;
  }

  // ── generate (single) ──
  async generate(): Promise<void> {
    const row = this.selected();
    if (!row) return;
    this.saving.set(true);
    this.errorMsg.set('');
    try {
      const roundId = await this.resolveRoundId();
      const physicalObjectId = await this.resolvePoId();
      const body: GenerateQuestionRequest = {
        roundId, physicalObjectId,
        prompt: this.fPrompt.trim() || null,
        answerType: this.fType,
        unit: this.fUnit.trim() || null,
        lowLimit: this.fLow, highLimit: this.fHigh,
        expectedValue: this.fExpected.trim() || null,
        trackIssues: this.fTrackIssues,
        choicesJson: this.fType === 'CHOICE' ? (this.fChoices.trim() || null) : null,
      };
      await firstValueFrom(this.api.generateFromStaging(row.id, body));
      await Promise.all([this.reloadStaging(), this.reloadRounds()]);
      this.advanceToNextNew(row.id);
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    } finally {
      this.saving.set(false);
    }
  }

  // ── generate (batch: whole group / selection → one round + one object) ──
  async generateBatch(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    this.saving.set(true);
    this.errorMsg.set('');
    try {
      const roundId = await this.resolveRoundId();
      const physicalObjectId = await this.resolvePoId();
      await firstValueFrom(this.api.generateBulk({ roundId, physicalObjectId, stagingIds: ids }));
      await Promise.all([this.reloadStaging(), this.reloadRounds()]);
      this.clearSelection();
      this.importMsg.set(`Generated ${ids.length} question(s) into the round.`);
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    } finally {
      this.saving.set(false);
    }
  }

  async ignoreSelected(): Promise<void> {
    const ids = [...this.selectedIds()];
    if (!ids.length) return;
    try {
      await firstValueFrom(this.api.ignoreBulk(ids));
      await this.reloadStaging();
      this.clearSelection();
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    }
  }

  async ignore(row: ImportedRoundQuestion): Promise<void> {
    try {
      await firstValueFrom(this.api.ignoreStaging(row.id));
      await this.reloadStaging();
      if (this.selected()?.id === row.id) this.advanceToNextNew(row.id);
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    }
  }

  private advanceToNextNew(justDoneId: number): void {
    const news = this.staging().filter(s => s.status === 'NEW' && s.id !== justDoneId);
    if (news.length) { this.statusTab.set('NEW'); this.select(news[0]); }
    else this.clearDetail();
  }

  // ── manual create ──
  openNewRound(): void {
    this.nrName = ''; this.nrArea = ''; this.nrCadence = 'PER_SHIFT'; this.nrShift = 'EITHER';
    this.showNewRound.set(true);
  }

  async createRoundNow(): Promise<void> {
    if (!this.nrName.trim()) { this.errorMsg.set('Round needs a name.'); return; }
    this.saving.set(true);
    try {
      await firstValueFrom(this.api.createRound({
        name: this.nrName.trim(), area: this.nrArea.trim() || null, cadence: this.nrCadence, shift: this.nrShift,
      }));
      await this.reloadRounds();
      this.showNewRound.set(false);
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    } finally {
      this.saving.set(false);
    }
  }

  openNewQuestion(): void {
    this.nqRoundId = this.rounds()[0]?.id ?? null;
    this.nqPrompt = ''; this.nqType = 'TEXT'; this.nqUnit = ''; this.nqLow = null; this.nqHigh = null;
    this.nqExpected = ''; this.nqChoices = ''; this.nqTrackIssues = true; this.nqPoId = null;
    this.showNewQuestion.set(true);
  }

  async createQuestionNow(): Promise<void> {
    if (!this.nqRoundId) { this.errorMsg.set('Pick a round for the question.'); return; }
    if (!this.nqPrompt.trim()) { this.errorMsg.set('Question needs a prompt.'); return; }
    this.saving.set(true);
    try {
      const body: GenerateQuestionRequest = {
        roundId: this.nqRoundId, physicalObjectId: this.nqPoId,
        prompt: this.nqPrompt.trim(), answerType: this.nqType,
        unit: this.nqUnit.trim() || null, lowLimit: this.nqLow, highLimit: this.nqHigh,
        expectedValue: this.nqExpected.trim() || null, trackIssues: this.nqTrackIssues,
        choicesJson: this.nqType === 'CHOICE' ? (this.nqChoices.trim() || null) : null,
      };
      await firstValueFrom(this.api.generateAdHoc(body));
      await this.reloadRounds();
      this.showNewQuestion.set(false);
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    } finally {
      this.saving.set(false);
    }
  }

  // ── rounds panel ──
  async toggleRound(r: Round): Promise<void> {
    if (this.expandedRoundId() === r.id) { this.expandedRoundId.set(null); return; }
    try {
      const full = await firstValueFrom(this.api.getRound(r.id));
      this.rounds.update(list => list.map(x => x.id === r.id ? full : x));
      this.expandedRoundId.set(r.id);
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    }
  }

  editRound(r: Round): void { this.router.navigate(['/rounds/editor', r.id]); }

  /** Clear stale (unprocessed) staging rows — e.g. old scraper-imported items. */
  async clearStaging(): Promise<void> {
    const n = this.counts().NEW + this.counts().IGNORED;
    if (!n || !confirm(`Remove ${n} unprocessed staging item(s)? Generated questions are not affected.`)) return;
    try {
      await firstValueFrom(this.api.purgeStaging('ALL'));
      this.clearSelection();
      await this.reloadStaging();
      this.importMsg.set('Cleared unprocessed staging.');
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    }
  }

  /** Loose-group a round's questions by category for display. */
  groupQuestions(qs: RoundQuestion[] | null): [string, RoundQuestion[]][] {
    if (!qs) return [];
    const map = new Map<string, RoundQuestion[]>();
    for (const q of qs) {
      const k = q.category || '(ungrouped)';
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(q);
    }
    return [...map.entries()];
  }

  async deleteQuestion(q: { id: number }, roundId: number): Promise<void> {
    if (!confirm('Delete this question from the round?')) return;
    try {
      await firstValueFrom(this.api.deleteQuestion(q.id));
      const full = await firstValueFrom(this.api.getRound(roundId));
      this.rounds.update(list => list.map(x => x.id === roundId ? full : x));
    } catch (e: any) {
      this.errorMsg.set(this.msg(e));
    }
  }

  private msg(e: any): string {
    return e?.error?.message || e?.message || 'Request failed';
  }
}
