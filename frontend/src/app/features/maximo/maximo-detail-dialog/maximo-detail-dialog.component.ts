import { Component, EventEmitter, Input, OnInit, Output, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoPmApiService } from '../../../services/maximo/maximo-pm-api.service';
import { MaximoFormApiService } from '../../../services/maximo/maximo-form-api.service';
import { AuthService } from '../../../services/auth.service';
import { copyToOsClipboard, fillGenSuit } from '../../../services/util/os-clipboard';
import { MaximoPersonPickerComponent } from '../maximo-person-picker/maximo-person-picker.component';
import { MaximoSchedulePeekComponent } from '../maximo-schedule-peek/maximo-schedule-peek.component';
import { MaximoAssetPickerComponent } from '../maximo-asset-picker/maximo-asset-picker.component';
import { MaximoLocationPickerComponent } from '../maximo-location-picker/maximo-location-picker.component';
import { MaximoLocationTreePickerComponent } from '../maximo-location-tree-picker/maximo-location-tree-picker.component';
import { MaximoAttachmentsComponent } from '../maximo-attachments/maximo-attachments.component';
import { MaximoWoLotoLinkComponent } from '../maximo-wo-loto-link/maximo-wo-loto-link.component';
import { ConversationDialogService } from '../../../shared/messaging/conversation-dialog.service';
import { SmartFormComponent } from '../../../shared/reactive-form/smart-form/smart-form.component';
import { FormField } from '../../../models/ui/form-field.model';
import { MaximoFormFieldDef, MaximoFormSubmission, MaximoFormTemplate, ReorderLine, ReorderResult, computeReorderLines, isInventoryForm } from '../../../models/maximo/maximo-form.models';
import {
  MaximoAsset,
  MaximoInventoryItem,
  MaximoMaterialTxn,
  MaximoServiceRequest,
  MaximoTicketParent,
  MaximoWorkOrder,
  MaximoWorklog
} from '../../../models/maximo/maximo.models';

type Tab = 'details' | 'notes' | 'attachments' | 'complete' | 'materials' | 'tasks' | 'history';

/** Statuses from which a WO can still be completed. */
const COMPLETABLE_WO_STATUSES = ['APPR', 'INPRG', 'WMATL', 'WSCH', 'WPCOND'];

/** SR statuses where the ticket is still editable (description / notes / attachments). */
const EDITABLE_SR_STATUSES = ['NEW', 'QUEUED', 'INPROG', 'PENDING'];

/**
 * Dialog showing full details, worklog (notes), and attachments for an SR or WO.
 * The parent component passes the record + parent type; this component fetches subcollections.
 */
@Component({
  selector: 'app-maximo-detail-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MaximoPersonPickerComponent, MaximoSchedulePeekComponent, MaximoAssetPickerComponent, MaximoLocationPickerComponent, MaximoLocationTreePickerComponent, MaximoAttachmentsComponent, SmartFormComponent, MaximoWoLotoLinkComponent],
  templateUrl: './maximo-detail-dialog.component.html',
  styleUrl: './maximo-detail-dialog.component.css'
})
export class MaximoDetailDialogComponent implements OnInit {
  private api = inject(MaximoApiService);
  private pmApi = inject(MaximoPmApiService);
  private formApi = inject(MaximoFormApiService);
  private auth = inject(AuthService);
  private conversationDialog = inject(ConversationDialogService);

  /** Open the WO Q&A thread (entityType 'MaximoWorkOrder', anchored by the numeric workorderid). Everyone who can
   *  see the WO can read and reply; the shared conversation dialog renders the list + compose + thread. */
  askAboutWo(): void {
    if (this.wo?.workorderid) this.conversationDialog.open('MaximoWorkOrder', this.wo.workorderid, null, this.wo.wonum ?? null);
  }
  @ViewChild(SmartFormComponent) smartForm?: SmartFormComponent;

  @Input({ required: true }) parent!: MaximoTicketParent;
  @Input() sr: MaximoServiceRequest | null = null;
  @Input() wo: MaximoWorkOrder | null = null;
  @Output() closed = new EventEmitter<void>();
  /** Emitted after a successful completion OR lead transfer so the parent list can refresh the row. */
  @Output() completed = new EventEmitter<MaximoWorkOrder>();

  // ── Transfer lead (WO only) — writes spi:lead, does NOT change status ──────
  showTransferLead = signal(false);
  transferPersonid = '';
  transferring = signal(false);

  // ── GenSuit confirmation phrase (resolved for a WO by its pmnum) ──────────
  genSuit = signal<{ enabled: boolean | null; phrase: string | null } | null>(null);
  genSuitCopied = signal(false);

  tab = signal<Tab>('details');
  notes = signal<MaximoWorklog[]>([]);
  notesLoaded = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  // Add-note (worklog) form — WO or editable SR; works even on a completed WO.
  noteSummary = '';
  noteDetails = '';
  addingNote = signal(false);

