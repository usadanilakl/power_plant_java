import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { ImageZoomInteractiveComponent } from "../../../shared/image/image-zoom-interactive/image-zoom-interactive.component";
import { FileDto } from '../../../models/file/file.model';
import { CurrentFileService } from '../../../services/current-file.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ImageService } from '../../../services/text-recognition.service';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';
import { FileBulkEditorMenuComponent } from "./file-bulk-editor-menu/file-bulk-editor-menu.component";
import { Shape } from '../../../models/shape.model';
import { catchError, map, of, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FloatingMenuComponent } from "../../../shared/menu/floating-menu/floating-menu.component";
import { DataPresetMenuComponent } from "./data-preset-menu/data-preset-menu.component";
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";
import { EquipmentFormComponent } from "../../equipment/equipment-form/equipment-form.component";
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { LotoDetailFormComponent } from "../../loto/loto-detail-form/loto-detail-form.component";
import { LotoPointService } from '../../../services/loto/loto-point.service';

@Component({
  selector: 'app-file-editor',
  imports: [ImageZoomInteractiveComponent, FileBulkEditorMenuComponent, CommonModule, FloatingMenuComponent, DataPresetMenuComponent, PopupProjectionComponent, EquipmentFormComponent, LotoDetailFormComponent],
  templateUrl: './file-editor.component.html',
  styleUrl: './file-editor.component.css',
  standalone: true,
})
export class FileEditorComponent {


  openMenu = output<boolean>();

  currentFile = signal<FileDto | null>(null);
  currentEquipment = signal<EquipmentDto>(new EquipmentDto());
  recognizedText = signal<string | null>(null);
  visibleShapes = signal<Shape[]>([]);
  isMenuOpen = signal<boolean>(false);
  selectedEqTypes = signal<{type: string, selected: boolean}[]>([]);
  uniqueEquipmentTypes = signal<string[]>([]);
  isFilterMenuOpen = signal<boolean>(false);
  isDataPresetMenuOpen = signal<boolean>(false);

  isEqFormOpen = signal<boolean>(false);
  isLotoPointFormOpen = signal<boolean>(false);

  lpToEdit = signal<LotoPointDto | null>(null);


  constructor(
    protected currentFileService: CurrentFileService,
    private currentEquipmentService: CurrentEquipmentService,
    private lotoPointService: LotoPointService,
    private destroyRef: DestroyRef,
    private imageService: ImageService
  ) {}

  ngOnInit() {
    this.currentFileService.currentFile$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(file => {
      this.currentFile.set(file);
      if (file) {
        // Handle the new file data, e.g., populate form fields
      }
    });
  
    this.currentFileService.getUniqueEquipmentTypes().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(types => {
      this.uniqueEquipmentTypes.set(types);
      this.initializeSelectedEqTypes();
      this.updateFilteredEquipment();
    });

    this.currentEquipmentService.currentEquipment$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(equipment => {
      this.currentEquipment.set(equipment?? new EquipmentDto());
      if (equipment) {
        // Handle the new equipment data, e.g., update form fields
        // console.log('Current equipment was updated in subscription:', equipment);
      }
    });
  }

