import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { MaximoApiService } from '../../../services/maximo/maximo-api.service';
import { MaximoAttachmentParent, MaximoDoclink } from '../../../models/maximo/maximo.models';

/**
 * Shared Maximo attachments panel: lists a ticket/asset's attachments, uploads (when {@link canUpload}),
 * and previews inline — image/PDF straight from the auth-cookie proxy, docx/xlsx converted client-side
 * (mammoth / SheetJS, lazy-loaded). Used by the WO/SR detail dialog and the Assets page so the preview
 * lives in one place. Loads whenever {@link href} changes.
 */
@Component({
  selector: 'app-maximo-attachments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="upload-row" *ngIf="canUpload">
      <label>Doctype <input [(ngModel)]="uploadDoctype" /></label>
      <label class="file-btn">
        Upload file
        <input type="file" (change)="onUpload($event)" [disabled]="uploading()" hidden />
      </label>
      <span *ngIf="uploading()" class="muted">Uploading…</span>
    </div>
    <div class="muted" *ngIf="loading()">Loading…</div>
    <div class="error" *ngIf="error()">{{ error() }}</div>
    <table>
      <thead>
        <tr><th>File</th><th>Title</th><th>Type</th><th>Size</th><th>Created</th><th>By</th><th></th></tr>
      </thead>
      <tbody>
        <ng-container *ngFor="let d of attachments()">
          <tr [class.expanded]="isPreviewOpen(d)">
            <td>{{ d.urlname || d.title || d.document }}</td>
            <td>{{ d.title }}</td>
            <td>{{ d.mimeType || d.doctype }}</td>
            <td>{{ fmtSize(d.size) }}</td>
            <td>{{ d.createdDate }}</td>
            <td>{{ d.createby }}</td>
            <td class="att-actions">
              <button class="link" *ngIf="canPreview(d)" (click)="togglePreview(d)">{{ isPreviewOpen(d) ? 'hide' : 'preview' }}</button>
              <a [href]="downloadUrl(d)" target="_blank" rel="noopener">open</a>
            </td>
          </tr>
          <tr class="att-preview-row" *ngIf="isPreviewOpen(d)">
            <td colspan="7">
              <div class="att-preview">
                <div *ngIf="previewLoading()" class="muted">Loading preview…</div>
                <div *ngIf="previewError()" class="error">{{ previewError() }}</div>
                <img *ngIf="attType(d) === 'image'" [src]="downloadUrl(d)" class="att-img" alt="" />
                <iframe *ngIf="attType(d) === 'pdf' && pdfUrl()" [src]="pdfUrl()" class="att-frame"></iframe>
                <div *ngIf="(attType(d) === 'docx' || attType(d) === 'excel') && officeHtml()"
                     class="att-office" [innerHTML]="officeHtml()"></div>
              </div>
            </td>
          </tr>
        </ng-container>
        <tr *ngIf="!loading() && attachments().length === 0">
          <td colspan="7" class="muted">No attachments.</td>
        </tr>
      </tbody>
    </table>
  `,
  styles: [`
    :host { display: block; color: #e6e6e6; }
    .muted { color: #777; } .error { color: #ff7b72; }
    .upload-row { display: flex; gap: 12px; align-items: center; margin-bottom: 10px; }
    .upload-row label { color: #aaa; }
    .upload-row input:not([type=file]) { background: #2a2a2a; color: #e6e6e6; border: 1px solid #444; border-radius: 3px; padding: 4px 6px; }
    .file-btn { cursor: pointer; color: #7cc6ff; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #2a2a2a; font-size: 13px; }
    th { color: #7cc6ff; font-weight: 500; }
    a { color: #7cc6ff; } .link { background: none; border: 0; color: #7cc6ff; cursor: pointer; font: inherit; padding: 0; }
    .link:hover { text-decoration: underline; }
    .att-actions { white-space: nowrap; display: flex; gap: 10px; align-items: center; }
    .att-preview-row > td { background: #161616; padding: 10px; }
    .att-preview { max-height: 60vh; overflow: auto; }
    .att-img { max-width: 100%; height: auto; border: 1px solid #333; border-radius: 3px; }
    .att-frame { width: 100%; height: 60vh; border: 1px solid #333; border-radius: 3px; background: #fff; }
    .att-office { background: #fff; color: #111; padding: 12px; border-radius: 3px; font-size: 13px; overflow: auto; }
    .att-office table { border-collapse: collapse; }
    .att-office td, .att-office th { border: 1px solid #ccc; padding: 2px 6px; color: #111; }
    .att-office .sheet-name { margin: 8px 0 4px; color: #0e639c; }
  `]
})
export class MaximoAttachmentsComponent implements OnChanges {
  private api = inject(MaximoApiService);
  private sanitizer = inject(DomSanitizer);

  @Input({ required: true }) parent!: MaximoAttachmentParent;
  @Input({ required: true }) href!: string;
  @Input() canUpload = false;

  attachments = signal<MaximoDoclink[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  uploadDoctype = 'Attachments';
  uploading = signal(false);

  previewHref = signal<string | null>(null);
  previewLoading = signal(false);
  previewError = signal<string | null>(null);
  officeHtml = signal<SafeHtml | null>(null);
  pdfUrl = signal<SafeResourceUrl | null>(null);

  private loadedFor = '';

  ngOnChanges(_c: SimpleChanges) {
    if (this.href && this.parent && this.loadedFor !== this.href) this.load();
  }

  async load() {
    if (!this.href) return;
    this.loadedFor = this.href;
    this.loading.set(true); this.error.set(null); this.closePreview();
    try { this.attachments.set(await firstValueFrom(this.api.listAttachments(this.parent, this.href))); }
    catch (e: any) { this.error.set(this.errMsg(e)); }
    finally { this.loading.set(false); }
  }

  async onUpload(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.href) return;
    this.uploading.set(true); this.error.set(null);
    try {
      const created = await firstValueFrom(this.api.uploadAttachment(this.parent, this.href, file, this.uploadDoctype || undefined));
      this.attachments.update(list => [created, ...list]);
    } catch (e: any) { this.error.set(this.errMsg(e)); }
    finally { this.uploading.set(false); input.value = ''; }
  }

  downloadUrl(d: MaximoDoclink): string {
    if (d.urltype === 'WEB' && d.url) return d.url;
    return `${environment.baseApiUrl}/ng/maximo/${this.parent}/${encodeURIComponent(this.href)}/attachments/${encodeURIComponent(d.href)}/content`;
  }

  attType(d: MaximoDoclink): 'image' | 'pdf' | 'docx' | 'excel' | 'other' {
    if (d.urltype === 'WEB') return 'other';
    const name = (d.urlname || d.title || d.document || '').toLowerCase();
    const mime = (d.mimeType || '').toLowerCase();
    const ext = name.includes('.') ? name.split('.').pop()! : '';
    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) return 'image';
    if (mime.includes('pdf') || ext === 'pdf') return 'pdf';
    if (ext === 'docx' || mime.includes('wordprocessingml')) return 'docx';
    if (['xlsx', 'xls', 'xlsm', 'csv'].includes(ext) || mime.includes('spreadsheetml') || mime.includes('ms-excel')) return 'excel';
    return 'other';
  }

  canPreview(d: MaximoDoclink): boolean { return this.attType(d) !== 'other'; }
  isPreviewOpen(d: MaximoDoclink): boolean { return this.previewHref() === d.href; }

  async togglePreview(d: MaximoDoclink) {
    if (this.previewHref() === d.href) { this.closePreview(); return; }
    this.closePreview();
    this.previewHref.set(d.href);
    const t = this.attType(d);
    if (t === 'pdf') { this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.downloadUrl(d))); return; }
    if (t === 'image') return;
    if (t === 'docx' || t === 'excel') {
      this.previewLoading.set(true);
      try {
        const buf = await firstValueFrom(this.api.getAttachmentContent(this.parent, this.href, d.href));
        const html = t === 'docx' ? await this.docxToHtml(buf) : await this.excelToHtml(buf);
        this.officeHtml.set(this.sanitizer.bypassSecurityTrustHtml(html));
      } catch (e: any) {
        this.previewError.set('Could not render preview — use Download. ' + this.errMsg(e));
      } finally {
        this.previewLoading.set(false);
      }
    }
  }

  closePreview() {
    this.previewHref.set(null);
    this.officeHtml.set(null);
    this.pdfUrl.set(null);
    this.previewError.set(null);
  }

  fmtSize(bytes: number | null | undefined): string {
    if (bytes == null) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  private async docxToHtml(buf: ArrayBuffer): Promise<string> {
    const mammoth: any = await import('mammoth');
    const lib = mammoth.convertToHtml ? mammoth : mammoth.default;
    const r = await lib.convertToHtml({ arrayBuffer: buf });
    return r.value || '<p class="muted">Empty document.</p>';
  }

  private async excelToHtml(buf: ArrayBuffer): Promise<string> {
    const XLSX: any = await import('xlsx');
    const wb = XLSX.read(new Uint8Array(buf), { type: 'array' });
    return wb.SheetNames
      .map((n: string) => `<h5 class="sheet-name">${n}</h5>` + XLSX.utils.sheet_to_html(wb.Sheets[n]))
      .join('');
  }

  private errMsg(e: any): string { return e?.error?.message ?? e?.message ?? String(e); }
}