  // Edit an editable SR's fields (Details tab).
  editingSr = signal(false);
  savingSr = signal(false);
  /** Escape hatch on the SR edit form: swap the plant-tree picker for the free-text asset/location pickers
   *  (for codes not yet in the Maximo-seeded tree). Tree is the default. */
  srManualEntry = signal(false);
  editDescription = '';
  editLongDescription = '';
  editPriority = '';
  editReportedby = '';
  editAffectedperson = '';
  editClassstructureid = '';
  editAssetnum = '';
  editLocation = '';
  readonly priorityOptions = ['', '1', '2', '3', '4', '5'];

  // ── Materials (issues + returns) ────────────────────────────────────────
  materials = signal<MaximoMaterialTxn[]>([]);
  materialsLoaded = signal(false);
  /** Per-row return quantity, keyed by matusetransid. */
  returnQty: Record<number, number> = {};
  returningId = signal<number | null>(null);

  // Add-part (issue) sub-form inside the Materials tab
  mItemQuery = '';
  mItemResults = signal<MaximoInventoryItem[]>([]);
  mItemSearching = signal(false);
  issuingItem = signal<string | null>(null);
  private mItemTimer: ReturnType<typeof setTimeout> | null = null;

  get isWo(): boolean { return this.parent === 'wo'; }

  // ── Tasks (internal child work orders of this WO) ───────────────────────
  tasks = signal<MaximoWorkOrder[]>([]);
  tasksLoaded = signal(false);
  /** href of the task currently being completed (disables just that row's button). */
  completingTaskHref = signal<string | null>(null);

  // ── Complete-WO form state ──────────────────────────────────────────────
  cLaborcode = '';
  cHours: number | null = null;
  cSummary = '';
  cDetails = '';
  completing = signal(false);
  completeDone = signal(false);
  /** Not-yet-due PM: reveal the assigned form read-for-reference (no finalize/complete) when the user opts in. */
  previewForm = signal(false);
  /** Human summary shown after a completion — honest about whether the WO actually closed vs. form-only attach. */
  completeSummary = signal('');
  laborPeople = signal<{ name: string; personid: string }[]>([]);
  private profileLoaded = false;

  // ── Electronic completion form (assigned to the WO's recurring PM) ────────
  /** All forms assigned to this WO's recurring PM. 0 = manual UI; 1 = auto-selected; >1 = the operator picks one. */
  availableForms = signal<MaximoFormTemplate[]>([]);
  /** The form currently being filled (auto when only one is assigned), or null when none/awaiting a pick. */
  completionForm = signal<MaximoFormTemplate | null>(null);
  /** Whether we've attempted to resolve the assigned form yet (Complete tab is opened lazily). */
  private formResolved = signal(false);
  resolvingForm = signal(false);
  /** SmartForm field defs derived from the template's fieldsJson. */
  formFields = signal<FormField[]>([]);
  /** Raw (parsed) template field defs — used to enforce required fields on completion. */
  private formDefs = signal<MaximoFormFieldDef[]>([]);
  /** Initial values for the form (prefilled from a prior draft/submission). */
  formValues = signal<any>({});
  /** The prior submission for this WO+form, if any (drives the "already completed" guard). */
  formSubmission = signal<MaximoFormSubmission | null>(null);
  /** Live form values (from SmartForm's change output, debounced) — drives the pre-submit reorder summary. */
  liveFormValues = signal<any>({});
  /** True when the assigned form is a reorder-capable inventory form (chem-lab inventory). */
  chemInventoryForm = computed(() => isInventoryForm(this.formDefs()));
  /** What WILL be reordered given the current entries — shown at the bottom of the form BEFORE submitting. */
  reorderSummary = computed<ReorderLine[]>(() =>
    computeReorderLines(this.formDefs(), { ...(this.formValues() ?? {}), ...(this.liveFormValues() ?? {}) }));
  /**
   * True once the assigned form's PDF has been finalized + attached to this WO (Button A). Distinct from
   * completeDone(): attaching the form does NOT close the WO unless the template sets completeWoStatus.
   * Gates Button B ("Complete Work Order") and is rehydrated from an existing COMPLETED submission so a
   * re-opened dialog still offers the close action.
   */
  formFinalized = signal(false);

  // ── Reorder step (chem-inventory form: after finalize, before close) ──────
  /** Reagents below target on the just-finalized inventory form — the offered reorder. */
  reorderLines = signal<ReorderLine[]>([]);
  reorderSending = signal(false);
  /** Result of a sent reorder (drives the "email sent" confirmation); null until sent. */
  reorderResult = signal<ReorderResult | null>(null);
  /** The exact values used to finalize — reused verbatim for the reorder preview/send. */
  private reorderValues: any = null;

  /** Only WOs in a still-open status can be completed. */
  get canComplete(): boolean {
    return this.parent === 'wo' && !!this.wo
      && COMPLETABLE_WO_STATUSES.includes((this.wo.status ?? '').toUpperCase());
  }

