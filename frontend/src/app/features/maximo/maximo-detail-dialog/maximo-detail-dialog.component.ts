import { Component, EventEmitter, Input, Output, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoFormApiService } from '../../../services/maximo/maximo-form-api.service';
import { AuthService } from '../../../services/auth.service';
import { MaximoPersonPickerComponent } from '../maximo-person-picker/maximo-person-picker.component';
import { MaximoAssetPickerComponent } from '../maximo-asset-picker/maximo-asset-picker.component';
import { MaximoLocationPickerComponent } from '../maximo-location-picker/maximo-location-picker.component';
import { MaximoAttachmentsComponent } from '../maximo-attachments/maximo-attachments.component';
import { SmartFormComponent } from '../../../shared/reactive-form/smart-form/smart-form.component';
import { FormField } from '../../../models/ui/form-field.model';
import { MaximoFormFieldDef, MaximoFormSubmission, MaximoFormTemplate } from '../../../models/maximo/maximo-form.models';
import {
  MaximoAsset,
  MaximoInventoryItem,
  MaximoMaterialTxn,
  MaximoServiceRequest,
  MaximoTicketParent,
  MaximoWorkOrder,
  MaximoWorklog
} from '../../../models/maximo/maximo.models';

type Tab = 'details' | 'notes' | 'attachments' | 'complete' | 'materials' | 'tasks';

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
  imports: [CommonModule, FormsModule, MaximoPersonPickerComponent, MaximoAssetPickerComponent, MaximoLocationPickerComponent, MaximoAttachmentsComponent, SmartFormComponent],
  templateUrl: './maximo-detail-dialog.component.html',
  styleUrl: './maximo-detail-dialog.component.css'
})
export class MaximoDetailDialogComponent {
  private api = inject(MaximoApiService);
  private formApi = inject(MaximoFormApiService);
  private auth = inject(AuthService);
  @ViewChild(SmartFormComponent) smartForm?: SmartFormComponent;

  @Input({ required: true }) parent!: MaximoTicketParent;
  @Input() sr: MaximoServiceRequest | null = null;
  @Input() wo: MaximoWorkOrder | null = null;
  @Output() closed = new EventEmitter<void>();
  /** Emitted after a successful completion so the parent list can refresh the row. */
  @Output() completed = new EventEmitter<MaximoWorkOrder>();

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
  /** Human summary shown after a completion — honest about whether the WO actually closed vs. form-only attach. */
  completeSummary = signal('');
  laborPeople = signal<{ name: string; personid: string }[]>([]);
  private profileLoaded = false;

  // ── Electronic completion form (assigned to the WO's recurring PM) ────────
  /** The form assigned to this WO's recurring PM, or null when none — then the manual UI is shown. */
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
  /**
   * True once the assigned form's PDF has been finalized + attached to this WO (Button A). Distinct from
   * completeDone(): attaching the form does NOT close the WO unless the template sets completeWoStatus.
   * Gates Button B ("Complete Work Order") and is rehydrated from an existing COMPLETED submission so a
   * re-opened dialog still offers the close action.
   */
  formFinalized = signal(false);

  /** Only WOs in a still-open status can be completed. */
  get canComplete(): boolean {
    return this.parent === 'wo' && !!this.wo
      && COMPLETABLE_WO_STATUSES.includes((this.wo.status ?? '').toUpperCase());
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
      const t = await firstValueFrom(
        this.formApi.completionFormForWo(this.wo.pmnum || undefined, this.wo.description || undefined));
      this.completionForm.set(t);
      if (t) {
        const defs = this.parseFields(t.fieldsJson);
        this.formDefs.set(defs);
        this.formFields.set(this.toSmartFields(defs));
        // Prefill from an existing submission for this WO + form, if any.
        let values: any = {};
        this.formSubmission.set(null);
        const wonum = this.wo.wonum?.trim();
        if (wonum) {
          try {
            const subs = await firstValueFrom(this.formApi.submissionsForWo(wonum));
            const match = subs.find(s => s.templateFormKey === t.formKey) ?? null;
            this.formSubmission.set(match);
            if (match?.valuesJson) values = this.parseValues(match.valuesJson);
            if (match?.status === 'COMPLETED') this.formFinalized.set(true);
            // Only collapse the whole tab if the WO itself is already terminal.
            if (this.isCompletedStatus(this.wo?.status)) this.completeDone.set(true);
          } catch { /* prefill is best-effort */ }
        }
        this.formValues.set(values);
      }
    } catch {
      this.completionForm.set(null);   // fall back to manual completion
    } finally {
      this.resolvingForm.set(false);
    }
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
        lines: [{ itemnum: row.itemnum, quantity: qty }]
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

  async issueItem(item: MaximoInventoryItem, qty: number) {
    if (!this.wo?.href || this.issuingItem() != null) return;
    if (!qty || qty <= 0) { this.error.set('Enter a quantity greater than 0.'); return; }
    if (this.mItemTimer) { clearTimeout(this.mItemTimer); this.mItemTimer = null; }
    this.issuingItem.set(item.itemnum);
    this.error.set(null);
    try {
      const rows = await firstValueFrom(this.api.issueMaterial(this.wo.href, {
        lines: [{ itemnum: item.itemnum, quantity: qty }]
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

  close() { this.closed.emit(); }

  onBackdropClick(ev: MouseEvent) {
    if ((ev.target as HTMLElement).classList.contains('mx-backdrop')) this.close();
  }

  private errMsg(e: any): string {
    return e?.error?.message ?? e?.message ?? String(e);
  }
}
