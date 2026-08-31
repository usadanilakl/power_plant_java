import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { RfFileApiService, ReattachResult } from '../services/rf-file-api.service';
import { FileDto } from '../../../../models/file/file.model';
import { GlobalMessageService } from '../../../../shared/global-message/global-message.service';

/**
 * Restore-missing-bytes dialog. Given ANY member of a split-page group
 * (fileNumber ending in `_page_N`), pre-populates the list of every sibling
 * in that group ordered by page index. User picks a source PDF (or drags one
 * in), confirms the count matches, and the backend writes each split page's
 * bytes to the corresponding EXISTING entity — no new FileObjects created,
 * so LOTO points / coordinates / permits attached to those IDs stay intact.
 *
 * Data contract: { fileId: number } passed in via MAT_DIALOG_DATA. The
 * component fetches the sibling list from the backend; caller doesn't have
 * to pre-compute it.
 */
@Component({
  selector: 'app-rf-file-reattach-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="reattach-header">
      <h2 class="reattach-title">Restore Missing Files — Re-attach Source PDF</h2>
      <button class="reattach-close" (click)="cancel()" aria-label="Close">&times;</button>
    </div>

    <div class="reattach-body">
      @if (loading()) {
        <p class="reattach-loading">Loading split-page siblings…</p>
      } @else if (loadError()) {
        <p class="reattach-error">{{ loadError() }}</p>
      } @else {
        <p class="reattach-intro">
          These <strong>{{ siblings().length }}</strong> file entries share a split-page
          group. Pick a source PDF with <strong>exactly {{ siblings().length }} pages</strong>
          and its pages will be written to each entity below. No entities are created
          or deleted — LOTO points, coordinates, and other relationships stay attached
          to these IDs.
        </p>

        <div class="reattach-targets">
          <div class="reattach-target-header">
            <span>Page</span>
            <span>File #</span>
            <span>Name</span>
          </div>
          @for (t of siblings(); track t.id) {
            <div class="reattach-target-row">
              <span class="reattach-page">{{ pageOf(t) }}</span>
              <span class="reattach-fn">{{ (t.fileNumber || []).join(', ') }}</span>
              <span class="reattach-name">{{ t.name || '—' }}</span>
            </div>
          }
        </div>

        <div class="reattach-picker">
          <label>
            <span class="reattach-picker-label">Source PDF:</span>
            <input type="file" accept="application/pdf,.pdf"
                   (change)="onPickFile($event)"
                   [disabled]="submitting()">
          </label>
          @if (selectedFile(); as f) {
            <div class="reattach-file-info">
              Selected: <strong>{{ f.name }}</strong> ({{ humanBytes(f.size) }})
              @if (detectedPages() !== null) {
                — detected {{ detectedPages() }} page(s)
                @if (pageCountMismatch()) {
                  <span class="reattach-warn">
                    ⚠ mismatch! Need exactly {{ siblings().length }} page(s).
                  </span>
                }
              }
            </div>
          }
        </div>

        @if (result(); as r) {
          <div class="reattach-result">
            <p><strong>Result:</strong> {{ r.successCount }}/{{ r.total }} page(s) re-attached.</p>
            @if (r.perTarget.length > 0) {
              <ul class="reattach-result-list">
                @for (row of r.perTarget; track row.id) {
                  <li [class.reattach-row-ok]="row.status === 'restored'"
                      [class.reattach-row-fail]="row.status === 'failed'">
                    Page {{ row.page }} → #{{ row.id }} ({{ row.fileNumber }}):
                    {{ row.status }}
                    @if (row.error) { — <em>{{ row.error }}</em> }
                  </li>
                }
              </ul>
            }
          </div>
        }
      }
    </div>

    <div class="reattach-footer">
      <button mat-button (click)="cancel()">
        {{ result() ? 'Close' : 'Cancel' }}
      </button>
      @if (!result()) {
        <button mat-flat-button color="primary"
                [disabled]="!canSubmit()"
                (click)="submit()">
          @if (submitting()) { Re-attaching… } @else { Re-attach }
        </button>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-width: 560px; max-width: 720px; }
    .reattach-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px 8px;
    }
    .reattach-title { margin: 0; font-size: 16px; }
    .reattach-close {
      background: none; border: none; color: #999; font-size: 22px;
      cursor: pointer; padding: 0 6px; line-height: 1;
    }
    .reattach-close:hover { color: #fff; }
    .reattach-body { padding: 8px 20px 16px; max-height: 60vh; overflow-y: auto; overflow-x: hidden; }
    .reattach-loading, .reattach-error { color: #bbb; margin: 12px 0; }
    .reattach-error { color: #ff8080; }
    .reattach-intro { font-size: 13px; line-height: 1.5; color: #d5d5d5; margin: 0 0 14px; }

    .reattach-targets {
      border: 1px solid #333; border-radius: 6px; margin-bottom: 14px;
      background: #1a1a1a; overflow: hidden;
    }
    .reattach-target-header, .reattach-target-row {
      display: grid; grid-template-columns: 60px 200px 1fr; gap: 12px;
      padding: 8px 12px; font-size: 12px;
      min-width: 0;
    }
    .reattach-target-header {
      background: #262626; color: #999; font-weight: 600;
      text-transform: uppercase; letter-spacing: 0.05em;
    }
    .reattach-target-row + .reattach-target-row { border-top: 1px solid #262626; }
    .reattach-page { color: #f0a020; font-weight: 600; }
    .reattach-fn { font-family: ui-monospace, monospace; color: #d5d5d5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .reattach-name { color: #bbb; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .reattach-picker { margin: 12px 0; font-size: 13px; }
    .reattach-picker-label { margin-right: 10px; color: #d5d5d5; }
    .reattach-file-info { margin-top: 8px; font-size: 12px; color: #bbb; }
    .reattach-warn { color: #ffaa33; font-weight: 600; margin-left: 8px; }

    .reattach-result {
      margin-top: 12px; padding: 10px 14px; background: #1c1c1c;
      border: 1px solid #333; border-radius: 6px;
    }
    .reattach-result-list { margin: 8px 0 0; padding-left: 20px; font-size: 12px; line-height: 1.5; }
    .reattach-row-ok { color: #7fdd7f; }
    .reattach-row-fail { color: #ff8080; }

    .reattach-footer {
      display: flex; justify-content: flex-end; gap: 8px;
      padding: 12px 20px; border-top: 1px solid #333;
    }
  `],
})
export class RfFileReattachDialogComponent {
  private api = inject(RfFileApiService);
  private messages = inject(GlobalMessageService);
  private dialogRef = inject(MatDialogRef<RfFileReattachDialogComponent>);
  private data = inject<{ fileId: number }>(MAT_DIALOG_DATA);

  loading = signal<boolean>(true);
  loadError = signal<string | null>(null);
  siblings = signal<FileDto[]>([]);
  selectedFile = signal<File | null>(null);
  detectedPages = signal<number | null>(null);
  submitting = signal<boolean>(false);
  result = signal<ReattachResult | null>(null);

  pageCountMismatch = computed(() => {
    const p = this.detectedPages();
    if (p === null) return false;
    return p !== this.siblings().length;
  });

  canSubmit = computed(() =>
    !this.submitting() &&
    this.selectedFile() !== null &&
    this.siblings().length > 0 &&
    !this.pageCountMismatch()
  );

  constructor() {
    this.api.splitSiblings(this.data.fileId).subscribe({
      next: (res) => {
        const raw = (res.responseData ?? []) as any[];
        this.siblings.set(raw.map(f => FileDto.fromJson(f)));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('splitSiblings failed:', err);
        this.loadError.set(err?.error?.message ?? err?.message ?? 'Failed to load siblings');
        this.loading.set(false);
      },
    });
  }

  async onPickFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.detectedPages.set(null);
    if (file) {
      // Reuse the same PDF page-count utility used by the upload dialog.
      const { countPdfPages } = await import('../services/pdf-page-count.util');
      const count = await countPdfPages(file);
      this.detectedPages.set(count);
    }
  }

  submit() {
    const file = this.selectedFile();
    if (!file) return;
    const targetIds = this.siblings().map(s => s.id!).filter(id => id != null);
    if (targetIds.length === 0) {
      this.messages.showWarning('No target IDs — nothing to re-attach.');
      return;
    }
    this.submitting.set(true);
    this.api.reattachSplit(file, targetIds).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.result.set(res.responseData);
        const msg = res.message ?? 'Re-attach complete';
        if (res.responseData?.successCount === res.responseData?.total) {
          this.messages.showSuccess(msg);
        } else {
          this.messages.showWarning(msg);
        }
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err?.error?.message ?? err?.message ?? 'Re-attach failed';
        this.messages.showError(msg);
      },
    });
  }

  cancel() {
    this.dialogRef.close(this.result());
  }

  pageOf(t: FileDto): number | string {
    // FileDto.fileNumber is a string[] (multi-token). The split-page naming
    // convention emits a single token per entity ending in "_page_N"; join with
    // '_' so multi-token names still match if the convention ever changes.
    const joined = (t.fileNumber || []).join('_');
    const m = joined.match(/_page_(\d+)$/);
    return m ? Number(m[1]) : '—';
  }

  humanBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  }
}
