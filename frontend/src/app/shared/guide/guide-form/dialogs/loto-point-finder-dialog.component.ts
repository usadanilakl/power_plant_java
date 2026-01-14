import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Existing components to embed
import { RfFileLeftMenuComponent } from '../../../../features/files/refactored/rf-file-left-menu/rf-file-left-menu.component';
import { RfLotoPointLeftMenuComponent } from '../../../../features/loto-points/refactored/rf-loto-point-left-menu/rf-loto-point-left-menu.component';
import { RfLotoPointTableComponent } from '../../../../features/loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { RfUnifiedImageViewerComponent } from '../../../image/refactored/rf-unified-image-viewer/rf-unified-image-viewer.component';

// Services
import { CurrentFileService } from '../../../../services/current-file.service';
import { RfLotoPointStateService } from '../../../../features/loto-points/refactored/services/rf-loto-point-state.service';

// Table services required by RfLotoPointTableComponent
import { TableSelectionService } from '../../../table/refactored/services/table-selection.service';
import { TableStateService } from '../../../table/refactored/services/table-state.service';
import { TableDragService } from '../../../table/refactored/services/table-drag.service';
import { TableSearchService } from '../../../table/refactored/services/table-search.service';
import { TableSortService } from '../../../table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../table/refactored/services/table-sync.service';
import { TableClickService } from '../../../table/refactored/services/table-click.service';
import { TableControlsService } from '../../../table/refactored/services/table-controls.service';
import { TableDataService } from '../../../table/refactored/services/table-data.service';
import { RfLotoPointTableDataService } from '../../../../features/loto-points/refactored/rf-loto-point-table/rf-loto-point-table-data.service';
import { LotoPointBulkEditService } from '../../../../features/loto-points/refactored/services/loto-point-bulk-edit.service';

// Models
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { FileDto } from '../../../../models/file/file.model';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { ViewerDataSource, ViewerConfig } from '../../../image/refactored/rf-unified-image-viewer/rf-unified-image-viewer.component';

export interface LotoPointFinderDialogData {
  mode: 'single' | 'multi';
  preselectedIds?: number[];
  initialTab?: 'file' | 'loto-point';
}

export interface LotoPointFinderDialogResult {
  selectedLotoPoints: LotoPointDto[];
  cancelled: boolean;
}

type ViewTab = 'file' | 'loto-point';
type DisplayMode = 'table' | 'menu';

