import { Component, DestroyRef, ElementRef, inject, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// EtaProPointPickerComponent handles its own data loading + table services
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfPopupProjectionComponent } from '../../../shared/popup-projection/rf-popup-projection.component';
import { EtaProPointPickerComponent } from '../etapro-point-picker/etapro-point-picker.component';
import { EtaProStateService } from '../services/etapro-state.service';
import { EtaProMapperService } from '../services/etapro-mapper.service';
import { EtaProApiService, PointImportResult } from '../services/etapro-api.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';

@Component({
  selector: 'app-etapro-points',
  standalone: true,
  imports: [CommonModule, EtaProPointPickerComponent, RfReactiveFormComponent, RfPopupProjectionComponent],
  template: `
    <div class="points-container">
      <div class="toolbar">
        <span class="count">{{ selectedRows().length }} selected</span>
        <div class="toolbar-actions">
          <button class="btn" (click)="onTrendSelected()" [disabled]="selectedRows().length === 0">
            Trend Selected ({{ selectedRows().length }})
          </button>
          <button class="btn" (click)="onImportClick()" [disabled]="importing()">
            {{ importing() ? 'Importing...' : 'Import from File' }}
          </button>
          <button class="btn btn-new" (click)="stateService.openNewPointForm()">+ Add Point</button>
        </div>
      </div>

      <!-- Hidden file input triggered by the Import button -->
      <input #fileInput
             type="file"
             accept=".xlsx,.xlsm,.csv"
             style="display: none"
             (change)="onFileSelected($event)">

      <app-etapro-point-picker
        (rowDoubleClicked)="onRowClick($event)"
        (selectedItemsEvent)="onSelectedItems($event)">
      </app-etapro-point-picker>

      <!-- Point edit/create form — use [isOpen] binding (not @if) so the popup
           can manage its own DOM lifecycle and the close button works reliably -->
      <app-rf-popup-projection [isOpen]="stateService.isPointFormOpen()" (close)="stateService.isPointFormOpen.set(false)">
        <div class="form-container">
          <h3>{{ stateService.selectedPoint()?.id ? 'Edit Point' : 'New Point' }}</h3>
          <app-rf-reactive-form
            #pointForm
            [fields]="formFields()"
            [showSubmitButton]="true"
            [submitButtonText]="stateService.selectedPoint()?.id ? 'Update' : 'Create'"
            (formSubmit)="onFormSubmit($event)">
          </app-rf-reactive-form>
          @if (stateService.selectedPoint()?.id) {
            <button class="btn btn-delete" (click)="onDelete()">Delete</button>
          }
        </div>
      </app-rf-popup-projection>

      <!-- Import result dialog -->
      <app-rf-popup-projection [isOpen]="!!importResult()" (close)="importResult.set(null)">
        @if (importResult(); as r) {
          <div class="import-result">
            <h3>Import Complete</h3>
            <div class="result-grid">
              <div class="result-stat added">
                <span class="label">Added</span>
                <span class="value">{{ r.added }}</span>
              </div>
              <div class="result-stat skipped">
                <span class="label">Skipped (existing)</span>
                <span class="value">{{ r.skipped }}</span>
              </div>
              <div class="result-stat errors" [class.has-errors]="r.errorCount > 0">
                <span class="label">Errors</span>
                <span class="value">{{ r.errorCount }}</span>
              </div>
            </div>
            @if (r.errors && r.errors.length > 0) {
              <details class="error-list">
                <summary>Show errors ({{ r.errors.length }})</summary>
                <ul>
                  @for (err of r.errors; track err) {
                    <li>{{ err }}</li>
                  }
                </ul>
              </details>
            }
            <button class="btn btn-new" (click)="importResult.set(null)">Close</button>
          </div>
        }
      </app-rf-popup-projection>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .points-container { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
    .toolbar {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 8px; flex-shrink: 0;
    }
    .count { font-size: 13px; color: var(--secondary-text); }
    .toolbar-actions { display: flex; gap: 6px; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn {
      padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px;
    }
    .btn-new { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    .btn-new:hover { opacity: 0.9; }
    .btn-delete { margin-top: 8px; background: #f44336; color: white; border: none; border-radius: 4px;
      padding: 6px 14px; cursor: pointer; font-size: 13px; }
    .btn-delete:hover { background: #e53935; }
    .form-container { padding: 16px; min-width: 400px; }
    .form-container h3 { margin: 0 0 12px; font-size: 16px; }
    app-table { flex: 1; min-height: 0; overflow: hidden; }

    .import-result { padding: 20px; min-width: 420px; max-width: 600px; }
    .import-result h3 { margin: 0 0 16px; font-size: 16px; }
    .result-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .result-stat {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      padding: 12px; border-radius: 6px; border: 1px solid var(--border-color);
    }
    .result-stat .label { font-size: 11px; color: var(--secondary-text); text-transform: uppercase; }
    .result-stat .value { font-size: 24px; font-weight: 700; }
    .result-stat.added .value { color: #4caf50; }
    .result-stat.skipped .value { color: #888; }
    .result-stat.errors .value { color: #888; }
    .result-stat.errors.has-errors .value { color: #f44336; }
    .error-list { margin-bottom: 16px; }
    .error-list summary { cursor: pointer; font-size: 12px; color: var(--secondary-text); padding: 6px 0; }
    .error-list ul { max-height: 200px; overflow: auto; padding-left: 20px; margin: 8px 0;
      font-size: 12px; color: #c62828; background: var(--hover-background); border-radius: 4px; padding: 8px 8px 8px 24px; }
    .error-list li { margin-bottom: 4px; }
  `]
})
export class EtaProPointsComponent {
  stateService = inject(EtaProStateService);
  private mapperService = inject(EtaProMapperService);
  private apiService = inject(EtaProApiService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('pointForm') pointForm!: RfReactiveFormComponent;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  selectedRows = signal<EtaProPointDto[]>([]);

  importing = signal(false);
  importResult = signal<PointImportResult | null>(null);

  formFields = computed(() => {
    const point = this.stateService.selectedPoint() || new EtaProPointDto();
    return this.mapperService.toPointFormFields(point);
  });

  onRowClick(item: any): void {
    this.stateService.editPoint(EtaProPointDto.fromJson(item));
  }

  onSelectedItems(items: any[]): void {
    const dtos = items.map(i => EtaProPointDto.fromJson(i));
    this.selectedRows.set(dtos);
    if (items.length === 1) {
      this.stateService.selectedPoint.set(dtos[0]);
    }
  }

  onTrendSelected(): void {
    const ids = this.selectedRows()
      .map(p => p.pointId)
      .filter((id): id is string => !!id);
    if (ids.length > 0) {
      this.stateService.trendPointIds.set(ids);
      this.stateService.activeTab.set('trend');
    }
  }

  onFormSubmit(formValue: any): void {
    const existing = this.stateService.selectedPoint();
    const dto = EtaProPointDto.fromJson({ ...existing, ...formValue });
    if (existing?.id) dto.id = existing.id;
    this.stateService.savePoint(dto);
  }

  onDelete(): void {
    const point = this.stateService.selectedPoint();
    if (point?.id && confirm('Delete point ' + point.pointId + '?')) {
      this.stateService.deletePoint(point.id);
      this.stateService.isPointFormOpen.set(false);
    }
  }

  // ── Import ─────────────────────────────────────────────────

  onImportClick(): void {
    this.fileInput.nativeElement.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Reset the input so the same file can be selected again
    input.value = '';
    if (!file) return;

    this.importing.set(true);
    this.apiService.importPoints(file).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: res => {
        this.importing.set(false);
        if (res.responseData) {
          this.importResult.set(res.responseData);
          // Refresh the point list so newly added rows appear
          this.stateService.loadPoints();
        }
      },
      error: err => {
        this.importing.set(false);
        const msg = err?.error?.message || err?.message || 'Unknown error';
        alert('Import failed: ' + msg);
      }
    });
  }
}
