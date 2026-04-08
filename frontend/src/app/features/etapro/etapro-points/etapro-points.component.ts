import { Component, inject, OnInit, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfPopupProjectionComponent } from '../../../shared/popup-projection/rf-popup-projection.component';
import { EtaProStateService } from '../services/etapro-state.service';
import { EtaProMapperService } from '../services/etapro-mapper.service';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';

@Component({
  selector: 'app-etapro-points',
  standalone: true,
  imports: [CommonModule, TableComponent, RfReactiveFormComponent, RfPopupProjectionComponent],
  template: `
    <div class="points-container">
      <div class="toolbar">
        <span class="count">{{ points().length }} points configured</span>
        <div class="toolbar-actions">
          <button class="btn" (click)="onTrendSelected()" [disabled]="selectedRows().length === 0">
            Trend Selected ({{ selectedRows().length }})
          </button>
          <button class="btn btn-new" (click)="stateService.openNewPointForm()">+ Add Point</button>
        </div>
      </div>

      <app-table
        [tableId]="'etapro-points-table'"
        [items]="points()"
        [columns]="columns()"
        (rowDoubleClicked)="onRowClick($event)"
        (selectedItemsEvent)="onSelectedItems($event)">
      </app-table>

      @if (stateService.isPointFormOpen()) {
        <app-rf-popup-projection [isOpen]="true" (close)="stateService.isPointFormOpen.set(false)">
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
      }
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
  `]
})
export class EtaProPointsComponent implements OnInit {
  stateService = inject(EtaProStateService);
  private mapperService = inject(EtaProMapperService);

  @ViewChild('pointForm') pointForm!: RfReactiveFormComponent;

  points = toSignal(this.stateService.allPoints$, { initialValue: [] as EtaProPointDto[] });
  columns = signal(this.mapperService.toPointTableColumns());
  selectedRows = signal<EtaProPointDto[]>([]);

  formFields = computed(() => {
    const point = this.stateService.selectedPoint() || new EtaProPointDto();
    return this.mapperService.toPointFormFields(point);
  });

  ngOnInit(): void {
    this.stateService.loadPoints();
  }

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
      this.stateService.openTrend(ids);
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
}
