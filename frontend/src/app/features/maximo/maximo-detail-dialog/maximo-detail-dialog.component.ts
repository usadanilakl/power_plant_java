import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { AuthService } from '../../../services/auth.service';
import {
  MaximoDoclink,
  MaximoInventoryItem,
  MaximoMaterialTxn,
  MaximoServiceRequest,
  MaximoTicketParent,
  MaximoWorkOrder,
  MaximoWorklog
} from '../../../models/maximo/maximo.models';

type Tab = 'details' | 'notes' | 'attachments' | 'complete' | 'materials';

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
  imports: [CommonModule, FormsModule],
  templateUrl: './maximo-detail-dialog.component.html',
  styleUrl: './maximo-detail-dialog.component.css'
})
export class MaximoDetailDialogComponent {
  private api = inject(MaximoApiService);
  private auth = inject(AuthService);

  @Input({ required: true }) parent!: MaximoTicketParent;
  @Input() sr: MaximoServiceRequest | null = null;
  @Input() wo: MaximoWorkOrder | null = null;
  @Output() closed = new EventEmitter<void>();
  /** Emitted after a successful completion so the parent list can refresh the row. */
  @Output() completed = new EventEmitter<MaximoWorkOrder>();

  tab = signal<Tab>('details');
  notes = signal<MaximoWorklog[]>([]);
  attachments = signal<MaximoDoclink[]>([]);
  notesLoaded = signal(false);
  attachmentsLoaded = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  uploadDoctype = 'Attachments';
  uploading = signal(false);

  // Add-note (worklog) form — WO or editable SR; works even on a completed WO.
  noteSummary = '';
  noteDetails = '';
  addingNote = signal(false);

  // Edit an editable SR's description / long description (Details tab).
  editingSr = signal(false);
  savingSr = signal(false);
  editDescription = '';
  editLongDescription = '';

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

  // ── Complete-WO form state ──────────────────────────────────────────────
  cLaborcode = '';
  cHours: number | null = null;
  cSummary = '';
  cDetails = '';
  completing = signal(false);
  completeDone = signal(false);
  laborPeople = signal<{ name: string; personid: string }[]>([]);
  private profileLoaded = false;

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
    if (t === 'attachments' && !this.attachmentsLoaded()) await this.loadAttachments();
    if (t === 'complete' && !this.profileLoaded) await this.prefillLaborcode();
    if (t === 'materials' && !this.materialsLoaded()) await this.loadMaterials();
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
      this.completeDone.set(true);
      // Worklog changed — force a reload next time the Notes tab is opened.
      this.notesLoaded.set(false);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.completing.set(false);
    }
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

  /** Begin editing the SR's description / long description (seeds the inputs from the current SR). */
  startEditSr() {
    if (!this.sr) return;
    this.editDescription = this.sr.description ?? '';
    this.editLongDescription = this.sr.longDescription ?? '';
    this.editingSr.set(true);
    this.error.set(null);
  }

  cancelEditSr() { this.editingSr.set(false); }

  /** Save the SR description / long description; on success swap in the refreshed record. */
  async saveSr() {
    if (!this.sr?.href || this.savingSr()) return;
    this.savingSr.set(true);
    this.error.set(null);
    try {
      const updated = await firstValueFrom(this.api.updateServiceRequest(this.sr.href, {
        description: this.editDescription.trim(),
        longDescription: this.editLongDescription.trim()
      }));
      if (updated) this.sr = updated;
      this.editingSr.set(false);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.savingSr.set(false);
    }
  }

  async loadAttachments() {
    if (!this.href) return;
    this.loading.set(true);
    try {
      this.attachments.set(await firstValueFrom(this.api.listAttachments(this.parent, this.href)));
      this.attachmentsLoaded.set(true);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.loading.set(false);
    }
  }

  async onUpload(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!this.href || !file) return;
    this.uploading.set(true);
    this.error.set(null);
    try {
      const created = await firstValueFrom(
        this.api.uploadAttachment(this.parent, this.href, file, this.uploadDoctype || undefined));
      this.attachments.update(list => [created, ...list]);
    } catch (e: any) {
      this.error.set(this.errMsg(e));
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  /**
   * Build the download URL for a FILE-type doclink that points to our Spring proxy.
   * The proxy adds the apikey header and streams Maximo's binary back, so a target=_blank
   * <a href> works without exposing credentials. WEB-type links keep their direct URL.
   */
  downloadUrl(d: MaximoDoclink): string {
    if (d.urltype === 'WEB' && d.url) return d.url;
    return `${environment.baseApiUrl}/ng/maximo/${this.parent}/${encodeURIComponent(this.href)}/attachments/${encodeURIComponent(d.href)}/content`;
  }

  /** Format byte size as KB / MB / GB. */
  fmtSize(bytes: number | null | undefined): string {
    if (bytes == null) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  close() { this.closed.emit(); }

  onBackdropClick(ev: MouseEvent) {
    if ((ev.target as HTMLElement).classList.contains('mx-backdrop')) this.close();
  }

  private errMsg(e: any): string {
    return e?.error?.message ?? e?.message ?? String(e);
  }
}
