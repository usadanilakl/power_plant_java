import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { WorkAreaMapStateService } from './work-area-map-state.service';
import { WorkAreaDto, WorkAreaPermitCounts } from '../../../../models/permits/work-area.model';

@Component({
  selector: 'app-work-area-map-left-menu',
  standalone: true,
  imports: [CommonModule, RfPopupProjectionComponent, RfReactiveFormComponent],
  template: `
    <!-- Mode Tabs -->
    <div class="mode-tabs">
      <button
        class="mode-tab"
        [class.active]="state.mode() === 'operator'"
        (click)="state.setMode('operator')"
      >Select</button>
      <button
        class="mode-tab"
        [class.active]="state.mode() === 'dev'"
        (click)="state.setMode('dev')"
      >Edit</button>
      <button
        class="mode-tab"
        [class.active]="state.mode() === 'overview'"
        (click)="state.setMode('overview')"
      >Overview</button>
    </div>

    <!-- Left Panel Content -->
    @switch (state.mode()) {
      @case ('dev') {
        <div class="panel-section">
          <div class="section-header">
            <h3>Work Areas</h3>
            <button class="icon-btn" title="New Work Area" (click)="state.openWorkAreaForm()">+</button>
          </div>
          <div class="area-list">
            @for (area of state.workAreas(); track area.id) {
              <div
                class="area-item"
                [class.selected]="state.selectedWorkArea()?.id === area.id"
                (click)="onWorkAreaClick(area)"
                (dblclick)="state.openWorkAreaForm(area)"
              >
                <div class="area-info">
                  <span class="area-name">{{ area.name }}</span>
                  <span class="area-type">{{ area.areaType?.name }}</span>
                </div>
                @if (area.shapeId) {
                  <span class="shape-badge" title="Has map shape">&#9632;</span>
                }
              </div>
            }
          </div>
        </div>

        @if (state.selectedShapeId()) {
          <div class="panel-section assignment-section">
            <div class="section-header">
              <h3>Shape Assignment</h3>
            </div>
            <div class="assignment-info">
              <p class="assignment-label">Assigned areas:</p>
              @for (wa of state.selectedShapeWorkAreas(); track wa.id) {
                <div class="assigned-area">
                  <span>{{ wa.name }}</span>
                  <button
                    class="remove-btn"
                    title="Remove assignment"
                    (click)="onRemoveAssignment(wa.id)"
                  >&times;</button>
                </div>
              }
              @if (state.selectedShapeWorkAreas().length === 0) {
                <p class="helper-text">No areas assigned to this shape.</p>
              }
              @if (state.unassignedWorkAreas().length > 0) {
                <select class="assign-select" (change)="onAssignArea($event)">
                  <option value="">-- Assign area --</option>
                  @for (wa of state.unassignedWorkAreas(); track wa.id) {
                    <option [value]="wa.id">{{ wa.name }}</option>
                  }
                </select>
              }
            </div>
          </div>
        }
      }

      @case ('operator') {
        <div class="panel-section">
          <div class="section-header">
            <h3>Select Work Area</h3>
          </div>
          <p class="helper-text">Click a shape on the map to select a work area.</p>
          <div class="area-list">
            @for (area of state.workAreas(); track area.id) {
              <div
                class="area-item"
                [class.selected]="state.selectedWorkArea()?.id === area.id"
                (click)="onWorkAreaClick(area)"
              >
                <span class="area-name">{{ area.name }}</span>
                <span class="area-type">{{ area.areaType?.name }}</span>
              </div>
            }
          </div>
        </div>
      }

      @case ('overview') {
        <div class="panel-section">
          <div class="section-header">
            <h3>Active Permits</h3>
          </div>
          @if (state.isLoading()) {
            <p class="helper-text">Loading permit counts...</p>
          } @else {
            <div class="area-list">
              @for (pc of state.permitCounts(); track pc.workArea?.id) {
                <div
                  class="area-item overview-item"
                  [class.selected]="state.selectedWorkArea()?.id === pc.workArea?.id"
                  (click)="onPermitCountClick(pc)"
                >
                  <div class="area-info">
                    <span class="area-name">{{ pc.workArea?.name }}</span>
                  </div>
                  <div class="permit-counts">
                    @if (pc.safeWorkCount > 0) {
                      <span class="count-badge sw" title="Safe Work permits">SW: {{ pc.safeWorkCount }}</span>
                    }
                    @if (pc.hotWorkCount > 0) {
                      <span class="count-badge hw" title="Hot Work permits">HW: {{ pc.hotWorkCount }}</span>
                    }
                    @if (pc.confinedSpaceCount > 0) {
                      <span class="count-badge cs" title="Confined Space permits">CS: {{ pc.confinedSpaceCount }}</span>
                    }
                    @if (pc.safeWorkCount === 0 && pc.hotWorkCount === 0 && pc.confinedSpaceCount === 0) {
                      <span class="count-badge none">None</span>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    }

    <!-- Work Area Form Popup -->
    <app-rf-popup-projection
      [isOpen]="state.formOpen()"
      [fullHeight]="true"
      (close)="state.closeWorkAreaForm()"
    >
      <app-rf-reactive-form
        [fields]="workAreaFormFields()"
        [entity]="state.editingWorkArea() ?? {}"
        [title]="workAreaFormTitle()"
        [submitButtonText]="'Save'"
        [deleteButtonText]="state.editingWorkArea()?.id ? 'Delete' : ''"
        (formSubmit)="onWorkAreaFormSubmit($event)"
        (formDelete)="onWorkAreaFormDelete()"
      ></app-rf-reactive-form>
    </app-rf-popup-projection>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
    }

    .mode-tabs {
      display: flex;
      border-bottom: 2px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .mode-tab {
      flex: 1;
      padding: 10px 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
      transition: all 0.2s;
    }

    .mode-tab:hover { background: rgba(0, 0, 0, 0.04); }

    .mode-tab.active {
      color: #2563eb;
      border-bottom: 2px solid #2563eb;
      margin-bottom: -2px;
    }

    .panel-section {
      display: flex;
      flex-direction: column;
      overflow: hidden;
      flex: 1;
    }

    .assignment-section {
      flex: 0 0 auto;
      border-top: 1px solid var(--border-color, #e0e0e0);
      max-height: 250px;
      overflow-y: auto;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px 8px;
      flex-shrink: 0;
    }

    .section-header h3 { margin: 0; font-size: 14px; font-weight: 600; color: #1f2937; }

    .icon-btn {
      width: 28px; height: 28px;
      border: 1px solid #d1d5db; border-radius: 4px;
      background: white; cursor: pointer;
      font-size: 16px; display: flex; align-items: center; justify-content: center;
      color: #374151;
    }

    .icon-btn:hover { background: #f3f4f6; }

    .helper-text { padding: 0 16px; font-size: 12px; color: #9ca3af; margin: 0 0 8px; }

    .area-list { flex: 1; overflow-y: auto; padding: 0 8px 8px; }

    .area-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 8px 12px; margin-bottom: 2px; border-radius: 6px;
      cursor: pointer; transition: background 0.15s; font-size: 13px;
    }

    .area-item:hover { background: rgba(0, 0, 0, 0.04); }
    .area-item.selected { background: #dbeafe; }

    .area-info { display: flex; flex-direction: column; gap: 2px; }
    .area-name { font-weight: 500; color: #1f2937; }
    .area-type { font-size: 11px; color: #9ca3af; }
    .shape-badge { color: #3b82f6; font-size: 10px; }

    .assignment-info { padding: 0 16px 16px; }
    .assignment-label { font-size: 12px; color: #6b7280; margin: 0 0 8px; }

    .assigned-area {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 10px; background: #eff6ff; border-radius: 4px;
      margin-bottom: 4px; font-size: 13px;
    }

    .remove-btn {
      background: none; border: none; cursor: pointer;
      color: #ef4444; font-size: 16px; padding: 0 4px;
    }

    .assign-select {
      width: 100%; padding: 6px 8px;
      border: 1px solid #d1d5db; border-radius: 4px;
      font-size: 13px; margin-top: 8px;
    }

    .overview-item { flex-direction: column; align-items: flex-start; gap: 4px; }
    .permit-counts { display: flex; gap: 6px; flex-wrap: wrap; }
    .count-badge { font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: 500; }
    .count-badge.sw { background: #dbeafe; color: #1d4ed8; }
    .count-badge.hw { background: #fee2e2; color: #b91c1c; }
    .count-badge.cs { background: #fef3c7; color: #92400e; }
    .count-badge.none { background: #f3f4f6; color: #9ca3af; }
  `],
})
export class WorkAreaMapLeftMenuComponent {
  state = inject(WorkAreaMapStateService);