  /**
   * Mirrors the backend's assertDueForCompletion: a PM WO can't be completed before its Target Start (date-only;
   * unset/unparseable = allowed). Blocks the whole Complete tab so no one fills a form only to be rejected at
   * submit. The server block remains the source of truth.
   */
  get tooEarly(): boolean {
    const ts = this.wo?.targetStart;
    if (this.parent !== 'wo' || !ts) return false;
    const d = new Date(ts);
    if (isNaN(d.getTime())) return false;
    const target = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return target > today;
  }
  get notDueMsg(): string {
    const ts = this.wo?.targetStart;
    const d = ts ? new Date(ts) : null;
    const when = d && !isNaN(d.getTime()) ? d.toLocaleDateString() : 'its scheduled date';
    return `This PM isn't due yet — it's scheduled for ${when} and can't be completed before its period.`;
  }

  /** Only SRs in an open status can be edited (description / notes / attachments). */
  get canEditSr(): boolean {
    return this.parent === 'sr' && !!this.sr
      && EDITABLE_SR_STATUSES.includes((this.sr.status ?? '').toUpperCase());
  }

  get title(): string {
    if (this.parent === 'sr' && this.sr) return `SR ${this.sr.ticketid}`;
    if (this.parent === 'wo' && this.wo) return `WO ${this.wo.wonum}`;
    return 'Details';
  }

  get description(): string {
    return (this.parent === 'sr' ? this.sr?.description : this.wo?.description) ?? '';
  }

  get longDescription(): string {
    return (this.parent === 'sr' ? this.sr?.longDescription : this.wo?.longDescription) ?? '';
  }

  get href(): string {
    return (this.parent === 'sr' ? this.sr?.href : this.wo?.href) ?? '';
  }

  /** Field/value pairs to render in the Details tab. */
  get detailFields(): Array<[string, string | undefined]> {
    if (this.parent === 'sr' && this.sr) {
      const s = this.sr;
      return [
        ['Ticket', s.ticketid],
        ['Status', s.status],
        ['Site', s.siteid],
        ['Asset', s.assetnum],
        ['Location', s.location],
        ['Reported', s.reportdate],
        ['Reported by', s.reportedby],
        ['Affected', s.affectedperson],
        ['Priority', s.priority],
        ['Class', s.classstructureid]
      ];
    }
    if (this.parent === 'wo' && this.wo) {
      const w = this.wo;
      return [
        ['WO #', w.wonum],
        ['Status', w.status],
        ['Type', w.worktype],
        ['Site', w.siteid],
        ['Asset', w.assetnum],
        ['Location', w.location],
        ['Reported', w.reportdate],
        ['Target start', w.targetStart],
        ['Sched start', w.schedstart],
        ['Sched finish', w.schedfinish],
        ['Lead', w.leadCraft],
        ['Supervisor', w.supervisor],
        ['Priority', w.priority]
      ];
    }
    return [];
  }

  async setTab(t: Tab) {
    this.tab.set(t);
    this.error.set(null);
    if (t === 'notes' && !this.notesLoaded()) await this.loadNotes();
    if (t === 'complete') {
      if (!this.formResolved()) await this.resolveCompletionForm();
      // Only the manual (no-form) path needs the labor dropdown / signed-in-user default.
      if (!this.completionForm() && !this.profileLoaded) await this.prefillLaborcode();
    }
    if (t === 'materials' && !this.materialsLoaded()) await this.loadMaterials();
    if (t === 'tasks' && !this.tasksLoaded()) await this.loadTasks();
    if (t === 'history' && !this.historyLoaded()) await this.loadHistory();
  }

  /** Previously-completed WOs for this WO's PM (by pmnum), newest first. */
  historyRows = signal<MaximoWorkOrder[]>([]);
  historyLoaded = signal(false);
  async loadHistory() {
    const pmnum = this.wo?.pmnum?.trim();
    if (!pmnum) { this.historyRows.set([]); this.historyLoaded.set(true); return; }
    this.loading.set(true);
    try {
      this.historyRows.set(await firstValueFrom(this.formApi.getPmCompletedHistory(pmnum)));
      this.historyLoaded.set(true);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.loading.set(false);
    }
  }

  /** Load this WO's internal tasks (child WOs). Keyed by the parent's wonum. */
  async loadTasks() {
    const wonum = this.wo?.wonum?.trim();
    if (!wonum) { this.tasks.set([]); this.tasksLoaded.set(true); return; }
    this.loading.set(true);
    try {
      this.tasks.set(await firstValueFrom(this.api.listWoTasks(wonum)));
      this.tasksLoaded.set(true);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.loading.set(false);
    }
  }

  /** A task is completable when its own status is still open (same rule as a WO). */
  taskCompletable(task: MaximoWorkOrder): boolean {
    return COMPLETABLE_WO_STATUSES.includes((task.status ?? '').toUpperCase());
  }

