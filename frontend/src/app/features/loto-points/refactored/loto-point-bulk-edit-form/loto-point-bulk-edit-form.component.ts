import { Component, inject, input, output, signal, computed, effect, ViewChild, TemplateRef, ViewContainerRef, OnDestroy, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Overlay, OverlayRef, OverlayConfig } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { BulkEditMenuComponent } from '../../../../shared/bulk-edit/bulk-edit-menu/bulk-edit-menu.component';
import { LotoPointBulkEditService } from '../services/loto-point-bulk-edit.service';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

/**
 * LOTO Point specific bulk edit form component
 * Connects the generic bulk edit menu to LOTO point table data
 * Uses CDK overlay to render at document body level (escapes parent overflow constraints)
 * Includes counterpart handling for unit-specific LOTO points
 */
@Component({
  selector: 'app-loto-point-bulk-edit-form',
  standalone: true,
  // forwardRef breaks a circular import cycle: bulk-edit-menu → rf-reactive-form
  // → equipment-list-manager → equipment-unified-dialog → rf-loto-point-table →
  // loto-point-bulk-edit-form → (here) bulk-edit-menu. Without it, this component's
  // captured BulkEditMenuComponent reference is undefined at render time, crashing
  // with "Cannot read properties of undefined (reading 'ɵcmp')" when the overlay opens.
  imports: [CommonModule, forwardRef(() => BulkEditMenuComponent)],
  templateUrl: './loto-point-bulk-edit-form.component.html',
  styleUrl: './loto-point-bulk-edit-form.component.css'
})
export class LotoPointBulkEditFormComponent implements OnDestroy {
  @ViewChild('bulkEditTemplate') bulkEditTemplate!: TemplateRef<any>;

  // Services
  bulkEditService = inject(LotoPointBulkEditService);
  // Use the root-level state service (singleton) instead of local table data service
  // This ensures selected items are available even when rendered via portal
  private stateService = inject(RfLotoPointStateService);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);

  // Overlay management
  private overlayRef: OverlayRef | null = null;

  // Outputs
  bulkEditApplied = output<LotoPointDto[]>();

  /**
   * Per-table selection, set by the host table (alias 'selectedItems'). When a
   * host provides it, the bulk edit operates on THAT table's selection — this
   * is required when two tables (e.g. the double-table's source + destination)
   * share the root state service and would otherwise clobber each other's
   * selection. Falls back to the root singleton when not bound (backward compat).
   */
  selectionInput = input<LotoPointDto[] | null>(null, { alias: 'selectedItems' });

  isBulkEditOpen = this.bulkEditService.isBulkEditOpen;

  // Effective selection: the host-provided one if bound, else the root singleton.
  selectedItems = computed(() => this.selectionInput() ?? this.stateService.selectedItems());

  // Counterpart state
  showCounterpartConfirmation = signal<boolean>(false);
  itemsWithCounterparts = computed(() =>
    this.bulkEditService.getItemsWithCounterparts(this.selectedItems())
  );
  hasCounterparts = computed(() => this.itemsWithCounterparts().length > 0);

  // Track pending apply action
  private pendingApplyItems = signal<LotoPointDto[]>([]);
  private pendingProceed: (() => void) | null = null;

  constructor() {
    // Effect to manage overlay when bulk edit opens/closes
    effect(() => {
      const isOpen = this.isBulkEditOpen();
      if (isOpen) {
        this.openOverlay();
      } else {
        this.closeOverlay();
      }
    });
  }

  ngOnDestroy(): void {
    this.closeOverlay();
  }

  /**
   * Clipboard configuration functions - same as loto point form
   */
  hasValidData = (entity: LotoPointDto): boolean => {
    return !!(entity.id || entity.tagNumber || entity.description);
  };

  getItemSummary = (item: LotoPointDto): string => {
    return `${item.tagNumber || 'N/A'} - ${item.description || 'No description'}`;
  };

  /**
   * Open the overlay at document body level
   */
  private openOverlay(): void {
    if (this.overlayRef) return; // Already open

    // Wait for template to be available
    setTimeout(() => {
      if (!this.bulkEditTemplate) return;

      const config = new OverlayConfig({
        hasBackdrop: false,
        positionStrategy: this.overlay.position()
          .global()
          .centerHorizontally()
          .centerVertically(),
        scrollStrategy: this.overlay.scrollStrategies.noop(),
      });

      this.overlayRef = this.overlay.create(config);
      const portal = new TemplatePortal(this.bulkEditTemplate, this.viewContainerRef);
      this.overlayRef.attach(portal);
    });
  }

  /**
   * Close the overlay
   */
  private closeOverlay(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.showCounterpartConfirmation.set(false);
    this.pendingApplyItems.set([]);
  }

  /**
   * Handle bulk edit apply - check for counterparts first
   */
  onBulkEditApplied(updatedItems: LotoPointDto[]): void {
    // Emit updated items so parent can refresh data
    this.bulkEditApplied.emit(updatedItems);
  }

  /**
   * Handle before apply event - intercept to check for counterparts
   */
  onBeforeApply(event: { items: LotoPointDto[], proceed: () => void }): void {
    const { items, proceed } = event;

    // Check if any items have counterparts
    const withCounterparts = this.bulkEditService.getItemsWithCounterparts(items);

    if (withCounterparts.length > 0) {
      // Show confirmation dialog
      this.pendingApplyItems.set(items);
      this.pendingProceed = proceed;
      this.showCounterpartConfirmation.set(true);
    } else {
      // No counterparts, proceed directly
      proceed();
    }
  }

  /**
   * Handle menu close
   */
  onClose(): void {
    this.bulkEditService.closeBulkEdit();
  }

  /**
   * User confirms to apply to counterparts
   */
  onConfirmCounterparts(): void {
    this.bulkEditService.setApplyToCounterparts(true);
    this.showCounterpartConfirmation.set(false);
    this.applyWithCounterpartChoice(true);
  }

  /**
   * User chooses not to apply to counterparts
   */
  onSkipCounterparts(): void {
    this.bulkEditService.setApplyToCounterparts(false);
    this.showCounterpartConfirmation.set(false);
    // Just proceed with normal apply (no counterparts)
    if (this.pendingProceed) {
      this.pendingProceed();
      this.pendingProceed = null;
    }
    this.pendingApplyItems.set([]);
  }

  /**
   * Cancel the counterpart confirmation
   */
  onCancelCounterpartConfirmation(): void {
    this.showCounterpartConfirmation.set(false);
    this.pendingApplyItems.set([]);
    this.pendingProceed = null;
  }

  /**
   * Apply changes with counterparts
   */
  private applyWithCounterpartChoice(applyToCounterparts: boolean): void {
    const items = this.pendingApplyItems();
    const changes = (this.bulkEditService as any).getSelectedFieldValues();

    this.bulkEditService.updateBatchWithCounterparts(items, changes, applyToCounterparts)
      .subscribe({
        next: (result) => {
          if (result.length > 0) {
            this.bulkEditApplied.emit(result);
            this.onClose();
          }
        },
        error: (error) => {
          console.error('Bulk edit with counterparts failed:', error);
        }
      });

    this.pendingApplyItems.set([]);
    this.pendingProceed = null;
  }
}
