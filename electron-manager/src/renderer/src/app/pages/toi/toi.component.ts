import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService, ToiFile } from '../../services/electron.service';

const SP_SITE = 'https://jpowerusa.sharepoint.com';
const SP_FOLDER_URL = 'https://jpowerusa.sharepoint.com/sites/JG/External/Forms/AllItems.aspx?id=%2Fsites%2FJG%2FExternal%2F60%20%2D%20Operations%2F60%2E11%20TIO%2DTMOD%2F60%2E20%2E01%20Active%20TOI%2DTMOD&viewid=88b99ea1%2D77a0%2D4798%2Dbc16%2D64e9eec8fa6a';

@Component({
  selector: 'app-toi',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Active TOI / TMOD</h1>
        <div class="header-actions">
          <button class="btn btn-icon" (click)="openFolder()" title="Open folder on SharePoint">
            <span class="material-icons">open_in_new</span>
          </button>
          <button class="btn btn-primary" (click)="refresh()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <p class="page-desc">
        Temporary Operation Instructions and Temporary Modifications currently in effect.
        <span class="file-count" *ngIf="files.length > 0">{{ files.length }} active items</span>
      </p>

      <!-- TOI Cards -->
      <div class="toi-list" *ngIf="files.length > 0">
        <div class="toi-card" *ngFor="let f of files" (click)="openFile(f)">
          <div class="toi-card-header">
            <div class="toi-id">
              <span class="material-icons toi-icon">description</span>
              <span class="toi-name">{{ f.name.replace('.xlsx', '').replace('.xls', '') }}</span>
            </div>
            <button class="btn btn-icon btn-sm" (click)="openFile(f); $event.stopPropagation()" title="Open on SharePoint">
              <span class="material-icons">open_in_new</span>
            </button>
          </div>

          <div class="toi-body" *ngIf="f.title || f.originator || f.instructions">
            <div class="toi-title" *ngIf="f.title">{{ f.title }}</div>

            <div class="toi-meta">
              <span class="meta-item" *ngIf="f.originator">
                <span class="material-icons meta-icon">person</span> {{ f.originator }}
              </span>
              <span class="meta-item" *ngIf="f.date">
                <span class="material-icons meta-icon">calendar_today</span> {{ f.date }}
              </span>
            </div>

            <div class="toi-instructions" *ngIf="f.instructions">
              <span class="instructions-label">Instructions:</span>
              <p class="instructions-text">{{ f.instructions }}</p>
            </div>
          </div>

          <div class="toi-body empty-body" *ngIf="!f.title && !f.originator && !f.instructions">
            <span class="no-details">Details not available</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="empty-state" *ngIf="loading">
        <span class="material-icons spin">sync</span>
        <span>Loading TOI/TMOD files from SharePoint...</span>
      </div>

      <!-- Error -->
      <div class="empty-state error" *ngIf="error && !loading">
        <span class="material-icons">error_outline</span>
        <span>{{ error }}</span>
        <button class="btn btn-primary" (click)="refresh()">Retry</button>
      </div>

      <!-- Empty -->
      <div class="empty-state" *ngIf="!loading && !error && files.length === 0 && loaded">
        <span class="material-icons">description</span>
        <span>No active TOI/TMOD files found</span>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .page-title { font-size: 22px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .header-actions { display: flex; gap: 8px; align-items: center; }
    .btn { padding: 6px 14px; font-size: 12px; border: none; border-radius: 6px; cursor: pointer; }
    .btn-primary { background: var(--accent-primary); color: #fff; }
    .btn-primary:disabled { opacity: 0.5; cursor: default; }
    .btn-icon { background: transparent; border: 1px solid var(--border-color); color: var(--text-muted); border-radius: 6px; padding: 6px; cursor: pointer; }
    .btn-icon:hover { color: var(--text-primary); border-color: var(--text-muted); }
    .btn-icon .material-icons { font-size: 18px; }
    .btn-sm { padding: 4px; }
    .btn-sm .material-icons { font-size: 16px; }

    .page-desc { font-size: 13px; color: var(--text-muted); margin: 0 0 16px; }
    .file-count { color: var(--text-secondary); font-weight: 500; }

    /* TOI list */
    .toi-list { display: flex; flex-direction: column; gap: 10px; }

    .toi-card {
      background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px;
      overflow: hidden; cursor: pointer; transition: all 150ms;
    }
    .toi-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }

    .toi-card-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 12px 16px; background: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
    }
    .toi-id { display: flex; align-items: center; gap: 8px; }
    .toi-icon { font-size: 20px; color: #22c55e; }
    .toi-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }

    .toi-body { padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
    .empty-body { padding: 10px 16px; }
    .no-details { font-size: 12px; color: var(--text-muted); font-style: italic; }

    .toi-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }

    .toi-meta { display: flex; gap: 16px; flex-wrap: wrap; }
    .meta-item { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--text-secondary); }
    .meta-icon { font-size: 15px; color: var(--text-muted); }

    .toi-instructions { margin-top: 4px; }
    .instructions-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .instructions-text {
      font-size: 13px; color: var(--text-secondary); line-height: 1.5;
      margin: 4px 0 0; white-space: pre-wrap; word-break: break-word;
    }

    /* States */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 40px; color: var(--text-muted); font-size: 14px;
    }
    .empty-state .material-icons { font-size: 40px; opacity: 0.3; }
    .empty-state.error .material-icons { color: var(--accent-error); opacity: 0.6; }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ToiComponent implements OnInit {
  files: ToiFile[] = [];
  loading = false;
  loaded = false;
  error = '';

  constructor(private electronService: ElectronService) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.electronService.toiListFiles();
      if (result.success && result.data) {
        // Already sorted by the main process — trust that order.
        this.files = result.data;
      } else {
        this.error = result.error || 'Failed to load';
      }
    } catch (err: any) { this.error = err.message; }
    finally { this.loading = false; this.loaded = true; }
  }

  async refresh(): Promise<void> { await this.load(); }

  openFile(file: ToiFile): void {
    const encodedPath = file.serverRelativeUrl.split('/').map(s => encodeURIComponent(s)).join('/');
    const url = `${SP_SITE}/sites/JG/_layouts/15/Doc.aspx?sourcedoc=${encodedPath}&action=default`;
    this.electronService.openExternal(url);
  }

  openFolder(): void {
    this.electronService.openExternal(SP_FOLDER_URL);
  }
}
