import { Component, inject, input, output, signal, computed, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, Subject } from 'rxjs';
import { GuideFormStep } from './guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';
import { RfFileApiService } from '../../../../features/files/refactored/services/rf-file-api.service';
import { FileDto } from '../../../../models/file/file.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';

@Component({
  selector: 'app-guide-file-selector-step',
  standalone: true,
  imports: [
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    GuideHintsPanelComponent,
  ],
  template: `
    <div class="file-selector-step">
      <h3 class="step-title">{{ step().title }}</h3>
      <p class="step-description">{{ step().description }}</p>

      <!-- Search Input -->
      <mat-form-field class="search-field" appearance="outline">
        <mat-label>Search files</mat-label>
        <input
          matInput
          [(ngModel)]="searchTerm"
          (ngModelChange)="onSearchChange($event)"
          placeholder="File name, number, or type..."
        />
        <mat-icon matPrefix>search</mat-icon>
        @if (searchTerm()) {
          <button matSuffix mat-icon-button (click)="clearSearch()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>

      <!-- Results List -->
      <div class="results-container">
        @if (isLoading()) {
          <div class="loading-state">
            <mat-spinner diameter="32"></mat-spinner>
            <span>Searching files...</span>
          </div>
        } @else if (searchResults().length > 0) {
          <div class="results-list">
            @for (file of searchResults(); track file.id) {
              <button
                class="file-item"
                [class.selected]="selectedFileId() === file.id"
                (click)="selectFile(file)"
              >
                <div class="file-icon">
                  <mat-icon>{{ getFileIcon(file) }}</mat-icon>
                </div>
                <div class="file-info">
                  <span class="file-name">{{ file.name }}</span>
                  <span class="file-meta">
                    {{ file.fileType?.name || 'Unknown type' }}
                    @if (file.fileNumber?.length) {
                      &bull; {{ file.fileNumber.join(', ') }}
                    }
                  </span>
                </div>
                @if (selectedFileId() === file.id) {
                  <mat-icon class="check-icon">check_circle</mat-icon>
                }
              </button>
            }
          </div>
        } @else if (searchTerm() && !isLoading()) {
          <div class="empty-state">
            <mat-icon>search_off</mat-icon>
            <span>No files found matching "{{ searchTerm() }}"</span>
          </div>
        } @else {
          <div class="empty-state">
            <mat-icon>folder_open</mat-icon>
            <span>Start typing to search for files</span>
          </div>
        }
      </div>

      <!-- Upload Option -->
      <div class="upload-section">
        <div class="divider">
          <span>or</span>
        </div>
        <button
          mat-stroked-button
          color="primary"
          class="upload-btn"
          (click)="onUploadNew.emit()"
        >
          <mat-icon>upload_file</mat-icon>
          Upload New File
        </button>
      </div>

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" [compact]="true" />
      }
    </div>
  `,
  styles: [
    `
      .file-selector-step {
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .step-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .step-description {
        margin: 0;
        font-size: 14px;
        color: var(--text-secondary, #666);
      }

      .search-field {
        width: 100%;
      }

      .results-container {
        min-height: 200px;
        max-height: 300px;
        overflow-y: auto;
        border: 1px solid var(--border-color, #e0e0e0);
        border-radius: 8px;
        background: var(--surface-color, #fff);
      }

      .results-list {
        display: flex;
        flex-direction: column;
      }

      .file-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        border-bottom: 1px solid var(--border-light, #f0f0f0);
        transition: background 0.15s ease;
      }

      .file-item:last-child {
        border-bottom: none;
      }

      .file-item:hover {
        background: var(--surface-alt, #f5f5f5);
      }

      .file-item.selected {
        background: var(--primary-light, #e3f2fd);
      }

      .file-icon {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        background: var(--surface-alt, #f5f5f5);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .file-icon mat-icon {
        color: var(--text-secondary, #666);
      }

      .file-item.selected .file-icon {
        background: var(--primary-color, #1976d2);
      }

      .file-item.selected .file-icon mat-icon {
        color: white;
      }

      .file-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #333);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .file-meta {
        font-size: 12px;
        color: var(--text-tertiary, #999);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .check-icon {
        color: var(--primary-color, #1976d2);
      }

      .loading-state,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 40px 20px;
        color: var(--text-tertiary, #999);
      }

      .loading-state mat-icon,
      .empty-state mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
      }

      .upload-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
      }

      .divider {
        display: flex;
        align-items: center;
        width: 100%;
        color: var(--text-tertiary, #999);
        font-size: 12px;
      }

      .divider::before,
      .divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border-color, #e0e0e0);
      }

      .divider span {
        padding: 0 12px;
      }

      .upload-btn {
        width: 100%;
      }
    `,
  ],
})
export class GuideFileSelectorStepComponent {
  private fileApiService = inject(RfFileApiService);
  private destroyRef = inject(DestroyRef);

  step = input.required<GuideFormStep>();

  fileSelected = output<FileDto>();
  onUploadNew = output<void>();

  searchTerm = signal('');
  searchResults = signal<FileDto[]>([]);
  isLoading = signal(false);
  selectedFileId = signal<number | null>(null);

  private searchSubject = new Subject<string>();

  constructor() {
    // Debounced search
    this.searchSubject
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe((term) => {
        if (term.length >= 2) {
          this.performSearch(term);
        } else {
          this.searchResults.set([]);
        }
      });
  }

  onSearchChange(term: string): void {
    this.searchSubject.next(term);
    if (term.length < 2) {
      this.searchResults.set([]);
      this.isLoading.set(false);
    } else {
      this.isLoading.set(true);
    }
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.selectedFileId.set(null);
  }

  private performSearch(term: string): void {
    const criteria: SearchCriteria = {
      type: 'column',
      filters: {
        name: term,
      },
      page: 1,
    };

    this.fileApiService
      .searchFiles(criteria, 20)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.searchResults.set(response.responseData?.content || []);
          this.isLoading.set(false);
        },
        error: () => {
          this.searchResults.set([]);
          this.isLoading.set(false);
        },
      });
  }

  selectFile(file: FileDto): void {
    this.selectedFileId.set(file.id);
    this.fileSelected.emit(file);
  }

  getFileIcon(file: FileDto): string {
    const type = file.fileType?.name?.toLowerCase() || '';
    if (type.includes('pid') || type.includes('p&id')) return 'account_tree';
    if (type.includes('elect')) return 'electrical_services';
    if (type.includes('iso')) return 'view_in_ar';
    return 'description';
  }
}
