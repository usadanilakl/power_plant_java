import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  InstrumentBulkUploadApiService,
  BulkUploadResult,
  InstrumentBulkTagMode,
  CounterpartCheckReport,
  CounterpartCreateResult,
  DuplicateCheckReport,
  DuplicateMergeResult
} from '../../../services/instrumentation/instrument-bulk-upload-api.service';
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

          <div class="options-row">
            <label for="tag-mode">Tag Mode:</label>
            <select
              id="tag-mode"
              class="mode-select"
              [value]="selectedTagMode()"
              (change)="onTagModeChanged($event)"
              [disabled]="loading()"
            >
              @for (mode of tagModeOptions; track mode.value) {
                <option [value]="mode.value">{{ mode.label }}</option>
              }
            </select>
          </div>

          <div class="file-input-row">
            <input type="file" accept=".csv,.xlsx" (change)="onFileSelected($event)" #fileInput />
            <button class="action-btn preview-btn" (click)="onPreview()" [disabled]="!selectedFile() || loading()">Preview</button>
            <button class="action-btn upload-btn" (click)="onUpload()" [disabled]="!selectedFile() || loading()">Upload to SharePoint</button>
            <button class="action-btn export-btn" (click)="onExportDefaultJson()" [disabled]="loading()">Export JSON</button>
          </div>

          <div class="counterpart-section">
            <h3>01/02 Counterpart Check</h3>
            <div class="counterpart-actions">
              <button class="action-btn check-btn" (click)="onRunCounterpartCheck()" [disabled]="loading() || counterpartLoading()">
                Run Check
              </button>
              <button
                class="action-btn create-btn"
                (click)="onCreateMissingCounterparts()"
                [disabled]="loading() || counterpartLoading() || getMissingTotal() === 0"
              >
                Create Missing Counterparts
              </button>
            </div>

            @if (counterpartLoading()) {
              <div class="status">Checking/creating counterparts...</div>
            }

            @if (counterpartCreateResult()) {
              <div class="result-summary">
                <strong>Create Missing Result:</strong>
                {{ counterpartCreateResult()!.created }} created,
                {{ counterpartCreateResult()!.skipped }} skipped,
                {{ counterpartCreateResult()!.failed }} failed
                ({{ counterpartCreateResult()!.attempted }} attempted)
                @if (counterpartCreateResult()!.errors.length > 0) {
                  <div class="errors">
                    <strong>Errors:</strong>
                    <ul>
                      @for (error of counterpartCreateResult()!.errors; track error) {
                        <li>{{ error }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            }

            @if (counterpartReport()) {
              <div class="report-grid">
                <div><strong>Total instruments:</strong> {{ counterpartReport()!.totalInstruments }}</div>
                <div><strong>01/02 tagged:</strong> {{ counterpartReport()!.totalUnitTagged }}</div>
                <div><strong>Paired bases:</strong> {{ counterpartReport()!.pairedBaseCount }}</div>
                <div><strong>Missing 01:</strong> {{ counterpartReport()!.missing01Count }}</div>
                <div><strong>Missing 02:</strong> {{ counterpartReport()!.missing02Count }}</div>
                <div><strong>Total missing:</strong> {{ getMissingTotal() }}</div>
              </div>

              @if (counterpartReport()!.missing01Tags.length > 0 || counterpartReport()!.missing02Tags.length > 0) {
                <div class="missing-tags">
                  @if (counterpartReport()!.missing01Tags.length > 0) {
                    <div class="tag-group">
                      <strong>Missing 01 tags ({{ counterpartReport()!.missing01Tags.length }}):</strong>
                      <div class="tag-list">{{ counterpartReport()!.missing01Tags.join(', ') }}</div>
                    </div>
                  }
                  @if (counterpartReport()!.missing02Tags.length > 0) {
                    <div class="tag-group">
                      <strong>Missing 02 tags ({{ counterpartReport()!.missing02Tags.length }}):</strong>
                      <div class="tag-list">{{ counterpartReport()!.missing02Tags.join(', ') }}</div>
                    </div>
                  }
                </div>
              }
            }
          </div>

          <div class="duplicates-section">
            <h3>Duplicate Tag Check</h3>
            <div class="counterpart-actions">
              <button class="action-btn check-btn" (click)="onRunDuplicatesCheck()" [disabled]="loading() || duplicateLoading()">
                Check Duplicates
              </button>
              <button
                class="action-btn create-btn"
                (click)="onMergeDuplicates()"
                [disabled]="loading() || duplicateLoading() || getDuplicateGroupCount() === 0"
              >
                Merge All Duplicates
              </button>
            </div>

            @if (duplicateLoading()) {
              <div class="status">Checking/merging duplicates...</div>
            }

            @if (duplicateMergeResult()) {
              <div class="result-summary">
                <strong>Merge Result:</strong>
                {{ duplicateMergeResult()!.groupsResolved }} groups resolved,
                {{ duplicateMergeResult()!.duplicatesDeleted }} duplicates deleted,
                {{ duplicateMergeResult()!.failed }} failed
                @if (duplicateMergeResult()!.errors.length > 0) {
                  <div class="errors">
                    <strong>Errors:</strong>
                    <ul>
                      @for (error of duplicateMergeResult()!.errors; track error) {
                        <li>{{ error }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>
            }

            @if (duplicateReport()) {
              <div class="report-grid">
                <div><strong>Total instruments:</strong> {{ duplicateReport()!.totalInstruments }}</div>
                <div><strong>Duplicate groups:</strong> {{ duplicateReport()!.duplicateGroupCount }}</div>
                <div><strong>Duplicate items:</strong> {{ duplicateReport()!.duplicateItemCount }}</div>
              </div>

              @if (duplicateReport()!.groups.length > 0) {
                <div class="missing-tags">
                  <strong>Duplicate groups:</strong>
                  <div class="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Tag Number</th>
                          <th>Count</th>
                          <th>SharePoint IDs</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (group of duplicateReport()!.groups; track group.tagNumber) {
                          <tr>
                            <td>{{ group.tagNumber }}</td>
                            <td>{{ group.count }}</td>
                            <td>{{ group.sharepointIds.join(', ') }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              }
            }
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
    .options-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      color: var(--primary-text);
      font-size: 0.9rem;
    }
    .mode-select {
      min-width: 320px;
      padding: 0.3rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--card-bg);
      color: var(--primary-text);
      font-size: 0.85rem;
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
    .export-btn { background: var(--accent-color); }
    .check-btn { background: var(--accent-color); }
    .create-btn { background: var(--status-in-progress); }
    .counterpart-section {
      margin-bottom: 1rem;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--card-bg);
    }
    .duplicates-section {
      margin-bottom: 1rem;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      background: var(--card-bg);
    }
    .duplicates-section h3 {
      margin: 0 0 0.5rem 0;
      color: var(--primary-text);
      font-size: 1rem;
    }
    .counterpart-section h3 {
      margin: 0 0 0.5rem 0;
      color: var(--primary-text);
      font-size: 1rem;
    }
    .counterpart-actions {
      display: flex;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .report-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(220px, 1fr));
      gap: 0.35rem 1rem;
      color: var(--primary-text);
      margin-top: 0.5rem;
      font-size: 0.9rem;
    }
    .missing-tags {
      margin-top: 0.75rem;
      color: var(--primary-text);
      font-size: 0.85rem;
    }
    .tag-group {
      margin-bottom: 0.5rem;
    }
    .tag-list {
      margin-top: 0.25rem;
      color: var(--secondary-text);
      word-break: break-word;
    }
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
  counterpartReport = signal<CounterpartCheckReport | null>(null);
  counterpartCreateResult = signal<CounterpartCreateResult | null>(null);
  duplicateReport = signal<DuplicateCheckReport | null>(null);
  duplicateMergeResult = signal<DuplicateMergeResult | null>(null);
  loading = signal(false);
  counterpartLoading = signal(false);
  duplicateLoading = signal(false);
  errorMessage = signal('');
  selectedTagMode = signal<InstrumentBulkTagMode>('as_is');
  readonly tagModeOptions: { value: InstrumentBulkTagMode; label: string }[] = [
    { value: 'as_is', label: 'Upload As-Is (current behavior)' },
    { value: 'base_to_u1_u2', label: 'Base Tag -> Create 01 and 02' },
    { value: 'copy_u1_to_u2', label: 'If tag starts with 01, also create 02' },
    { value: 'copy_u2_to_u1', label: 'If tag starts with 02, also create 01' }
  ];

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    this.selectedFile.set(file);
    this.previewData.set([]);
    this.uploadResult.set(null);
    this.counterpartCreateResult.set(null);
    this.duplicateMergeResult.set(null);
    this.errorMessage.set('');
  }

  onTagModeChanged(event: Event) {
    const select = event.target as HTMLSelectElement;
    this.selectedTagMode.set(select.value as InstrumentBulkTagMode);
    this.previewData.set([]);
    this.uploadResult.set(null);
    this.counterpartCreateResult.set(null);
    this.duplicateMergeResult.set(null);
    this.errorMessage.set('');
  }

  onPreview() {
    const file = this.selectedFile();
    if (!file) return;
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.preview(file, this.selectedTagMode()).subscribe({
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
    this.api.upload(file, this.selectedTagMode()).subscribe({
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

  onExportDefaultJson() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.getAllInstruments().subscribe({
      next: res => {
        const rows = (res.responseData ?? [])
          .map(item => ({
            tagNumber: item.tagNumber ?? '',
            description: item.description ?? '',
            vendor: item.vendor ?? '',
            location: item.location ?? '',
            type: item.type ?? '',
            status: item.currentStatus ?? 'Active'
          }))
          .sort((a, b) => a.tagNumber.localeCompare(b.tagNumber));

        const json = JSON.stringify(rows, null, 2);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'default-instruments.json';
        anchor.click();
        URL.revokeObjectURL(url);

        this.loading.set(false);
      },
      error: err => {
        this.errorMessage.set('Export failed: ' + (err.error?.message || err.message));
        this.loading.set(false);
      }
    });
  }

  onRunCounterpartCheck() {
    this.counterpartLoading.set(true);
    this.errorMessage.set('');
    this.api.checkCounterparts().subscribe({
      next: res => {
        this.counterpartReport.set(res.responseData);
        this.counterpartLoading.set(false);
      },
      error: err => {
        this.errorMessage.set('Counterpart check failed: ' + (err.error?.message || err.message));
        this.counterpartLoading.set(false);
      }
    });
  }

  onCreateMissingCounterparts() {
    this.counterpartLoading.set(true);
    this.errorMessage.set('');
    this.counterpartCreateResult.set(null);
    this.api.createMissingCounterparts().subscribe({
      next: res => {
        this.counterpartCreateResult.set(res.responseData);
        this.counterpartReport.set(res.responseData?.reportAfter ?? null);
        this.counterpartLoading.set(false);
      },
      error: err => {
        this.errorMessage.set('Create missing counterparts failed: ' + (err.error?.message || err.message));
        this.counterpartLoading.set(false);
      }
    });
  }

  getMissingTotal(): number {
    const report = this.counterpartReport();
    if (!report) return 0;
    return report.missing01Count + report.missing02Count;
  }

  onRunDuplicatesCheck() {
    this.duplicateLoading.set(true);
    this.errorMessage.set('');
    this.api.checkDuplicates().subscribe({
      next: res => {
        this.duplicateReport.set(res.responseData);
        this.duplicateLoading.set(false);
      },
      error: err => {
        this.errorMessage.set('Duplicate check failed: ' + (err.error?.message || err.message));
        this.duplicateLoading.set(false);
      }
    });
  }

  onMergeDuplicates() {
    this.duplicateLoading.set(true);
    this.errorMessage.set('');
    this.duplicateMergeResult.set(null);
    this.api.mergeDuplicates().subscribe({
      next: res => {
        this.duplicateMergeResult.set(res.responseData);
        this.duplicateReport.set(res.responseData?.reportAfter ?? null);
        this.duplicateLoading.set(false);
      },
      error: err => {
        this.errorMessage.set('Duplicate merge failed: ' + (err.error?.message || err.message));
        this.duplicateLoading.set(false);
      }
    });
  }

  getDuplicateGroupCount(): number {
    return this.duplicateReport()?.duplicateGroupCount ?? 0;
  }

  goBack() {
    this.router.navigate(['/instrumentation']);
  }
}