@Component({
  selector: 'app-loto-point-finder-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    RfFileLeftMenuComponent,
    RfLotoPointLeftMenuComponent,
    RfLotoPointTableComponent,
    RfUnifiedImageViewerComponent,
  ],
  providers: [
    // Provide isolated instances for this dialog's table
    RfLotoPointStateService,
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    TableClickService,
    TableControlsService,
    LotoPointBulkEditService,
    RfLotoPointTableDataService,
    {
      provide: TableDataService,
      useClass: RfLotoPointTableDataService,
    },
  ],
  template: `
    <div class="finder-dialog" [class.resizing]="isResizing()">
      <!-- Header -->
      <div class="dialog-header">
        <h2>
          <mat-icon>search</mat-icon>
          Find LOTO Points
        </h2>
        <div class="header-actions">
          <span class="selection-count" *ngIf="selectedItems().length > 0">
            {{ selectedItems().length }} selected
          </span>
          <button mat-icon-button (click)="toggleHelp()" matTooltip="Show Help">
            <mat-icon>help_outline</mat-icon>
          </button>
          <button mat-icon-button (click)="onCancel()" matTooltip="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Help Panel (collapsible) -->
      @if (showHelp()) {
        <div class="help-panel">
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>lightbulb</mat-icon>
                How to use the LOTO Point Finder
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="help-content">
              <div class="help-section">
                <h4><mat-icon>tab</mat-icon> View Tabs</h4>
                <p><strong>Files:</strong> Browse P&ID files and see equipment on drawings. Click a shape to select its LOTO point.</p>
                <p><strong>LOTO Points:</strong> Search/browse all LOTO points directly by tag number, description, or category.</p>
              </div>
              <div class="help-section">
                <h4><mat-icon>view_list</mat-icon> Display Modes</h4>
                <p><strong>Tree View:</strong> Browse hierarchically by system, equipment type, or location (uses "bucket of words" matching).</p>
                <p><strong>Table View:</strong> Search and filter with column headers. Type in column headers to filter results.</p>
              </div>
              <div class="help-section">
                <h4><mat-icon>touch_app</mat-icon> Selecting LOTO Points</h4>
                <p><strong>From P&ID:</strong> Click on equipment shapes in the viewer. Double-click to add and confirm.</p>
                <p><strong>From Table:</strong> Click rows to select. Use Ctrl+Click for multiple. Double-click to add immediately.</p>
                <p><strong>From Menu:</strong> Click on leaf items (LOTO points) in the tree to add them.</p>
              </div>
            </div>
          </mat-expansion-panel>
        </div>
      }

      <!-- Selected Items Chips -->
      @if (selectedItems().length > 0) {
        <div class="selected-bar">
          <mat-chip-set>
            @for (item of selectedItems(); track item.id) {
              <mat-chip (removed)="removeSelection(item)">
                {{ item.tagNumber || 'ID: ' + item.id }}
                <button matChipRemove>
                  <mat-icon>cancel</mat-icon>
                </button>
              </mat-chip>
            }
          </mat-chip-set>
          <button mat-stroked-button color="warn" (click)="clearSelections()">
            Clear All
          </button>
        </div>
      }

      <!-- Main Content -->
      <div class="dialog-content">
        <!-- Left Panel -->
        <div class="left-panel" [style.width.px]="leftPanelWidth()">
          <!-- Tabs -->
          <div class="panel-tabs">
            <button
              class="tab-btn"
              [class.active]="viewTab() === 'file'"
              (click)="setViewTab('file')"
              matTooltip="Browse by P&ID files"
            >
              <mat-icon>folder</mat-icon>
              Files
            </button>
            <button
              class="tab-btn"
              [class.active]="viewTab() === 'loto-point'"
              (click)="setViewTab('loto-point')"
              matTooltip="Browse all LOTO points"
            >
              <mat-icon>lock</mat-icon>
              LOTO Points
            </button>

            <!-- Mode Toggle -->
            <div class="mode-toggle">
              <button
                mat-icon-button
                [class.active]="displayMode() === 'menu'"
                (click)="setDisplayMode('menu')"
                matTooltip="Tree View - browse by category"
              >
                <mat-icon>account_tree</mat-icon>
              </button>
              <button
                mat-icon-button
                [class.active]="displayMode() === 'table'"
                (click)="setDisplayMode('table')"
                matTooltip="Table View - search and filter"
              >
                <mat-icon>view_list</mat-icon>
              </button>
            </div>
          </div>

          <!-- Panel Content -->
          <div class="panel-content">
            @if (viewTab() === 'file') {
              @if (displayMode() === 'menu') {
                <app-rf-file-left-menu></app-rf-file-left-menu>
              } @else {
                <div class="table-placeholder">
                  <mat-icon>folder_open</mat-icon>
                  <p>Switch to Tree View to browse files</p>
                  <button mat-stroked-button (click)="setDisplayMode('menu')">
                    <mat-icon>account_tree</mat-icon>
                    Use Tree View
                  </button>
                </div>
              }
            } @else {
              @if (displayMode() === 'menu') {
                <app-rf-loto-point-left-menu></app-rf-loto-point-left-menu>
              } @else {
                <app-rf-loto-point-table
                  [tableId]="'finder-loto-point-table'"
                  [enableDragDrop]="false"
                  [loadMoreEnabled]="true"
                  (selectedItemsEvent)="onTableSelectionChange($event)"
                  (rowDoubleClickedEvent)="onRowDoubleClick($event)"
                ></app-rf-loto-point-table>
              }
            }
          </div>
        </div>

        <!-- Resizable Divider -->
        <div
          class="divider"
          [class.active]="isResizing()"
          (mousedown)="onDividerMouseDown($event)"
        >
          <div class="divider-handle"></div>
        </div>

        <!-- Right Panel - File Viewer -->
        <div class="right-panel">
          @if (currentFile()) {
            <div class="viewer-header">
              <span class="file-name">{{ currentFile()?.name }}</span>
              <span class="file-hint">Click on equipment shapes to select LOTO points</span>
            </div>
            <div class="viewer-content">
              <app-rf-unified-image-viewer
                [dataSource]="viewerDataSource()"
                [config]="viewerConfig"
                [mode]="viewerMode"
                [highlightedShapeIds]="highlightedEquipmentIds()"
                (shapeClicked)="onShapeClicked($event)"
                (shapeDoubleClicked)="onShapeDoubleClicked($event)"
              ></app-rf-unified-image-viewer>
            </div>
          } @else {
            <div class="empty-viewer">
              <mat-icon>image</mat-icon>
              <p>Select a file to view P&ID</p>
              <span>Click on a file in the left menu to load it</span>
              <div class="empty-hint">
                <mat-icon>lightbulb</mat-icon>
                <span>Tip: Equipment shapes on P&IDs show associated LOTO points</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Footer -->
      <mat-divider></mat-divider>
      <div class="dialog-footer">
        <button mat-stroked-button (click)="onCancel()">Cancel</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="selectedItems().length === 0"
          (click)="onConfirm()"
        >
          <mat-icon>check</mat-icon>
          Select {{ selectedItems().length }} LOTO Point{{ selectedItems().length !== 1 ? 's' : '' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .finder-dialog {
      display: flex;
      flex-direction: column;
      width: 95vw;
      max-width: 1400px;
      height: 85vh;
      max-height: 900px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid #e0e0e0;
      background: #fafafa;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .dialog-header mat-icon {
      color: #1976d2;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .selection-count {
      font-size: 14px;
      color: #1976d2;
      font-weight: 500;
      padding: 4px 12px;
      background: #e3f2fd;
      border-radius: 16px;
    }

    /* Help Panel */
    .help-panel {
      background: #fff8e1;
      border-bottom: 1px solid #ffe082;
    }

    .help-panel mat-expansion-panel {
      background: transparent;
      box-shadow: none;
    }

    .help-panel mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f57c00;
    }

    .help-panel mat-panel-title mat-icon {
      color: #ffc107;
    }

    .help-content {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      padding: 8px 0;
    }

    .help-section {
      background: white;
      padding: 12px;
      border-radius: 8px;
      border: 1px solid #ffe082;
    }

    .help-section h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 8px 0;
      font-size: 14px;
      color: #333;
    }

    .help-section h4 mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .help-section p {
      margin: 4px 0;
      font-size: 12px;
      color: #555;
      line-height: 1.4;
    }

    .selected-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #e8f5e9;
      border-bottom: 1px solid #c8e6c9;
    }

    .dialog-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .left-panel {
      display: flex;
      flex-direction: column;
      min-width: 300px;
      max-width: 600px;
      border-right: 1px solid #e0e0e0;
    }

    .panel-tabs {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 8px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border: none;
      background: transparent;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      color: #666;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #e0e0e0;
    }

    .tab-btn.active {
      background: #1976d2;
      color: white;
    }

    .tab-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .mode-toggle {
      margin-left: auto;
      display: flex;
      gap: 4px;
    }

    .mode-toggle button {
      opacity: 0.6;
    }

    .mode-toggle button.active {
      opacity: 1;
      color: #1976d2;
    }

    .panel-content {
      flex: 1;
      overflow: auto;
    }

    .divider {
      width: 6px;
      background: #e0e0e0;
      cursor: col-resize;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }

    .divider:hover, .divider.active {
      background: #1976d2;
    }

    .divider-handle {
      width: 2px;
      height: 40px;
      background: #999;
      border-radius: 2px;
    }

    .divider:hover .divider-handle,
    .divider.active .divider-handle {
      background: white;
    }

    .right-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 400px;
      overflow: hidden;
    }

    .viewer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .file-name {
      font-weight: 500;
      color: #333;
    }

    .file-hint {
      font-size: 12px;
      color: #666;
      font-style: italic;
    }

    .viewer-content {
      flex: 1;
      overflow: auto;
      background: #fafafa;
    }

    .empty-viewer {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #999;
      text-align: center;
      gap: 8px;
    }

    .empty-viewer mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ddd;
    }

    .empty-viewer p {
      margin: 0;
      font-size: 16px;
      color: #666;
    }

    .empty-viewer > span {
      font-size: 13px;
    }

    .empty-hint {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px 20px;
      background: #fff8e1;
      border-radius: 8px;
      border: 1px solid #ffe082;
    }

    .empty-hint mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #ffc107;
    }

    .empty-hint span {
      font-size: 13px;
      color: #5d4037;
    }

    .table-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: #999;
      text-align: center;
      gap: 16px;
    }

    .table-placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ddd;
    }

    .table-placeholder p {
      margin: 0;
    }

    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      background: #fafafa;
    }

    .finder-dialog.resizing {
      cursor: col-resize;
      user-select: none;
    }
  `],
})
export class LotoPointFinderDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<LotoPointFinderDialogComponent>);
  private dialogData = inject<LotoPointFinderDialogData>(MAT_DIALOG_DATA);
  private currentFileService = inject(CurrentFileService);
  private lotoPointStateService = inject(RfLotoPointStateService);

  private destroy$ = new Subject<void>();

  // State
  viewTab = signal<ViewTab>('file');
  displayMode = signal<DisplayMode>('menu');
  leftPanelWidth = signal<number>(400);
  isResizing = signal<boolean>(false);
  showHelp = signal<boolean>(false);

  // Selection
  selectedItems = signal<LotoPointDto[]>([]);

  // File viewer state
  currentFile = signal<FileDto | null>(null);
  currentEquipmentList = signal<EquipmentDto[]>([]);

  // Computed data source for the viewer - includes equipment list for shapes
  viewerDataSource = computed<ViewerDataSource>(() => {
    const file = this.currentFile();
    const equipmentList = this.currentEquipmentList();

    if (file) {
      return {
        type: 'file',
        file: file,
        equipmentList: equipmentList,
      };
    }
    return {
      type: 'file',
      file: null,
      equipmentList: [],
    };
  });

  viewerConfig: ViewerConfig = {
    showCarousel: false,
    showTable: false,
    legend: true,
    highlightMode: 'clicked',
  };

  // Use EQUIPMENT_BROWSER mode so shapes are clickable
  viewerMode: 'EQUIPMENT_BROWSER' = 'EQUIPMENT_BROWSER';

  // Computed list of equipment IDs to highlight based on selected LOTO points
  highlightedEquipmentIds = computed<number[]>(() => {
    const selectedLotoPoints = this.selectedItems();
    const equipmentIds: number[] = [];

    selectedLotoPoints.forEach(lotoPoint => {
      if (lotoPoint.equipmentList) {
        lotoPoint.equipmentList.forEach(eq => {
          if (eq.id && !equipmentIds.includes(eq.id)) {
            equipmentIds.push(eq.id);
          }
        });
      }
    });

    return equipmentIds;
  });

  ngOnInit(): void {
    // Set initial tab from dialog data
    if (this.dialogData?.initialTab) {
      this.viewTab.set(this.dialogData.initialTab);
      // If starting with LOTO table, show table mode
      if (this.dialogData.initialTab === 'loto-point') {
        this.displayMode.set('table');
      }
    }

    // Subscribe to current file changes
    this.currentFileService.currentFile$
      .pipe(takeUntil(this.destroy$))
      .subscribe((file: FileDto | null) => {
        this.currentFile.set(file);
      });

    // Subscribe to equipment list for the current file (for shapes)
    this.currentFileService.elements$
      .pipe(takeUntil(this.destroy$))
      .subscribe((equipment: EquipmentDto[]) => {
        this.currentEquipmentList.set(equipment);
      });

    // Subscribe to associated LOTO points from the current file
    this.currentFileService.associatedLotoPoints$
      .pipe(takeUntil(this.destroy$))
      .subscribe((lotoPoints: LotoPointDto[]) => {
        // These are the LOTO points associated with the current file's equipment
        // Can be used to show available selections
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleHelp(): void {
    this.showHelp.update(v => !v);
  }

  setViewTab(tab: ViewTab): void {
    this.viewTab.set(tab);
  }

  setDisplayMode(mode: DisplayMode): void {
    this.displayMode.set(mode);
  }

  // Resizing
  onDividerMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set(true);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing()) return;

    const newWidth = event.clientX - 20; // Account for dialog margin
    if (newWidth >= 300 && newWidth <= 600) {
      this.leftPanelWidth.set(newWidth);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing.set(false);
  }

  // Selection methods
  addToSelection(item: LotoPointDto): void {
    const current = this.selectedItems();
    if (!current.some(s => s.id === item.id)) {
      if (this.dialogData?.mode === 'single') {
        this.selectedItems.set([item]);
      } else {
        this.selectedItems.set([...current, item]);
      }
    }
  }

  removeSelection(item: LotoPointDto): void {
    this.selectedItems.set(this.selectedItems().filter(s => s.id !== item.id));
  }

  clearSelections(): void {
    this.selectedItems.set([]);
  }

  onTableSelectionChange(items: LotoPointDto[]): void {
    // When clicking a row in the LOTO table, open the file in the viewer
    // Selection happens via shape clicks on the P&ID, not from the table
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      this.openFileForLotoPoint(lastItem);
    }
  }

  /**
   * Opens the file associated with a LOTO point in the viewer
   */
  private openFileForLotoPoint(lotoPoint: LotoPointDto): void {
    // Get the first equipment that has a mainFileObject
    const equipmentWithFile = lotoPoint.equipmentList?.find(
      eq => eq.mainFileObject?.id
    );

    if (equipmentWithFile?.mainFileObject) {
      // Set the file in the current file service - it will fetch complete data if needed
      const file = equipmentWithFile.mainFileObject;
      this.currentFileService.setCurrentFile(file as FileDto);
      console.log('Opening file for LOTO point:', lotoPoint.tagNumber, '- File:', file.name);
    } else {
      console.log('No file associated with LOTO point:', lotoPoint.tagNumber);
    }
  }

  onRowDoubleClick(item: LotoPointDto): void {
    // Double-click adds to selection AND opens the file
    this.addToSelection(item);
    this.openFileForLotoPoint(item);
    // Optionally auto-confirm on double-click for single mode
    if (this.dialogData?.mode === 'single') {
      this.onConfirm();
    }
  }

  // Shape click handlers for P&ID viewer
  onShapeClicked(shape: any): void {
    // The shape's id corresponds to an equipment id
    // Look up the equipment in our current equipment list to get associated LOTO points
    const shapeId = shape?.id;
    if (!shapeId) {
      console.log('Shape clicked but no ID found');
      return;
    }

    // Find the equipment in the current file's equipment list
    const equipmentList = this.currentEquipmentList();
    const equipment = equipmentList.find(eq => eq.id === shapeId);

    if (equipment?.lotoPoints && equipment.lotoPoints.length > 0) {
      // If equipment has multiple LOTO points, add all or just the first one
      // For now, add the first one (user can click again for others)
      const lotoPoint = equipment.lotoPoints[0];
      this.addToSelection(lotoPoint);
      console.log('Added LOTO point from shape:', lotoPoint.tagNumber);
    } else {
      // Equipment exists but has no LOTO points directly
      // Try looking in associated LOTO points from the current file service
      console.log('Shape clicked, equipment ID:', shapeId, '- no direct LOTO points found');
    }
  }

  onShapeDoubleClicked(shape: any): void {
    // On double-click, add and potentially confirm if single mode
    this.onShapeClicked(shape);
    if (this.dialogData?.mode === 'single' && this.selectedItems().length > 0) {
      this.onConfirm();
    }
  }

  onCancel(): void {
    this.dialogRef.close({
      selectedLotoPoints: [],
      cancelled: true,
    } as LotoPointFinderDialogResult);
  }

  onConfirm(): void {
    this.dialogRef.close({
      selectedLotoPoints: this.selectedItems(),
      cancelled: false,
    } as LotoPointFinderDialogResult);
  }
}