  /**
   * Complete a single task by changing its status to COMP (a task is a WO, so it reuses the WO complete
   * endpoint with the task's own href). Refreshes the task list after. Does NOT complete the parent WO —
   * Maximo decides whether finishing the last task advances the parent.
   */
  async completeTask(task: MaximoWorkOrder) {
    if (!task?.href || this.completingTaskHref()) return;
    if (!window.confirm(`Complete task ${task.taskid ?? ''} “${task.description || task.wonum}”?`)) return;
    this.completingTaskHref.set(task.href);
    this.error.set(null);
    try {
      await firstValueFrom(this.api.completeWorkOrder(task.href, { complete: true }));
      // Statuses (and possibly the parent) changed — reload the task list.
      this.tasksLoaded.set(false);
      await this.loadTasks();
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.completingTaskHref.set(null);
    }
  }

  /**
   * Resolve the electronic completion form assigned to this WO's recurring PM (by pmnum, then description).
   * When one is assigned, the Complete tab renders it and completing the WO means filling it out; otherwise
   * the manual labor/log form is shown. Best-effort — on any failure we fall back to the manual UI.
   */
  private async resolveCompletionForm() {
    this.formResolved.set(true);
    if (!this.isWo || !this.wo) return;
    this.resolvingForm.set(true);
    try {
      const list = await firstValueFrom(
        this.formApi.completionFormsForWo(this.wo.pmnum || undefined, this.wo.description || undefined));
      this.availableForms.set(list ?? []);
      if ((list ?? []).length === 1) {
        await this.selectForm(list[0]);   // exactly one → fill it automatically (unchanged UX)
      } else {
        this.completionForm.set(null);    // none → manual; several → the picker is shown until one is chosen
      }
    } catch {
      this.availableForms.set([]);
      this.completionForm.set(null);      // fall back to manual completion
    } finally {
      this.resolvingForm.set(false);
    }
  }

  /** Choose which assigned form to fill (called automatically when only one is assigned), load its fields + prefill. */
  async selectForm(t: MaximoFormTemplate) {
    this.completionForm.set(t);
    this.formFinalized.set(false);
    this.formSubmission.set(null);
    const defs = this.parseFields(t.fieldsJson);
    this.formDefs.set(defs);
    this.formFields.set(this.toSmartFields(defs));
    let values: any = {};
    const wonum = this.wo?.wonum?.trim();
    if (wonum) {
      try {
        const subs = await firstValueFrom(this.formApi.submissionsForWo(wonum));
        const match = subs.find(s => s.templateFormKey === t.formKey) ?? null;
        this.formSubmission.set(match);
        if (match?.valuesJson) values = this.parseValues(match.valuesJson);
        if (match?.status === 'COMPLETED') this.formFinalized.set(true);
        // Only collapse the whole tab if the WO itself is already terminal.
        if (this.isCompletedStatus(this.wo?.status)) this.completeDone.set(true);
        // Inventory forms carry their settings + target levels forward from the last run (any WO); the in-stock
        // counts are cleared so they're re-counted. Scoped to inventory forms (have __instock fields).
        if (!match && defs.some(d => (d.name ?? '').endsWith('__instock'))) {
          try {
            const latest = await firstValueFrom(this.formApi.latestSubmissionForForm(t.formKey));
            if (latest?.valuesJson) {
              const carried = this.parseValues(latest.valuesJson) ?? {};
              for (const k of Object.keys(carried)) if (k.endsWith('__instock')) delete carried[k];
              values = carried;
            }
          } catch { /* carry-forward is best-effort */ }
        }
      } catch { /* prefill is best-effort */ }
    }
    this.formValues.set(values);
  }

  /** Back to the form picker (only when several forms are assigned) to choose a different one. */
  backToFormPicker() {
    this.completionForm.set(null);
    this.formFinalized.set(false);
    this.formSubmission.set(null);
    this.formValues.set({});
    this.liveFormValues.set({});
  }

  async loadMaterials() {
    if (!this.wo?.href) return;
    this.loading.set(true);
    try {
      const rows = await firstValueFrom(this.api.listWoMaterials(this.wo.href));
      this.materials.set(rows);
      // default each issue row's return qty to the amount issued (absolute)
      for (const r of rows) {
        if (r.issuetype === 'ISSUE') this.returnQty[r.matusetransid] = Math.abs(r.quantity);
      }
      this.materialsLoaded.set(true);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.loading.set(false);
    }
  }

  /** Net quantity still out for an item (issued minus returned) — drives whether a return is offered. */
  netOut(itemnum: string): number {
    return this.materials()
      .filter(m => m.itemnum === itemnum)
      .reduce((sum, m) => sum - m.quantity, 0); // issue qty is negative, so -(neg) adds; return positive subtracts
  }

