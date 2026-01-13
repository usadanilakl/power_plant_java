import { Component, inject, input, output, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { InteractiveImageComponent } from '../../../../image/refactored/interactive-image/interactive-image.component';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { toSignal } from '@angular/core/rxjs-interop';
import { EquipmentMapperService } from '../../../../../features/equipment/refactored/services/equipment-mapper.service';
import { EquipmentDialogFileService } from '../services/equipment-dialog-file.service';
import { RfToggleMenuComponent } from '../../../../menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { NestedItem } from '../../../../../models/ui/nested-item.model';
import { GuideDirective } from '../../../../guide/guide.directive';
import { RfShape } from '../../../../image/refactored/models/fr-shape.model';
import { RfLotoPointLeftMenuService, GroupingCriteria } from '../../../../../features/loto-points/refactored/services/rf-loto-point-left-menu.service';
import { RfLotoPointApiService } from '../../../../../features/loto-points/refactored/services/rf-loto-point-api.service';

@Component({
  selector: 'app-equipment-browser-dialog',
  standalone: true,
  imports: [CommonModule, InteractiveImageComponent, RfToggleMenuComponent, GuideDirective],
  providers: [EquipmentDialogFileService],
  templateUrl: './equipment-browser-dialog.component.html',
  styleUrl: './equipment-browser-dialog.component.css'
})
export class EquipmentBrowserDialogComponent {
  // Services
  fileService = inject(EquipmentDialogFileService);
  equipmentMapper = inject(EquipmentMapperService);
  currentFileService = inject(CurrentFileService);
  lotoPointMenuService = inject(RfLotoPointLeftMenuService);
  lotoPointApiService = inject(RfLotoPointApiService);

  // Inputs
  immediateSelection = input<boolean>(false); // When true, emit equipmentSelected immediately on click (no confirm button needed)
  hideActions = input<boolean>(false); // When true, hide the dialog action buttons

  // Outputs
  equipmentSelected = output<EquipmentDto>();
  close = output<void>();

  // Navigation mode
  browseMode = signal<'file' | 'lotoPoint'>('file');

  // LOTO Point grouping
  lotoPointGrouping = signal<GroupingCriteria>('equipmentType');

  // Available grouping options
  groupingOptions: { value: GroupingCriteria; label: string }[] = [
    { value: 'equipmentType', label: 'Equipment Type' },
    { value: 'location', label: 'Location' },
    { value: 'file', label: 'File' },
    { value: 'system', label: 'System' },
    { value: 'unit', label: 'Unit' },
    { value: 'zeroEnergyMethod', label: 'Zero Energy Method' }
  ];

  // State
  selectedEquipment = signal<EquipmentDto | null>(null);
  highlightEquipmentId = signal<number | null>(null);

  // Delegated to file service
  selectedFile = this.fileService.selectedFile;
  fileMenuItems = this.fileService.menuItems;
  currentFileLink = this.fileService.currentFileLink;

  // Delegated to LOTO point service
  lotoPointMenuItems = toSignal(this.lotoPointMenuService.menuData$, { initialValue: [] });
  isLoadingLotoPoints = toSignal(this.lotoPointMenuService.isLoading$, { initialValue: false });
  selectedLotoPoint = toSignal(this.lotoPointMenuService.selectedLotoPoint$, { initialValue: null });
  lotoPointSelectedEquipment = toSignal(this.lotoPointMenuService.selectedEquipment$, { initialValue: null });
  lotoPointSelectedFile = toSignal(this.lotoPointMenuService.selectedFile$, { initialValue: null });

  // Subscribe to CurrentFileService to get complete file data in LOTO point mode
  currentFile = toSignal(this.currentFileService.currentFile$, { initialValue: null });

  // Active file based on current mode
  activeFile = computed(() => {
    const mode = this.browseMode();
    if (mode === 'lotoPoint') {
      return this.currentFile();
    } else {
      return this.selectedFile();
    }
  });

  // Active file link based on current mode
  activeFileLink = computed(() => {
    const file = this.activeFile();
    return file ? file.fileLink : '';
  });

  // Equipment from active file (works in both modes)
  equipment = computed(() => {
    const file = this.activeFile();
    if (!file) return [];
    return file.points ?? [];
  });

  // Equipment shapes for InteractiveImageComponent - reactive to both file and LOTO point selection
  equipmentShapes = computed(() => {
    const eq = this.equipment();
    if (!eq) return [];
    const shapes = eq.map((e: EquipmentDto) => this.equipmentMapper.mapToRfShape(e)).filter(s => s !== null);

    const mode = this.browseMode();

    // Highlight selected equipment based on mode
    let highlightId: number | null = null;

    if (mode === 'lotoPoint') {
      // In LOTO point mode, highlight equipment from LOTO point service
      const lotoEquipment = this.lotoPointSelectedEquipment();
      highlightId = lotoEquipment?.id ?? null;
    } else {
      // In file mode, use manual selection
      highlightId = this.highlightEquipmentId();
    }

    if (highlightId !== null) {
      shapes.forEach((shape: RfShape) => {
        if (shape.id === highlightId) {
          shape.isSelected = true;
          shape.color = '#FF0000';
        }
      });
    }

    return shapes;
  });

  constructor() {
    // Load LOTO points when mode switches to lotoPoint
    effect(() => {
      const mode = this.browseMode();
      const grouping = this.lotoPointGrouping();

      if (mode === 'lotoPoint') {
        this.lotoPointMenuService.loadGroupedLotoPoints(grouping);
      }
    });
  }

  onFileSelect(fileItem: NestedItem) {
    this.fileService.selectFileFromNestedItem(fileItem);
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
  }

  onLotoPointSelect(lotoPointItem: NestedItem) {
    // Delegate to service - it handles all the logic
    this.lotoPointMenuService.selectLotoPointFromNestedItem(lotoPointItem);

    // Sync the file with CurrentFileService for complete data fetching
    const selectedFile = this.lotoPointMenuService.getSelectedFile();
    if (selectedFile) {
      this.currentFileService.setCurrentFile(selectedFile);
    }
  }

  onBrowseModeChange(mode: 'file' | 'lotoPoint') {
    this.browseMode.set(mode);
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);

    // Clear LOTO point selections when switching away from LOTO point mode
    if (mode !== 'lotoPoint') {
      this.lotoPointMenuService.clearSelections();
    }
  }

  onGroupingChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const grouping = select.value as GroupingCriteria;
    this.lotoPointGrouping.set(grouping);
  }

  onConfirmSelection() {
    const equipment = this.selectedEquipment();
    const file = this.activeFile();

    if (equipment && file) {
      // Ensure mainFileObject and mainFileId are populated from the current file context
      const enrichedEquipment = new EquipmentDto({
        ...equipment,
        mainFileId: file.id,
        mainFileObject: file
      });

      this.equipmentSelected.emit(enrichedEquipment);
      this.reset();
    }
  }

  onCancel() {
    this.reset();
    this.close.emit();
  }

  onEquipmentSelected(shape: RfShape) {
    console.log('Selected equipment:', shape.id);
    const selectedId = shape.id;
    if (selectedId !== null) {
      const eq = this.equipment();
      if (eq) {
        const selected = eq.find((e: EquipmentDto) => e.id === selectedId);
        if (selected) {
          console.log('Selected equipment:', selected);
          this.selectedEquipment.set(selected);
          this.highlightEquipmentId.set(selectedId);

          // If immediate selection mode, emit right away
          if (this.immediateSelection()) {
            const file = this.activeFile();
            if (file) {
              const enrichedEquipment = new EquipmentDto({
                ...selected,
                mainFileId: file.id,
                mainFileObject: file
              });
              this.equipmentSelected.emit(enrichedEquipment);
            }
          }
        }
      }
    }
  }

  private reset() {
    this.fileService.reset();
    this.lotoPointMenuService.reset();
    this.selectedEquipment.set(null);
    this.highlightEquipmentId.set(null);
    this.browseMode.set('file');
  }
}
