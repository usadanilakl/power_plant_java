import { Component, inject, computed, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { WorkAreaMapStateService } from './work-area-map-state.service';
import { WorkAreaDto, WorkAreaPermitCounts } from '../../../../models/permits/work-area.model';
import { LotoStandardService } from '../../../../services/loto/loto-standard.service';
import { Option } from '../../../../models/option.model';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { WorkAreaNavTableComponent } from './work-area-nav-table.component';
import { WorkAreaContextMenuService } from '../services/work-area-context-menu.service';
import { WorkAreaGroupingCriteria, WorkAreaLeftMenuService } from '../services/work-area-left-menu.service';

@Component({
  selector: 'app-work-area-map-left-menu',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RfPopupProjectionComponent,
    RfReactiveFormComponent,
    RfToggleMenuComponent,
    WorkAreaNavTableComponent
  ],
  providers: [WorkAreaContextMenuService],
  template: `
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

    <div class="display-mode-bar">
      <div class="display-mode-toggle">
        <button
          class="display-mode-btn"
          [class.active]="currentDisplayMode() === 'toggle-menu'"
          (click)="setDisplayMode('toggle-menu')"
          title="Grouped menu view"
        >
          <mat-icon>account_tree</mat-icon>
        </button>
        <button
          class="display-mode-btn"
          [class.active]="currentDisplayMode() === 'table'"
          (click)="setDisplayMode('table')"
          title="Table view"
        >
          <mat-icon>view_list</mat-icon>
        </button>
      </div>
    </div>

    <div class="grouping-bar">
      <span class="grouping-label">Group by</span>
      <div class="grouping-buttons">
        @for (option of groupingOptions; track option.value) {
          <button
            class="grouping-btn"
            [class.active]="selectedGrouping() === option.value"
            (click)="onGroupingChange(option.value)"
          >
            {{ option.label }}
          </button>
        }
      </div>
    </div>

    @switch (state.mode()) {
      @case ('dev') {
        <div class="panel-section">
          <div class="section-header">
            <h3>Work Areas</h3>
            <div class="header-actions">
              <button
                class="icon-btn"
                title="Create counterpart from selected area"
                [disabled]="!state.selectedWorkArea()"
                (click)="state.openCounterpartForm()"
              >
                <mat-icon>swap_horiz</mat-icon>
              </button>
              <button class="icon-btn" title="New Work Area" (click)="state.openWorkAreaForm()">+</button>
            </div>
          </div>

          @if (currentDisplayMode() === 'toggle-menu') {
            <app-rf-toggle-menu
              [menuItems]="groupedWorkAreaItems()"
              [searchPlaceholder]="'Search work areas...'"
              (itemClick)="onMenuItemClick($event)"
              (itemDblClick)="onMenuItemDoubleClick($event)"
              (itemRightClick)="onMenuItemRightClick($event)"
            ></app-rf-toggle-menu>
          } @else {
            <app-work-area-nav-table
              [tableId]="'work-area-dev-table'"
              [items]="tableItems()"
              [columns]="devTableColumns()"
              (itemSelected)="onTableSelection($event)"
              (itemDoubleClicked)="onTableDoubleClick($event)"
            ></app-work-area-nav-table>
          }
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

          @if (currentDisplayMode() === 'toggle-menu') {
            <app-rf-toggle-menu
              [menuItems]="groupedWorkAreaItems()"
              [searchPlaceholder]="'Search work areas...'"
              (itemClick)="onMenuItemClick($event)"
              (itemDblClick)="onMenuItemDoubleClick($event)"
              (itemRightClick)="onMenuItemRightClick($event)"
            ></app-rf-toggle-menu>
          } @else {
            <app-work-area-nav-table
              [tableId]="'work-area-operator-table'"
              [items]="tableItems()"
              [columns]="devTableColumns()"
              (itemSelected)="onTableSelection($event)"
              (itemDoubleClicked)="onTableDoubleClick($event)"
            ></app-work-area-nav-table>
          }
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
            @if (currentDisplayMode() === 'toggle-menu') {
              <app-rf-toggle-menu
                [menuItems]="overviewMenuItems()"
                [searchPlaceholder]="'Search permit activity...'"
                (itemClick)="onMenuItemClick($event)"
                (itemRightClick)="onMenuItemRightClick($event)"
              ></app-rf-toggle-menu>
            } @else {
              <app-work-area-nav-table
                [tableId]="'work-area-overview-table'"
                [items]="overviewTableItems()"
                [columns]="overviewTableColumns()"
                (itemSelected)="onOverviewTableSelection($event)"
              ></app-work-area-nav-table>
            }
          }
        </div>
      }
    }

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

    .display-mode-bar {
      display: flex;
      justify-content: flex-end;
      padding: 8px 12px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .grouping-bar {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color, #e0e0e0);
      flex-shrink: 0;
    }

    .grouping-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--secondary-text, #6b7280);
    }

    .grouping-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .grouping-btn {
      padding: 6px 10px;
      border: 1px solid var(--border-color, #d1d5db);
      border-radius: 999px;
      background: transparent;
      color: var(--primary-text, #374151);
      cursor: pointer;
      font-size: 12px;
      line-height: 1;
      transition: all 0.2s ease;
    }

    .grouping-btn.active {
      background: var(--primary-color, #2196F3);
      border-color: var(--primary-color, #2196F3);
      color: white;
    }

    .display-mode-toggle {
      display: flex;
      gap: 4px;
      background: var(--secondary-background, #f5f5f5);
      padding: 4px;
      border-radius: 6px;
    }

    .display-mode-btn {
      padding: 6px 10px;
      background: transparent;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-text, #333);
    }

    .display-mode-btn.active {
      background: var(--primary-color, #2196F3);
      color: white;
    }

    .display-mode-btn mat-icon,
    .icon-btn mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
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
      width: 28px;
      height: 28px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #374151;
    }

    .icon-btn:hover { background: #f3f4f6; }
    .icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .header-actions { display: flex; gap: 6px; }

    .helper-text { padding: 0 16px; font-size: 12px; color: #9ca3af; margin: 0 0 8px; }

    .assignment-info { padding: 0 16px 16px; }
    .assignment-label { font-size: 12px; color: #6b7280; margin: 0 0 8px; }

    .assigned-area {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 10px;
      background: #eff6ff;
      border-radius: 4px;
      margin-bottom: 4px;
      font-size: 13px;
    }

    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #ef4444;
      font-size: 16px;
      padding: 0 4px;
    }

    .assign-select {
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 13px;
      margin-top: 8px;
    }

    app-rf-toggle-menu,
    app-work-area-nav-table {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
    }
  `],
})
export class WorkAreaMapLeftMenuComponent implements OnInit {
  initialDisplayMode = input<'table' | 'toggle-menu'>('toggle-menu');
  state = inject(WorkAreaMapStateService);
  private lotoStandardService = inject(LotoStandardService);
  private contextMenuService = inject(WorkAreaContextMenuService);
  private leftMenuService = inject(WorkAreaLeftMenuService);
  lotoStandardOptions = signal<Option[]>([]);
  currentDisplayMode = signal<'table' | 'toggle-menu'>('toggle-menu');
  selectedGrouping = signal<WorkAreaGroupingCriteria>('areaType');
  groupingOptions = this.leftMenuService.groupingOptions;

