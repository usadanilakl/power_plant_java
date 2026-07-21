import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  CorkBoardAction,
  CorkBoardActionCreateRequest,
  CorkBoardActionType,
  CorkBoardItem,
  ElectronService,
} from '../../services/electron.service';
import { CORK_BOARD_SOURCE_URL } from './cork-board.constants';
import { CorkBoardActionCardComponent } from '../../components/cork-board-action-card/cork-board-action-card.component';

interface CorkBoardDisplayItem extends CorkBoardItem {
  safeDataUrl?: SafeResourceUrl;
}

@Component({
  selector: 'app-cork-board',
  standalone: true,
  imports: [CommonModule, FormsModule, CorkBoardActionCardComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Cork-Board</h1>
          <p class="page-desc">
            {{ actions.length }} action item{{ actions.length === 1 ? '' : 's' }} |
            {{ items.length }} media item{{ items.length === 1 ? '' : 's' }}
          </p>
        </div>
        <div class="header-actions">
          <button class="btn btn-icon" (click)="openFolder()" title="Open folder on SharePoint">
            <span class="material-icons">open_in_new</span>
          </button>
          <button class="btn btn-primary" (click)="refresh()" [disabled]="loading || actionsLoading">
            {{ loading || actionsLoading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <section class="action-board">
        <div class="section-header">
          <div>
            <h2>Action Items</h2>
            <p>{{ actions.length > 0 ? actions.length + ' active prompt' + (actions.length === 1 ? '' : 's') : 'No active prompts' }}</p>
          </div>
          <button class="btn btn-secondary" (click)="toggleActionForm()">
            <span class="material-icons">{{ showActionForm ? 'close' : 'add_task' }}</span>
            {{ showActionForm ? 'Close' : 'New Action' }}
          </button>
        </div>

        <div class="action-form" *ngIf="showActionForm">
          <div class="segmented">
            <button type="button" class="seg-option" [class.active]="actionForm.type === 'acknowledge'" (click)="setActionType('acknowledge')">
              <span class="material-icons">assignment_turned_in</span>
              Acknowledge
            </button>
            <button type="button" class="seg-option" [class.active]="actionForm.type === 'poll'" (click)="setActionType('poll')">
              <span class="material-icons">poll</span>
              Poll
            </button>
            <button type="button" class="seg-option" [class.active]="actionForm.type === 'signup'" (click)="setActionType('signup')">
              <span class="material-icons">how_to_reg</span>
              Signup
            </button>
          </div>

          <div class="form-grid">
            <label>
              <span>Title</span>
              <input type="text" [(ngModel)]="actionForm.title" placeholder="Action title" />
            </label>
            <label>
              <span>Posted by</span>
              <input type="text" [(ngModel)]="actionForm.createdBy" placeholder="Name or shift" />
            </label>
            <label>
              <span>Expires</span>
              <input type="date" [(ngModel)]="actionForm.expiresOn" />
            </label>
          </div>

          <label class="wide-field">
            <span>Details</span>
            <textarea rows="3" [(ngModel)]="actionForm.description" placeholder="What people need to know"></textarea>
          </label>

          <label class="wide-field" *ngIf="actionForm.type !== 'acknowledge'">
            <span>Options</span>
            <textarea rows="4" [(ngModel)]="actionForm.optionsText" placeholder="One option per line"></textarea>
          </label>

          <div class="form-actions">
            <span class="form-message error-text" *ngIf="actionError">{{ actionError }}</span>
            <span class="form-message success-text" *ngIf="actionNotice">{{ actionNotice }}</span>
            <button class="btn btn-primary" (click)="createAction()" [disabled]="creatingAction">
              {{ creatingAction ? 'Creating...' : 'Create Action' }}
            </button>
          </div>
        </div>

        <div class="empty-state compact" *ngIf="actionsLoading">
          <span class="material-icons spin">sync</span>
          <span>Loading action items...</span>
        </div>

        <div class="empty-state error compact" *ngIf="actionError && !actionsLoading && !showActionForm">
          <span class="material-icons">error_outline</span>
          <span>{{ actionError }}</span>
        </div>

        <div class="actions-list" *ngIf="actions.length > 0">
          <app-cork-board-action-card
            *ngFor="let action of actions; trackBy: trackByActionId"
            [action]="action"
            (changed)="loadActions()"
          ></app-cork-board-action-card>
        </div>
      </section>

      <section class="media-section">
        <div class="section-header">
          <div>
            <h2>Media</h2>
            <p>{{ items.length > 0 ? items.length + ' SharePoint media item' + (items.length === 1 ? '' : 's') : 'PDF and JPG folder' }}</p>
          </div>
        </div>

        <div class="board-list" *ngIf="items.length > 0">
          <section
            class="board-item"
            *ngFor="let item of items; trackBy: trackByUrl"
            [class.important]="item.important"
            [class.pinned]="item.pinned"
          >
            <div class="media-header">
              <div class="media-title">
                <span class="material-icons media-icon">{{ item.kind === 'pdf' ? 'picture_as_pdf' : 'image' }}</span>
                <span class="file-name" [title]="item.name">{{ item.displayName }}</span>
                <span class="badge important-badge" *ngIf="item.important">Important</span>
                <span class="badge pinned-badge" *ngIf="item.pinned">Pinned</span>
              </div>
              <div class="file-meta">
                <span class="order-chip" *ngIf="item.sortOrder != null">#{{ item.sortOrder }}</span>
                <span class="expiry-chip" *ngIf="item.expiresOn">Expires {{ formatExpirationDate(item.expiresOn) }}</span>
                <span>{{ formatSize(item.size) }}<ng-container *ngIf="item.modified"> | {{ formatDate(item.modified) }}</ng-container></span>
              </div>
            </div>

            <div class="media-body">
              <img
                *ngIf="item.kind === 'image'"
                class="board-image"
                [src]="item.dataUrl"
                [alt]="item.displayName"
              />
              <iframe
                *ngIf="item.kind === 'pdf'"
                class="board-pdf"
                [src]="item.safeDataUrl"
                [title]="item.displayName"
              ></iframe>
            </div>
          </section>
        </div>

        <div class="empty-state" *ngIf="loading">
          <span class="material-icons spin">sync</span>
          <span>Loading Cork-Board media from SharePoint...</span>
        </div>

        <div class="empty-state error" *ngIf="error && !loading">
          <span class="material-icons">error_outline</span>
          <span>{{ error }}</span>
          <button class="btn btn-primary" (click)="load()">Retry</button>
        </div>

        <div class="empty-state" *ngIf="!loading && !error && items.length === 0 && loaded">
          <span class="material-icons">collections</span>
          <span>No PDF or JPG media found</span>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { max-width: 1180px; margin: 0 auto; padding-bottom: 24px; }

    .page-header {
      display: flex; justify-content: space-between; align-items: flex-start;
      gap: 16px; margin-bottom: 18px;
    }
    .page-title { font-size: 22px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .page-desc { font-size: 13px; color: var(--text-muted); margin: 4px 0 0; }
    .header-actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }

    .btn {
      min-height: 32px; padding: 6px 14px; font-size: 12px; border: none;
      border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center;
      justify-content: center; gap: 6px; white-space: nowrap;
    }
    .btn .material-icons { font-size: 17px; }
    .btn-primary { background: var(--accent-primary); color: #fff; }
    .btn-secondary { background: var(--bg-secondary); color: var(--text-secondary); border: 1px solid var(--border-color); }
    .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.5; cursor: default; }
    .btn-icon {
      background: transparent; border: 1px solid var(--border-color); color: var(--text-muted);
      border-radius: 6px; padding: 6px; cursor: pointer; display: inline-flex;
    }
    .btn-icon:hover { color: var(--text-primary); border-color: var(--text-muted); }
    .btn-icon .material-icons { font-size: 18px; }

    .action-board, .media-section {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 10px; padding: 14px; margin-bottom: 18px;
    }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      gap: 12px; margin-bottom: 12px;
    }
    .section-header h2 { margin: 0; color: var(--text-primary); font-size: 16px; font-weight: 600; }
    .section-header p { margin: 3px 0 0; color: var(--text-muted); font-size: 12px; }

    .action-form {
      border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;
      background: rgba(15, 15, 26, 0.35); margin-bottom: 12px;
    }
    .segmented {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px; margin-bottom: 12px;
    }
    .seg-option {
      border: 1px solid var(--border-color); background: var(--bg-secondary); color: var(--text-secondary);
      border-radius: 6px; min-height: 34px; cursor: pointer; display: flex; align-items: center;
      justify-content: center; gap: 6px; font-size: 12px;
    }
    .seg-option.active { border-color: var(--accent-primary); color: #fff; background: rgba(59, 130, 246, 0.35); }
    .seg-option .material-icons { font-size: 17px; }
    .form-grid {
      display: grid; grid-template-columns: minmax(220px, 1fr) minmax(160px, 0.55fr) 160px;
      gap: 10px; margin-bottom: 10px;
    }
    label { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
    label span { font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    input, select, textarea {
      width: 100%; box-sizing: border-box; border: 1px solid var(--border-color);
      border-radius: 6px; background: var(--bg-secondary); color: var(--text-primary);
      font-size: 13px; padding: 8px 9px; outline: none;
    }
    textarea { resize: vertical; min-height: 74px; }
    input:focus, select:focus, textarea:focus { border-color: var(--accent-primary); }
    .wide-field { margin-bottom: 10px; }
    .form-actions {
      display: flex; justify-content: flex-end; align-items: center; gap: 10px; min-height: 32px;
    }
    .form-message { margin-right: auto; font-size: 12px; }
    .error-text { color: var(--accent-error); }
    .success-text { color: #22c55e; }

    .actions-list { display: flex; flex-direction: column; gap: 10px; }
    .action-card {
      border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;
      background: rgba(15, 15, 26, 0.26);
    }
    .action-top { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
    .action-title-row { display: flex; gap: 10px; min-width: 0; }
    .action-icon { color: #38bdf8; font-size: 22px; flex-shrink: 0; margin-top: 1px; }
    .action-title-row h3 { margin: 0; color: var(--text-primary); font-size: 14px; font-weight: 650; }
    .action-title-row p { margin: 4px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.4; }
    .action-meta { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; flex-shrink: 0; }
    .type-chip, .posted-chip {
      font-size: 10px; line-height: 1; color: var(--text-secondary);
      border: 1px solid var(--border-color); border-radius: 4px;
      padding: 5px 6px; background: rgba(15, 15, 26, 0.45);
    }

    .summary-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-top: 12px; }
    .summary-row {
      border: 1px solid var(--border-color); border-radius: 6px; padding: 7px;
      background: var(--bg-secondary);
    }
    .summary-label { display: flex; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--text-secondary); }
    .summary-label span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .summary-label strong { color: var(--text-primary); }
    .summary-bar { height: 5px; background: rgba(148, 163, 184, 0.18); border-radius: 999px; overflow: hidden; margin-top: 6px; }
    .summary-bar span { display: block; height: 100%; background: #38bdf8; border-radius: inherit; }
    .response-count { color: var(--text-muted); font-size: 11px; margin-top: 9px; }

    .response-row {
      display: grid; grid-template-columns: minmax(130px, 0.35fr) minmax(150px, 0.45fr) minmax(160px, 1fr) auto;
      gap: 8px; align-items: center; margin-top: 10px;
    }
    .name-input, .comment-input { min-height: 32px; }

    .media-section { padding-bottom: 0; }
    .board-list { display: flex; flex-direction: column; gap: 18px; padding-bottom: 14px; }

    .board-item {
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 10px; overflow: hidden;
    }
    .board-item.important {
      border-color: #f97316;
      box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.35), 0 0 22px rgba(249, 115, 22, 0.2);
      animation: importantPulse 1.8s ease-in-out infinite;
    }
    .board-item.pinned:not(.important) {
      border-color: var(--accent-primary);
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.28);
    }

    .media-header {
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      padding: 10px 14px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color);
    }
    .board-item.important .media-header { background: rgba(249, 115, 22, 0.12); }
    .board-item.pinned:not(.important) .media-header { background: rgba(59, 130, 246, 0.1); }
    .media-title { display: flex; align-items: center; gap: 8px; min-width: 0; flex-wrap: wrap; }
    .media-icon { font-size: 19px; color: #f59e0b; flex-shrink: 0; }
    .file-name {
      font-size: 13px; font-weight: 600; color: var(--text-primary);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .board-item.important .file-name { color: #fed7aa; }
    .file-meta {
      display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      font-size: 11px; color: var(--text-muted); white-space: nowrap;
    }
    .order-chip {
      font-family: monospace; color: var(--text-secondary);
      border: 1px solid var(--border-color); border-radius: 4px;
      padding: 1px 5px; background: rgba(15, 15, 26, 0.45);
    }
    .expiry-chip {
      color: var(--text-secondary);
      border: 1px solid var(--border-color); border-radius: 4px;
      padding: 5px 6px; background: rgba(15, 15, 26, 0.45); font-size: 10px; line-height: 1;
    }
    .file-meta .expiry-chip { padding: 1px 6px; font-size: 11px; }
    .badge {
      font-size: 10px; line-height: 1; font-weight: 700; text-transform: uppercase;
      padding: 5px 6px; border-radius: 5px; letter-spacing: 0;
    }
    .important-badge { background: #f97316; color: #111827; }
    .pinned-badge { background: var(--accent-primary); color: #fff; }

    .media-body {
      padding: 14px; overflow: auto; background: rgba(15, 15, 26, 0.35);
    }
    .board-image {
      display: block; width: auto; max-width: 100%; height: auto;
      margin: 0 auto; background: #f8fafc;
    }
    .board-pdf {
      width: 100%; min-height: 760px; height: 86vh;
      border: 0; background: #f8fafc; display: block;
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px; padding: 44px; color: var(--text-muted); font-size: 14px;
    }
    .empty-state.compact { padding: 18px; flex-direction: row; }
    .empty-state .material-icons { font-size: 40px; opacity: 0.3; }
    .empty-state.compact .material-icons { font-size: 20px; }
    .empty-state.error .material-icons { color: var(--accent-error); opacity: 0.6; }
    .spin { animation: spin 1s linear infinite; }

    @keyframes importantPulse {
      0%, 100% { box-shadow: 0 0 0 1px rgba(249, 115, 22, 0.35), 0 0 14px rgba(249, 115, 22, 0.15); }
      50% { box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.7), 0 0 28px rgba(249, 115, 22, 0.38); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    @media (max-width: 820px) {
      .page-header, .section-header, .action-top { flex-direction: column; align-items: stretch; }
      .header-actions, .action-meta { justify-content: flex-start; }
      .form-grid, .response-row { grid-template-columns: 1fr; }
      .segmented { grid-template-columns: 1fr; }
      .media-header { align-items: flex-start; flex-direction: column; }
      .file-meta { flex-wrap: wrap; white-space: normal; }
    }
    @media (prefers-reduced-motion: reduce) {
      .board-item.important, .spin { animation: none; }
    }
  `]
})
export class CorkBoardComponent implements OnInit {
  items: CorkBoardDisplayItem[] = [];
  actions: CorkBoardAction[] = [];

  loading = false;
  loaded = false;
  error = '';
  actionsLoading = false;
  actionError = '';
  actionNotice = '';
  showActionForm = false;
  creatingAction = false;
  actionForm = {
    type: 'acknowledge' as CorkBoardActionType,
    title: '',
    description: '',
    optionsText: '',
    expiresOn: '',
    createdBy: '',
  };

  constructor(
    private electronService: ElectronService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    this.load();
    this.loadActions();
  }

  async load(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.electronService.corkBoardListItems();
      if (result.success && result.data) {
        this.items = result.data.map(item => ({
          ...item,
          safeDataUrl: item.kind === 'pdf'
            ? this.sanitizer.bypassSecurityTrustResourceUrl(item.dataUrl)
            : undefined,
        }));
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

  async loadActions(): Promise<void> {
    this.actionsLoading = true;
    this.actionError = '';
    try {
      const result = await this.electronService.corkBoardListActions();
      if (result.success && result.data) {
        this.actions = result.data;
      } else {
        this.actionError = result.error || 'Failed to load action items';
      }
    } catch (err: any) {
      this.actionError = err.message;
    } finally {
      this.actionsLoading = false;
    }
  }

  async refresh(): Promise<void> {
    await Promise.all([this.load(), this.loadActions()]);
  }

  openFolder(): void {
    this.electronService.openExternal(CORK_BOARD_SOURCE_URL);
  }

  toggleActionForm(): void {
    this.showActionForm = !this.showActionForm;
    this.actionNotice = '';
    if (this.showActionForm) this.actionError = '';
  }

  setActionType(type: CorkBoardActionType): void {
    this.actionForm.type = type;
  }

  async createAction(): Promise<void> {
    this.actionError = '';
    this.actionNotice = '';
    const options = this.parseOptionsText(this.actionForm.optionsText);
    if (!this.actionForm.title.trim()) {
      this.actionError = 'Action title is required';
      return;
    }
    if (this.actionForm.type === 'poll' && options.length < 2) {
      this.actionError = 'Polls need at least two options';
      return;
    }

    const request: CorkBoardActionCreateRequest = {
      title: this.actionForm.title.trim(),
      description: this.actionForm.description.trim() || undefined,
      type: this.actionForm.type,
      options,
      expiresOn: this.actionForm.expiresOn || undefined,
      createdBy: this.actionForm.createdBy.trim() || undefined,
      active: true,
    };

    this.creatingAction = true;
    try {
      const result = await this.electronService.corkBoardCreateAction(request);
      if (!result.success) {
        this.actionError = result.error || 'Failed to create action item';
        return;
      }
      const createdBy = this.actionForm.createdBy;
      this.actionForm = {
        type: 'acknowledge',
        title: '',
        description: '',
        optionsText: '',
        expiresOn: '',
        createdBy,
      };
      this.actionNotice = 'Action item created.';
      await this.loadActions();
    } catch (err: any) {
      this.actionError = err.message;
    } finally {
      this.creatingAction = false;
    }
  }

  formatSize(bytes: number): string {
    if (!bytes || bytes < 1) return '0 KB';
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString();
  }

  formatExpirationDate(value: string): string {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString();
  }

  trackByUrl(_index: number, item: CorkBoardDisplayItem): string {
    return item.serverRelativeUrl;
  }

  trackByActionId(_index: number, action: CorkBoardAction): string {
    return action.id;
  }

  private parseOptionsText(value: string): string[] {
    const seen = new Set<string>();
    const options: string[] = [];
    for (const option of value.split(/\r?\n/).map(line => line.trim()).filter(Boolean)) {
      const key = option.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      options.push(option);
    }
    return options;
  }
}
