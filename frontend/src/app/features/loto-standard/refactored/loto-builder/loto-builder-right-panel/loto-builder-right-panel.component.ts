import { Component, inject, computed, DestroyRef, effect, output, Injector, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { InteractiveImageComponent } from '../../../../../shared/image/refactored/interactive-image/interactive-image.component';
import { LotoBuilderInfoWindowComponent } from '../loto-builder-info-window/loto-builder-info-window.component';
import { LotoBuilderConnectorInfoWindowComponent } from '../loto-builder-connector-info-window/loto-builder-connector-info-window.component';
import { ContextMenuAction } from '../../../../../shared/menu/context-menu/context-menu.component';
import { getPreset, InteractiveImageConfig } from '../../../../../shared/image/refactored/models/interactive-image-config.model';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { EquipmentMapperService } from '../../../../equipment/refactored/services/equipment-mapper.service';
import { EquipmentService } from '../../../../../services/equipment.service';
import { RfLotoPointStateService } from '../../../../loto-points/refactored/services/rf-loto-point-state.service';
import { RfLotoPointApiService } from '../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { ImageService } from '../../../../../services/text-recognition.service';
import { RfShape, SVGSymbolShape } from '../../../../../shared/image/refactored/models/fr-shape.model';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { GuideDirective } from '../../../../../shared/guide/guide.directive';
import { ReactiveGuideDirective } from '../../../../../shared/guide/reactive-guide.directive';
import { PIDSymbol, PIDSymbolsService } from '../../../../../shared/image/refactored/services/pid-symbols.service';
import { SyncUpdateService } from '../../../../../services/sync/sync-update.service';
import { FileDto } from '../../../../../models/file/file.model';
import { RfFileApiService } from '../../../../files/refactored/services/rf-file-api.service';
import { RfFileConnectorApiService } from '../../../../files/refactored/services/rf-file-connector-api.service';
import { FileConnectorMapperService } from '../../../../files/refactored/services/file-connector-mapper.service';
import { ConnectorNavigationService } from '../../../../files/refactored/services/connector-navigation.service';
import { FileConnectorDto, FileConnectorIdDto } from '../../../../../models/file/file-connector.model';
import { FileConnectorShape } from '../../../../../shared/image/refactored/models/fr-shape.model';
import { OFF_PAGE_CONNECTOR_SYMBOL_ID } from '../../../../../shared/image/refactored/services/pid-symbols.service';
import { ConnectorTargetPickerDialogComponent } from '../../../../files/refactored/connector-target-picker-dialog/connector-target-picker-dialog.component';
import { ConnectorEditDialogComponent } from '../../../../files/refactored/connector-edit-dialog/connector-edit-dialog.component';
import { LegacyConnectorMigrateDialogComponent, LegacyConnectorMigrateResult } from '../../../../files/refactored/legacy-connector-migrate-dialog/legacy-connector-migrate-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-loto-builder-right-panel',
  standalone: true,
  imports: [
    CommonModule,
    InteractiveImageComponent,
    LotoBuilderInfoWindowComponent,
    LotoBuilderConnectorInfoWindowComponent,
    GuideDirective,
    ReactiveGuideDirective,
  ],
  templateUrl: './loto-builder-right-panel.component.html',
  styleUrl: './loto-builder-right-panel.component.css',
})
export class LotoBuilderRightPanelComponent {
  @ViewChild(InteractiveImageComponent) interactiveImage!: InteractiveImageComponent;

