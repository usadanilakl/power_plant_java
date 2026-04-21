import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService, ToiFile } from '../../../services/electron.service';

const SP_SITE = 'https://jpowerusa.sharepoint.com';
const SP_FOLDER_URL = 'https://jpowerusa.sharepoint.com/sites/JG/External/Forms/AllItems.aspx?id=%2Fsites%2FJG%2FExternal%2F60%20%2D%20Operations%2F60%2E11%20TIO%2DTMOD%2F60%2E20%2E01%20Active%20TOI%2DTMOD&viewid=88b99ea1%2D77a0%2D4798%2Dbc16%2D64e9eec8fa6a';

@Component({
  selector: 'app-toi-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card">
      <div class="widget-header">
        <div class="header-left">
          <span class="material-icons widget-icon" style="color: #10b981">description</span>
          <h3>TOI / TMOD</h3>
          <span class="file-count" *ngIf="files.length > 0">({{ files.length }})</span>
        </div>
        <div class="header-actions" *ngIf="!editMode">
          <button class="icon-btn" (click)="refresh($event)" title="Refresh">
            <span class="material-icons">refresh</span>
          </button>
          <button class="icon-btn" (click)="openFolder($event)" title="Open folder on SharePoint">
            <span class="material-icons">open_in_new</span>
          </button>
        </div>
      </div>

      <!-- File list -->
      <div class="file-list" *ngIf="files.length > 0">
        <div class="file-item" *ngFor="let f of files" (click)="openFile(f, $event)">
          <span class="material-icons file-icon">table_chart</span>
          <div class="file-info">
            <span class="file-name">{{ f.name }}</span>
            <span class="file-meta" *ngIf="cols >= 2">{{ formatDate(f.modified) }}</span>
          </div>
          <span class="material-icons open-arrow">open_in_new</span>
        </div>
      </div>

      <!-- Loading -->
      <div class="empty-hint" *ngIf="loading">
        <span class="material-icons spin">sync</span> Loading...
      </div>

      <!-- Error -->
      <div class="empty-hint" *ngIf="error && !loading">
        <span class="material-icons" style="color: var(--accent-error)">error_outline</span>
        {{ error }}
      </div>

      <!-- Empty -->
      <div class="empty-hint" *ngIf="!loading && !error && files.length === 0 && loaded">
        No active TOI/TMOD files
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      display: flex; flex-direction: column; gap: 8px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; height: 100%; box-sizing: border-box; overflow-y: auto;
    }
    .widget-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }
    :host { display: block; height: 100%; }

    .widget-header { display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 6px; }
    .widget-icon { font-size: 22px; }
    .widget-header h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .file-count { font-size: 12px; color: var(--text-muted); }
    .header-actions { display: flex; gap: 4px; }
    .icon-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
    .icon-btn:hover { color: var(--accent-primary); }
    .icon-btn .material-icons { font-size: 18px; }

    .file-list { display: flex; flex-direction: column; gap: 2px; }
    .file-item {
      display: flex; align-items: center; gap: 8px;
      padding: 6px 8px; border-radius: 6px; cursor: pointer;
      transition: background-color 150ms;
    }
    .file-item:hover { background: var(--bg-secondary); }
    .file-icon { font-size: 18px; color: #22c55e; flex-shrink: 0; }
    .file-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .file-name {
      font-size: 12px; color: var(--text-primary); font-weight: 500;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .file-meta { font-size: 10px; color: var(--text-muted); }
    .open-arrow { font-size: 14px; color: var(--text-muted); opacity: 0; transition: opacity 150ms; flex-shrink: 0; }
    .file-item:hover .open-arrow { opacity: 1; }

    .empty-hint { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); }
    .spin { animation: spin 1s linear infinite; font-size: 16px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ToiWidgetComponent implements OnInit {
  @Input() cols = 1;
  @Input() rows = 1;
  @Input() editMode = false;

  files: ToiFile[] = [];
  loading = false;
  loaded = false;
  error = '';

  constructor(private electronService: ElectronService) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.electronService.toiListFiles();
      if (result.success && result.data) {
        this.files = result.data
          .filter(f => f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls'))
          .sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.error = result.error || 'Failed to load';
      }
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
      this.loaded = true;
    }
  }

  async refresh(event: Event): Promise<void> {
    event.stopPropagation();
    await this.load();
  }

  openFile(file: ToiFile, event: Event): void {
    event.stopPropagation();
    if (this.editMode) return;
    // Build SharePoint web URL for the file
    const encodedPath = encodeURIComponent(file.serverRelativeUrl);
    const url = `${SP_SITE}/:x:/r${file.serverRelativeUrl}?action=default&mobileredirect=true`;
    this.electronService.openExternal(url);
  }

  openFolder(event: Event): void {
    event.stopPropagation();
    this.electronService.openExternal(SP_FOLDER_URL);
  }

  formatDate(dateStr: string): string {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch { return ''; }
  }
}
