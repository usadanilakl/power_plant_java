import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { WizardStep, StepDataPayload } from '../wizard-stack.types';

interface FileItem {
  id: number;
  name: string;
  fileType?: string;
  fileNumber?: string;
}

@Component({
  selector: 'app-wizard-file-browser-step',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <div class="file-browser-container">
      <!-- Search -->
      <mat-form-field appearance="outline" class="full-width">
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          [(ngModel)]="searchText"
          placeholder="Search files..."
          (ngModelChange)="onSearchChange($event)"
        />
      </mat-form-field>

      <!-- Files list -->
      <div class="files-list">
        @if (isLoading()) {
          <div class="loading">Loading files...</div>
        } @else if (filteredFiles().length === 0) {
          <div class="empty-state">
            <mat-icon>folder_off</mat-icon>
            <p>No files found</p>
          </div>
        } @else {
          @for (file of filteredFiles(); track file.id) {
            <div
              class="file-row"
              [class.selected]="selectedFile()?.id === file.id"
              (click)="selectFile(file)"
            >
              <mat-icon class="file-icon">{{ getFileIcon(file) }}</mat-icon>
              <div class="file-info">
                <span class="file-name">{{ file.name }}</span>
                <span class="file-meta">
                  {{ file.fileType }}
                  @if (file.fileNumber) {
                    &bull; {{ file.fileNumber }}
                  }
                </span>
              </div>
              @if (selectedFile()?.id === file.id) {
                <mat-icon class="check-icon">check_circle</mat-icon>
              }
            </div>
          }
        }
      </div>

      <!-- Upload new button -->
      @if (step().fileBrowserConfig?.allowUpload) {
        <div class="upload-section">
          <span class="or-text">Can't find your file?</span>
          <button mat-stroked-button (click)="onUploadNew()">
            <mat-icon>upload_file</mat-icon>
            Upload New File
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .file-browser-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .files-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }

    .file-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      cursor: pointer;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s;
    }

    .file-row:last-child {
      border-bottom: none;
    }

    .file-row:hover {
      background: #f5f5f5;
    }

    .file-row.selected {
      background: #e3f2fd;
    }

    .file-icon {
      color: #666;
    }

    .file-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .file-name {
      font-weight: 500;
    }

    .file-meta {
      font-size: 12px;
      color: #666;
    }

    .check-icon {
      color: #1976d2;
    }

    .loading, .empty-state {
      padding: 40px;
      text-align: center;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }

    .upload-section {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .or-text {
      color: #666;
      font-size: 14px;
    }
  `],
})
export class WizardFileBrowserStepComponent {
  step = input.required<WizardStep>();
  currentValue = input<FileItem | null>(null);

  valueChange = output<StepDataPayload>();
  uploadNew = output<void>();

  searchText = '';
  files = signal<FileItem[]>([]);
  filteredFiles = signal<FileItem[]>([]);
  selectedFile = signal<FileItem | null>(null);
  isLoading = signal(false);

  constructor() {
    this.loadFiles();
  }

  loadFiles(): void {
    this.isLoading.set(true);
    // TODO: Use actual file API service
    setTimeout(() => {
      const mockFiles: FileItem[] = [
        { id: 1, name: 'P&ID-001-Condenser System', fileType: 'P&ID', fileNumber: 'DWG-001' },
        { id: 2, name: 'P&ID-002-Feedwater System', fileType: 'P&ID', fileNumber: 'DWG-002' },
        { id: 3, name: 'EL-001-Main Switchgear', fileType: 'Electrical', fileNumber: 'EL-001' },
        { id: 4, name: 'P&ID-003-Turbine Aux', fileType: 'P&ID', fileNumber: 'DWG-003' },
      ];
      this.files.set(mockFiles);
      this.filteredFiles.set(mockFiles);
      this.isLoading.set(false);
    }, 300);
  }

  onSearchChange(text: string): void {
    if (!text) {
      this.filteredFiles.set(this.files());
      return;
    }

    const lower = text.toLowerCase();
    const filtered = this.files().filter(file =>
      file.name.toLowerCase().includes(lower) ||
      file.fileNumber?.toLowerCase().includes(lower)
    );
    this.filteredFiles.set(filtered);
  }

  selectFile(file: FileItem): void {
    this.selectedFile.set(file);
    const fieldName = this.step().fileBrowserConfig?.fieldName || 'selectedFile';
    this.valueChange.emit({
      field: fieldName,
      value: file,
    });
  }

  getFileIcon(file: FileItem): string {
    switch (file.fileType) {
      case 'P&ID': return 'account_tree';
      case 'Electrical': return 'electrical_services';
      case 'Schematic': return 'schema';
      default: return 'insert_drive_file';
    }
  }

  onUploadNew(): void {
    this.uploadNew.emit();
  }
}
