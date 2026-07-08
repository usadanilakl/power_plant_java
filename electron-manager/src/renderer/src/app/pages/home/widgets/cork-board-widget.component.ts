import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { CorkBoardAction, CorkBoardItem, ElectronService } from '../../../services/electron.service';
import { CORK_BOARD_SOURCE_URL } from '../../cork-board/cork-board.constants';

interface CorkBoardPreviewItem extends CorkBoardItem {
  safeDataUrl?: SafeResourceUrl;
}

@Component({
  selector: 'app-cork-board-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="widget-card" (click)="navigateToPage($event)">
      <div class="widget-header">
        <div class="header-left">
          <span class="material-icons widget-icon">collections</span>
          <h3>Cork-Board</h3>
          <span class="file-count" *ngIf="items.length > 0 || actions.length > 0">
            ({{ items.length }} media<span *ngIf="actions.length > 0">, {{ actions.length }} action{{ actions.length === 1 ? '' : 's' }}</span>)
          </span>
        </div>
        <div class="header-actions" *ngIf="!editMode">
          <button class="icon-btn" (click)="openFolder($event)" title="Open folder on SharePoint">
            <span class="material-icons">open_in_new</span>
          </button>
        </div>
      </div>

      <div class="action-strip" *ngIf="actions.length > 0">
        <span class="material-icons">add_task</span>
        <span class="action-text">{{ actions[0].title }}</span>
        <span class="action-count">{{ actions.length }}</span>
      </div>

      <div class="media-scroll" *ngIf="items.length > 0">
        <div
          class="media-tile"
          *ngFor="let item of items; trackBy: trackByUrl"
          [class.important]="item.important"
          [class.pinned]="item.pinned"
        >
          <div class="tile-badges" *ngIf="item.important || item.pinned || item.expiresOn">
            <span class="badge important-badge" *ngIf="item.important">Important</span>
            <span class="badge pinned-badge" *ngIf="item.pinned">Pinned</span>
            <span class="badge expiry-badge" *ngIf="item.expiresOn">Expires {{ formatExpirationDate(item.expiresOn) }}</span>
          </div>
          <img
            *ngIf="item.kind === 'image'"
            class="media-preview"
            [src]="item.dataUrl"
            [alt]="item.displayName"
          />
          <iframe
            *ngIf="item.kind === 'pdf'"
            class="media-preview pdf-preview"
            [src]="item.safeDataUrl"
            [title]="item.displayName"
          ></iframe>
          <span class="media-name" [title]="item.name">{{ item.displayName }}</span>
        </div>
      </div>

      <div class="empty-hint" *ngIf="loading">
        <span class="material-icons spin">sync</span> Loading...
      </div>
      <div class="empty-hint" *ngIf="error && !loading">{{ error }}</div>
      <div class="empty-hint" *ngIf="!loading && !error && items.length === 0 && loaded">
        No Cork-Board media found
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }

    .widget-card {
      display: flex; flex-direction: column; gap: 10px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; height: 100%; box-sizing: border-box; overflow: hidden; cursor: pointer;
    }
    .widget-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }

    .widget-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .header-left { display: flex; align-items: center; gap: 6px; min-width: 0; }
    .widget-icon { font-size: 22px; color: #f59e0b; }
    .widget-header h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .file-count { font-size: 12px; color: var(--text-muted); }
    .header-actions { display: flex; gap: 4px; }

    .icon-btn {
      background: none; border: none; color: var(--text-muted);
      cursor: pointer; padding: 2px; display: flex; align-items: center; justify-content: center;
    }
    .icon-btn:hover { color: var(--accent-primary); }
    .icon-btn .material-icons { font-size: 18px; }

    .action-strip {
      display: flex; align-items: center; gap: 7px; min-height: 30px;
      border: 1px solid rgba(56, 189, 248, 0.35); border-radius: 7px;
      background: rgba(56, 189, 248, 0.1); color: var(--text-secondary);
      padding: 5px 7px; flex-shrink: 0;
    }
    .action-strip .material-icons { font-size: 16px; color: #38bdf8; }
    .action-text {
      min-width: 0; flex: 1; overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; font-size: 11px; color: var(--text-primary);
    }
    .action-count {
      min-width: 20px; height: 20px; display: inline-flex; align-items: center;
      justify-content: center; border-radius: 999px; background: #38bdf8;
      color: #082f49; font-size: 11px; font-weight: 700;
    }

    .media-scroll {
      flex: 1; min-height: 0; overflow-y: auto; padding-right: 2px;
      display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 8px;
    }

    .media-tile {
      position: relative;
      min-width: 0; overflow: hidden; border: 1px solid var(--border-color); border-radius: 8px;
      background: var(--bg-secondary); display: flex; flex-direction: column;
    }
    .media-tile.important {
      border-color: #f97316;
      box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.35), 0 0 18px rgba(249, 115, 22, 0.2);
      animation: importantPulse 1.8s ease-in-out infinite;
    }
    .media-tile.pinned:not(.important) {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.28);
    }

    .media-preview {
      width: 100%; height: 170px; object-fit: contain;
      background: #f8fafc; border: 0; flex-shrink: 0;
    }

    .pdf-preview { pointer-events: none; }

    .media-name {
      font-size: 10px; color: var(--text-secondary); padding: 5px 6px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .media-tile.important .media-name { color: #fed7aa; font-weight: 600; }

    .tile-badges {
      position: absolute; top: 6px; left: 6px; z-index: 1;
      display: flex; gap: 4px; flex-wrap: wrap;
    }
    .badge {
      font-size: 9px; line-height: 1; font-weight: 700; text-transform: uppercase;
      padding: 4px 5px; border-radius: 4px; letter-spacing: 0;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
    }
    .important-badge { background: #f97316; color: #111827; }
    .pinned-badge { background: var(--accent-primary); color: #fff; }
    .expiry-badge { background: rgba(15, 23, 42, 0.92); color: #e4e4e7; }

    .empty-hint {
      font-size: 11px; color: var(--text-muted);
      display: flex; align-items: center; gap: 6px;
    }
    .spin { animation: spin 1s linear infinite; font-size: 16px; }
    @keyframes importantPulse {
      0%, 100% { box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.35), 0 0 12px rgba(249, 115, 22, 0.15); }
      50% { box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.7), 0 0 24px rgba(249, 115, 22, 0.42); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) {
      .media-tile.important, .spin { animation: none; }
    }
  `]
})
export class CorkBoardWidgetComponent implements OnInit {
  @Input() cols = 1;
  @Input() rows = 1;
  @Input() editMode = false;

  items: CorkBoardPreviewItem[] = [];
  actions: CorkBoardAction[] = [];
  loading = false;
  loaded = false;
  error = '';

  constructor(
    private electronService: ElectronService,
    private router: Router,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const [mediaResult, actionsResult] = await Promise.all([
        this.electronService.corkBoardListItems(),
        this.electronService.corkBoardListActions(),
      ]);

      if (mediaResult.success && mediaResult.data) {
        this.items = mediaResult.data.map(item => ({
          ...item,
          safeDataUrl: item.kind === 'pdf'
            ? this.sanitizer.bypassSecurityTrustResourceUrl(item.dataUrl)
            : undefined,
        }));
      } else {
        this.error = mediaResult.error || 'Failed to load';
      }

      if (actionsResult.success && actionsResult.data) {
        this.actions = actionsResult.data;
      }
    } catch (err: any) {
      this.error = err.message;
    } finally {
      this.loading = false;
      this.loaded = true;
    }
  }

  navigateToPage(event: Event): void {
    if (this.editMode) return;
    if ((event.target as HTMLElement).closest('button')) return;
    this.router.navigate(['/cork-board']);
  }

  openFolder(event: Event): void {
    event.stopPropagation();
    this.electronService.openExternal(CORK_BOARD_SOURCE_URL);
  }

  trackByUrl(_index: number, item: CorkBoardPreviewItem): string {
    return item.serverRelativeUrl;
  }

  formatExpirationDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }
}
