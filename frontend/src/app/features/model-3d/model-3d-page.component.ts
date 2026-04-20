import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MainLayoutComponent } from '../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../shared/menu/router-menu/router-menu.component';
import { RfMultiUploadComponent } from '../files/refactored/rf-multi-upload/rf-multi-upload.component';
import { RfFileApiService } from '../files/refactored/services/rf-file-api.service';
import { RfLotoPointApiService } from '../loto-points/refactored/services/rf-loto-point-api.service';
import { FileDto } from '../../models/file/file.model';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { firstValueFrom } from 'rxjs';

const MODEL_EXTENSIONS = ['stl', 'obj', '3mf'];

@Component({
  selector: 'app-model-3d-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, RfMultiUploadComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="page-container">
          <!-- LEFT: 3D Model file list -->
          <div class="left-panel">
            <div class="panel-header">
              <h3>3D Model Files</h3>
              <div class="panel-actions">
                <button class="btn btn-sm btn-primary" (click)="showUploadDialog.set(true)">Upload</button>
                <button class="btn btn-sm" (click)="refreshFiles()" [disabled]="isLoadingFiles()">↻</button>
              </div>
            </div>

            <div class="file-list">
              @if (isLoadingFiles()) {
                <div class="loading">Loading...</div>
              } @else if (modelFiles().length === 0) {
                <div class="empty-state">
                  <p>No 3D model files found.</p>
                  <p class="hint">Upload .stl, .obj, or .3mf files to get started.</p>
                </div>
              } @else {
                @for (file of modelFiles(); track file.id) {
                  <div class="file-item" [class.selected]="selectedFile()?.id === file.id"
                       (click)="selectFile(file)">
                    <span class="file-icon">🧊</span>
                    <div class="file-info">
                      <span class="file-name">{{ file.name || file.fileNumber?.[0] || 'Unnamed' }}</span>
                      <span class="file-ext">.{{ file.extension }}</span>
                    </div>
                  </div>
                }
              }
            </div>

          </div>

          <!-- RIGHT: Detail + linked LOTO points -->
          <div class="right-panel">
            @if (selectedFile()) {
              <div class="detail-section">
                <h3>{{ selectedFile()!.name || 'Unnamed File' }}</h3>
                <div class="detail-meta">
                  <span><strong>ID:</strong> {{ selectedFile()!.id }}</span>
                  <span><strong>Extension:</strong> {{ selectedFile()!.extension }}</span>
                  <span><strong>File Number:</strong> {{ selectedFile()!.fileNumber?.join(', ') || '—' }}</span>
                </div>
                <div class="viewer-placeholder">
                  <span class="viewer-icon">🧊</span>
                  <p>3D viewer coming soon</p>
                  <a class="download-link" [href]="getDownloadUrl(selectedFile()!)" target="_blank">
                    Download file
                  </a>
                </div>
              </div>

              <!-- Linked LOTO Points -->
              <div class="linked-section">
                <div class="linked-header">
                  <h4>Linked LOTO Points ({{ linkedLotoPoints().length }})</h4>
                  <button class="btn btn-sm btn-primary" (click)="openLinkDialog()">+ Link</button>
                </div>

                @if (isLoadingLotoPoints()) {
                  <div class="loading">Loading linked points...</div>
                } @else if (linkedLotoPoints().length === 0) {
                  <div class="empty-state small">No LOTO points linked to this model.</div>
                } @else {
                  <table class="lp-table">
                    <thead>
                      <tr>
                        <th>Tag</th>
                        <th>Description</th>
                        <th>Location</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (lp of linkedLotoPoints(); track lp.id) {
                        <tr>
                          <td class="tag-cell">{{ lp.tagNumber }}</td>
                          <td>{{ lp.description }}</td>
                          <td>{{ lp.specificLocation }}</td>
                          <td>
                            <button class="btn-icon" title="Unlink" (click)="unlinkLotoPoint(lp)">✕</button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>

              <!-- Link dialog -->
              @if (isLinkDialogOpen()) {
                <div class="link-dialog-overlay" (click)="closeLinkDialog()">
                  <div class="link-dialog link-dialog-wide" (click)="$event.stopPropagation()">
                    <div class="dialog-header">
                      <h4>Link LOTO Points to Model</h4>
                      <button class="btn-icon" (click)="closeLinkDialog()">✕</button>
                    </div>
                    <div class="dialog-body">
                      <div class="dialog-toolbar">
                        <input class="search-input" placeholder="Search tag, description, location..."
                               [(ngModel)]="linkSearchQuery"
                               (input)="searchLotoPoints()"
                               (keydown.enter)="searchLotoPoints()" />
                        <button class="btn btn-sm btn-primary"
                                [disabled]="selectedSearchResults().length === 0 || isLinking()"
                                (click)="linkSelected()">
                          {{ isLinking() ? 'Linking...' : 'Link Selected (' + selectedSearchResults().length + ')' }}
                        </button>
                      </div>
                      @if (isSearching()) {
                        <div class="loading">Searching...</div>
                      } @else if (searchResults().length > 0) {
                        <div class="search-results-table-wrap">
                          <table class="lp-table search-table">
                            <thead>
                              <tr>
                                <th class="check-col">
                                  <input type="checkbox"
                                         [checked]="allSearchSelected()"
                                         [indeterminate]="someSearchSelected() && !allSearchSelected()"
                                         (change)="toggleSelectAll($any($event.target).checked)" />
                                </th>
                                <th>Tag</th>
                                <th>Description</th>
                                <th>Location</th>
                                <th>Eq Type</th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (lp of searchResults(); track lp.id) {
                                <tr (click)="toggleSearchSelection(lp)" class="selectable-row"
                                    [class.row-selected]="isSearchSelected(lp)">
                                  <td class="check-col">
                                    <input type="checkbox" [checked]="isSearchSelected(lp)"
                                           (click)="$event.stopPropagation()"
                                           (change)="toggleSearchSelection(lp)" />
                                  </td>
                                  <td class="tag-cell">{{ lp.tagNumber }}</td>
                                  <td>{{ lp.description }}</td>
                                  <td>{{ lp.specificLocation }}</td>
                                  <td>{{ lp.eqType?.name }}</td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                        @if (searchHasMore()) {
                          <button class="btn btn-sm load-more-btn" (click)="loadMoreResults()">
                            Load more results...
                          </button>
                        }
                      } @else if (linkSearchQuery.length >= 2) {
                        <div class="empty-state small">No results found</div>
                      } @else {
                        <div class="empty-state small">Type at least 2 characters to search</div>
                      }
                    </div>
                  </div>
                </div>
              }
            } @else {
              <div class="no-selection">
                <span class="no-selection-icon">🧊</span>
                <p>Select a 3D model file to view details and linked LOTO points.</p>
              </div>
            }
          </div>
        </div>

        <!-- Reuse existing multi-upload dialog -->
        @if (showUploadDialog()) {
          <app-rf-multi-upload
            (close)="showUploadDialog.set(false)"
            (uploadComplete)="onUploadComplete($event)"
          ></app-rf-multi-upload>
        }
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .page-container { display: flex; height: 100%; gap: 0; }

    /* Left panel */
    .left-panel { width: 280px; min-width: 280px; border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; background: #fafafa; }
    .panel-header { padding: 12px 14px; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .panel-header h3 { margin: 0; font-size: 14px; flex: 1; }
    .panel-actions { display: flex; gap: 4px; }
    .file-list { flex: 1; overflow-y: auto; padding: 4px 0; }
    .file-item { display: flex; align-items: center; gap: 8px; padding: 8px 14px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
    .file-item:hover { background: #e3f2fd; }
    .file-item.selected { background: #bbdefb; }
    .file-icon { font-size: 18px; flex-shrink: 0; }
    .file-info { display: flex; flex-direction: column; min-width: 0; }
    .file-name { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .file-ext { font-size: 11px; color: #888; }

    /* Right panel */
    .right-panel { flex: 1; overflow-y: auto; padding: 20px; }
    .detail-section { margin-bottom: 24px; }
    .detail-section h3 { margin: 0 0 8px; font-size: 18px; }
    .detail-meta { display: flex; gap: 16px; font-size: 13px; color: #666; margin-bottom: 16px; flex-wrap: wrap; }
    .viewer-placeholder {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      padding: 40px; background: #f5f5f5; border-radius: 8px; border: 2px dashed #ddd;
      color: #999; text-align: center;
    }
    .viewer-icon { font-size: 48px; margin-bottom: 8px; }
    .download-link { margin-top: 8px; padding: 6px 16px; border: 1px solid #ccc; border-radius: 4px; text-decoration: none; color: #1976d2; font-size: 13px; }
    .download-link:hover { background: #e3f2fd; }

    /* Linked section */
    .linked-section { margin-top: 16px; }
    .linked-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .linked-header h4 { margin: 0; font-size: 15px; }
    .lp-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .lp-table th { text-align: left; padding: 6px 10px; background: #f5f5f5; border-bottom: 2px solid #e0e0e0; font-weight: 600; color: #555; }
    .lp-table td { padding: 6px 10px; border-bottom: 1px solid #f0f0f0; }
    .tag-cell { font-weight: 500; color: #1976d2; }
    .btn-icon { background: none; border: none; cursor: pointer; font-size: 14px; color: #999; padding: 2px 6px; border-radius: 4px; }
    .btn-icon:hover { background: #ffebee; color: #c62828; }

    /* Link dialog */
    .link-dialog-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 10000; display: flex; align-items: center; justify-content: center; }
    .link-dialog { background: #fff; border-radius: 8px; width: 500px; max-height: 70vh; display: flex; flex-direction: column; }
    .link-dialog-wide { width: 800px; max-height: 80vh; }
    .dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; }
    .dialog-header h4 { margin: 0; }
    .dialog-body { padding: 12px 16px; overflow-y: auto; }
    .search-input { width: 100%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; margin-bottom: 8px; box-sizing: border-box; }
    .search-results { max-height: 300px; overflow-y: auto; }
    .search-result-item { display: flex; gap: 12px; padding: 8px 10px; cursor: pointer; border-bottom: 1px solid #f0f0f0; }
    .search-result-item:hover { background: #e3f2fd; }
    .result-tag { font-weight: 600; color: #1976d2; min-width: 100px; }
    .result-desc { color: #555; }
    .dialog-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; }
    .dialog-toolbar .search-input { flex: 1; }
    .search-results-table-wrap { max-height: 400px; overflow-y: auto; }
    .search-table { font-size: 12px; }
    .search-table th { position: sticky; top: 0; background: #f5f5f5; z-index: 1; }
    .check-col { width: 32px; text-align: center; }
    .selectable-row { cursor: pointer; }
    .selectable-row:hover { background: #e3f2fd; }
    .row-selected { background: #bbdefb; }
    .row-selected:hover { background: #90caf9; }
    .load-more-btn { width: 100%; margin-top: 4px; }

    /* Shared */
    .btn { padding: 4px 12px; border: 1px solid #ccc; border-radius: 4px; background: #fff; cursor: pointer; font-size: 12px; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #1976d2; color: #fff; border-color: #1976d2; }
    .btn-primary:hover:not(:disabled) { background: #1565c0; }
    .btn-sm { padding: 3px 8px; font-size: 11px; }
    .loading { padding: 16px; text-align: center; color: #888; font-size: 13px; }
    .empty-state { padding: 24px; text-align: center; color: #999; }
    .empty-state.small { padding: 12px; font-size: 13px; }
    .empty-state .hint { font-size: 12px; margin-top: 4px; }
    .no-selection { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #bbb; }
    .no-selection-icon { font-size: 64px; margin-bottom: 12px; }
  `]
})
export class Model3dPageComponent implements OnInit {
  private fileApi = inject(RfFileApiService);
  private lpApi = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);

  // Upload dialog
  showUploadDialog = signal(false);

  // Left panel state
  modelFiles = signal<FileDto[]>([]);
  isLoadingFiles = signal(false);
  selectedFile = signal<FileDto | null>(null);

  // Right panel state
  linkedLotoPoints = signal<LotoPointDto[]>([]);
  isLoadingLotoPoints = signal(false);

  // Link dialog state
  isLinkDialogOpen = signal(false);
  linkSearchQuery = '';
  searchResults = signal<LotoPointDto[]>([]);
  isSearching = signal(false);
  isLinking = signal(false);
  searchPage = signal(1);
  searchHasMore = signal(false);
  private selectedIds = signal<Set<number>>(new Set());

  selectedSearchResults = computed(() => {
    const ids = this.selectedIds();
    return this.searchResults().filter(lp => ids.has(lp.id));
  });
  allSearchSelected = computed(() => {
    const results = this.searchResults();
    return results.length > 0 && this.selectedIds().size === results.length;
  });
  someSearchSelected = computed(() => this.selectedIds().size > 0);

  ngOnInit(): void {
    this.refreshFiles();
  }

  refreshFiles(): void {
    this.isLoadingFiles.set(true);
    this.fileApi.getByExtensions(MODEL_EXTENSIONS).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        const files = (res.responseData ?? []).map((f: any) => FileDto.fromJson(f));
        this.modelFiles.set(files);
        this.isLoadingFiles.set(false);
      },
      error: () => {
        this.modelFiles.set([]);
        this.isLoadingFiles.set(false);
      }
    });
  }

  selectFile(file: FileDto): void {
    this.selectedFile.set(file);
    this.loadLinkedLotoPoints(file.id);
  }

  private loadLinkedLotoPoints(fileId: number): void {
    this.isLoadingLotoPoints.set(true);
    this.lpApi.getByModelFile(fileId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        const lps = (res.responseData ?? []).map((lp: any) => LotoPointDto.fromJson(lp));
        this.linkedLotoPoints.set(lps);
        this.isLoadingLotoPoints.set(false);
      },
      error: () => {
        this.linkedLotoPoints.set([]);
        this.isLoadingLotoPoints.set(false);
      }
    });
  }

  onUploadComplete(files: FileDto[]): void {
    this.showUploadDialog.set(false);
    this.refreshFiles();
  }

  getDownloadUrl(file: FileDto): string {
    return file.fileLink || '';
  }

  // Link dialog
  openLinkDialog(): void {
    this.isLinkDialogOpen.set(true);
    this.linkSearchQuery = '';
    this.searchResults.set([]);
    this.selectedIds.set(new Set());
    this.searchPage.set(1);
    this.searchHasMore.set(false);
  }

  closeLinkDialog(): void {
    this.isLinkDialogOpen.set(false);
  }

  searchLotoPoints(): void {
    const q = this.linkSearchQuery.trim();
    if (q.length < 2) {
      this.searchResults.set([]);
      this.selectedIds.set(new Set());
      return;
    }
    this.isSearching.set(true);
    this.searchPage.set(1);
    this.selectedIds.set(new Set());
    this.doSearch(q, 1, false);
  }

  loadMoreResults(): void {
    const next = this.searchPage() + 1;
    this.searchPage.set(next);
    this.doSearch(this.linkSearchQuery.trim(), next, true);
  }

  private doSearch(query: string, page: number, append: boolean): void {
    const pageSize = 50;
    const criteria: SearchCriteria = {
      type: 'global',
      query,
      page,
    };
    this.lpApi.searchLotoPoints(criteria, pageSize).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (res) => {
        const content = res.responseData?.content ?? [];
        const linkedIds = new Set(this.linkedLotoPoints().map(lp => lp.id));
        const results = content
          .map((lp: any) => LotoPointDto.fromJson(lp))
          .filter((lp: LotoPointDto) => !linkedIds.has(lp.id));

        if (append) {
          this.searchResults.update(prev => [...prev, ...results]);
        } else {
          this.searchResults.set(results);
        }
        this.searchHasMore.set(!res.responseData?.last);
        this.isSearching.set(false);
      },
      error: () => {
        if (!append) this.searchResults.set([]);
        this.isSearching.set(false);
      }
    });
  }

  // Selection helpers
  isSearchSelected(lp: LotoPointDto): boolean {
    return this.selectedIds().has(lp.id);
  }

  toggleSearchSelection(lp: LotoPointDto): void {
    this.selectedIds.update(ids => {
      const next = new Set(ids);
      if (next.has(lp.id)) next.delete(lp.id);
      else next.add(lp.id);
      return next;
    });
  }

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selectedIds.set(new Set(this.searchResults().map(lp => lp.id)));
    } else {
      this.selectedIds.set(new Set());
    }
  }

  async linkSelected(): Promise<void> {
    if (!this.selectedFile()) return;
    const toLink = this.selectedSearchResults();
    if (toLink.length === 0) return;

    this.isLinking.set(true);
    const fileId = this.selectedFile()!.id;
    try {
      const ids = toLink.map(lp => lp.id);
      await firstValueFrom(this.lpApi.setModelFileOnPoints(ids, fileId));
      this.closeLinkDialog();
      this.loadLinkedLotoPoints(fileId);
    } catch (e: any) {
      console.error('Failed to link LOTO points:', e);
    } finally {
      this.isLinking.set(false);
    }
  }

  async unlinkLotoPoint(lp: LotoPointDto): Promise<void> {
    if (!this.selectedFile()) return;
    try {
      await firstValueFrom(this.lpApi.setModelFileOnPoints([lp.id], 0));
      this.loadLinkedLotoPoints(this.selectedFile()!.id);
    } catch (e: any) {
      console.error('Failed to unlink LOTO point:', e);
    }
  }
}