  protected builderState = inject(LotoBuilderStateService);
  private currentFileService = inject(CurrentFileService);
  private equipmentMapper = inject(EquipmentMapperService);
  private equipmentService = inject(EquipmentService);
  private lotoPointStateService = inject(RfLotoPointStateService);
  private lotoPointApiService = inject(RfLotoPointApiService);
  private imageService = inject(ImageService);
  private pidSymbolsService = inject(PIDSymbolsService);
  private syncUpdateService = inject(SyncUpdateService);
  private fileApi = inject(RfFileApiService);
  private connectorApi = inject(RfFileConnectorApiService);
  private connectorMapper = inject(FileConnectorMapperService);
  private connectorNav = inject(ConnectorNavigationService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // ==================== FILE CONNECTORS (off-page references) ====================
  // FileConnectors are first-class entities (NOT Equipment with eqType='connector'
  // anymore — that legacy is migrated via /ng/file-connectors/migrate-from-equipment).
  // The viewer renders connector shapes alongside equipment shapes; click on a
  // connector navigates to its target file instead of opening the equipment dialog.
  currentConnectors = signal<FileConnectorDto[]>([]);
  /** Connector currently shown in the info window — null hides it. Set by
   *  single-click on a file-connector shape; cleared on file change, on
   *  empty-space click, on close button, or when the underlying connector
   *  is deleted. */
  selectedConnector = signal<FileConnectorDto | null>(null);
  /** Monotonic token guarding against stale connector-load responses. Bumped
   *  on every file change; in-flight responses with an older token are dropped
   *  so a rapid file-switch doesn't overwrite the new file's connectors with
   *  the previous file's late response (codex stale-response race fix). */
  private connectorLoadToken = 0;

  // Output event for close button
  closeRequested = output<void>();

  // Symbol picker state
  showSymbolPicker = signal(false);
  shapeToChangeSymbol = signal<RfShape | null>(null);
  availableSymbols = computed(() => this.pidSymbolsService.getAllSymbols());

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
        id: 'changeSymbol',
        label: 'Change Symbol',
        icon: '🔄',
        action: (shape: RfShape) => this.handleChangeSymbolAction(shape)
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

  // ==================== COUNTERPART SIDE-BY-SIDE ====================
  // Optional split-view that renders the linked counterpart file alongside
  // the working P&ID. Read-only — no shape editing in the counterpart pane
  // (avoids polluting shared shape state). User can switch the loto-builder's
  // current file to the counterpart for full editing.
  showCounterpart = signal<boolean>(false);
  counterpartFile = signal<FileDto | null>(null);
  counterpartLoading = signal<boolean>(false);
  counterpartError = signal<string | null>(null);

  counterpartImageUrl = computed(() => this.counterpartFile()?.fileLink || '');
  hasCounterpart = computed(() => !!this.builderState.currentFile()?.counterpartId);

  /**
   * Equipment shapes for the counterpart pane — same mapper the primary uses,
   * but sourced from the counterpart's full FileDto (points field). Read-only
   * on this pane (no click handlers wired) — just visual overlay so the user
   * can compare equipment positions side-by-side.
   */
  counterpartShapes = computed(() => {
    const cp = this.counterpartFile();
    if (!cp || !cp.points || cp.points.length === 0) return [];
    return this.equipmentMapper.mapAllToRfShapes(cp.points);
  });

  toggleCounterpart(): void {
    // Simple toggle — the effect below handles loading/refreshing based on
    // the current file. No duplicate fetch logic.
    this.showCounterpart.set(!this.showCounterpart());
  }

  private loadCounterpart(id: number): void {
    this.counterpartLoading.set(true);
    this.counterpartError.set(null);
    this.fileApi.getFileById(String(id)).pipe(
      map(r => FileDto.fromJson(r.responseData)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (dto) => { this.counterpartFile.set(dto); this.counterpartLoading.set(false); },
      error: (err) => {
        console.error('Failed to load counterpart:', err);
        this.counterpartError.set('Failed to load counterpart file');
        this.counterpartLoading.set(false);
      },
    });
  }

  /**
   * Get current shapes from equipment + connectors. Connector shapes are
   * appended last so they render on top — small UX win, the off-page-reference
   * glyph should be visible above any equipment that shares its region.
   */
  currentShapes = computed(() => {
    const equipment = this.builderState.currentEquipment();
    const equipmentShapes = equipment && equipment.length > 0
      ? this.equipmentMapper.mapAllToRfShapes(equipment)
      : [];
    const connectorShapes = this.connectorMapper.mapAllToRfShapes(this.currentConnectors());
    return [...equipmentShapes, ...connectorShapes];
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

    // Keep the counterpart pane in sync when the user switches to a different
    // primary file. Without this, an open counterpart pane keeps showing the
    // OLD file's counterpart even after the user navigates to a new file.
    effect(() => {
      if (!this.showCounterpart()) return;
      const cpId = this.builderState.currentFile()?.counterpartId;
      if (!cpId) {
        this.counterpartFile.set(null);
        this.counterpartError.set('Current file has no counterpart linked.');
        return;
      }
      const cached = this.counterpartFile();
      if (cached && cached.id === cpId) return;
      this.loadCounterpart(cpId);
    });

    // Fetch connectors whenever the current file changes. Empty array if the
    // file has no connectors — viewer just shows equipment shapes alone.
    //
    // CRITICAL: clear currentConnectors IMMEDIATELY on file change, before the
    // fetch returns. Without this, the previous file's connectors stay
    // rendered during the in-flight fetch and — worse — get scaled to the
    // current file's canvas using the OLD file's originalPictureSize, showing
    // as misplaced shapes. The token guard handles fast-switch race; the
    // immediate clear handles the perceived persistence.
    effect(() => {
      const fileId = this.builderState.currentFile()?.id;
      const myToken = ++this.connectorLoadToken;
      this.currentConnectors.set([]);
      // Selected-connector signal references an old file's connector if we
      // leave it set across a file switch — close the info window now.
      this.selectedConnector.set(null);
      if (!fileId) return;
      this.connectorApi.bySourceFile(fileId).subscribe({
        next: (resp) => {
          if (myToken !== this.connectorLoadToken) return; // newer request superseded us
          this.currentConnectors.set((resp.responseData ?? []).map(c => new FileConnectorDto(c)));
        },
        error: (err) => {
          if (myToken !== this.connectorLoadToken) return;
          console.error('[LOTO Builder] failed to load connectors for file', fileId, err);
          this.currentConnectors.set([]);
        },
      });
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

    // Subscribe to SSE sync updates for Equipment entities (from other machines)
    // This updates the UI when equipment is synced from the server
    this.syncUpdateService.getEntityTypeUpdates$('Equipment')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.handleEquipmentSyncUpdate(event.entityId);
        }
      });

    // Subscribe to SSE sync updates for LotoPoint entities (from other machines)
    // This updates the UI when LOTO points are synced from the server
    this.syncUpdateService.getEntityTypeUpdates$('LotoPoint')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (event) => {
          this.handleLotoPointSyncUpdate(event.entityId);
        }
      });
  }

  /**
   * Handle shape hover. For connector shapes, set the hovered id but skip
   * the equipment lookup — a connector id could theoretically collide with
   * an equipment id (separate id-spaces), and we don't want hover to show a
   * LOTO-point tooltip for an unrelated equipment row.
   */
  onShapeHovered(shape: RfShape | null): void {
    if (!shape) {
      this.builderState.hoveredShapeId.set(null);
      this.builderState.hoveredLotoPoint.set(null);
      return;
    }

    this.builderState.hoveredShapeId.set(shape.id);

    if (shape.type === 'file-connector') {
      this.builderState.hoveredLotoPoint.set(null);
      return;
    }

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
   * Handle shape click. For connectors, single-click ONLY selects the shape
   * (so the user can resize/move it via the interactive-image's selection
   * handles). Navigation moves to {@link onShapeDoubleClicked} — see that
   * handler. Equipment behavior is unchanged.
   */
  onShapeClicked(shape: RfShape): void {
    this.builderState.selectedShapeId.set(shape.id);

    if (shape.type === 'file-connector') {
      // Selection only — navigation happens on double-click. This lets the
      // user reposition the connector shape without accidentally jumping to
      // the target file every time they click it. Also pop the info window
      // anchored to the viewer so the user can verify the target / open
      // edit / navigate without right-clicking.
      const connector = this.currentConnectors().find(c => c.id === shape.id);
      this.selectedConnector.set(connector ?? null);
      return;
    }
    // Equipment click — close any open connector info window so the two
    // panels don't compete for the user's attention.
    this.selectedConnector.set(null);

    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      const lotoPoint = matchingEquipment.lotoPoints[0];
      this.builderState.showLotoPointInfoWindow(lotoPoint);
    }
  }

  /**
   * Fetch the connector's target file and route the viewer there. Before
   * navigating, arms the navigation service with the source connector's
   * counterpartConnectorId — the target file's connector mapper picks it up
   * on the next render and marks the matching shape as selected, so the user
   * sees where they came from highlighted on arrival.
   */
  private navigateToConnectorTarget(shape: FileConnectorShape): void {
    if (!shape.targetFileId) {
      console.warn('[LOTO Builder] connector shape has no targetFileId', shape);
      return;
    }
    // Arm the highlight BEFORE the file switch so the destination's render
    // sees it. Connector mapper consumes + clears the signal automatically.
    this.connectorNav.flagPendingHighlight(shape.counterpartConnectorId ?? null);
    this.fileApi.getFileById(String(shape.targetFileId)).pipe(
      map(r => FileDto.fromJson(r.responseData)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (target) => this.currentFileService.setCurrentFile(target),
      error: (err) => {
        this.connectorNav.clearPendingHighlight(); // navigation failed — un-arm
        console.error('[LOTO Builder] failed to load connector target', shape.targetFileId, err);
      },
    });
  }

  /**
   * Info-window Navigate button. Mirrors the double-click navigation path —
   * arm the highlight, fetch the target file, switch the viewer. Close the
   * info window after navigation since its data is about to be stale.
   */
  onConnectorInfoNavigate(connector: FileConnectorDto): void {
    if (!connector.targetFileId) {
      console.warn('[LOTO Builder] info-window navigate: no targetFileId', connector);
      return;
    }
    this.connectorNav.flagPendingHighlight(connector.counterpartConnectorId ?? null);
    this.selectedConnector.set(null);
    this.fileApi.getFileById(String(connector.targetFileId)).pipe(
      map(r => FileDto.fromJson(r.responseData)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (target) => this.currentFileService.setCurrentFile(target),
      error: (err) => {
        this.connectorNav.clearPendingHighlight();
        console.error('[LOTO Builder] info-window: failed to load target', connector.targetFileId, err);
      },
    });
  }

  /**
   * Info-window Edit button. Reuses the same edit-dialog flow as the
   * right-click context menu — opens the dialog, replaces the connector
   * in-place on save, and updates the info window so it shows fresh data.
   */
  onConnectorInfoEdit(connector: FileConnectorDto): void {
    const sourceFile = this.builderState.currentFile();
    if (!sourceFile) return;
    const ref = this.dialog.open(ConnectorEditDialogComponent, {
      data: { connector, sourceFile },
      width: '560px',
      maxWidth: '90vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe((saved: FileConnectorDto | undefined) => {
      if (!saved) return;
      const dto = new FileConnectorDto(saved);
      this.currentConnectors.update(cs => cs.map(c => c.id === dto.id ? dto : c));
      // Refresh the info window with the saved data so the user sees the
      // change reflected immediately without re-clicking.
      this.selectedConnector.set(dto);
    });
  }

  /**
   * Info-window Link button result. The link endpoint updates both sides on
   * the server; on the client we refetch the local connector so it flips
   * to paired and the info window reflects that. Don't refetch the peer
   * — it's on a different file (the target), out of scope for this viewer.
   */
  onConnectorInfoLinked(evt: { connectorId: number; counterpartId: number }): void {
    this.connectorApi.getById(evt.connectorId).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (resp) => {
        const dto = new FileConnectorDto(resp.responseData);
        this.currentConnectors.update(cs => cs.map(c => c.id === dto.id ? dto : c));
        if (this.selectedConnector()?.id === dto.id) this.selectedConnector.set(dto);
      },
      error: (err) => console.warn('[LOTO Builder] info-window link: refresh failed', err),
    });
  }

  /**
   * Handle shape double click. For connectors, double-click is the explicit
   * navigation gesture — jumps to the target file and (when paired) highlights
   * the counterpart connector on arrival. Equipment double-click is unchanged
   * (the interactive-image handles edit-mode entry on its own).
   */
  onShapeDoubleClicked(shape: RfShape): void {
    if (shape.type === 'file-connector') {
      this.navigateToConnectorTarget(shape as FileConnectorShape);
      return;
    }
    // Equipment: edit-mode entry already handled by interactive-image
  }

  onBuildDiagram(): void {
    if (!this.builderState.currentFile()) return;
    this.builderState.openDiagramBuilder();
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
   * Handle shapes deleted from interactive-image (via toolbar, keyboard, or context menu).
   * Branches by id: if the id matches a current connector, delete via the
   * FileConnector endpoint (which also clears the surviving counterpart's
   * pointer); otherwise delete the matching Equipment as before.
   */
  onShapesDeleted(shapeIds: number[]): void {
    console.log('[LOTO Builder] Shapes deleted from interactive-image:', shapeIds);
    const connectors = this.currentConnectors();

    shapeIds.forEach(shapeId => {
      const matchingConnector = connectors.find(c => c.id === shapeId);
      if (matchingConnector) {
        this.connectorApi.delete(matchingConnector.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              console.log('[LOTO Builder] FileConnector deleted via API:', matchingConnector.id);
              this.currentConnectors.update(cs => cs.filter(c => c.id !== matchingConnector.id));
              if (this.selectedConnector()?.id === matchingConnector.id) this.selectedConnector.set(null);
            },
            error: (error: any) => console.error('Error deleting connector:', error),
          });
        return;
      }

      // Fall through: treat as equipment delete (legacy default).
      const equipment = this.builderState.currentEquipment();
      const matchingEquipment = equipment.find(eq => eq.id === shapeId);
      if (matchingEquipment) {
        this.equipmentService.deleteEquipment(matchingEquipment.id)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => console.log('[LOTO Builder] Equipment deleted via API:', matchingEquipment.id),
            error: (error: any) => console.error('Error deleting equipment:', error),
          });
      }
    });

    this.builderState.selectedShapeId.set(null);
  }

  /**
   * Open the connector edit dialog (change target file, edit label).
   * Invoked from the right-click context menu's Edit action when the
   * clicked shape is a file-connector.
   */
  private openConnectorEditDialog(shape: FileConnectorShape): void {
    const connector = this.currentConnectors().find(c => c.id === shape.id);
    const sourceFile = this.builderState.currentFile();
    if (!connector || !sourceFile) {
      console.warn('[LOTO Builder] cannot edit connector: not loaded or no source file', shape.id);
      return;
    }
    const ref = this.dialog.open(ConnectorEditDialogComponent, {
      data: { connector, sourceFile },
      width: '560px',
      maxWidth: '90vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe((saved: FileConnectorDto | undefined) => {
      if (!saved) return;
      // Replace in-place so the canvas re-renders with the new target/label.
      this.currentConnectors.update(cs =>
        cs.map(c => c.id === saved.id ? new FileConnectorDto(saved) : c)
      );
    });
  }

  /**
   * Handler for the off-page-connector draw branch. Two steps:
   *  1. Run OCR on the drawn shape's image region — if the user circled an
   *     existing connector label like "PD-031A", the recognized text gets
   *     pre-filled into the picker's search field so they land directly on
   *     the matching file. OCR is best-effort; if it fails or returns nothing
   *     the picker opens empty.
   *  2. Open the target-file picker. On selection, persists a FileConnector
   *     with the drawn shape's coordinates and refreshes the connector list.
   *     On cancel/error, removes the orphan canvas shape (same trick the
   *     Get Text branch uses).
   */
  private handleConnectorDrawn(shape: SVGSymbolShape): void {
    const sourceFile = this.builderState.currentFile();
    if (!sourceFile) {
      this.interactiveImage?.removeShape(shape.id);
      return;
    }

    // OCR-assist: try to read text from the drawn region before opening
    // the picker. Don't block on this — pass through to the picker with
    // empty initialQuery if OCR fails or the file path isn't available.
    const filePath = sourceFile.fileLink;
    if (!filePath) {
      this.openConnectorTargetPicker(shape, sourceFile, '');
      return;
    }
    this.builderState.startProcessing('Reading connector label…');
    this.imageService.getTextFromRfShape(filePath, shape)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (text: string) => {
          this.builderState.stopProcessing();
          this.openConnectorTargetPicker(shape, sourceFile, (text || '').trim());
        },
        error: (err) => {
          console.warn('[LOTO Builder] connector OCR failed (continuing without prefill):', err);
          this.builderState.stopProcessing();
          this.openConnectorTargetPicker(shape, sourceFile, '');
        },
      });
  }

  /**
   * Open the picker, then persist the FileConnector with the picked target
   * (or remove the orphan shape on cancel). Split out so the OCR pre-step
   * and the direct-open path share one save flow.
   */
  private openConnectorTargetPicker(
    shape: SVGSymbolShape,
    sourceFile: FileDto,
    initialQuery: string
  ): void {
    const ref = this.dialog.open(ConnectorTargetPickerDialogComponent, {
      data: { sourceFile, initialQuery },
      width: '720px',
      maxWidth: '90vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe((target: FileDto | undefined) => {
      if (!target?.id) {
        // User cancelled — drop the orphan shape so the canvas doesn't keep
        // a connector-symbol drawing that has no backing entity.
        this.interactiveImage?.removeShape(shape.id);
        return;
      }
      const payload: FileConnectorIdDto = {
        sourceFileId: sourceFile.id ?? null,
        targetFileId: target.id,
        coordinates: JSON.stringify({
          startX: shape.x, startY: shape.y,
          endX: shape.x + shape.width, endY: shape.y + shape.height,
          width: shape.width, height: shape.height,
          rotation: shape.rotation || 0,
        }).replace(/^"|"$/g, '').replace(/\\/g, '').replace(/"(\w+)":/g, '$1:'),
        originalPictureSize: `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`,
        rotation: shape.rotation ?? 0,
        symbolId: shape.symbolId,
        svgPath: shape.svgPath,
        counterpartConnectorId: null,
        label: null,
        // New connectors default to label-off — user opts in per-connector
        // via the edit dialog. Matches the persisted default for legacy rows.
        showLabel: false,
      };
      this.connectorApi.save(payload).subscribe({
        next: (resp) => {
          const created = new FileConnectorDto(resp.responseData);
          // Drop the transient canvas shape — the new FileConnector will
          // re-render via the connectors-list refresh below as a proper
          // FileConnectorShape (with the connector's id, target label, etc).
          this.interactiveImage?.removeShape(shape.id);
          this.currentConnectors.update(cs => [...cs, created]);
        },
        error: (err) => {
          console.error('[LOTO Builder] failed to save connector', err);
          this.interactiveImage?.removeShape(shape.id);
        },
      });
    });
  }

  /**
   * Handle Edit action from context menu. Three branches:
   *  1. FileConnector shape → open the connector edit dialog (change target, label).
   *  2. Equipment with eqType='connector' (legacy, not yet migrated) → open
   *     the migrate-to-FileConnector dialog so the user can pick a target
   *     and convert this Equipment to a proper FileConnector in one step.
   *     Same UX whether you're fixing 1 row or 100 — the bulk console
   *     handles the easy cases; this handles the hand-resolution cases.
   *  3. Regular Equipment → open the LOTO-point form / pending-equipment flow.
   */
  private handleEditAction(shape: RfShape): void {
    if (shape.type === 'file-connector') {
      this.openConnectorEditDialog(shape as FileConnectorShape);
      return;
    }
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === shape.id);

    // Legacy connector branch — Equipment row that the bulk migration
    // skipped (short tag / no match / ambiguous match). Open the inline
    // migrate dialog instead of the LOTO point form, since this row doesn't
    // represent a piece of equipment to LOTO out.
    if (matchingEquipment?.eqType?.name?.toLowerCase() === 'connector' && matchingEquipment.id) {
      this.openLegacyConnectorMigrateDialog(matchingEquipment.id, shape.id);
      return;
    }

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
   * Open the inline migrate-to-FileConnector dialog for a legacy Equipment
   * row. On success: remove the old Equipment from local state (it's now
   * soft-deleted on the backend) and add the freshly-created FileConnector
   * to currentConnectors so the canvas re-renders immediately. No reload
   * needed — the migration runner returns the new connector id and the
   * sync listener has already pushed it.
   */
  private openLegacyConnectorMigrateDialog(equipmentId: number, shapeId: number): void {
    const ref = this.dialog.open(LegacyConnectorMigrateDialogComponent, {
      data: { equipmentId },
      width: '640px',
      maxWidth: '95vw',
      autoFocus: false,
      restoreFocus: false,
    });
    ref.afterClosed().subscribe((result: LegacyConnectorMigrateResult | undefined) => {
      if (!result) return;
      const newConnectorId = result.item.newConnectorId;
      // Remove the old Equipment from local list — server soft-deleted it.
      this.removeEquipmentFromLocalList(equipmentId);
      if (this.builderState.selectedShapeId() === shapeId) {
        this.builderState.selectedShapeId.set(null);
      }
      // Fetch the freshly-created connector + append so it shows up immediately
      // (don't wait for SSE — the user just clicked, they expect instant feedback).
      if (newConnectorId) {
        this.connectorApi.getById(newConnectorId).subscribe({
          next: (resp) => {
            const dto = new FileConnectorDto(resp.responseData);
            this.currentConnectors.update(cs => [...cs.filter(c => c.id !== dto.id), dto]);
          },
          error: (err) => console.warn('[LOTO Builder] migrate-one: fetch new connector failed', err),
        });
      }
    });
  }

  /**
   * Handle Change Symbol action from context menu
   * Opens the symbol picker to allow user to change shape type
   */
  private handleChangeSymbolAction(shape: RfShape): void {
    // Only allow for rectangle and svg-symbol types
    if (shape.type !== 'rectangle' && shape.type !== 'svg-symbol') {
      console.warn('Cannot change symbol for shape type:', shape.type);
      return;
    }
    this.shapeToChangeSymbol.set(shape);
    this.showSymbolPicker.set(true);
  }

  /**
   * Apply selected symbol to the shape being changed
   */
  onSymbolSelected(symbol: PIDSymbol | null): void {
    const shape = this.shapeToChangeSymbol();
    if (!shape) return;

    // Use the interactive image component to change the symbol
    if (this.interactiveImage) {
      const updatedShape = this.interactiveImage.changeShapeSymbol(shape.id, symbol);

      // After shape is updated locally, also update equipment on the server
      if (updatedShape) {
        this.onShapeUpdated(updatedShape);
      }
    }

    this.closeSymbolPicker();
  }

  /**
   * Close the symbol picker without making changes
   */
  closeSymbolPicker(): void {
    this.showSymbolPicker.set(false);
    this.shapeToChangeSymbol.set(null);
  }

  /**
   * Check if the given symbol ID matches the current shape's symbol
   */
  isCurrentSymbol(symbolId: string): boolean {
    const shape = this.shapeToChangeSymbol();
    if (!shape || shape.type !== 'svg-symbol') return false;
    return (shape as SVGSymbolShape).symbolId === symbolId;
  }

  /**
   * Handle Add to LOTO action from context menu. No-op for connector shapes
   * — connectors don't carry a LOTO-point association by design.
   */
  private handleAddToLotoAction(shape: RfShape): void {
    if (shape.type === 'file-connector') return;
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
   * Handle Delete action from context menu. Branches by shape type — connector
   * delete uses the FileConnector endpoint (which also clears the surviving
   * counterpart's pointer); equipment delete uses the existing path.
   */
  private handleDeleteAction(shape: RfShape): void {
    if (shape.type === 'file-connector') {
      const cp = this.currentConnectors().find(c => c.id === shape.id);
      if (!cp) return;
      if (!confirm('Delete this connector? The link to the target file will be removed.')) return;
      this.connectorApi.delete(cp.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.currentConnectors.update(cs => cs.filter(c => c.id !== cp.id));
            // Info window holds a stale reference if the deleted connector
            // is the one being shown — close it.
            if (this.selectedConnector()?.id === cp.id) this.selectedConnector.set(null);
          },
          error: (err) => console.error('Error deleting connector:', err),
        });
      return;
    }

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
   * Handle shape update (after drag/resize). For FileConnector shapes,
   * persists the new coords back to the connector entity — without this
   * the interactive-image's local change is the only place the new
   * position exists, and the next refetch (file switch / page reload)
   * resurrects the original draw position. Equipment branch is unchanged.
   */
  onShapeUpdated(shape: RfShape): void {
    if (shape.type === 'file-connector') {
      this.persistConnectorShape(shape as FileConnectorShape);
      return;
    }
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

      // Update symbol-specific fields based on shape type
      if (shape.type === 'svg-symbol') {
        const symbolShape = shape as SVGSymbolShape;
        updatedEquipment.symbolId = symbolShape.symbolId;
        updatedEquipment.svgPath = symbolShape.svgPath;
      } else {
        // Converting to rectangle - clear symbol fields
        updatedEquipment.symbolId = null;
        updatedEquipment.svgPath = null;
      }

      // Save to backend
      this.equipmentService.updateEquipment(updatedEquipment)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (response: any) => {
            console.log('Equipment updated successfully:', response);
            // Update local equipment list with the saved data
            const savedEquipment = EquipmentDto.fromJson(response.responseData);
            this.updateEquipmentInLocalList(savedEquipment);
            this.builderState.hasUnsavedChanges.set(false);
          },
          error: (error: any) => {
            console.error('Error updating equipment:', error);
          }
        });
    }
  }

  /**
   * Persist the new shape coordinates back to the FileConnector entity.
   * Pulls the source connector DTO from currentConnectors so we don't lose
   * fields the canvas doesn't know about (counterpartConnectorId, label,
   * existing rotation if shape.rotation is undefined). Writes back into
   * currentConnectors on success so subsequent renders see the new geometry.
   */
  private persistConnectorShape(shape: FileConnectorShape): void {
    const existing = this.currentConnectors().find(c => c.id === shape.id);
    if (!existing) {
      console.warn('[LOTO Builder] persistConnectorShape: connector not in local list', shape.id);
      return;
    }
    // Same encoding the create-flow uses (see openConnectorTargetPicker) —
    // mirror it exactly so a round-trip (create → resize → save) doesn't
    // change the coordinate format and trip the migration idempotency hash.
    const coordinates = JSON.stringify({
      startX: shape.x, startY: shape.y,
      endX: shape.x + shape.width, endY: shape.y + shape.height,
      width: shape.width, height: shape.height,
      rotation: shape.rotation || 0,
    }).replace(/^"|"$/g, '').replace(/\\/g, '').replace(/"(\w+)":/g, '$1:');

    const payload: FileConnectorIdDto = {
      id: existing.id,
      sourceFileId: existing.sourceFileId,
      targetFileId: existing.targetFileId,
      coordinates,
      originalPictureSize: `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`,
      rotation: shape.rotation ?? existing.rotation ?? 0,
      symbolId: shape.symbolId ?? existing.symbolId,
      svgPath: shape.svgPath ?? existing.svgPath,
      counterpartConnectorId: existing.counterpartConnectorId,
      label: existing.label,
      // Backend mapper uses null-as-skip, so this preserves the persisted
      // showLabel toggle through a resize/move (don't accidentally turn it
      // off when the user just drags the shape).
      showLabel: existing.showLabel,
    };
    this.connectorApi.save(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resp) => {
          const saved = new FileConnectorDto(resp.responseData);
          this.currentConnectors.update(cs => cs.map(c => c.id === saved.id ? saved : c));
          // Refresh info window if the moved connector is the one displayed.
          if (this.selectedConnector()?.id === saved.id) this.selectedConnector.set(saved);
        },
        error: (err) => console.error('[LOTO Builder] failed to persist connector resize/move:', err),
      });
  }

  /**
   * Update an existing equipment in the local list
   */
  private updateEquipmentInLocalList(updatedEquipment: EquipmentDto): void {
    const currentEquipment = this.builderState.currentEquipment();
    const updatedList = currentEquipment.map(eq =>
      eq.id === updatedEquipment.id ? updatedEquipment : eq
    );
    this.builderState.setCurrentEquipment(updatedList);
  }

  /**
   * Handle new shape drawn (right-click drag)
   */
  onShapeDrawn(shape: RfShape): void {
    // Only handle shapes with position and size properties
    if (shape.type !== 'rectangle' && shape.type !== 'image' && shape.type !== 'svg-symbol') {
      console.warn('Cannot create equipment from shape type:', shape.type);
      return;
    }

    // Off-page connector branch — if the user picked the connector symbol
    // before drawing, route to FileConnector creation (target-file picker
    // dialog → save FileConnector) instead of the Equipment save path.
    // This MUST come before the Get Text and equipment branches so the user
    // can't accidentally create an equipment row from a connector symbol.
    if (shape.type === 'svg-symbol'
        && (shape as SVGSymbolShape).symbolId === OFF_PAGE_CONNECTOR_SYMBOL_ID) {
      this.handleConnectorDrawn(shape as SVGSymbolShape);
      return;
    }

    // One-shot "Get Text" mode: skip equipment + LOTO point creation entirely,
    // just OCR the drawn region and show the result in a copyable dialog. The
    // mode auto-disables (in openGetTextDialog) so the next draw resumes the
    // normal flow.
    if (this.builderState.isGetTextModeEnabled()) {
      this.runGetTextOnShape(shape);
      return;
    }

    // Start processing - show loading indicator
    this.builderState.startProcessing('Saving equipment...');

    // Create new equipment from shape
    const equipmentData: any = {
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
    };

    // Add symbol-specific fields for svg-symbol shapes
    if (shape.type === 'svg-symbol') {
      const symbolShape = shape as SVGSymbolShape;
      equipmentData.symbolId = symbolShape.symbolId;
      equipmentData.svgPath = symbolShape.svgPath;
    }

    const newEquipment = new EquipmentDto(equipmentData);

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
   * One-shot Get Text capture. Runs OCR on the drawn region of the current
   * file and shows the result in a copy-to-clipboard dialog. Does NOT create
   * equipment or open the LOTO point flow. The Get Text toggle is consumed
   * (disabled) when the dialog opens, so the next draw resumes the normal
   * flow even if OCR returned nothing.
   */
  private runGetTextOnShape(shape: RfShape): void {
    // The InteractiveImageComponent added this shape to its local shape
    // manager inside finishDrawing() BEFORE emitting shapeDrawn — that's how
    // the normal flow gets the shape on the canvas while the parent finishes
    // saving equipment. In the Get Text path we never save anything, so the
    // shape is a UI-only orphan that lingers until the next file reload.
    // Tell the InteractiveImageComponent to drop it right away.
    this.interactiveImage?.removeShape(shape.id);

    const filePath = this.builderState.currentFile()?.fileLink;

    if (!filePath) {
      console.warn('Get Text: no file path available for OCR');
      // Disable the mode so the user isn't stuck — open dialog with empty
      // result so they get explicit feedback rather than a silent no-op.
      this.builderState.openGetTextDialog('');
      return;
    }

    this.builderState.startProcessing('Recognizing text…');

    this.imageService.getTextFromRfShape(filePath, shape)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap((text: string) => {
          this.builderState.stopProcessing();
          this.builderState.openGetTextDialog((text || '').trim());
        }),
        catchError((error) => {
          console.error('Get Text: OCR failed', error);
          this.builderState.stopProcessing();
          this.builderState.openGetTextDialog('');
          return of(null);
        })
      )
      .subscribe();
  }

  /**
   * Copy the Get Text dialog content to the clipboard. Uses the modern async
   * Clipboard API with a textarea fallback for older Electron renderers
   * that ship a stripped-down navigator.clipboard.
   */
  copyGetTextToClipboard(): void {
    const text = this.builderState.getTextDialogContent();
    if (!text) return;
    const onSuccess = () => {
      // Brief visual confirmation via the processing-message channel — it's
      // already wired into the existing loading overlay's UI.
      this.builderState.processingMessage.set('Copied to clipboard');
      this.builderState.isProcessingShape.set(true);
      setTimeout(() => this.builderState.stopProcessing(), 800);
    };
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(err => {
        console.error('Get Text: clipboard write failed', err);
      });
      return;
    }
    // Fallback for environments without the async Clipboard API.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      onSuccess();
    } catch (err) {
      console.error('Get Text: fallback clipboard copy failed', err);
    } finally {
      document.body.removeChild(ta);
    }
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
    const currentFileId = this.builderState.currentFile()?.id;

    // Build a set of equipment IDs that should have this LOTO point
    // Check both equipmentList (full objects) and equipmentIdList (IDs only)
    const equipmentIdsWithLotoPoint = new Set<number>();

    // Add from equipmentList (full equipment objects)
    if (updatedLotoPoint.equipmentList) {
      updatedLotoPoint.equipmentList.forEach(e => {
        if (e.id) equipmentIdsWithLotoPoint.add(e.id);
      });
    }

    // Also check equipmentIdList (IDs only) - server may return this instead
    if (updatedLotoPoint.equipmentIdList) {
      updatedLotoPoint.equipmentIdList.forEach(id => {
        if (id) equipmentIdsWithLotoPoint.add(id);
      });
    }

    console.log('[LOTO Builder] Updating LOTO point:', updatedLotoPoint.id,
      'tagNumber:', updatedLotoPoint.tagNumber,
      'equipmentIds:', Array.from(equipmentIdsWithLotoPoint));

    // Check if this LOTO point is associated with any equipment in the current file
    const updatedEquipmentList = currentEquipment.map(eq => {
      // Skip equipment not in the current file
      if (currentFileId && eq.mainFileId !== currentFileId) {
        return eq;
      }

      // Check if this equipment already has the updated LOTO point
      const hasLotoPoint = eq.lotoPoints && eq.lotoPoints.some(lp => lp.id === updatedLotoPoint.id);

      // Check if this equipment should have the LOTO point (based on the updated LOTO point's equipment associations)
      const shouldHaveLotoPoint = eq.id && equipmentIdsWithLotoPoint.has(eq.id);

      if (hasLotoPoint) {
        // Update the LOTO point in the equipment's lotoPoints array
        const updatedLotoPoints = eq.lotoPoints!.map(lp =>
          lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp
        );
        console.log('[LOTO Builder] Updated existing LOTO point in equipment:', eq.id);
        return new EquipmentDto({ ...eq, lotoPoints: updatedLotoPoints });
      }

      if (shouldHaveLotoPoint) {
        // Add LOTO point to this equipment's lotoPoints array
        const existingLotoPoints = eq.lotoPoints || [];
        console.log('[LOTO Builder] Adding LOTO point to equipment:', eq.id);
        return new EquipmentDto({
          ...eq,
          lotoPoints: [...existingLotoPoints, updatedLotoPoint]
        });
      }

      return eq;
    });

    // Check if any equipment was actually updated
    const hasChanges = updatedEquipmentList.some((eq, index) => eq !== currentEquipment[index]);
    if (hasChanges) {
      console.log('[LOTO Builder] Equipment state updated with new LOTO point data');
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

  /**
   * Handle Equipment sync update from SSE (when equipment is synced from another machine).
   * Reloads the equipment from server and updates the local state if it belongs to the current file.
   */
  private handleEquipmentSyncUpdate(entityId: number): void {
    const currentFileId = this.builderState.currentFile()?.id;
    if (!currentFileId) {
      return;
    }

    console.log('[LOTO Builder] SSE Equipment sync update received:', entityId);

    // Fetch the updated equipment from server
    this.equipmentService.getEquipmentById(entityId)
      .pipe(
        tap((response) => {
          if (response.responseData) {
            const updatedEquipment = EquipmentDto.fromJson(response.responseData);

            // Only update if the equipment belongs to the current file
            if (updatedEquipment.mainFileId === currentFileId) {
              console.log('[LOTO Builder] SSE Equipment sync: updating equipment in current file:', entityId);
              const currentEquipment = this.builderState.currentEquipment();

              // Check if equipment already exists in the list
              const existingIndex = currentEquipment.findIndex(eq => eq.id === entityId);

              if (existingIndex >= 0) {
                // Update existing equipment
                const updatedList = currentEquipment.map(eq =>
                  eq.id === entityId ? updatedEquipment : eq
                );
                this.builderState.setCurrentEquipment(updatedList);
              } else {
                // New equipment synced - add to list
                console.log('[LOTO Builder] SSE Equipment sync: adding new equipment to list:', entityId);
                this.builderState.setCurrentEquipment([...currentEquipment, updatedEquipment]);
              }
            }
          }
        }),
        catchError((error) => {
          // Equipment might have been deleted - check if we need to remove it
          if (error.status === 404) {
            console.log('[LOTO Builder] SSE Equipment sync: equipment was deleted:', entityId);
            this.removeEquipmentFromLocalList(entityId);
          } else {
            console.error('[LOTO Builder] Error fetching synced equipment:', error);
          }
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * Handle LotoPoint sync update from SSE (when LOTO point is synced from another machine).
   * Reloads the LOTO point from server and updates any associated equipment in the local state.
   */
  private handleLotoPointSyncUpdate(entityId: number): void {
    const currentFileId = this.builderState.currentFile()?.id;
    if (!currentFileId) {
      return;
    }

    console.log('[LOTO Builder] SSE LotoPoint sync update received:', entityId);

    // Fetch the updated LOTO point from server
    this.lotoPointApiService.getLotoPointById(entityId.toString())
      .pipe(
        tap((response) => {
          if (response.responseData) {
            const updatedLotoPoint = LotoPointDto.fromJson(response.responseData);
            console.log('[LOTO Builder] SSE LotoPoint sync: updating LOTO point:', entityId, updatedLotoPoint.tagNumber);

            // Update the LOTO point in any associated equipment
            this.updateLotoPointInEquipment(updatedLotoPoint);
          }
        }),
        catchError((error) => {
          // LOTO point might have been deleted - check if we need to remove it
          if (error.status === 404) {
            console.log('[LOTO Builder] SSE LotoPoint sync: LOTO point was deleted:', entityId);
            this.removeLotoPointFromEquipment(entityId);
          } else {
            console.error('[LOTO Builder] Error fetching synced LOTO point:', error);
          }
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
