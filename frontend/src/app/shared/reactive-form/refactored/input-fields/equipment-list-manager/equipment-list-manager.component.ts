import { Component, Input, forwardRef, signal, inject, DestroyRef, ViewContainerRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RfPopupProjectionComponent } from '../../../../popup-projection/rf-popup-projection.component';
import { EquipmentBrowserDialogComponent } from '../equipment-browser-dialog/equipment-browser-dialog.component';
import { EquipmentShapeDrawerDialogComponent } from '../equipment-shape-drawer-dialog/equipment-shape-drawer-dialog.component';
import { EquipmentUnifiedDialogComponent } from '../equipment-unified-dialog/equipment-unified-dialog.component';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { RfEquipmentEditorComponent } from "../../../../../features/equipment/refactored/rf-equipment-editor/rf-equipment-editor.component";
import { EquipmentLotoConflictService } from '../services/equipment-loto-conflict.service';
import { EquipmentConflictDialogComponent, ConflictDialogData } from '../equipment-conflict-dialog/equipment-conflict-dialog.component';
import { LotoPointMapperService } from '../../../../../features/loto-points/refactored/services/rf-loto-point-mapper.service';
import { RfLotoPointApiService } from '../../../../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { RfFormField } from '../../../../../models/ui/form-field.model';

/**
 * Conflict detection modes:
 * - 'has-association': Warns when equipment IS associated with another LOTO point (for equipmentList field)
 * - 'no-association': Warns when equipment is NOT associated with any LOTO point (for zeroEnergy field)
 * - 'none': Disables conflict detection entirely
 */
export type ConflictMode = 'has-association' | 'no-association' | 'none';

interface EquipmentListItem {
  id?: number;
  coordinates?: string;
  fileId?: number;
  fileName?: string;
  originalPictureSize?: string;
  tagNumber?: string;
  source: 'browsed' | 'drawn'; // Track how equipment was added
}

@Component({
  selector: 'app-equipment-list-manager',
  standalone: true,
  imports: [
    CommonModule,
    RfPopupProjectionComponent,
    EquipmentBrowserDialogComponent,
    EquipmentShapeDrawerDialogComponent,
    EquipmentUnifiedDialogComponent,
    RfEquipmentEditorComponent,
    EquipmentConflictDialogComponent
  ],
  templateUrl: './equipment-list-manager.component.html',
  styleUrl: './equipment-list-manager.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => EquipmentListManagerComponent),
      multi: true
    }
  ]
})
export class EquipmentListManagerComponent implements ControlValueAccessor {
  @Input() label: string = 'Equipment List';
  @Input() allowBrowse: boolean = true;  // Allow selecting existing equipment
  @Input() allowDraw: boolean = true;    // Allow drawing new shapes
  @Input() useUnifiedDialog: boolean = false;  // Use unified dialog instead of separate browse/draw dialogs
  @Input() currentLotoPointId?: number;  // For conflict detection exclusion
  @Input() currentLotoPointTagNumber?: string;  // For conflict dialog display
  @Input() conflictMode: ConflictMode = 'has-association';  // Conflict detection mode
  @Input() requireLotoPointForDrawn: boolean = false;  // Require LOTO point creation for newly drawn equipment

  // ViewContainerRef for dynamic component loading
  @ViewChild('lotoFormContainer', { read: ViewContainerRef }) lotoFormContainer!: ViewContainerRef;

  // Services
  private equipmentMapper = inject(EquipmentMapperService);
  private conflictService = inject(EquipmentLotoConflictService);
  private lotoPointMapper = inject(LotoPointMapperService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);

  // State
  isBrowserOpen = signal(false);
  isDrawerOpen = signal(false);
  isUnifiedDialogOpen = signal(false);
  isVeiewerOpen = signal(false);
  isConflictDialogOpen = signal(false);
  equipmentList = signal<EquipmentListItem[]>([]);
  selectedEquipment = signal<EquipmentListItem | null>(null);
  conflictDialogData = signal<ConflictDialogData | null>(null);
  pendingEquipment = signal<EquipmentDto | null>(null);

  // LOTO Point Form State (for requireLotoPointForDrawn mode)
  isLotoPointFormOpen = signal(false);
  lotoPointFormFields = signal<RfFormField[]>([]);
  newLotoPoint = signal<LotoPointDto>(new LotoPointDto());
  isSavingLotoPoint = signal(false);
  lotoPointFormError = signal<string | null>(null);