  ngOnInit(): void {
    this.currentDisplayMode.set(this.initialDisplayMode());
    this.loadLotoStandards();
  }

  devTableColumns = computed(() => WorkAreaDto.toTableColumns());
  tableItems = computed(() =>
    this.leftMenuService.sortWorkAreasForTable(
      this.state.workAreas(),
      this.selectedGrouping(),
      this.state.permitCounts()
    )
  );
  overviewItems = computed(() =>
    this.leftMenuService.sortOverviewItems(this.state.permitCounts(), this.selectedGrouping())
  );
  overviewTableItems = computed(() => this.overviewItems());
  overviewTableColumns = computed(() => [
    ...WorkAreaDto.toTableColumns(),
    {
      id: 'safeWorkCount',
      header: 'SW',
      accessorFn: (item: WorkAreaDto) => this.getPermitCountForArea(item.id).safeWorkCount.toString(),
    },
    {
      id: 'hotWorkCount',
      header: 'HW',
      accessorFn: (item: WorkAreaDto) => this.getPermitCountForArea(item.id).hotWorkCount.toString(),
    },
    {
      id: 'confinedSpaceCount',
      header: 'CS',
      accessorFn: (item: WorkAreaDto) => this.getPermitCountForArea(item.id).confinedSpaceCount.toString(),
    }
  ]);
  groupedWorkAreaItems = computed(() => this.buildGroupedWorkAreaItems());
  overviewMenuItems = computed(() => this.buildOverviewMenuItems());

