import { Component, computed, inject } from '@angular/core';
import { CurrentJobLogService } from '../../../../services/current-items-services/current-job-log.service';
import { JobLogDto } from '../../../../models/permits/job-log.model';
import { DailyPermitPackageDto } from '../../../../models/permits/dailt-permit-package.model';
import { RfFormField } from '../../../../models/ui/form-field.model';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { TableComponent as SharedTableComponent } from '../../../../shared/table/table.component';
import { Column } from '../../../../models/column.model';

@Component({
  selector: 'app-rf-job-log-form',
  standalone: true,
  imports: [RfReactiveFormComponent, SharedTableComponent],
  template: `
    <div class="job-log-container">
      <app-rf-reactive-form
        [fields]="fields()"
        [entity]="entity()"
        [title]="'Job Log'"
        [submitButtonText]="entity().id ? 'Update' : 'Create'"
        [deleteButtonText]="entity().id ? 'Delete' : ''"
        (formSubmit)="onSubmit($event)"
        (formDelete)="onDelete()"
      ></app-rf-reactive-form>

      @if(entity().id) {
        <div class="packages-section">
          <div class="packages-header">
            <h3>Daily Packages ({{ packages().length }})</h3>
            <div style="display:flex;gap:8px;">
              <button class="create-package-btn" (click)="createPackage()">Create New Package</button>
              @if(entity().jobStatus?.name !== 'Closed') {
                <button class="close-job-btn" (click)="closeJob()">Close Job</button>
              } @else {
                <span class="job-closed-badge">Job Closed</span>
              }
            </div>
          </div>
          @if(packages().length > 0) {
            <app-shared-table
              [items]="packages()"
              [columns]="packageColumns"
              [clickCallback]="openPackage.bind(this)"
            ></app-shared-table>
            <div class="package-actions">
              <button class="detach-btn" (click)="detachSelectedPackage()" [disabled]="!selectedPackageId">Detach Selected Package</button>
            </div>
          } @else {
            <p class="no-packages">No packages attached to this job yet.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .job-log-container { display: flex; flex-direction: column; gap: 16px; padding-bottom: 16px; }
    .packages-section { padding: 0 12px; }
    .packages-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .packages-header h3 { margin: 0; font-size: 14px; }
    .create-package-btn { padding: 4px 12px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .create-package-btn:hover { background: #45a049; }
    .package-actions { margin-top: 8px; display: flex; gap: 8px; }
    .detach-btn { padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .detach-btn:hover { background: #d32f2f; }
    .detach-btn:disabled { background: #999; cursor: not-allowed; }
    .no-packages { color: #888; font-style: italic; font-size: 13px; }
    .close-job-btn { padding: 4px 12px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .close-job-btn:hover { background: #d32f2f; }
    .job-closed-badge { padding: 4px 12px; background: #fce4ec; color: #c62828; border-radius: 12px; font-size: 12px; font-weight: 600; }
  `],
})
export class RfJobLogFormComponent {
  private currentService = inject(CurrentJobLogService);

  entity = computed(() => this.currentService.selectedItem());
  fields = computed(() => JobLogDto.toFormFields(this.entity()) as RfFormField[]);
  packages = this.currentService.packages;

  selectedPackageId: number | null = null;

  packageColumns: Column[] = DailyPermitPackageDto.toTableColumns(['id', 'name', 'permitNumber']);

  onSubmit(formData: any): void {
    this.currentService.saveJobLog(formData);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.currentService.removeJobLogFromList(entity.id);
    }
  }

  createPackage(): void {
    this.currentService.createPackageForJob();
  }

  openPackage(pkg: DailyPermitPackageDto): void {
    this.selectedPackageId = pkg.id;
    if (pkg.id) {
      this.currentService.navigateToPackage(pkg.id);
    }
  }

  detachSelectedPackage(): void {
    if (this.selectedPackageId) {
      this.currentService.detachPackageFromJob(this.selectedPackageId);
      this.selectedPackageId = null;
    }
  }

  closeJob(): void {
    this.currentService.closeJob();
  }
}
