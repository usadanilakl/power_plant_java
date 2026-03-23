import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfReactiveFormComponent } from '../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfPopupProjectionComponent } from '../../../shared/popup-projection/rf-popup-projection.component';
import { WorkAreaStateService } from './services/work-area-state.service';
import { WorkAreaMapperService } from './services/work-area-mapper.service';
import { WorkAreaDto } from '../../../models/permits/work-area.model';
import { Option } from '../../../models/option.model';
import { RfLotoStandardApiService } from '../../loto-standard/refactored/services/rf-loto-standard-api.service';

@Component({
  selector: 'app-work-area-page',
  standalone: true,
  imports: [
    CommonModule,
    RfReactiveFormComponent,
    RfPopupProjectionComponent,
  ],
  template: `
    <div class="work-area-page">
      <div class="page-toolbar">
        <button class="action-btn new-btn" (click)="onNew()">+ New Work Area</button>
        <button class="action-btn secondary-btn" [disabled]="!stateService.selectedItem()" (click)="onCreateCounterpart()">
          Create Counterpart
        </button>
      </div>

      <div class="work-area-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Area Type</th>
            </tr>
          </thead>
          <tbody>
            @for (item of stateService.items(); track item.id) {
              <tr
                [class.selected]="stateService.selectedItem()?.id === item.id"
                (click)="onRowClick(item)"
                (dblclick)="onRowDoubleClick(item)"
              >
                <td>{{ item.name }}</td>
                <td>{{ item.description }}</td>
                <td>{{ item.areaType?.name }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <app-rf-popup-projection
      [isOpen]="stateService.formOpen()"
      [fullHeight]="true"
      (close)="stateService.closeForm()"
    >
      <app-rf-reactive-form
        [fields]="formFields()"
        [entity]="stateService.selectedItem() ?? {}"
        [title]="formTitle()"
        [submitButtonText]="'Save'"
        [deleteButtonText]="stateService.selectedItem()?.id ? 'Delete' : ''"
        (formSubmit)="onSubmit($event)"
        (formDelete)="onDelete()"
      ></app-rf-reactive-form>
    </app-rf-popup-projection>
  `,
  styles: [`
    .work-area-page {
      padding: 16px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .page-toolbar {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .action-btn {
      padding: 6px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .new-btn {
      background: #2563eb;
      color: white;
    }

    .new-btn:hover {
      background: #1d4ed8;
    }

    .secondary-btn {
      background: #eef2ff;
      color: #3730a3;
      border: 1px solid #c7d2fe;
    }

    .secondary-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .work-area-table {
      flex: 1;
      overflow: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    th {
      text-align: left;
      padding: 8px 12px;
      border-bottom: 2px solid #e5e7eb;
      font-weight: 600;
      color: #374151;
      background: #f9fafb;
    }

    td {
      padding: 8px 12px;
      border-bottom: 1px solid #e5e7eb;
    }

    tr:hover {
      background: #f3f4f6;
      cursor: pointer;
    }

    tr.selected {
      background: #dbeafe;
    }
  `],
})
export class WorkAreaPageComponent implements OnInit {
  stateService = inject(WorkAreaStateService);
  private mapperService = inject(WorkAreaMapperService);
  private lotoStandardApi = inject(RfLotoStandardApiService);
  lotoStandardOptions = signal<Option[]>([]);

  formFields = computed(() => {
    const item = this.stateService.selectedItem();
    return this.mapperService.toFormFields(item ?? new WorkAreaDto(), this.lotoStandardOptions());
  });

  formTitle = computed(() => {
    const item = this.stateService.selectedItem();
    return item?.id ? 'Edit Work Area' : 'New Work Area';
  });

  ngOnInit(): void {
    this.stateService.loadAll();
    this.loadLotoStandards();
  }

  private loadLotoStandards(): void {
    this.lotoStandardApi.getAllLotoStandards().subscribe({
      next: (response) => {
        const options = (response.responseData ?? []).map((standard) => ({
          value: standard.id,
          label: standard.name || `Standard ${standard.id}`,
        }));
        this.lotoStandardOptions.set(options);
      },
      error: () => {
        this.lotoStandardOptions.set([]);
      }
    });
  }

  onNew(): void {
    this.stateService.openNewForm();
  }

  onCreateCounterpart(): void {
    this.stateService.openCounterpartForm();
  }

  onRowClick(item: WorkAreaDto): void {
    this.stateService.setSelectedItem(item);
  }

  onRowDoubleClick(item: WorkAreaDto): void {
    this.stateService.setSelectedItem(item);
    this.stateService.openForm();
  }

  onSubmit(formData: any): void {
    const current = this.stateService.selectedItem();
    const dto = new WorkAreaDto({
      ...current,
      ...formData,
    });

    // Map areaType from ID back to object
    if (formData.areaType && typeof formData.areaType === 'number') {
      dto.areaType = { id: formData.areaType, name: '' };
    }

    dto.constantLotoIds = Array.isArray(formData.constantLotoIds)
      ? formData.constantLotoIds.map((id: any) => Number(id)).filter((id: number) => !Number.isNaN(id))
      : [];

    this.stateService.submitForm(dto);
  }

  onDelete(): void {
    const item = this.stateService.selectedItem();
    if (item?.id) {
      this.stateService.deleteItem(item.id);
    }
  }
}