  async returnLine(row: MaximoMaterialTxn) {
    if (!this.wo?.href || this.returningId() != null) return;
    const qty = this.returnQty[row.matusetransid];
    if (!qty || qty <= 0) { this.error.set('Enter a return quantity greater than 0.'); return; }
    this.returningId.set(row.matusetransid);
    this.error.set(null);
    try {
      const rows = await firstValueFrom(this.api.returnMaterial(this.wo.href, {
        // Return to the SAME storeroom the material was issued from (row.storeloc), not the default warehouse.
        lines: [{ itemnum: row.itemnum, quantity: qty, storeroom: row.storeloc }]
      }));
      this.materials.set(rows);
      for (const r of rows) {
        if (r.issuetype === 'ISSUE') this.returnQty[r.matusetransid] = Math.abs(r.quantity);
      }
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.returningId.set(null);
    }
  }

  // ── Add part (issue) ──────────────────────────────────────────────────────
  onMItemQueryChange() {
    if (this.mItemTimer) clearTimeout(this.mItemTimer);
    const q = this.mItemQuery.trim();
    if (q.length < 2) { this.mItemResults.set([]); return; }
    this.mItemTimer = setTimeout(() => this.searchIssueItems(), 300);
  }

  async searchIssueItems() {
    this.mItemSearching.set(true);
    this.error.set(null);
    try {
      this.mItemResults.set(await firstValueFrom(this.api.searchInventory(this.mItemQuery.trim())));
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.mItemSearching.set(false);
    }
  }

  /** OBSOLETE inventory at a storeroom can't be issued — the Issue button is hidden for those lines. */
  isObsolete(status?: string): boolean {
    return (status ?? '').toUpperCase() === 'OBSOLETE';
  }

  async issueItem(item: MaximoInventoryItem, qty: number) {
    if (!this.wo?.href || this.issuingItem() != null) return;
    if (!qty || qty <= 0) { this.error.set('Enter a quantity greater than 0.'); return; }
    if (this.mItemTimer) { clearTimeout(this.mItemTimer); this.mItemTimer = null; }
    this.issuingItem.set(item.itemnum);
    this.error.set(null);
    try {
      const rows = await firstValueFrom(this.api.issueMaterial(this.wo.href, {
        lines: [{ itemnum: item.itemnum, quantity: qty, storeroom: item.storeroom }]
      }));
      this.materials.set(rows);
      for (const r of rows) {
        if (r.issuetype === 'ISSUE') this.returnQty[r.matusetransid] = Math.abs(r.quantity);
      }
      // clear the search after a successful issue
      this.mItemQuery = '';
      this.mItemResults.set([]);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.issuingItem.set(null);
    }
  }

  /** Load the people dropdown and default the labor code to the signed-in user's personid. */
  private async prefillLaborcode() {
    this.profileLoaded = true;
    try {
      const [people, profile] = await Promise.all([
        firstValueFrom(this.api.getLaborPeople()),
        firstValueFrom(this.auth.getProfile())
      ]);
      this.laborPeople.set(people);
      const me = profile?.maximoPersonid ?? '';
      // Default to the signed-in user if they're in the list, else leave on the blank option.
      if (!this.cLaborcode && me && people.some(p => p.personid === me)) this.cLaborcode = me;
    } catch {
      // Non-fatal: dropdown just stays empty; the server defaults a blank code to the current user.
    }
  }

  async submitComplete() {
    if (!this.wo?.href || this.completing()) return;
    if (this.tooEarly) { this.error.set(this.notDueMsg); return; }
    this.completing.set(true);
    this.error.set(null);
    try {
      const labor = (this.cLaborcode.trim() || this.cHours != null)
        ? [{ laborcode: this.cLaborcode.trim() || undefined, regularhrs: this.cHours ?? undefined }]
        : [];
      const updated = await firstValueFrom(this.api.completeWorkOrder(this.wo.href, {
        labor,
        summary: this.cSummary.trim() || undefined,
        details: this.cDetails.trim() || undefined,
        complete: true
      }));
      if (updated) {
        this.wo = updated;
        this.completed.emit(updated);
      }
      this.completeSummary.set(`Work order completed. Status is now ${this.wo?.status ?? ''}.`);
      this.completeDone.set(true);
      // Worklog changed — force a reload next time the Notes tab is opened.
      this.notesLoaded.set(false);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.completing.set(false);
    }
  }

