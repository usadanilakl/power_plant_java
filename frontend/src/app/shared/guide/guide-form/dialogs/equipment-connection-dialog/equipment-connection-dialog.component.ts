import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  HostListener,
  DestroyRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RfLotoPointApiService } from '../../../../../features/loto-points/refactored/services/rf-loto-point-api.service';

import { RfFileLeftMenuComponent } from '../../../../../features/files/refactored/rf-file-left-menu/rf-file-left-menu.component';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { RfEquipmentService } from '../../../../../features/equipment/refactored/services/rf-equipment.service';
import { CurrentFileService } from '../../../../../services/current-file.service';

import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { FileDto } from '../../../../../models/file/file.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';

import {
  EquipmentConnectionDialogData,
  EquipmentConnectionDialogResult,
  ExistingAssociationWarning,
  MissingAssociationWarning,
  DEFAULT_DIALOG_DATA,
} from './equipment-connection-dialog.types';

@Component({
  selector: 'app-equipment-connection-dialog',
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
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    RfFileLeftMenuComponent,
    InteractiveImageComponent,
  ],
  template: `
    <div class="connection-dialog" [class.resizing]="isResizing()">
      <!-- Header -->
      <div class="dialog-header">
        <h2>
          <mat-icon>link</mat-icon>
          Connect to P&ID
        </h2>
        <div class="header-actions">
          @if (selectedEquipment().length > 0) {
            <span class="selection-count">
              {{ selectedEquipment().length }} selected
            </span>
          }
          <button mat-icon-button (click)="toggleHelp()" matTooltip="Show Help">
            <mat-icon>help_outline</mat-icon>
          </button>
          <button mat-icon-button (click)="onCancel()" matTooltip="Close">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <!-- Help Panel -->
      @if (showHelp()) {
        <div class="help-panel">
          <mat-expansion-panel [expanded]="true">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <mat-icon>lightbulb</mat-icon>
                How to connect equipment to P&ID
              </mat-panel-title>
            </mat-expansion-panel-header>
            <div class="help-content">
              <div class="help-section">
                <h4><mat-icon>folder_open</mat-icon> Browse Files</h4>
                <p>Select a P&ID file from the left panel to view it. The file's equipment shapes will be displayed on the right.</p>
              </div>
              <div class="help-section">
                <h4><mat-icon>touch_app</mat-icon> Select Equipment</h4>
                <p><strong>Left-click</strong> on an equipment shape to select it.</p>
                <p>In multi-select mode, click additional shapes to add them. Selected equipment is preserved when switching files.</p>
              </div>
              @if (dialogData.allowDraw) {
                <div class="help-section">
                  <h4><mat-icon>draw</mat-icon> Draw New</h4>
                  <p><strong>Right-click + drag</strong> to draw a new equipment shape.</p>
                  <p>Use the <strong>Symbol</strong> toolbar button to place P&ID symbols.</p>
                </div>
              }
            </div>
          </mat-expansion-panel>
        </div>
      }

      <!-- Warning Banner for P&ID Connection mode (equipment already has LOTO point) -->
      @if (existingAssociationWarnings().length > 0 && !dialogData.requireLotoPointForUnassociated) {
        <div class="warning-banner">
          <mat-icon>warning</mat-icon>
          <span>
            {{ existingAssociationWarnings().length }}
            equipment already {{ existingAssociationWarnings().length === 1 ? 'has' : 'have' }}
            LOTO point associations. Proceeding will overwrite.
          </span>
          <button mat-button (click)="showWarningDetails = !showWarningDetails">
            {{ showWarningDetails ? 'Hide' : 'View' }} Details
          </button>
        </div>
        @if (showWarningDetails) {
          <div class="warning-details">
            @for (warning of existingAssociationWarnings(); track warning.equipment.id) {
              <div class="warning-item">
                <mat-icon>info</mat-icon>
                <span>{{ warning.message }}</span>
              </div>
            }
          </div>
        }
      }

      <!-- Warning Banner for Zero Energy mode (equipment missing LOTO point) -->
      @if (missingAssociationWarnings().length > 0 && dialogData.requireLotoPointForUnassociated) {
        <div class="warning-banner warning-missing">
          <mat-icon>add_circle</mat-icon>
          <span>
            {{ missingAssociationWarnings().length }}
            equipment {{ missingAssociationWarnings().length === 1 ? 'has' : 'have' }}
            no LOTO point association. A LOTO point needs to be created.
          </span>
          <button mat-flat-button color="primary" (click)="openQuickCreateForm()">
            <mat-icon>add</mat-icon>
            Create LOTO Point
          </button>
        </div>
        @if (showWarningDetails) {
          <div class="warning-details warning-missing-details">
            @for (warning of missingAssociationWarnings(); track warning.equipment.id) {
              <div class="warning-item">
                <mat-icon>info</mat-icon>
                <span>{{ warning.message }}</span>
              </div>
            }
          </div>
        }
      }

      <!-- Quick-Create Form for Zero Energy mode -->
      @if (showQuickCreateForm() && pendingEquipmentForQuickCreate()) {
        <div class="quick-create-panel">
          <div class="quick-create-header">
            <mat-icon>add_circle</mat-icon>
            <h4>Create LOTO Point for {{ getEquipmentLabel(pendingEquipmentForQuickCreate()!) }}</h4>
            <button mat-icon-button (click)="closeQuickCreateForm()" matTooltip="Close">
              <mat-icon>close</mat-icon>
            </button>
          </div>
          <form [formGroup]="quickCreateForm" (ngSubmit)="submitQuickCreate()" class="quick-create-form">
            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Tag Number</mat-label>
                <input matInput formControlName="tagNumber" placeholder="e.g., V-101">
                @if (quickCreateForm.get('tagNumber')?.hasError('required')) {
                  <mat-error>Tag Number is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <input matInput formControlName="description" placeholder="e.g., Main Isolation Valve">
                @if (quickCreateForm.get('description')?.hasError('required')) {
                  <mat-error>Description is required</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline">
                <mat-label>Location</mat-label>
                <input matInput formControlName="location" placeholder="e.g., Unit 1, Level 2">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Isolated Position</mat-label>
                <input matInput formControlName="isoPos" placeholder="e.g., Closed">
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Normal Position</mat-label>
                <input matInput formControlName="normPos" placeholder="e.g., Open">
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="closeQuickCreateForm()">
                Cancel
              </button>
              <button
                mat-flat-button
                color="primary"
                type="submit"
                [disabled]="quickCreateForm.invalid || isCreatingLotoPoint()"
              >
                @if (isCreatingLotoPoint()) {
                  <mat-icon class="spinning">sync</mat-icon>
                  Creating...
                } @else {
                  <mat-icon>save</mat-icon>
                  Create LOTO Point
                }
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Selected Equipment Chips -->
      @if (selectedEquipment().length > 0) {
        <div class="selected-bar">
          <mat-chip-set>
            @for (eq of selectedEquipment(); track eq.id) {
              <mat-chip (removed)="removeEquipment(eq)">
                {{ getEquipmentLabel(eq) }}
                <span class="file-hint">({{ eq.mainFileObject?.name || 'File' }})</span>
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
        <!-- Left Panel: File Browser -->
        <div class="left-panel" [style.width.px]="leftPanelWidth()">
          <div class="panel-header">
            <h3>
              <mat-icon>folder_open</mat-icon>
              P&ID Files
            </h3>
          </div>
          <div class="panel-content">
            <app-rf-file-left-menu></app-rf-file-left-menu>
          </div>
          <div class="panel-footer">
            <div class="upload-hint">
              <mat-icon>cloud_upload</mat-icon>
              <span>Need to upload a new P&ID file? Use the <strong>File Management</strong> section to add files first.</span>
            </div>
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

        <!-- Right Panel: P&ID Viewer -->
        <div class="right-panel">
          @if (currentFile()) {
            <div class="viewer-header">
              <span class="file-name">{{ currentFile()?.name }}</span>
              <span class="instruction-hint">
                @if (dialogData.allowDraw && dialogData.allowBrowse) {
                  Left-click to select. Right-click + drag to draw new.
                } @else if (dialogData.allowBrowse) {
                  Click on equipment to select.
                } @else if (dialogData.allowDraw) {
                  Right-click + drag to draw equipment.
                }
              </span>
            </div>
            <div class="viewer-content">
              <app-interactive-image
                [imageUrl]="currentFileLink()"
                [shapesInput]="equipmentShapes()"
                [preset]="getPreset()"
                (shapeClicked)="onEquipmentClicked($event)"
                (shapeDrawn)="onShapeDrawn($event)"
              />
            </div>
          } @else {
            <div class="empty-viewer">
              <mat-icon>image</mat-icon>
              <p>Select a P&ID file to view</p>
              <span>Click on a file in the left panel to load it</span>
              <div class="empty-hint">
                <mat-icon>lightbulb</mat-icon>
                <span>Equipment shapes will be shown on the P&ID for selection</span>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Footer -->
      <mat-divider></mat-divider>
      <div class="dialog-footer">
        @if (isSaving()) {
          <span class="saving-indicator">
            <mat-icon class="spinning">sync</mat-icon>
            Saving equipment...
          </span>
        }
        @if (error()) {
          <span class="error-message">
            <mat-icon>error</mat-icon>
            {{ error() }}
          </span>
        }
        <button mat-stroked-button (click)="onCancel()">Cancel</button>
        <button
          mat-flat-button
          color="primary"
          [disabled]="selectedEquipment().length === 0 && !drawnShape() || isSaving()"
          (click)="onConfirm()"
        >
          @if (drawnShape() && !isSaving()) {
            <mat-icon>save</mat-icon>
            Save & Connect
          } @else {
            <mat-icon>check</mat-icon>
            Connect {{ selectedEquipment().length }} Equipment
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .connection-dialog {
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

    .dialog-header h2 mat-icon {
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
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

    /* Warning Banner */
    .warning-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: #fff3e0;
      border-bottom: 1px solid #ffcc80;
    }

    .warning-banner mat-icon {
      color: #f57c00;
    }

    .warning-banner span {
      flex: 1;
      font-size: 14px;
      color: #e65100;
    }

    .warning-details {
      padding: 8px 20px 12px;
      background: #fff8e1;
      border-bottom: 1px solid #ffe082;
    }

    .warning-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
      font-size: 13px;
      color: #5d4037;
    }

    .warning-item mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #ff9800;
    }

    /* Missing Association Warning (Zero Energy mode) */
    .warning-banner.warning-missing {
      background: #e3f2fd;
      border-bottom: 1px solid #90caf9;
    }

    .warning-banner.warning-missing mat-icon {
      color: #1976d2;
    }

    .warning-banner.warning-missing span {
      color: #0d47a1;
    }

    .warning-missing-details {
      background: #e8f4fd;
      border-bottom: 1px solid #bbdefb;
    }

    .warning-missing-details .warning-item mat-icon {
      color: #1976d2;
    }

    /* Quick-Create Form Panel */
    .quick-create-panel {
      background: #f3e5f5;
      border-bottom: 1px solid #ce93d8;
      padding: 16px 20px;
    }

    .quick-create-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .quick-create-header mat-icon {
      color: #7b1fa2;
    }

    .quick-create-header h4 {
      flex: 1;
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: #4a148c;
    }

    .quick-create-form {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .form-row mat-form-field {
      flex: 1;
      min-width: 180px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 8px;
      padding-top: 12px;
      border-top: 1px solid #e1bee7;
    }

    /* Selected Bar */
    .selected-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: #e8f5e9;
      border-bottom: 1px solid #c8e6c9;
    }

    .file-hint {
      font-size: 11px;
      color: #666;
      margin-left: 4px;
    }

    /* Main Content */
    .dialog-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .left-panel {
      display: flex;
      flex-direction: column;
      min-width: 280px;
      max-width: 500px;
      border-right: 1px solid #e0e0e0;
      height: 100%;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
      flex-shrink: 0;
    }

    .panel-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 14px;
      font-weight: 500;
    }

    .panel-header h3 mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
    }

    .panel-content {
      flex: 1;
      overflow: auto;
      min-height: 0;
    }

    .panel-content ::ng-deep .toggle-menu-container {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .panel-content ::ng-deep .menu-tree {
      flex: 1;
      overflow: auto;
    }

    .panel-footer {
      flex-shrink: 0;
      padding: 12px;
      background: #f5f5f5;
      border-top: 1px solid #e0e0e0;
    }

    .upload-hint {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      padding: 10px 12px;
      background: #e3f2fd;
      border-radius: 6px;
      border: 1px solid #bbdefb;
    }

    .upload-hint mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #1976d2;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .upload-hint span {
      font-size: 12px;
      color: #1565c0;
      line-height: 1.4;
    }

    .upload-hint strong {
      color: #0d47a1;
    }

    /* Divider */
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

    /* Right Panel */
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
      padding: 12px 16px;
      background: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }

    .file-name {
      font-weight: 500;
      color: #333;
    }

    .instruction-hint {
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

    /* Footer */
    .dialog-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 20px;
      background: #fafafa;
    }

    .saving-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
      font-size: 13px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #c62828;
      font-size: 13px;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .connection-dialog.resizing {
      cursor: col-resize;
      user-select: none;
    }
  `],
})
export class EquipmentConnectionDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<EquipmentConnectionDialogComponent>);
  dialogData = inject<EquipmentConnectionDialogData>(MAT_DIALOG_DATA);
  private dialog = inject(MatDialog);
  private currentFileService = inject(CurrentFileService);
  private equipmentMapper = inject(EquipmentMapperService);
  private equipmentService = inject(RfEquipmentService);
  private lotoPointApiService = inject(RfLotoPointApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  // Quick-create form
  quickCreateForm: FormGroup = this.fb.group({
    tagNumber: ['', Validators.required],
    description: ['', Validators.required],
    location: [null],
    isoPos: [null],
    normPos: [null],
  });

  // Apply defaults
  constructor() {
    this.dialogData = { ...DEFAULT_DIALOG_DATA, ...this.dialogData };
  }

  // UI State
  leftPanelWidth = signal(350);
  isResizing = signal(false);
  showHelp = signal(false);
  showWarningDetails = false;

  // Selection State
  selectedEquipment = signal<EquipmentDto[]>([]);
  drawnShape = signal<RfShape | null>(null);
  existingAssociationWarnings = signal<ExistingAssociationWarning[]>([]);
  missingAssociationWarnings = signal<MissingAssociationWarning[]>([]);

  // Quick-create form state for zero energy mode
  showQuickCreateForm = signal(false);
  pendingEquipmentForQuickCreate = signal<EquipmentDto | null>(null);
  isCreatingLotoPoint = signal(false);

  // File State
  currentFile = signal<FileDto | null>(null);
  currentEquipmentList = signal<EquipmentDto[]>([]);

  // Loading State
  isSaving = signal(false);
  error = signal<string | null>(null);

  // Computed: file link for image viewer
  currentFileLink = computed(() => {
    const file = this.currentFile();
    if (!file) return '';
    return file.fileLink || file.baseLink || '';
  });

  // Computed: equipment shapes for viewer
  equipmentShapes = computed(() => {
    const equipmentList = this.currentEquipmentList();
    const selected = this.selectedEquipment();
    const selectedIds = new Set(selected.map(e => e.id));
    const drawn = this.drawnShape();

    // Map equipment to shapes
    const shapes = equipmentList
      .map(e => this.equipmentMapper.mapToRfShape(e))
      .filter((s): s is RfShape => s !== null);

    // Highlight selected equipment
    shapes.forEach(shape => {
      if (selectedIds.has(shape.id)) {
        shape.isSelected = true;
        shape.color = '#FF0000';
      }
    });

    // Add drawn shape if exists
    if (drawn) {
      shapes.push({
        ...drawn,
        isSelected: true,
        color: '#00FF00',
      });
    }

    return shapes;
  });

  ngOnInit(): void {
    // Subscribe to current file changes
    this.currentFileService.currentFile$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((file: FileDto | null) => {
        this.currentFile.set(file);
        this.drawnShape.set(null); // Clear drawn shape when file changes
      });

    // Subscribe to equipment list
    this.currentFileService.elements$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((equipment: EquipmentDto[]) => {
        this.currentEquipmentList.set(equipment);
      });

    // Load preselected file if provided
    if (this.dialogData.preselectedFileId) {
      // TODO: Load the file by ID
    }
  }

  ngOnDestroy(): void {
    // Cleanup handled by DestroyRef
  }

  toggleHelp(): void {
    this.showHelp.update(v => !v);
  }

  getPreset(): string {
    const { allowBrowse, allowDraw } = this.dialogData;
    if (allowBrowse && allowDraw) return 'EQUIPMENT_UNIFIED';
    if (allowDraw) return 'EQUIPMENT_DRAWER';
    return 'EQUIPMENT_BROWSER';
  }

  // Resizing
  onDividerMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set(true);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing()) return;
    const newWidth = event.clientX - 20;
    if (newWidth >= 280 && newWidth <= 500) {
      this.leftPanelWidth.set(newWidth);
    }
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing.set(false);
  }

  // Equipment Selection
  onEquipmentClicked(shape: RfShape): void {
    if (!this.dialogData.allowBrowse) return;

    const shapeId = shape.id;
    if (shapeId === null || shapeId === undefined) return;

    const equipmentList = this.currentEquipmentList();
    const equipment = equipmentList.find(e => e.id === shapeId);
    if (!equipment) return;

    const file = this.currentFile();

    // Enrich equipment with file reference
    const enrichedEquipment = new EquipmentDto({
      ...equipment,
      mainFileId: file?.id,
      mainFileObject: file || undefined,
    });

    const hasLotoPoint = equipment.lotoPoints && equipment.lotoPoints.length > 0;

    // Handle warnings based on mode
    if (this.dialogData.requireLotoPointForUnassociated) {
      // ZERO ENERGY MODE: Warn if equipment has NO LOTO point
      if (!hasLotoPoint) {
        const warning: MissingAssociationWarning = {
          equipment: enrichedEquipment,
          message: `Equipment "${this.getEquipmentLabel(enrichedEquipment)}" has no LOTO point association. A LOTO point needs to be created.`,
        };

        // Check if warning already exists
        const warnings = this.missingAssociationWarnings();
        if (!warnings.some(w => w.equipment.id === enrichedEquipment.id)) {
          this.missingAssociationWarnings.set([...warnings, warning]);
        }

        // Set pending equipment for quick create
        this.pendingEquipmentForQuickCreate.set(enrichedEquipment);
      }
    } else {
      // P&ID CONNECTION MODE: Warn if equipment already HAS LOTO point
      if (hasLotoPoint) {
        const lotoPoint = equipment.lotoPoints![0];
        const warning: ExistingAssociationWarning = {
          equipment: enrichedEquipment,
          existingLotoPoint: lotoPoint,
          message: `Equipment "${this.getEquipmentLabel(enrichedEquipment)}" is already associated with LOTO point "${lotoPoint.tagNumber || lotoPoint.id}".`,
        };

        // Check if warning already exists
        const warnings = this.existingAssociationWarnings();
        if (!warnings.some(w => w.equipment.id === enrichedEquipment.id)) {
          this.existingAssociationWarnings.set([...warnings, warning]);
        }
      }
    }

    // Handle selection based on mode
    const currentSelection = this.selectedEquipment();
    const alreadySelected = currentSelection.some(e => e.id === enrichedEquipment.id);

    if (alreadySelected) {
      // Remove from selection
      this.removeEquipment(enrichedEquipment);
    } else {
      if (this.dialogData.mode === 'single') {
        // Single mode: replace selection
        this.selectedEquipment.set([enrichedEquipment]);
        // Keep only relevant warnings
        this.existingAssociationWarnings.update(warnings =>
          warnings.filter(w => w.equipment.id === enrichedEquipment.id)
        );
        this.missingAssociationWarnings.update(warnings =>
          warnings.filter(w => w.equipment.id === enrichedEquipment.id)
        );
      } else {
        // Multi mode: add to selection
        this.selectedEquipment.set([...currentSelection, enrichedEquipment]);
      }
    }

    // Clear drawn shape when selecting existing
    this.drawnShape.set(null);
  }

  onShapeDrawn(shape: RfShape): void {
    if (!this.dialogData.allowDraw) return;
    this.drawnShape.set(shape);
    // Don't clear selections - user might want both existing and new
  }

  removeEquipment(equipment: EquipmentDto): void {
    this.selectedEquipment.update(list => list.filter(e => e.id !== equipment.id));
    this.existingAssociationWarnings.update(warnings =>
      warnings.filter(w => w.equipment.id !== equipment.id)
    );
    this.missingAssociationWarnings.update(warnings =>
      warnings.filter(w => w.equipment.id !== equipment.id)
    );

    // Clear pending equipment if it's the one being removed
    if (this.pendingEquipmentForQuickCreate()?.id === equipment.id) {
      this.pendingEquipmentForQuickCreate.set(null);
      this.showQuickCreateForm.set(false);
    }
  }

  clearSelections(): void {
    this.selectedEquipment.set([]);
    this.existingAssociationWarnings.set([]);
    this.missingAssociationWarnings.set([]);
    this.drawnShape.set(null);
    this.pendingEquipmentForQuickCreate.set(null);
    this.showQuickCreateForm.set(false);
  }

  openQuickCreateForm(): void {
    const pendingEquipment = this.pendingEquipmentForQuickCreate();
    if (pendingEquipment || this.missingAssociationWarnings().length > 0) {
      // Use the first equipment without LOTO point if no pending
      if (!pendingEquipment && this.missingAssociationWarnings().length > 0) {
        this.pendingEquipmentForQuickCreate.set(this.missingAssociationWarnings()[0].equipment);
      }
      this.showQuickCreateForm.set(true);
    }
  }

  closeQuickCreateForm(): void {
    this.showQuickCreateForm.set(false);
  }

  onQuickCreateComplete(newLotoPoint: LotoPointDto): void {
    const equipment = this.pendingEquipmentForQuickCreate();
    if (!equipment) return;

    // Remove from missing warnings since LOTO point is now created
    this.missingAssociationWarnings.update(warnings =>
      warnings.filter(w => w.equipment.id !== equipment.id)
    );

    // Store the newly created LOTO point for return
    if (!this.newlyCreatedLotoPoints) {
      this.newlyCreatedLotoPoints = [];
    }
    this.newlyCreatedLotoPoints.push(newLotoPoint);

    // Update equipment with new LOTO point reference
    const updatedEquipment = new EquipmentDto({
      ...equipment,
      lotoPoints: [newLotoPoint],
    });

    // Update in selection
    this.selectedEquipment.update(list =>
      list.map(e => e.id === equipment.id ? updatedEquipment : e)
    );

    this.pendingEquipmentForQuickCreate.set(null);
    this.showQuickCreateForm.set(false);
  }

  // Track newly created LOTO points
  private newlyCreatedLotoPoints: LotoPointDto[] = [];

  submitQuickCreate(): void {
    if (this.quickCreateForm.invalid) return;

    const equipment = this.pendingEquipmentForQuickCreate();
    if (!equipment) return;

    this.isCreatingLotoPoint.set(true);

    const formValue = this.quickCreateForm.value;
    const newLotoPoint = new LotoPointDto({
      tagNumber: formValue.tagNumber,
      description: formValue.description,
      location: formValue.location,
      isoPos: formValue.isoPos,
      normPos: formValue.normPos,
      equipmentList: [equipment],
    });

    this.lotoPointApiService.createLotoPoint(newLotoPoint)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isCreatingLotoPoint.set(false);
          if (response.responseData) {
            const createdLotoPoint = LotoPointDto.fromJson(response.responseData);
            this.onQuickCreateComplete(createdLotoPoint);
            // Reset form for next use
            this.quickCreateForm.reset();
          } else {
            this.error.set('Failed to create LOTO point.');
          }
        },
        error: (err) => {
          this.isCreatingLotoPoint.set(false);
          console.error('Failed to create LOTO point:', err);
          this.error.set('Failed to create LOTO point. Please try again.');
        },
      });
  }

  getEquipmentLabel(equipment: EquipmentDto): string {
    if (equipment.tagNumber) return equipment.tagNumber;
    if ((equipment as any).lotoPoints?.[0]?.tagNumber) {
      return (equipment as any).lotoPoints[0].tagNumber;
    }
    return `Equipment #${equipment.id}`;
  }

  // Confirm and Save
  async onConfirm(): Promise<void> {
    const drawn = this.drawnShape();
    const file = this.currentFile();

    // If there's a drawn shape, save it first
    if (drawn && file) {
      this.isSaving.set(true);
      this.error.set(null);

      const shapeWithFile: RfShape = { ...drawn, fileId: file.id };

      this.equipmentService.saveEquipmentFromShape(shapeWithFile)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (savedEquipment) => {
            this.isSaving.set(false);
            if (savedEquipment) {
              const enrichedEquipment = new EquipmentDto({
                ...savedEquipment,
                mainFileId: file.id,
                mainFileObject: file,
              });

              // Add to selection
              const finalSelection = [...this.selectedEquipment(), enrichedEquipment];

              this.closeWithResult({
                selectedEquipment: finalSelection,
                selectedFile: file,
                newlyCreatedLotoPoints: this.newlyCreatedLotoPoints.length > 0 ? this.newlyCreatedLotoPoints : undefined,
                cancelled: false,
              });
            } else {
              this.error.set('Failed to save equipment.');
            }
          },
          error: (err) => {
            this.isSaving.set(false);
            console.error('Failed to save equipment:', err);
            this.error.set('Failed to save equipment. Please try again.');
          },
        });
    } else {
      // No drawn shape, just return selection
      this.closeWithResult({
        selectedEquipment: this.selectedEquipment(),
        selectedFile: this.currentFile(),
        newlyCreatedLotoPoints: this.newlyCreatedLotoPoints.length > 0 ? this.newlyCreatedLotoPoints : undefined,
        cancelled: false,
      });
    }
  }

  onCancel(): void {
    this.closeWithResult({
      selectedEquipment: [],
      selectedFile: null,
      cancelled: true,
    });
  }

  private closeWithResult(result: EquipmentConnectionDialogResult): void {
    this.dialogRef.close(result);
  }
}
