import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ElectronService, ToiFile } from '../../../services/electron.service';

const SP_FOLDER_URL = 'https://jpowerusa.sharepoint.com/sites/JG/External/Forms/AllItems.aspx?id=%2Fsites%2FJG%2FExternal%2F60%20%2D%20Operations%2F60%2E11%20TIO%2DTMOD%2F60%2E20%2E01%20Active%20TOI%2DTMOD&viewid=88b99ea1%2D77a0%2D4798%2Dbc16%2D64e9eec8fa6a';

@Component({
  selector: 'app-toi-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card" (click)="navigateToPage($event)">
      <div class="widget-header">
        <div class="header-left">
          <span class="material-icons widget-icon" style="color: #10b981">description</span>
          <h3>TOI / TMOD</h3>
          <span class="file-count" *ngIf="files.length > 0">({{ files.length }})</span>
        </div>
        <div class="header-actions" *ngIf="!editMode">
          <button class="icon-btn" (click)="openFolder($event)" title="Open folder on SharePoint">
            <span class="material-icons">open_in_new</span>
          </button>
        </div>
      </div>

      <div class="file-list" *ngIf="files.length > 0">
        <div class="file-item" *ngFor="let f of files">
          <span class="material-icons file-icon">table_chart</span>
          <div class="file-info">
            <span class="file-name">{{ f.name }}</span>
            <span class="file-title" *ngIf="f.title">{{ f.title }}</span>
          </div>
        </div>
      </div>

      <div class="empty-hint" *ngIf="loading">
        <span class="material-icons spin">sync</span> Loading...
      </div>
      <div class="empty-hint" *ngIf="error && !loading">{{ error }}</div>
      <div class="empty-hint" *ngIf="!loading && !error && files.length === 0 && loaded">
        No active TOI/TMOD files
      </div>
    </div>
  `,
  styles: [`
    .widget-card {
      display: flex; flex-direction: column; gap: 8px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; height: 100%; box-sizing: border-box; overflow-y: auto; cursor: pointer;
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
    .file-item { display: flex; align-items: center; gap: 8px; padding: 4px 6px; border-radius: 4px; }
    .file-icon { font-size: 16px; color: #22c55e; flex-shrink: 0; }
    .file-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
    .file-name { font-size: 11px; color: var(--text-primary); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .file-title { font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .empty-hint { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
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

  constructor(private electronService: ElectronService, private router: Router) {}

  ngOnInit(): void { this.load(); }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.electronService.toiListFiles();
      if (result.success && result.data) {
        this.files = result.data.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.error = result.error || 'Failed to load';
      }
    } catch (err: any) { this.error = err.message; }
    finally { this.loading = false; this.loaded = true; }
  }

  navigateToPage(event: Event): void {
    if (this.editMode) return;
    if ((event.target as HTMLElement).closest('button')) return;
    this.router.navigate(['/toi']);
  }

  openFolder(event: Event): void {
    event.stopPropagation();
    this.electronService.openExternal(SP_FOLDER_URL);
  }
}
