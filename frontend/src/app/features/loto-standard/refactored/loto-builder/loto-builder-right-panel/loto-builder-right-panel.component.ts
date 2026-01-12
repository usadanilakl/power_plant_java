import { Component, inject, computed, DestroyRef, effect, output, Injector } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { InteractiveImageComponent } from '../../../../../shared/image/refactored/interactive-image/interactive-image.component';
import { LotoBuilderInfoWindowComponent } from '../loto-builder-info-window/loto-builder-info-window.component';
import { ContextMenuAction } from '../../../../../shared/menu/context-menu/context-menu.component';
import { getPreset, InteractiveImageConfig } from '../../../../../shared/image/refactored/models/interactive-image-config.model';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { EquipmentMapperService } from '../../../../equipment/refactored/services/equipment-mapper.service';
import { EquipmentService } from '../../../../../services/equipment.service';
import { RfLotoPointStateService } from '../../../../loto-points/refactored/services/rf-loto-point-state.service';
import { RfLotoPointApiService } from '../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { ImageService } from '../../../../../services/text-recognition.service';
import { RfShape } from '../../../../../shared/image/refactored/models/fr-shape.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { GuideDirective } from '../../../../../shared/guide/guide.directive';
import { ReactiveGuideDirective } from '../../../../../shared/guide/reactive-guide.directive';
import { ContextualGuideDirective } from '../../../../../shared/guide/contextual-guide.directive';

@Component({
  selector: 'app-loto-builder-right-panel',
  standalone: true,
  imports: [
    CommonModule,
    InteractiveImageComponent,
    LotoBuilderInfoWindowComponent,
    GuideDirective,
    ReactiveGuideDirective,
    ContextualGuideDirective,
  ],
  templateUrl: './loto-builder-right-panel.component.html',
  styleUrl: './loto-builder-right-panel.component.css',
})
export class LotoBuilderRightPanelComponent {
  protected builderState = inject(LotoBuilderStateService);
  private currentFileService = inject(CurrentFileService);
  private equipmentMapper = inject(EquipmentMapperService);
  private equipmentService = inject(EquipmentService);
  private lotoPointStateService = inject(RfLotoPointStateService);
  private lotoPointApiService = inject(RfLotoPointApiService);
  private imageService = inject(ImageService);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // Output event for close button
  closeRequested = output<void>();

  /**
   * Interactive image configuration - use FILE_EDITOR preset
   */
  imageConfig = computed<InteractiveImageConfig>(() => {
    return getPreset('FILE_EDITOR');
  });

  /**
   * Custom context menu actions for shapes
   */
  customContextMenuActions = computed<ContextMenuAction[]>(() => {
    return [
      {
        id: 'edit',
        label: 'Edit',
        icon: '✏️',
        action: (shape: RfShape) => this.handleEditAction(shape)
      },
      {
        id: 'addToLoto',
        label: 'Add to LOTO',
        icon: '➕',
        action: (shape: RfShape) => this.handleAddToLotoAction(shape)
      },
      {
        id: 'delete',
        label: 'Delete',
        icon: '🗑️',
        action: (shape: RfShape) => this.handleDeleteAction(shape)
      }
    ];
  });

  /**
   * Get current file's image URL
   */
  currentImageUrl = computed(() => {
    const file = this.builderState.currentFile();
    return file?.fileLink || '';
  });

  /**
   * Get current shapes from equipment
   */
  currentShapes = computed(() => {
    const equipment = this.builderState.currentEquipment();
    if (!equipment || equipment.length === 0) return [];

    const shapes = this.equipmentMapper.mapAllToRfShapes(equipment);
    return shapes;
  });

  /**
   * Get hovered shape ID
   */
  hoveredShapeId = computed(() => {
    return this.builderState.hoveredShapeId();
  });

  /**
   * Get selected shape ID (for selection with handles)
   */
  selectedShapeId = computed(() => {
    return this.builderState.selectedShapeId();
  });

