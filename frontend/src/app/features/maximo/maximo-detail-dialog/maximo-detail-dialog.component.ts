import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import {
  MaximoDoclink,
  MaximoServiceRequest,
  MaximoTicketParent,
  MaximoWorkOrder,
  MaximoWorklog
} from '../../../models/maximo/maximo.models';

type Tab = 'details' | 'notes' | 'attachments';

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

  @Input({ required: true }) parent!: MaximoTicketParent;
  @Input() sr: MaximoServiceRequest | null = null;
  @Input() wo: MaximoWorkOrder | null = null;
  @Output() closed = new EventEmitter<void>();

  tab = signal<Tab>('details');
  notes = signal<MaximoWorklog[]>([]);
  attachments = signal<MaximoDoclink[]>([]);
  notesLoaded = signal(false);
  attachmentsLoaded = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  uploadDoctype = 'Attachments';
  uploading = signal(false);

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