  workAreaFormFields = computed(() => {
    const editing = this.state.editingWorkArea();
    return WorkAreaDto.toFormFields(editing ?? new WorkAreaDto(), this.lotoStandardOptions());
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

  onTableSelection(area: WorkAreaDto | null): void {
    if (area) {
      this.onWorkAreaClick(area);
    }
  }

  onTableDoubleClick(area: WorkAreaDto): void {
    this.onWorkAreaClick(area);
    if (this.state.mode() === 'dev') {
      this.state.openWorkAreaForm(area);
    }
  }

  onOverviewTableSelection(area: WorkAreaDto | null): void {
    if (area) {
      this.onWorkAreaClick(area);
    }
  }

  onMenuItemClick(item: NestedItem): void {
    if (item.objectType !== 'WorkArea') {
      return;
    }
    const area = this.state.workAreas().find(workArea => workArea.id === Number(item.id));
    if (area) {
      this.onWorkAreaClick(area);
    }
  }

  onMenuItemDoubleClick(item: NestedItem): void {
    if (item.objectType !== 'WorkArea') {
      return;
    }
    const area = this.state.workAreas().find(workArea => workArea.id === Number(item.id));
    if (area) {
      this.onWorkAreaClick(area);
      if (this.state.mode() === 'dev') {
        this.state.openWorkAreaForm(area);
      }
    }
  }

  onMenuItemRightClick(event: { event: MouseEvent; item: NestedItem }): void {
    if (event.item.objectType !== 'WorkArea') {
      return;
    }

    const area = this.state.workAreas().find(workArea => workArea.id === Number(event.item.id));
    if (!area) {
      return;
    }

    this.contextMenuService.showContextMenu(area, event.event);
    this.contextMenuService.positionContextMenu(event.event, 220, 220);
  }

  onGroupingChange(groupBy: WorkAreaGroupingCriteria): void {
    this.selectedGrouping.set(groupBy);
    if (groupBy === 'permitActivity' && this.state.permitCounts().length === 0) {
      this.state.loadPermitCounts();
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
    dto.constantLotoIds = Array.isArray(formData.constantLotoIds)
      ? formData.constantLotoIds.map((id: any) => Number(id)).filter((id: number) => !Number.isNaN(id))
      : [];
    this.state.saveWorkArea(dto);
  }

  onWorkAreaFormDelete(): void {
    const editing = this.state.editingWorkArea();
    if (editing?.id && confirm('Delete this work area?')) {
      this.state.deleteWorkArea(editing.id);
    }
  }

  setDisplayMode(mode: 'table' | 'toggle-menu'): void {
    this.currentDisplayMode.set(mode);
  }

  private loadLotoStandards(): void {
    this.lotoStandardService.getAllLotoStandards().subscribe({
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

  private buildGroupedWorkAreaItems(): NestedItem[] {
    return this.leftMenuService.buildGroupedWorkAreaItems(
      this.state.workAreas(),
      this.state.mode(),
      this.selectedGrouping(),
      this.state.permitCounts()
    );
  }

  private buildOverviewMenuItems(): NestedItem[] {
    return this.leftMenuService.buildOverviewMenuItems(
      this.state.permitCounts(),
      this.selectedGrouping()
    );
  }

  private getWorkAreaSubtitle(area: WorkAreaDto): string {
    const parts: string[] = [];
    if (area.areaType?.name) {
      parts.push(area.areaType.name);
    }
    parts.push(area.shapeId ? 'Mapped' : 'Unmapped');
    return parts.join(' • ');
  }

  private getOverviewSubtitle(pc: WorkAreaPermitCounts): string {
    const parts: string[] = [];
    if (pc.safeWorkCount > 0) parts.push(`SW ${pc.safeWorkCount}`);
    if (pc.hotWorkCount > 0) parts.push(`HW ${pc.hotWorkCount}`);
    if (pc.confinedSpaceCount > 0) parts.push(`CS ${pc.confinedSpaceCount}`);
    return parts.length > 0 ? parts.join(' • ') : 'No active permits';
  }

  private getOverviewColor(pc: WorkAreaPermitCounts): string {
    const total = pc.safeWorkCount + pc.hotWorkCount + pc.confinedSpaceCount;
    if (total > 5) return '#ef4444';
    if (total > 2) return '#f59e0b';
    if (total > 0) return '#22c55e';
    return '#94a3b8';
  }

  private getPermitCountForArea(workAreaId: number): { safeWorkCount: number; hotWorkCount: number; confinedSpaceCount: number } {
    const found = this.state.permitCounts().find(pc => pc.workArea?.id === workAreaId);
    return {
      safeWorkCount: found?.safeWorkCount ?? 0,
      hotWorkCount: found?.hotWorkCount ?? 0,
      confinedSpaceCount: found?.confinedSpaceCount ?? 0,
    };
  }
}