  /**
   * Button B for the form-assigned flow: close the WO in Maximo (status → COMP) AFTER its completion
   * form has been finalized + attached (Button A). Guarded so it can't run before the form is finalized;
   * idempotent against an already-terminal WO. Reuses the same WO-complete endpoint as the manual path
   * (labor already flowed in via the form's laborhours write-back, so this only advances the status).
   */
  async completeWoAfterForm() {
    if (!this.wo?.href || this.completing()) return;
    if (this.tooEarly) { this.error.set(this.notDueMsg); return; }
    if (this.isCompletedStatus(this.wo.status)) { this.completeDone.set(true); return; }
    if (!this.formFinalized()) { this.error.set('Finalize & attach the form first, then complete the work order.'); return; }
    this.completing.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.completeWorkOrder(this.wo.href, {
        summary: `Completed via ${this.completionForm()?.formName ?? 'form'}`,
        complete: true
      }));
      if (updated) {
        this.wo = updated;
        this.completed.emit(updated);
      }
      this.completeSummary.set(`Work order completed. Status is now ${this.wo?.status ?? ''}.`);
      this.completeDone.set(true);
      this.notesLoaded.set(false);   // worklog changed — reload on next Notes open
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.completing.set(false);
    }
  }

  /**
   * Complete the WO by submitting its assigned electronic form: renders the PDF, attaches it to the WO,
   * writes worklog/labor/reading write-backs, and advances the WO status server-side (idempotent). Then
   * re-fetches the WO header so the dialog reflects the new status and the parent list refreshes.
   */
  async submitCompleteForm() {
    const t = this.completionForm();
    if (!t || !this.wo || this.completing()) return;
    if (this.tooEarly) { this.error.set(this.notDueMsg); return; }
    const wonum = this.wo.wonum?.trim();
    if (!wonum) { this.error.set('This work order has no number — cannot attach the form.'); return; }
    if (this.formSubmission()?.status === 'COMPLETED') { this.completeDone.set(true); return; }
    // Read the LIVE form value — SmartForm's change output is debounced (1s), so a stale value could miss the
    // operator's last edit. SmartForm doesn't wire validators onto its controls, so enforce required here.
    const live = this.smartForm?.getCurrentFormValues() ?? {};
    const values = { ...(this.formValues() ?? {}), ...(live ?? {}) };
    const missing = this.missingRequiredLabels(values);
    if (missing.length) {
      this.smartForm?.form?.markAllAsTouched();
      this.error.set(`Please fill required field(s): ${missing.join(', ')}.`);
      return;
    }
    if (!window.confirm(`Attach the completed “${t.formName}” PDF to WO ${wonum} and complete it in Maximo?`)) return;

    this.completing.set(true);
    this.error.set(null);
    try {
      const dto: MaximoFormSubmission = {
        templateFormKey: t.formKey,
        templateName: t.formName,
        wonum,
        pmnum: this.wo.pmnum || undefined,
        woHref: this.wo.href || undefined,
        valuesJson: JSON.stringify(values ?? {}),
      };
      const saved = await firstValueFrom(this.formApi.complete(dto));
      this.formSubmission.set(saved);
      // Completion advanced the WO status server-side — refresh the header so the dialog + parent reflect it.
      let updated: MaximoWorkOrder | null = null;
      if (this.wo.href) {
        try { updated = await firstValueFrom(this.api.getWorkOrder(this.wo.href)); } catch { /* keep stale header */ }
      }
      if (updated) this.wo = updated;
      this.completed.emit(this.wo);
      const st = this.wo?.status ?? '';
      // The form only closes the WO if its template sets completeWoStatus; otherwise it's attach-only.
      this.formFinalized.set(true);
      // Inventory forms: after the PDF is attached, surface any reagents below target as a reorder offer
      // (before the WO is closed). No-op / empty for non-inventory forms.
      this.reorderValues = values;
      this.reorderResult.set(null);
      await this.checkReorder();
      if (this.isCompletedStatus(st)) {
        // Template set completeWoStatus → the WO already closed; finish the tab in one step.
        this.completeSummary.set(`Work order completed. Status is now ${st}.`);
        this.completeDone.set(true);
      } else {
        // Attach-only form: the PDF is on the WO but it is still open. Leave the tab open so the
        // "Complete Work Order" button (Button B) can change the status to COMP.
        this.completeSummary.set(`Form finalized and attached to WO ${wonum} (status ${st}). Click "Complete Work Order" to close it in Maximo.`);
      }
      this.notesLoaded.set(false);   // worklog changed — reload on next Notes open
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.completing.set(false);
    }
  }

  /**
   * After an inventory form is finalized, ask the server which reagents are below target (the reorder
   * offer). Empty for non-inventory forms — the reorder panel then never shows. Best-effort.
   */
  private async checkReorder() {
    const t = this.completionForm();
    if (!t || !this.reorderValues) { this.reorderLines.set([]); return; }
    try {
      this.reorderLines.set(await firstValueFrom(this.formApi.reorderPreview(this.reorderDto(t))));
    } catch {
      this.reorderLines.set([]);   // never block the completion flow on the reorder preview
    }
  }

  /**
   * Send the vendor reorder email (uses the settings entered on the form) and attach the order summary to
   * the WO. Outward-facing — confirmed first. On success the offer is cleared and a confirmation shown.
   */
  async sendReorder() {
    const t = this.completionForm();
    if (!t || this.reorderSending() || !this.reorderValues) return;
    const n = this.reorderLines().length;
    if (!n) return;
    if (!window.confirm(`Send the reorder email for ${n} item(s) to the vendor now?`)) return;
    this.reorderSending.set(true);
    this.error.set(null);
    try {
      const result = await firstValueFrom(this.formApi.reorderSend(this.reorderDto(t)));
      this.reorderResult.set(result);
      if (result?.sent) {
        this.reorderLines.set([]);     // offer fulfilled
        this.notesLoaded.set(false);   // a worklog/doclink may have changed
      } else if (result?.message) {
        this.error.set(result.message);
      }
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.reorderSending.set(false);
    }
  }

  private reorderDto(t: MaximoFormTemplate): MaximoFormSubmission {
    return {
      templateFormKey: t.formKey,
      templateName: t.formName,
      wonum: this.wo?.wonum?.trim() ?? '',
      pmnum: this.wo?.pmnum || undefined,
      woHref: this.wo?.href || undefined,
      valuesJson: JSON.stringify(this.reorderValues ?? {}),
    };
  }

  // ── Completion-form mapping (mirrors the standalone fill page) ────────────
  /** Map a data-driven field def onto a SmartFormComponent FormField. */
  private toSmartFields(defs: MaximoFormFieldDef[]): FormField[] {
    return defs.map(d => {
      const opts = (d.options ?? []).map(o => ({ value: o, label: o }));
      const label = d.type === 'number' && d.unit ? `${d.label} (${d.unit})` : d.label;
      const base: any = { name: d.name, label, validators: d.required ? [Validators.required] : [] };
      if (d.section) base.group = { label: d.section };
      switch (d.type) {
        case 'select': return { ...base, type: 'select', options: opts };
        case 'radio-group': return { ...base, type: 'radio-group', options: opts };
        case 'checkbox-group': return { ...base, type: 'checkbox-group', options: opts };
        case 'checkbox': return { ...base, type: 'checkbox' };
        case 'image': return { ...base, type: 'image', imageSrc: d.imageSrc };   // read-only reference photo
        default: return { ...base, type: d.type };   // text / textarea / number / date → app-form-input
      }
    });
  }

  /** True when a WO status means the WO is closed/completed (terminal) — vs. still open. */
  private isCompletedStatus(status?: string): boolean {
    return ['COMP', 'CLOSE'].includes((status ?? '').toUpperCase());
  }

  private parseFields(json?: string): MaximoFormFieldDef[] {
    if (!json) return [];
    try { const a = JSON.parse(json); return Array.isArray(a) ? a : []; } catch { return []; }
  }
  private parseValues(json?: string): any {
    if (!json) return {};
    try { return JSON.parse(json) ?? {}; } catch { return {}; }
  }

  /** Labels of required, still-empty fields in the merged values (image fields are display-only, skipped). */
  private missingRequiredLabels(values: any): string[] {
    const out: string[] = [];
    for (const d of this.formDefs()) {
      if (!d.required || d.type === 'image') continue;
      const v = values?.[d.name];
      const empty = v == null || v === '' || v === false || (Array.isArray(v) && v.length === 0);
      if (empty) out.push(d.label || d.name);
    }
    return out;
  }

  async loadNotes() {
    if (!this.href) return;
    this.loading.set(true);
    try {
      this.notes.set(await firstValueFrom(this.api.listWorklog(this.parent, this.href)));
      this.notesLoaded.set(true);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.loading.set(false);
    }
  }

  async addNote() {
    // WO (any status) or an editable SR. Branch on parent — the SR href lives on this.sr.
    const href = this.isWo ? this.wo?.href : this.sr?.href;
    if (!href || this.addingNote()) return;
    if (!this.noteSummary.trim()) { this.error.set('Enter a note summary.'); return; }
    this.addingNote.set(true);
    this.error.set(null);
    try {
      const body = { summary: this.noteSummary.trim(), details: this.noteDetails.trim() || undefined };
      const rows = await firstValueFrom(
        this.isWo ? this.api.addWoWorklog(href, body) : this.api.addSrWorklog(href, body));
      this.notes.set(rows);
      this.notesLoaded.set(true);
      this.noteSummary = '';
      this.noteDetails = '';
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.addingNote.set(false);
    }
  }

  /** Begin editing the SR (seeds all inputs from the current SR). */
  startEditSr() {
    if (!this.sr) return;
    this.editDescription = this.sr.description ?? '';
    this.editLongDescription = this.sr.longDescription ?? '';
    this.editPriority = this.sr.priority ?? '';
    this.editReportedby = this.sr.reportedby ?? '';
    this.editAffectedperson = this.sr.affectedperson ?? '';
    this.editClassstructureid = this.sr.classstructureid ?? '';
    this.editAssetnum = this.sr.assetnum ?? '';
    this.editLocation = this.sr.location ?? '';
    this.editingSr.set(true);
    this.error.set(null);
  }

  cancelEditSr() { this.editingSr.set(false); }

  /** When an asset is picked in the edit form, auto-fill the location (Maximo derives it from the asset). */
  onEditAssetPicked(a: MaximoAsset) {
    if (a?.location) this.editLocation = a.location;
  }

  /**
   * SR-edit tree pick. An equipment node sets the asset + its location; a LOCATION node updates only the
   * location and KEEPS any existing asset. Rationale: the SR update path skips blank values (adapter
   * putIfPresent), so an asset cannot be cleared via edit — blanking it here would be a silent no-op and
   * leave the SR aimed at a stale asset. Keeping it makes the UI reflect what will actually persist.
   */
  onSrTreeSelect(sel: { assetnum: string; location: string }) {
    if (sel.assetnum) this.editAssetnum = sel.assetnum;
    this.editLocation = sel.location;
  }

  /** Save the SR fields (blank = leave unchanged); on success swap in the refreshed record. */
  async saveSr() {
    if (!this.sr?.href || this.savingSr()) return;
    this.savingSr.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.updateServiceRequest(this.sr.href, {
        description: this.editDescription.trim(),
        longDescription: this.editLongDescription.trim(),
        priority: this.editPriority.trim(),
        reportedby: this.editReportedby.trim(),
        affectedperson: this.editAffectedperson.trim(),
        classstructureid: this.editClassstructureid.trim(),
        assetnum: this.editAssetnum.trim(),
        location: this.editLocation.trim(),
      }));
      if (updated) this.sr = updated;
      this.editingSr.set(false);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.savingSr.set(false);
    }
  }

  /** On open, resolve the WO's GenSuit setting (by pmnum) so the Details tab can offer the GS copy button. */
  async ngOnInit() {
    if (this.parent === 'wo' && this.wo?.pmnum) {
      try {
        this.genSuit.set(await firstValueFrom(this.pmApi.getGenSuitForWo(this.wo.pmnum)));
      } catch { /* GenSuit is optional — leave null */ }
    }
  }

  // ── Transfer lead (WO only) ───────────────────────────────────────────────
  /** yyyy-MM-dd the schedule peek is centered on: the WO's target/sched start, else today (guidance only). */
  get transferPeekDate(): string {
    const t = (this.wo?.targetStart || this.wo?.schedstart || '').substring(0, 10);
    if (t && t.length >= 10) return t;
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  startTransferLead() {
    this.transferPersonid = '';
    this.showTransferLead.set(true);
    this.error.set(null);
  }
  cancelTransferLead() { this.showTransferLead.set(false); }

  /** A schedule-peek click sets the chosen personid (any person is allowed). */
  onPeekPick(personid: string) {
    if (personid) this.transferPersonid = personid;
  }

  /** Transfer the WO's lead (writes spi:lead; no status change), then swap in the refreshed WO + notify the parent. */
  async submitTransferLead() {
    if (!this.wo?.href || this.transferring()) return;
    const pid = this.transferPersonid.trim();
    if (!pid) { this.error.set('Choose a person to transfer the lead to.'); return; }
    if (!window.confirm(`Transfer the lead of WO ${this.wo.wonum} to ${pid.toUpperCase()}?`)) return;
    this.transferring.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.transferLead(this.wo.href, pid));
      if (updated) {
        this.wo = updated;
        this.completed.emit(updated);   // parents wire (completed) → refresh their list
      }
      this.showTransferLead.set(false);
      this.transferPersonid = '';
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.transferring.set(false);
    }
  }

  // ── Reschedule (Target Start / Finish) ──────────────────────────────────
  showReschedule = signal(false);
  rescheduleStart = '';    // yyyy-MM-dd
  rescheduleFinish = '';   // yyyy-MM-dd
  rescheduling = signal(false);

  startReschedule() {
    this.rescheduleStart = (this.wo?.targetStart || '').substring(0, 10);
    this.rescheduleFinish = (this.wo?.targetFinish || '').substring(0, 10);
    this.showReschedule.set(true);
    this.error.set(null);
  }
  cancelReschedule() { this.showReschedule.set(false); }

  /** Set Target Start (+ optional Finish) on the WO in one MERGE, then swap in the refreshed WO + notify the parent. */
  async submitReschedule() {
    if (!this.wo?.href || this.rescheduling()) return;
    const start = (this.rescheduleStart || '').trim();
    if (!start) { this.error.set('Pick a target start date.'); return; }
    const finish = (this.rescheduleFinish || '').trim();
    if (finish && finish < start) { this.error.set('Target finish cannot be before target start.'); return; }
    this.rescheduling.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.setTargetDates(this.wo.href, start, finish || undefined));
      if (updated) {
        this.wo = updated;
        this.completed.emit(updated);   // parents wire (completed) → refresh their list
      }
      this.showReschedule.set(false);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.rescheduling.set(false);
    }
  }

  // ── GenSuit confirmation copy (Details tab, WO only) ──────────────────────
  async copyGenSuit() {
    const gs = this.genSuit();
    if (!gs?.enabled || !this.wo) return;
    const text = fillGenSuit(gs.phrase, this.wo.wonum, this.wo.description);
    if (!text) return;
    const ok = await copyToOsClipboard(text);
    if (ok) { this.genSuitCopied.set(true); setTimeout(() => this.genSuitCopied.set(false), 2000); }
  }

  close() { this.closed.emit(); }

  onBackdropClick(ev: MouseEvent) {
    if ((ev.target as HTMLElement).classList.contains('mx-backdrop')) this.close();
  }

  private errMsg(e: any): string {
    return e?.error?.message ?? e?.message ?? String(e);
  }
}