  onNewShapeCreated(shape: any) {
    console.log('New shape created:', shape);
    
    this.currentEquipmentService.getCurrentPresetData().pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(presetData => {
        const newEq: EquipmentDto = EquipmentDto.createEquipmentFromShape(shape);
        
        // Set a default tag number
        newEq.tagNumber = `EQ-${shape.id}`;
        
        // Apply preset data if available
        if (presetData) {
          // Merge preset data with newEq
          Object.assign(newEq, presetData);
        }
        
        // Set the current equipment and open the form immediately
        this.currentEquipmentService.setCurrentShape(shape);
        this.currentEquipmentService.setCurrentEquipment(newEq);
        this.isEqFormOpen.set(true);
      
        // Start the text recognition process
        this.startTextRecognition(shape, newEq);
      })
    ).subscribe();
  }
  
  private startTextRecognition(shape: any, newEq: EquipmentDto) {
    this.imageService.getText(this.currentFile()?.fileLink, shape).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(text => {
        console.log('Recognized text:', text);
        if (text) {
          // Update the tag number when text is recognized
          newEq.tagNumber = text.trim();
          this.currentEquipmentService.setCurrentEquipment(newEq);
          this.recognizedText.set(text.trim());
        }
      }),
      catchError(error => {
        console.error('Error recognizing text:', error);
        return of(null);
      })
    ).subscribe();
  }

  closeEqForm(){
    this.isEqFormOpen.set(false);
    this.currentEquipmentService.clearCurrentEquipment();
  }

  onShapeSelected(shape: any) {
    console.log('Shape selected:', shape);
    this.currentEquipmentService.setCurrentShape(shape);
    this.isEqFormOpen.set(true);
  }

  handleVisibleShapes($event: Shape[]) {
    this.visibleShapes.set($event);
  }

  onMenuOpen(): void {
    this.isMenuOpen.set(!this.isMenuOpen())  ;
    this.openMenu.emit(this.isMenuOpen());
  }

  onFilterMenuOpen(): void {
    this.isFilterMenuOpen.set(!this.isFilterMenuOpen());
  }

  onDataPresetMenuOpen(): void {
    this.isDataPresetMenuOpen.set(!this.isDataPresetMenuOpen());
  }

  onEqTypeChange(eqType: {type: string, selected: boolean}) {
    const updatedTypes = this.selectedEqTypes().map(et => 
      et.type === eqType.type ? {...et, selected: !et.selected} : et
    );
    this.selectedEqTypes.set(updatedTypes);
    this.updateFilteredEquipment();
  }

  initializeSelectedEqTypes() {
    const equipmentNotSelectedByDefault = ['connector', 'instrument', 'line'];
    this.selectedEqTypes.set(
      this.uniqueEquipmentTypes().map(type => ({
        type,
        selected: !equipmentNotSelectedByDefault.includes(type.toLowerCase())
      }))
    );
  }

  updateFilteredEquipment() {
    const selectedTypes = this.selectedEqTypes()
      .filter(eq => eq.selected)
      .map(eq => eq.type);

    this.currentFileService.getElements().pipe(
      map(elements => elements.filter(el => el.eqType && el.eqType.name && selectedTypes.includes(el.eqType.name)))
    ).subscribe(filteredEquipments => {
      this.currentFileService.setElementsToRender(filteredEquipments);
    });
  }

  onCloseEquipmentFilterMenu() {
    this.isFilterMenuOpen.set(false);
  }

  onCloseBulkEditMenu(){
    this.isMenuOpen.set(false);
    this.openMenu.emit(false);
  }

  onCloseDataPresetMenu(): void {
    this.isDataPresetMenuOpen.set(false);
  }

  //Loto Point form

  onLotoPointFormSubmit(lotoPoint: LotoPointDto) {
    if (!lotoPoint || !lotoPoint.id) {
      console.error('Invalid LOTO point');
      return;
    }

    this.lotoPointService.updateLotoPoint(lotoPoint).pipe(
      tap(resp => {
        if (resp && resp.responseData) {
          const updatedLotoPoint = new LotoPointDto(resp.responseData);
          
          // Update the LOTO point in the current equipment
          const currentEquipment = this.currentEquipment();
          if (currentEquipment && currentEquipment.id) {
            const updatedEquipment = new EquipmentDto({
              ...currentEquipment,
              lotoPoints: currentEquipment.lotoPoints.map(lp => 
                lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp
              )
            });
            
            this.currentEquipmentService.setCurrentEquipment(updatedEquipment);
          }
          
          // Optionally, you can emit an event or update a local state to reflect the change
          console.log('LOTO point updated successfully', updatedLotoPoint);
        } else {
          throw new Error('Invalid response from server');
        }
      }),
      catchError(error => {
        console.error('Error updating LOTO point:', error);
        // Optionally, you can emit an error event or show a user-friendly error message
        return of(null);
      })
    ).subscribe();

  }

  onLotoPointFormDelete(lotoPoint: LotoPointDto) {}

  onLotoPointFormOpen(lotoPoint: LotoPointDto) {
    this.lpToEdit.set(lotoPoint);
    this.isLotoPointFormOpen.set(true);
  }
  onLotoPointFormClose() {
    this.lpToEdit.set(null);
    this.isLotoPointFormOpen.set(false);
  }



  
}

