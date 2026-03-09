import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { InstrumentBulkUploadApiService, BulkUploadResult } from '../../../services/instrumentation/instrument-bulk-upload-api.service';
import { InstrumentDto } from '../../../models/instrumentation/instrument.model';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';

@Component({
  selector: 'app-instrument-bulk-upload',
  standalone: true,
  imports: [MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="upload-container">
          <div class="page-header">
            <h2>Bulk Upload Instruments</h2>
            <button class="action-btn" (click)="goBack()">Back to Instruments</button>
          </div>
          <p class="description">Upload a CSV or Excel (.xlsx) file with columns: TagNumber, Description, Vendor, Location, Type</p>

          <div class="file-input-row">
            <input type="file" accept=".csv,.xlsx" (change)="onFileSelected($event)" #fileInput />
            <button class="action-btn preview-btn" (click)="onPreview()" [disabled]="!selectedFile() || loading()">Preview</button>
            <button class="action-btn upload-btn" (click)="onUpload()" [disabled]="!selectedFile() || loading()">Upload to SharePoint</button>
          </div>

          @if (loading()) {
            <div class="status">Processing...</div>
          }

          @if (errorMessage()) {
            <div class="status error">{{ errorMessage() }}</div>
          }

          @if (uploadResult()) {
            <div class="result-summary">
              <strong>Upload Complete:</strong>
              {{ uploadResult()!.created }} created,
              {{ uploadResult()!.updated }} updated,
              {{ uploadResult()!.failed }} failed
              ({{ uploadResult()!.total }} total)
              @if (uploadResult()!.errors.length > 0) {
                <div class="errors">
                  <strong>Errors:</strong>
                  <ul>
                    @for (error of uploadResult()!.errors; track error) {
                      <li>{{ error }}</li>
                    }
                  </ul>
                </div>
              }
            </div>
          }

          @if (previewData().length > 0) {
            <div class="preview-section">
              <h3>Preview ({{ previewData().length }} instruments)</h3>
              <div class="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tag Number</th>
                      <th>Description</th>
                      <th>Vendor</th>
                      <th>Location</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (item of previewData(); track item.tagNumber; let i = $index) {
                      <tr>
                        <td>{{ i + 1 }}</td>
                        <td>{{ item.tagNumber }}</td>
                        <td>{{ item.description }}</td>
                        <td>{{ item.vendor }}</td>
                        <td>{{ item.location }}</td>
                        <td>{{ item.type }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }
    .upload-container {
      max-width: 1000px;
    }
    .page-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }
    .page-header h2 {
      margin: 0;
      color: var(--primary-text);
      font-size: 1.1rem;
    }
    .description {
      color: var(--secondary-text);
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .file-input-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      color: var(--primary-text);
    }
    .action-btn {
      padding: 0.3rem 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      cursor: pointer;
      color: var(--primary-text);
      font-size: 0.85rem;
      background: var(--accent-color);
    }
    .action-btn:disabled { opacity: 0.5; cursor: default; }
    .action-btn:hover:not(:disabled) { opacity: 0.8; }
    .upload-btn { background: var(--status-complete); }
    .status { padding: 0.5rem; margin-bottom: 0.5rem; color: var(--secondary-text); }
    .status.error { color: var(--status-attention); }
    .result-summary {
      padding: 0.75rem;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      margin-bottom: 1rem;
      color: var(--primary-text);
    }
    .errors { margin-top: 0.5rem; color: var(--status-attention); }
    .errors ul { margin: 0.25rem 0 0 1rem; padding: 0; }
    .preview-section { margin-top: 1rem; }
    .preview-section h3 { color: var(--primary-text); margin-bottom: 0.5rem; font-size: 1rem; }
    .table-scroll { overflow: auto; max-height: 400px; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    th, td {
      padding: 0.4rem 0.6rem;
      border: 1px solid var(--border-color);
      text-align: left;
      color: var(--primary-text);
    }
    th { background: var(--card-bg); position: sticky; top: 0; }
    tr:hover { background: var(--hover-bg); }
  `]
})
export class InstrumentBulkUploadComponent {
  private api = inject(InstrumentBulkUploadApiService);
  private router = inject(Router);

  selectedFile = signal<File | null>(null);
  previewData = signal<InstrumentDto[]>([]);
  uploadResult = signal<BulkUploadResult | null>(null);
  loading = signal(false);
  errorMessage = signal('');

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile.set(file);
    this.previewData.set([]);
    this.uploadResult.set(null);
    this.errorMessage.set('');
  }

  onPreview() {
    const file = this.selectedFile();
    if (!file) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.preview(file).subscribe({
      next: res => {
        this.previewData.set(res.responseData || []);
        this.loading.set(false);
      },
      error: err => {
        this.errorMessage.set('Preview failed: ' + (err.error?.message || err.message));
        this.loading.set(false);
      }
    });
  }

  onUpload() {
    const file = this.selectedFile();
    if (!file) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.uploadResult.set(null);
    this.api.upload(file).subscribe({
      next: res => {
        this.uploadResult.set(res.responseData);
        this.loading.set(false);
      },
      error: err => {
        this.errorMessage.set('Upload failed: ' + (err.error?.message || err.message));
        this.loading.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/instrumentation']);
  }
}