  workAreaFormFields = computed(() => {
    const editing = this.state.editingWorkArea();
    return WorkAreaDto.toFormFields(editing ?? new WorkAreaDto());
  });

  workAreaFormTitle = computed(() => {
    const editing = this.state.editingWorkArea();
    return editing?.id ? 'Edit Work Area' : 'New Work Area';
  });

  onWorkAreaClick(area: WorkAreaDto): void {
    this.state.selectedWorkArea.set(area);
    if (area.shapeId) {
      this.state.selectedShapeId.set(area.shapeId);
    }
  }

  onPermitCountClick(pc: WorkAreaPermitCounts): void {
    if (pc.workArea) {
      this.onWorkAreaClick(pc.workArea as WorkAreaDto);
    }
  }

  onAssignArea(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const workAreaId = parseInt(select.value, 10);
    const shapeId = this.state.selectedShapeId();
    if (workAreaId && shapeId) {
      this.state.assignWorkAreaToShape(workAreaId, shapeId);
    }
    select.value = '';
  }

  onRemoveAssignment(workAreaId: number): void {
    const shapeId = this.state.selectedShapeId();
    if (shapeId) {
      this.state.removeWorkAreaFromShape(workAreaId, shapeId);
    }
  }

  onWorkAreaFormSubmit(formData: any): void {
    const current = this.state.editingWorkArea();
    const dto = new WorkAreaDto({ ...current, ...formData });
    if (formData.areaType && typeof formData.areaType === 'number') {
      dto.areaType = { id: formData.areaType, name: '' };
    }
    this.state.saveWorkArea(dto);
  }

  onWorkAreaFormDelete(): void {
    const editing = this.state.editingWorkArea();
    if (editing?.id) {
      if (confirm('Delete this work area?')) {
        this.state.deleteWorkArea(editing.id);
      }
    }
  }
}
