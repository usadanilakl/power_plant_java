import { DatePipe } from '@angular/common';
import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { MaximoApiService } from './maximo-api.service';
import { MaximoDoclink } from './maximo.model';

/**
 * Attachments (Maximo doclinks) for a work order: list existing photos/PDFs/docs, open one to view, and add a
 * new photo/file. Needs a connection — Maximo is the store, so this is online-only (a clear message when it
 * fails). Kept as its own component so the WO sheet's Files tab is a thin `<app-maximo-wo-files>`.
 */
@Component({
  selector: 'app-maximo-wo-files',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (loading()) { <p class="wf-msg">Loading attachments…</p> }
    @else {
      @if (error()) { <p class="wf-err">{{ error() }}</p> }
      @if (files().length === 0 && !error()) { <p class="wf-msg">No attachments yet.</p> }
      <div class="wf-list">
        @for (f of files(); track f.href) {
          <button class="wf-item" [disabled]="opening() === f.href" (click)="open(f)">
            <span class="wf-ic">{{ icon(f) }}</span>
            <span class="wf-info">
              <span class="wf-name">{{ f.title || f.urlname || '(file)' }}</span>
              <span class="wf-meta">{{ f.doctype || 'Attachment' }}@if (f.size) { · {{ size(f.size) }} }@if (f.createdDate) { · {{ f.createdDate | date:'MMM d' }} }</span>
            </span>
            <span class="wf-open">{{ opening() === f.href ? '…' : 'view' }}</span>
          </button>
        }
      </div>
    }

    @if (canUpload) {
      <label class="wf-add" [class.busy]="uploading()">
        {{ uploading() ? 'Uploading…' : '＋ Add photo / file' }}
        <input type="file" accept="image/*,video/*,application/pdf,.doc,.docx,.xls,.xlsx" (change)="pick($event)" [disabled]="uploading()" hidden>
      </label>
      @if (uploadError()) { <p class="wf-err">{{ uploadError() }}</p> }
    }
  `,
  styles: [`
    .wf-msg { text-align: center; color: var(--secondary-text, #888); padding: 1rem; font-size: 0.9rem; }
    .wf-err { color: #e74c3c; font-size: 0.85rem; margin: 0.3rem 0; }
    .wf-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.8rem; }
    .wf-item { display: flex; align-items: center; gap: 0.6rem; width: 100%; text-align: left; padding: 0.6rem 0.7rem;
      border: 1px solid var(--border-color); border-radius: 10px; background: var(--secondary-background); cursor: pointer; font-family: inherit; }
    .wf-item:disabled { opacity: 0.6; }
    .wf-ic { font-size: 1.3rem; }
    .wf-info { display: flex; flex-direction: column; gap: 0.15rem; flex: 1; min-width: 0; }
    .wf-name { font-size: 0.9rem; color: var(--primary-text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wf-meta { font-size: 0.72rem; color: var(--secondary-text, #888); }
    .wf-open { font-size: 0.8rem; font-weight: 700; color: var(--accent-color); }
    .wf-add { display: block; text-align: center; padding: 0.7rem; border: 1px dashed var(--border-color); border-radius: 10px;
      color: var(--accent-color); font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .wf-add.busy { opacity: 0.6; cursor: default; }
  `]
})
export class MaximoWoFilesComponent implements OnInit {
  @Input({ required: true }) href!: string;
  /** Which Maximo record the href points at — routes list/view/upload to the WO or SR endpoints. */
  @Input() parent: 'wo' | 'sr' = 'wo';
  /** When false, viewing still works but the upload control is hidden (e.g. an SR past NEW). */
  @Input() canUpload = true;

  private api = inject(MaximoApiService);

  loading = signal(true);
  files = signal<MaximoDoclink[]>([]);
  error = signal<string | null>(null);
  opening = signal<string | null>(null);
  uploading = signal(false);
  uploadError = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  private load(): void {
    this.loading.set(true); this.error.set(null);
    const list$ = this.parent === 'sr' ? this.api.listSrAttachments(this.href) : this.api.listWoAttachments(this.href);
    list$.subscribe({
      next: f => { this.files.set(f); this.loading.set(false); },
      error: () => { this.error.set('Could not load attachments — check your connection.'); this.loading.set(false); }
    });
  }

  open(f: MaximoDoclink): void {
    if (this.opening()) return;
    this.opening.set(f.href);
    // A blank tab opened synchronously (inside the click) survives the async fetch without a popup block.
    const tab = window.open('', '_blank');
    const bytes$ = this.parent === 'sr' ? this.api.fetchSrAttachment(this.href, f.href) : this.api.fetchWoAttachment(this.href, f.href);
    bytes$.subscribe({
      next: blob => {
        this.opening.set(null);
        const url = URL.createObjectURL(blob);
        if (tab) tab.location.href = url; else window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      },
      error: () => { this.opening.set(null); if (tab) tab.close(); this.error.set('Could not open that attachment.'); }
    });
  }

  pick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploading.set(true); this.uploadError.set(null);
    const up$ = this.parent === 'sr' ? this.api.uploadSrAttachment(this.href, file) : this.api.uploadWoAttachment(this.href, file);
    up$.subscribe({
      next: ok => {
        this.uploading.set(false);
        if (ok) this.load(); else this.uploadError.set('Upload failed — check your connection and try again.');
      },
      error: () => { this.uploading.set(false); this.uploadError.set('Upload failed — check your connection and try again.'); }
    });
  }

  icon(f: MaximoDoclink): string {
    const m = (f.mimeType || '').toLowerCase();
    const n = (f.urlname || f.title || '').toLowerCase();
    if (m.startsWith('image/')) return '🖼️';
    if (m.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm|m4v)$/.test(n)) return '🎬';
    if (m.includes('pdf') || n.endsWith('.pdf')) return '📄';
    if (/\.(xls|xlsx|csv)$/.test(n)) return '📊';
    if (/\.(doc|docx)$/.test(n)) return '📝';
    return '📎';
  }
  size(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