  // ControlValueAccessor
  value = signal<EquipmentListItem[]>([]);
  onChange: any = () => {};
  onTouched: any = () => {};
  disabled: boolean = false;

  writeValue(value: any): void {
    if (Array.isArray(value)) {
      this.equipmentList.set(
        value.map((item) => ({
          ...item,
          fileId: item.mainFileId ?? item.fileId,
          // Use mainFile (string field), fallback to mainFileObject.name, then fileName
          fileName:
            item.mainFileObject?.name ??
            item.mainFile ??
            item.fileName ??
            (item.mainFileId ? `File #${item.mainFileId}` : undefined),
          source: item.source ?? 'browsed', // Default to browsed for draft-loaded items
        }))
      );
      this.value.set(value);
    } else {
      this.equipmentList.set([]);
      this.value.set([]);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  // Unified Dialog (combines browse + draw)
  openUnifiedDialog() {
    if (!this.disabled && (this.allowBrowse || this.allowDraw)) {
      this.isUnifiedDialogOpen.set(true);
    }
  }

  closeUnifiedDialog() {
    this.isUnifiedDialogOpen.set(false);
  }

  onUnifiedEquipmentAcquired(equipment: EquipmentDto) {
    // Handle equipment from unified dialog (either browsed or drawn without LOTO requirement)
    // Check for conflicts same as browser selection
    if (this.conflictMode === 'none' || !equipment.id) {
      this.addEquipmentToList(equipment, equipment.id ? 'browsed' : 'drawn');
      this.closeUnifiedDialog();
      return;
    }

    if (this.conflictMode === 'has-association') {
      const conflicts = this.conflictService.findConflicts(equipment.id, this.currentLotoPointId);
      if (conflicts.length > 0) {
        this.showConflictDialog(equipment, conflicts, 'has-association');
        this.closeUnifiedDialog();
        return;
      }
    } else if (this.conflictMode === 'no-association') {
      if (this.conflictService.hasNoAssociation(equipment.id)) {
        this.showConflictDialog(equipment, [], 'no-association');
        this.closeUnifiedDialog();
        return;
      }
    }

    this.addEquipmentToList(equipment, equipment.id ? 'browsed' : 'drawn');
    this.closeUnifiedDialog();
  }

  /**
   * Called when equipment is drawn in unified dialog and LOTO point creation is required.
   * Opens the LOTO point form for the newly drawn equipment.
   */
  onUnifiedEquipmentDrawnForLotoPoint(equipment: EquipmentDto) {
    // Close the unified dialog first, then open LOTO point form
    this.closeUnifiedDialog();
    this.openLotoPointFormForEquipment(equipment);
  }

  // Browser Dialog
  openBrowser() {
    if (!this.disabled && this.allowBrowse) {
      this.isBrowserOpen.set(true);
    }
  }

  closeBrowser() {
    this.isBrowserOpen.set(false);
  }

  openViewer(item: EquipmentListItem) {
    // Only open viewer for existing equipment with IDs
    if (!item || !item.id) {
      console.warn('Cannot open viewer: equipment has no ID', item);
      return;
    }
    this.selectedEquipment.set(item);
    this.isVeiewerOpen.set(true);
  }
  closeViewer() {
    this.selectedEquipment.set(null);
    this.isVeiewerOpen.set(false);
  }

  onEquipmentSelected(equipment: EquipmentDto) {
    // Skip conflict detection if disabled
    if (this.conflictMode === 'none' || !equipment.id) {
      this.addEquipmentToList(equipment);
      this.closeBrowser();
      return;
    }

    // Check for conflicts based on mode
    if (this.conflictMode === 'has-association') {
      // Warn if equipment IS already associated with another LOTO point
      const conflicts = this.conflictService.findConflicts(equipment.id, this.currentLotoPointId);

      if (conflicts.length > 0) {
        this.showConflictDialog(equipment, conflicts, 'has-association');
        return;
      }
    } else if (this.conflictMode === 'no-association') {
      // Warn if equipment is NOT associated with any LOTO point
      if (this.conflictService.hasNoAssociation(equipment.id)) {
        this.showConflictDialog(equipment, [], 'no-association');
        return;
      }
    }

    // No conflicts, add directly
    this.addEquipmentToList(equipment);
    this.closeBrowser();
  }

  private showConflictDialog(equipment: EquipmentDto, conflicts: any[], conflictType: 'has-association' | 'no-association') {
    this.pendingEquipment.set(equipment);
    this.conflictDialogData.set({
      equipment,
      conflicts,
      currentLotoPointTagNumber: this.currentLotoPointTagNumber,
      conflictType
    });
    this.isConflictDialogOpen.set(true);
    this.closeBrowser();
  }

  private addEquipmentToList(equipment: EquipmentDto, source: 'browsed' | 'drawn' = 'browsed') {
    const newItem: EquipmentListItem = {
      id: equipment.id,
      coordinates: equipment.coordinates || '',
      fileId: equipment.mainFileId ?? undefined,
      fileName: equipment.mainFileObject?.name ?? (equipment.mainFileId ? `File #${equipment.mainFileId}` : ''),
      originalPictureSize: equipment.originalPictureSize || '',
      tagNumber: equipment.tagNumber || '',
      source
    };

    this.addItem(newItem);
  }

  // Conflict Dialog handlers
  onConflictConfirmed(equipment: EquipmentDto) {
    this.addEquipmentToList(equipment);
    this.closeConflictDialog();
  }

  onConflictCancelled() {
    this.closeConflictDialog();
  }

  private closeConflictDialog() {
    this.isConflictDialogOpen.set(false);
    this.conflictDialogData.set(null);
    this.pendingEquipment.set(null);
  }

  // Drawer Dialog
  openDrawer() {
    if (!this.disabled && this.allowDraw) {
      this.isDrawerOpen.set(true);
    }
  }

  closeDrawer() {
    this.isDrawerOpen.set(false);
  }

  onEquipmentSaved(equipment: EquipmentDto | null) {
    if (!equipment) {
      console.error('No equipment saved');
      this.closeDrawer();
      return;
    }

    // If LOTO point creation is required, the equipmentReadyForLotoPoint event handles it
    if (this.requireLotoPointForDrawn) {
      // Don't close drawer or add to list - wait for LOTO form
      return;
    }

    const newItem: EquipmentListItem = {
      id: equipment.id,
      coordinates: equipment.coordinates || '',
      fileId: equipment.mainFileId ?? undefined,
      fileName: equipment.mainFileObject?.name ?? (equipment.mainFileId ? `File #${equipment.mainFileId}` : ''),
      originalPictureSize: equipment.originalPictureSize || '',
      tagNumber: equipment.tagNumber || `Equipment #${equipment.id}`,
      source: 'drawn'
    };

    this.addItem(newItem);
    this.closeDrawer();
  }

  /**
   * Called when equipment is saved and ready for LOTO point creation
   * (from drawer dialog's equipmentReadyForLotoPoint event)
   */
  onEquipmentReadyForLotoPoint(equipment: EquipmentDto) {
    this.openLotoPointFormForEquipment(equipment);
  }

  /**
   * Opens LOTO point form for newly drawn equipment
   */
  private async openLotoPointFormForEquipment(equipment: EquipmentDto) {
    // Store the equipment for later
    this.pendingEquipment.set(equipment);

    // Create a new LOTO point with the equipment pre-assigned
    const lotoPoint = new LotoPointDto({
      equipmentList: [equipment]
    });
    this.newLotoPoint.set(lotoPoint);

    // Generate form fields WITHOUT equipmentList field (it's pre-assigned)
    const fieldsWithoutEquipmentList: (keyof LotoPointDto)[] = [
      'unit',
      'tagNumber',
      'description',
      'eqType',
      'tagged',
      'isoPos',
      'normPos',
      'specificLocation',
      'location',
      'standard',
      'generalLocation'
    ];
    const formFields = this.lotoPointMapper.toFormFields(lotoPoint, fieldsWithoutEquipmentList);
    this.lotoPointFormFields.set(formFields);

    // Open the form (keep drawer open behind it)
    this.isLotoPointFormOpen.set(true);
    this.lotoPointFormError.set(null);

    // Dynamically load the form component to avoid circular dependency
    await this.loadLotoPointFormComponent();
  }

  /**
   * Dynamically loads RfReactiveFormComponent to avoid circular dependency
   */
  private async loadLotoPointFormComponent() {
    // Trigger change detection to render the popup with ng-container
    this.cdr.detectChanges();

    // Wait for Angular to fully render the popup
    await new Promise(resolve => setTimeout(resolve, 50));

    if (!this.lotoFormContainer) {
      console.error('lotoFormContainer not available after change detection');
      return;
    }

    // Clear previous component
    this.lotoFormContainer.clear();

    // Dynamically import the component
    const { RfReactiveFormComponent } = await import('../../reactive-form/rf-reactive-form.component');

    // Create the component
    const componentRef = this.lotoFormContainer.createComponent(RfReactiveFormComponent);

    // Set inputs using setInput() method for signal inputs
    componentRef.setInput('fields', this.lotoPointFormFields());
    componentRef.setInput('entity', this.newLotoPoint());
    componentRef.setInput('title', '');
    componentRef.setInput('submitButtonText', this.isSavingLotoPoint() ? 'Saving...' : 'Create LOTO Point');
    componentRef.setInput('showSubmitButton', true);

    // Subscribe to formSubmit output
    componentRef.instance.formSubmit.subscribe((formData: any) => {
      this.onLotoPointFormSubmit(formData);
    });

    // Trigger change detection to render the dynamically created component
    this.cdr.detectChanges();
  }

  /**
   * Handle LOTO point form submission
   */
  onLotoPointFormSubmit(formData: any) {
    const equipment = this.pendingEquipment();
    if (!equipment) {
      this.lotoPointFormError.set('No equipment available for LOTO point.');
      return;
    }

    this.isSavingLotoPoint.set(true);
    this.lotoPointFormError.set(null);

    // Create LotoPointDto with the form data and the pre-assigned equipment
    const lotoPointData = new LotoPointDto({
      ...formData,
      equipmentList: [equipment]
    });

    this.lotoPointApi
      .saveLotoPoint(lotoPointData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.isSavingLotoPoint.set(false);
          if (response.responseData) {
            // LOTO point created successfully, now add equipment to the list
            const newItem: EquipmentListItem = {
              id: equipment.id,
              coordinates: equipment.coordinates || '',
              fileId: equipment.mainFileId ?? undefined,
              fileName: equipment.mainFileObject?.name ?? (equipment.mainFileId ? `File #${equipment.mainFileId}` : ''),
              originalPictureSize: equipment.originalPictureSize || '',
              tagNumber: equipment.tagNumber || `Equipment #${equipment.id}`,
              source: 'drawn'
            };

            this.addItem(newItem);
            this.closeLotoPointForm();
            // Keep drawer open so user can continue drawing
          } else {
            this.lotoPointFormError.set('Failed to save LOTO point.');
          }
        },
        error: (err) => {
          this.isSavingLotoPoint.set(false);
          this.lotoPointFormError.set('An error occurred while saving the LOTO point.');
          console.error('Failed to save LOTO point:', err);
        },
      });
  }