  constructor() {
    // Sync currentShapes with builder state whenever equipment changes
    effect(() => {
      const shapes = this.currentShapes();
      this.builderState.currentShapes.set(shapes);
    });

    // Subscribe to current file changes to update builder state
    // Always accept file changes - the currentFileService is the source of truth for file selection
    this.currentFileService.currentFile$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (file) => {
          if (file) {
            const previousFileId = this.builderState.currentFile()?.id;

            // If switching to a different file, clear equipment immediately
            // This prevents old shapes from showing on the new file
            if (previousFileId && previousFileId !== file.id) {
              this.builderState.setCurrentEquipment([]);
            }

            // Check if there's a pending LOTO point (set by click handler before file change)
            // If so, preserve it when setting the current file
            const hasPendingLotoPoint = this.builderState.currentLotoPoint() !== null;
            this.builderState.setCurrentFile(file, hasPendingLotoPoint);
          }
        },
        error: (error) => {
          console.error('Error loading file:', error);
        }
      });

    // Subscribe to current file service to load equipment when file changes
    // Accept equipment updates that belong to the current builder file
    this.currentFileService.elementsToRender$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (equipment) => {
          if (equipment && equipment.length > 0) {
            const currentBuilderFileId = this.builderState.currentFile()?.id;
            // Get the file ID from the first equipment item
            const equipmentFileId = equipment[0]?.mainFileId || equipment[0]?.mainFileObject?.id;

            // Update if the equipment belongs to the current builder file
            if (equipmentFileId === currentBuilderFileId) {
              // Merge with existing equipment to preserve local LOTO point associations
              this.mergeEquipmentWithLocalState(equipment);

              // After equipment loads, check if there's a pending LOTO point to highlight
              const pendingLotoPoint = this.builderState.currentLotoPoint();
              console.log('[RightPanel] Equipment loaded, pendingLotoPoint:', pendingLotoPoint?.id, pendingLotoPoint?.tagNumber);
              if (pendingLotoPoint) {
                // Use setTimeout to ensure the shapes are rendered before highlighting
                setTimeout(() => {
                  this.highlightLotoPointEquipment(pendingLotoPoint);
                }, 100);
              }
            }
          } else if (equipment && equipment.length === 0) {
            // Always clear equipment when empty array is received
            // This handles file switching where the new file has no equipment
            this.builderState.setCurrentEquipment([]);
          }
        },
        error: (error) => {
          console.error('Error loading equipment:', error);
        }
      });

    // Subscribe to LOTO point selection from left menu
    toObservable(this.lotoPointStateService.selectedItem, { injector: this.injector })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (lotoPoint) => {
          if (lotoPoint) {
            this.highlightLotoPointEquipment(lotoPoint);
          }
        },
        error: (error) => {
          console.error('Error handling LOTO point selection:', error);
        }
      });

    // Subscribe to equipment updates to keep builder state in sync
    // This handles cases where equipment is updated from any component
    this.equipmentService.equipmentUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedEquipment) => {
          const currentEquipment = this.builderState.currentEquipment();
          const currentFileId = this.builderState.currentFile()?.id;

          // Only update if the equipment belongs to the current file
          if (currentFileId && updatedEquipment.mainFileId === currentFileId) {
            console.log('[LOTO Builder] Equipment updated, refreshing local state:', updatedEquipment.id);
            const updatedList = currentEquipment.map(eq =>
              eq.id === updatedEquipment.id ? updatedEquipment : eq
            );
            this.builderState.setCurrentEquipment(updatedList);
          }
        }
      });

    // Subscribe to LOTO point updates to keep builder state in sync
    // This handles cases where LOTO points are updated from any component (form, table, etc.)
    this.lotoPointApiService.lotoPointUpdated$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updatedLotoPoint) => {
          console.log('[LOTO Builder] LOTO point updated:', updatedLotoPoint.id);
          this.updateLotoPointInEquipment(updatedLotoPoint);
        }
      });

    // Subscribe to LOTO point deletions
    this.lotoPointApiService.lotoPointDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (deletedLotoPointId) => {
          console.log('[LOTO Builder] LOTO point deleted:', deletedLotoPointId);
          this.removeLotoPointFromEquipment(deletedLotoPointId);
        }
      });

    // Subscribe to equipment deletions to keep local state in sync
    this.equipmentService.equipmentDeleted$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (deletedEquipmentId) => {
          console.log('[LOTO Builder] Equipment deleted:', deletedEquipmentId);
          this.removeEquipmentFromLocalList(deletedEquipmentId);
        }
      });
  }

  /**
   * Handle shape hover
   */
  onShapeHovered(shape: RfShape | null): void {
    if (!shape) {
      this.builderState.hoveredShapeId.set(null);
      this.builderState.hoveredLotoPoint.set(null);
      return;
    }

    this.builderState.hoveredShapeId.set(shape.id);

    // Find the equipment and get its first LOTO point
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      this.builderState.hoveredLotoPoint.set(matchingEquipment.lotoPoints[0]);
    } else {
      this.builderState.hoveredLotoPoint.set(null);
    }
  }

  /**
   * Handle shape click - show info window and set selection
   */
  onShapeClicked(shape: RfShape): void {
    // Set the selected shape for toolbar delete button
    this.builderState.selectedShapeId.set(shape.id);

    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      const lotoPoint = matchingEquipment.lotoPoints[0];
      this.builderState.showLotoPointInfoWindow(lotoPoint);
    }
  }

  /**
   * Handle shape double click - enable editing (already handled by interactive-image)
   */
  onShapeDoubleClicked(shape: RfShape): void {
    console.log('Shape double clicked - editing enabled by interactive-image', shape);
  }

  /**
   * Handle shape right click - context menu is now handled by interactive-image
   * This output is no longer needed but kept for backwards compatibility
   */
  onShapeRightClicked(shape: RfShape): void {
    // Context menu is now handled by interactive-image component
    // using customContextMenuActions input
  }

  /**
   * Handle shapes deleted from interactive-image (via toolbar, keyboard, or context menu)
   */
  onShapesDeleted(shapeIds: number[]): void {
    console.log('[LOTO Builder] Shapes deleted from interactive-image:', shapeIds);

    // Delete each equipment via API
    shapeIds.forEach(shapeId => {
      const equipment = this.builderState.currentEquipment();
      const matchingEquipment = equipment.find(eq => eq.id === shapeId);

      if (matchingEquipment) {
        this.equipmentService.deleteEquipment(matchingEquipment.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              console.log('[LOTO Builder] Equipment deleted via API:', matchingEquipment.id);
            },
            error: (error: any) => {
              console.error('Error deleting equipment:', error);
            }
          });
      }
    });

    // Clear selection
    this.builderState.selectedShapeId.set(null);
  }

  /**
   * Handle Edit action from context menu
   */
  private handleEditAction(shape: RfShape): void {
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      // Open form for existing LOTO point
      this.builderState.openLotoPointForm(matchingEquipment.lotoPoints[0]);
    } else {
      // Open empty form with "select existing" option
      this.builderState.openLotoPointForm(null);
      // Store the equipment for later association
      if (matchingEquipment) {
        this.builderState.setPendingEquipment(matchingEquipment);
      }
    }
  }

  /**
   * Handle Add to LOTO action from context menu
   */
  private handleAddToLotoAction(shape: RfShape): void {
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (!matchingEquipment?.lotoPoints || matchingEquipment.lotoPoints.length === 0) {
      console.warn('No LOTO point associated with this equipment');
      return;
    }

    const lotoPoint = matchingEquipment.lotoPoints[0];

    // Check if carousel is visible (LOTO building mode is active)
    if (this.builderState.isCarouselVisible()) {
      // Add to currently active LOTO standard
      this.builderState.addLotoPointToActiveStandard(lotoPoint);
    } else {
      // Open LOTO standards selector popup
      this.builderState.openLotoStandardsPopup();
      // Store the LOTO point to add after user selects standards
      this.builderState.setCurrentLotoPoint(lotoPoint);
    }
  }

  /**
   * Handle Delete action from context menu
   */
  private handleDeleteAction(shape: RfShape): void {
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (!matchingEquipment) {
      console.warn('No equipment found for shape:', shape.id);
      return;
    }

    // Confirm deletion
    const hasLotoPoints = matchingEquipment.lotoPoints && matchingEquipment.lotoPoints.length > 0;
    const confirmMessage = hasLotoPoints
      ? `Are you sure you want to delete this equipment? The LOTO point associations will be removed but the LOTO points will be preserved.`
      : `Are you sure you want to delete this equipment?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Start processing
    this.builderState.startProcessing('Deleting equipment...');

    // Delete equipment via API
    this.equipmentService.deleteEquipment(matchingEquipment.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          console.log('[LOTO Builder] Equipment deleted successfully:', matchingEquipment.id);
          this.builderState.stopProcessing();
          // Clear selection if deleted equipment was selected
          if (this.builderState.selectedShapeId() === matchingEquipment.id) {
            this.builderState.selectedShapeId.set(null);
          }
        },
        error: (error: any) => {
          console.error('Error deleting equipment:', error);
          this.builderState.stopProcessing();
          alert('Failed to delete equipment. Please try again.');
        }
      });
  }

  /**
   * Handle shape update (after drag/resize)
   */
  onShapeUpdated(shape: RfShape): void {
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (!matchingEquipment) return;

    // Update equipment coordinates
    const updatedEquipment = new EquipmentDto(matchingEquipment);

    if (shape.type === 'rectangle' || shape.type === 'image' || shape.type === 'svg-symbol') {
      const coordinates = JSON.stringify({
        startX: shape.x,
        startY: shape.y,
        endX: shape.x + shape.width,
        endY: shape.y + shape.height,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0
      })
      .replace(/^"|"$/g, '')
      .replace(/\\/g, '')
      .replace(/"(\w+)":/g, '$1:');

      const originalPictureSize = `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`;

      updatedEquipment.coordinates = coordinates;
      updatedEquipment.originalPictureSize = originalPictureSize;


      // Save to backend
      this.equipmentService.updateEquipment(updatedEquipment)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response: any) => {
            console.log('Equipment updated successfully:', response);
            this.builderState.hasUnsavedChanges.set(false);
          },
          error: (error: any) => {
            console.error('Error updating equipment:', error);
          }
        });
    }
  }

  /**
   * Handle new shape drawn (right-click drag)
   */
  onShapeDrawn(shape: RfShape): void {
    console.log('New shape drawn:', shape);

    // Only handle shapes with position and size properties
    if (shape.type !== 'rectangle' && shape.type !== 'image' && shape.type !== 'svg-symbol') {
      console.warn('Cannot create equipment from shape type:', shape.type);
      return;
    }

    // Start processing - show loading indicator
    this.builderState.startProcessing('Saving equipment...');

    // Create new equipment from shape
    const newEquipment = new EquipmentDto({
      coordinates: JSON.stringify({
        startX: shape.x,
        startY: shape.y,
        endX: shape.x + shape.width,
        endY: shape.y + shape.height,
        width: shape.width,
        height: shape.height,
        rotation: shape.rotation || 0
      }).replace(/^"|"$/g, '').replace(/\\/g, '').replace(/"(\w+)":/g, '$1:'),
      originalPictureSize: `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`,
      mainFileObject: this.builderState.currentFile(),
    });

    // Save equipment to backend
    this.equipmentService.updateEquipment(newEquipment)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: any) => {
          console.log('Equipment created successfully:', response);
          const savedEquipment = EquipmentDto.fromJson(response.responseData);

          // Add the newly created equipment to the local list immediately
          this.addEquipmentToLocalList(savedEquipment);

          // If text recognition is enabled, perform OCR and open table with search
          if (this.builderState.isTextRecognitionEnabled()) {
            this.performTextRecognitionAndOpenPopup(shape, savedEquipment);
          } else {
            // Stop processing and open empty LOTO point form
            this.builderState.stopProcessing();
            this.builderState.openLotoPointFormForNewEquipment(savedEquipment);
          }
        },
        error: (error: any) => {
          console.error('Error creating equipment:', error);
          this.builderState.stopProcessing();
        }
      });
  }

  /**
   * Perform text recognition on the drawn shape and open popup accordingly
   */
  private performTextRecognitionAndOpenPopup(shape: RfShape, equipment: EquipmentDto): void {
    const filePath = this.builderState.currentFile()?.fileLink;

    if (!filePath) {
      console.warn('No file path available for text recognition');
      this.builderState.stopProcessing();
      this.builderState.openLotoPointFormForNewEquipment(equipment);
      return;
    }

    // Update processing message for OCR
    this.builderState.processingMessage.set('Recognizing text...');

    this.imageService.getTextFromRfShape(filePath, shape)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((text: string) => {
          // Stop processing before opening popup
          this.builderState.stopProcessing();

          if (text && text.trim()) {
            const recognizedText = text.trim();
            console.log('Text recognized:', recognizedText);
            this.builderState.setRecognizedText(recognizedText);
            // Open table view with pre-filtered search by recognized tag number
            this.builderState.openLotoPointTableWithSearch(recognizedText, equipment);
          } else {
            // No text recognized, open empty form
            this.builderState.openLotoPointFormForNewEquipment(equipment);
          }
        }),
        catchError((error) => {
          console.error('Error during text recognition:', error);
          // Stop processing and fall back to opening empty form
          this.builderState.stopProcessing();
          this.builderState.openLotoPointFormForNewEquipment(equipment);
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Handle save button click
   */
  onSave(): void {
    // Currently, equipment is auto-saved when updated or drawn
    // This method can be used for explicit save operations or batch saves
    console.log('Save button clicked');

    // Clear the unsaved changes flag
    this.builderState.hasUnsavedChanges.set(false);

    // TODO: Add any additional save logic here
    // For example: save form data, validate LOTO points, etc.
  }

  /**
   * Handle close button click
   */
  onClose(): void {
    this.closeRequested.emit();
  }

  /**
   * Handle delete button click in toolbar
   */
  onDeleteSelected(): void {
    const shapeId = this.selectedShapeId();
    if (!shapeId) return;

    // Create a mock shape with the selected ID to reuse handleDeleteAction
    const shape = { id: shapeId } as RfShape;
    this.handleDeleteAction(shape);
  }

  /**
   * Highlight equipment associated with selected LOTO point
   */
  private highlightLotoPointEquipment(lotoPoint: LotoPointDto): void {
    // Find equipment that has this LOTO point
    const equipment = this.builderState.currentEquipment();
    console.log('[highlightLotoPointEquipment] Looking for lotoPoint:', lotoPoint.id, lotoPoint.tagNumber);
    console.log('[highlightLotoPointEquipment] Equipment count:', equipment.length);

    const matchingEquipment = equipment.find(eq =>
      eq.lotoPoints && eq.lotoPoints.some(lp => lp.id === lotoPoint.id)
    );

    if (matchingEquipment) {
      console.log('[highlightLotoPointEquipment] Found matching equipment:', matchingEquipment.id);
      // Highlight the equipment by setting it as hovered and selected
      this.builderState.hoveredShapeId.set(matchingEquipment.id);
      this.builderState.selectedShapeId.set(matchingEquipment.id);
      this.builderState.hoveredLotoPoint.set(lotoPoint);

      // Show the info window
      this.builderState.showLotoPointInfoWindow(lotoPoint);
    } else {
      console.log('[highlightLotoPointEquipment] No equipment found for LOTO point:', lotoPoint.tagNumber);
      // Log equipment lotoPoints for debugging
      equipment.forEach(eq => {
        if (eq.lotoPoints && eq.lotoPoints.length > 0) {
          console.log('[highlightLotoPointEquipment] Equipment', eq.id, 'has lotoPoints:', eq.lotoPoints.map(lp => lp.id));
        }
      });
    }
  }

  /**
   * Update LOTO point in equipment list when it changes
   * This syncs changes from form submissions back to the builder state
   */
  private updateLotoPointInEquipment(updatedLotoPoint: LotoPointDto): void {
    const currentEquipment = this.builderState.currentEquipment();

    // Check if this LOTO point is associated with any equipment in the current file
    const updatedEquipmentList = currentEquipment.map(eq => {
      // Check if this equipment has the updated LOTO point
      if (eq.lotoPoints && eq.lotoPoints.some(lp => lp.id === updatedLotoPoint.id)) {
        // Update the LOTO point in the equipment's lotoPoints array
        const updatedLotoPoints = eq.lotoPoints.map(lp =>
          lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp
        );
        return new EquipmentDto({ ...eq, lotoPoints: updatedLotoPoints });
      }

      // Check if this equipment is in the updated LOTO point's equipmentList
      // This handles newly associated equipment
      if (updatedLotoPoint.equipmentList && updatedLotoPoint.equipmentList.some(e => e.id === eq.id)) {
        // Check if LOTO point is not already in this equipment's lotoPoints
        if (!eq.lotoPoints || !eq.lotoPoints.some(lp => lp.id === updatedLotoPoint.id)) {
          const existingLotoPoints = eq.lotoPoints || [];
          return new EquipmentDto({
            ...eq,
            lotoPoints: [...existingLotoPoints, updatedLotoPoint]
          });
        }
      }

      return eq;
    });

    // Check if any equipment was actually updated
    const hasChanges = updatedEquipmentList.some((eq, index) => eq !== currentEquipment[index]);
    if (hasChanges) {
      console.log('[LOTO Builder] Updated equipment with new LOTO point data');
      this.builderState.setCurrentEquipment(updatedEquipmentList);
    }
  }

  /**
   * Remove LOTO point from equipment list when it's deleted.
   * Also removes any equipment that no longer has any LOTO points (since the server
   * deletes equipment shapes when their associated LOTO point is deleted).
   */
  private removeLotoPointFromEquipment(deletedLotoPointId: number): void {
    const currentEquipment = this.builderState.currentEquipment();

    // First, update equipment by removing the deleted LOTO point from their lotoPoints arrays
    const updatedEquipmentList = currentEquipment
      .map(eq => {
        if (eq.lotoPoints && eq.lotoPoints.some(lp => lp.id === deletedLotoPointId)) {
          const filteredLotoPoints = eq.lotoPoints.filter(lp => lp.id !== deletedLotoPointId);
          return new EquipmentDto({ ...eq, lotoPoints: filteredLotoPoints });
        }
        return eq;
      })
      // Then, filter out equipment that no longer has any LOTO points
      // (these are shapes that were deleted on the server along with the LOTO point)
      .filter(eq => {
        const hadDeletedLotoPoint = currentEquipment.find(
          orig => orig.id === eq.id
        )?.lotoPoints?.some(lp => lp.id === deletedLotoPointId);

        // If this equipment had the deleted LOTO point and now has no LOTO points, remove it
        if (hadDeletedLotoPoint && (!eq.lotoPoints || eq.lotoPoints.length === 0)) {
          console.log('[LOTO Builder] Removing equipment with no remaining LOTO points:', eq.id);
          return false;
        }
        return true;
      });

    if (updatedEquipmentList.length !== currentEquipment.length ||
        updatedEquipmentList.some((eq, index) => eq !== currentEquipment[index])) {
      console.log('[LOTO Builder] Removed deleted LOTO point and associated equipment');
      this.builderState.setCurrentEquipment(updatedEquipmentList);
    }
  }

  /**
   * Remove equipment from local list when it's deleted
   */
  private removeEquipmentFromLocalList(deletedEquipmentId: number): void {
    const currentEquipment = this.builderState.currentEquipment();
    const filteredEquipment = currentEquipment.filter(eq => eq.id !== deletedEquipmentId);

    if (filteredEquipment.length !== currentEquipment.length) {
      console.log('[LOTO Builder] Removed deleted equipment from local list:', deletedEquipmentId);
      this.builderState.setCurrentEquipment(filteredEquipment);
    }
  }

  /**
   * Add newly created equipment to the local equipment list
   */
  private addEquipmentToLocalList(equipment: EquipmentDto): void {
    const currentEquipment = this.builderState.currentEquipment();
    const currentFileId = this.builderState.currentFile()?.id;

    // Only add if the equipment belongs to the current file
    if (currentFileId && equipment.mainFileId === currentFileId) {
      // Check if it's not already in the list
      if (!currentEquipment.some(eq => eq.id === equipment.id)) {
        console.log('[LOTO Builder] Adding new equipment to local list:', equipment.id);
        this.builderState.setCurrentEquipment([...currentEquipment, equipment]);
      }
    }
  }

  /**
   * Merge incoming equipment with local state to preserve LOTO point associations
   * that may have been added locally but not yet reflected in the server response
   */
  private mergeEquipmentWithLocalState(incomingEquipment: EquipmentDto[]): void {
    const currentEquipment = this.builderState.currentEquipment();

    // If no current equipment, just set the incoming
    if (!currentEquipment || currentEquipment.length === 0) {
      this.builderState.setCurrentEquipment(incomingEquipment);
      return;
    }

    // Create a map of current equipment with their LOTO points
    const localLotoPointsMap = new Map<number, LotoPointDto[]>();
    currentEquipment.forEach(eq => {
      if (eq.id && eq.lotoPoints && eq.lotoPoints.length > 0) {
        localLotoPointsMap.set(eq.id, eq.lotoPoints);
      }
    });

    // Merge incoming equipment with local LOTO point associations
    const mergedEquipment = incomingEquipment.map(incomingEq => {
      const localLotoPoints = localLotoPointsMap.get(incomingEq.id);
      const incomingLotoPoints = incomingEq.lotoPoints || [];

      // If we have local LOTO points that aren't in the incoming data, preserve them
      if (localLotoPoints && localLotoPoints.length > 0) {
        // Merge: use incoming as base, but add any local LOTO points not already present
        const mergedLotoPoints = [...incomingLotoPoints];

        localLotoPoints.forEach(localLp => {
          if (!mergedLotoPoints.some(lp => lp.id === localLp.id)) {
            mergedLotoPoints.push(localLp);
          }
        });

        if (mergedLotoPoints.length > incomingLotoPoints.length) {
          console.log('[LOTO Builder] Preserving local LOTO points for equipment:', incomingEq.id);
          return new EquipmentDto({
            ...incomingEq,
            lotoPoints: mergedLotoPoints
          });
        }
      }

      return incomingEq;
    });

    // Also add any equipment that exists locally but not in the incoming data
    // (newly created equipment that hasn't been included in the response yet)
    currentEquipment.forEach(localEq => {
      if (localEq.id && !mergedEquipment.some(eq => eq.id === localEq.id)) {
        console.log('[LOTO Builder] Preserving locally-added equipment:', localEq.id);
        mergedEquipment.push(localEq);
      }
    });

    this.builderState.setCurrentEquipment(mergedEquipment);
  }
}
