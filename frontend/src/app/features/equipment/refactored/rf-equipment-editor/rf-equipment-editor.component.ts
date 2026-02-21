import { CommonModule } from "@angular/common";
import { Component, computed, DestroyRef, inject, input, effect } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { InteractiveImageComponent } from "../../../../shared/image/refactored/interactive-image/interactive-image.component";
import { RfShape } from "../../../../shared/image/refactored/models/fr-shape.model";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";
import { RfEquipmentEditorStateService } from "../services/rf-equipment-editor-state.service";
import { RfEquipmentEditorDataService } from "../services/rf-equipment-editor-data.service";
import { RfEquipmentEditorUiService } from "../services/rf-equipment-editor-ui.service";

@Component({
  selector: 'app-rf-equipment-editor',
  imports: [
    CommonModule,
    InteractiveImageComponent
  ],
  providers: [
    RfEquipmentEditorStateService,
    RfEquipmentEditorDataService,
    RfEquipmentEditorUiService
  ],
  templateUrl: './rf-equipment-editor.component.html',
  styleUrl: './rf-equipment-editor.component.css',
  standalone: true,
})
export class RfEquipmentEditorComponent {
  // Services
  private stateService = inject(RfEquipmentEditorStateService);
  private dataService = inject(RfEquipmentEditorDataService);
  private uiService = inject(RfEquipmentEditorUiService);
  private destroyRef = inject(DestroyRef);

  // Input
  selectedEquipmentId = input.required<number>();

  // Expose state as readonly signals
  isLoading = this.stateService.isLoading;
  error = this.stateService.error;
  fileLink = this.stateService.fileLink;
  selectedEquipment = this.stateService.selectedEquipment;
  isLotoPointTableOpen = this.stateService.isLotoPointTableOpen;
  isLotoPointFormOpen = this.stateService.isLotoPointFormOpen;
  selectedLotoPoint = this.stateService.selectedLotoPoint;
  allLotoPoints = this.stateService.allLotoPoints;

  // Computed shapes
  shapes = computed(() => this.uiService.getShapesFromEquipment());

  constructor() {
    // Load equipment and file when selectedEquipmentId changes
    effect(() => {
      const selectedId = this.selectedEquipmentId();
      if (selectedId) {
        this.dataService.loadEquipmentAndFile(selectedId)
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe();
      }
    });
  }

  // Loto point table actions
  openLotoPointTable(): void {
    this.stateService.openLotoPointTable();
  }

  closeLotoPointTable(): void {
    this.stateService.closeLotoPointTable();
  }

  onLotoPointSelected(lotoPoints: LotoPointDto[]): void {
    this.uiService.handleLotoPointSelection(lotoPoints);
  }

  // Shape interaction handlers
  onShapeRightClicked(shape: RfShape): void {
    this.uiService.handleShapeRightClick(shape);
  }

  onShapeSelected(shape: RfShape): void {
    this.uiService.handleShapeSelection(shape);
  }

  onShapeUpdated(shape: RfShape): void {
    this.uiService.handleShapeUpdate(shape);
  }

  // Loto point form actions
  onLotoPointFormClose(): void {
    this.stateService.closeLotoPointForm();
  }

  onLotoPointFormSubmit(lotoPoint: LotoPointDto): void {
    this.uiService.submitLotoPointForm(lotoPoint);
  }

  onLotoPointFormDelete(): void {
    const lotoPoint = this.selectedLotoPoint();
    if (lotoPoint?.id) {
      this.uiService.deleteLotoPoint(lotoPoint.id);
    }
  }
}