  /**
   * Close the LOTO point form popup
   */
  closeLotoPointForm() {
    this.isLotoPointFormOpen.set(false);
    this.lotoPointFormFields.set([]);
    this.newLotoPoint.set(new LotoPointDto());
    this.pendingEquipment.set(null);
    this.lotoPointFormError.set(null);
  }

  // List Management
  private addItem(item: EquipmentListItem) {
    const currentList = this.equipmentList();
    const updatedList = [...currentList, item];
    this.equipmentList.set(updatedList);
    this.value.set(updatedList);
    this.onChange(this.value());
    this.onTouched();
  }

  removeItem(index: number) {
    if (!this.disabled) {
      const currentList = this.equipmentList();
      const updatedList = currentList.filter((_, i) => i !== index);
      this.equipmentList.set(updatedList);
      this.value.set(updatedList);
      this.onChange(this.value());
      this.onTouched();
    }
  }

  clearAll() {
    if (!this.disabled) {
      this.equipmentList.set([]);
      this.value.set([]);
      this.onChange(this.value());
      this.onTouched();
    }
  }

  // Display helpers
  getItemDisplay(item: EquipmentListItem): string {
    return `Shape on File #${item.fileName || item.fileId || 'Unknown'}`;
  }

  getItemIcon(item: EquipmentListItem): string {
    return item.source === 'browsed' ? 'existing' : 'new';
  }

  hasItems(): boolean {
    return this.equipmentList().length > 0;
  }
}
