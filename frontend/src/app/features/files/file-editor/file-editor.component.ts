import { Component, DestroyRef, output, signal } from '@angular/core';
import { ImageZoomInteractiveComponent } from "../../../shared/image/image-zoom-interactive/image-zoom-interactive.component";
import { FileDto } from '../../../models/file/file.model';
import { CurrentFileService } from '../../../services/current-file.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ImageService } from '../../../services/text-recognition.service';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';
import { FileBulkEditorMenuComponent } from "./file-bulk-editor-menu/file-bulk-editor-menu.component";
import { RectangleShape, Shape } from '../../../models/shape.model';
import { catchError, combineLatest, map, Observable, of, switchMap, tap, throwError } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FloatingMenuComponent, MenuPosition } from "../../../shared/menu/floating-menu/floating-menu.component";
import { DataPresetMenuComponent } from "./data-preset-menu/data-preset-menu.component";
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { PopupProjectionComponent } from "../../../shared/popup-projection/popup-projection.component";
import { EquipmentFormComponent } from "../../equipment/equipment-form/equipment-form.component";
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { LotoPointService } from '../../../services/loto/loto-point.service';
import { LotoPointDetailFormComponent } from "../../loto-points/loto-point-detail-form/loto-point-detail-form.component";
import { PdfDisplayIframeComponent } from "../../../shared/pdf-dislplay-iframe/pdf-dislplay-iframe.component";
import { LotoPointBulkEditorComponent } from "./loto-point-bulk-editor/loto-point-bulk-editor.component";
import { EquipmentService } from '../../../services/equipment.service';
import { TagNumberGeneratorComponent } from "../../tag-number/tag-number-generator/tag-number-generator.component";
import { ClipboardService } from '../../../services/util/clipboard.service';

@Component({
  selector: 'app-file-editor',
  imports: [ImageZoomInteractiveComponent, FileBulkEditorMenuComponent, CommonModule, FloatingMenuComponent, DataPresetMenuComponent, PopupProjectionComponent, EquipmentFormComponent, LotoPointDetailFormComponent, PdfDisplayIframeComponent, LotoPointBulkEditorComponent, TagNumberGeneratorComponent],
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
  position: MenuPosition = MenuPosition.CenterLeft
  isLoading = signal<boolean>(false);
  isLotoPointFormOpen = signal<boolean>(false);

  isLpBulkEditOpen = signal<boolean>(false);

  lpToEdit = signal<LotoPointDto | null>(null);

  isTextRecongnitionEnabled = signal<boolean>(true);
  isGetJustTextEnabled = signal<boolean>(false);
  isTagNumberGeneratorOpen = signal<boolean>(false);



  constructor(
    protected currentFileService: CurrentFileService,
    private currentEquipmentService: CurrentEquipmentService,
    private equipmentService: EquipmentService,
    private lotoPointService: LotoPointService,
    private destroyRef: DestroyRef,
    private imageService: ImageService,
    private clipboardService: ClipboardService,
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
    });


    this.currentEquipmentService.currentEquipment$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(equipment => {
      this.currentEquipment.set(equipment?? new EquipmentDto());
      if (equipment) {
        // Handle the new equipment data, e.g., update form fields
      }
    });

    this.currentEquipmentService.getRezizeDetector().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(shape =>{
      if(shape && shape.id && shape.id !== 0){
        
        const updatedEq = new EquipmentDto().setCoordinatesFromShape(shape as RectangleShape);

        this.equipmentService.updateEquipment(new EquipmentDto({...updatedEq,id:shape.id})).pipe(
          catchError(error => {
            console.error('Error updating equipment:', error);
            // You can add more specific error handling here, such as displaying a user-friendly message
            // For now, we'll just log the error and return an observable that completes
            return of(null);
          })
        ).subscribe(resp => {
          if (resp) {
            this.currentEquipmentService.setCurrentEquipment(new EquipmentDto(resp.responseData));
          } else {
            console.warn('Equipment update failed or returned no data');
            // You might want to handle this case, perhaps by showing a message to the user
          }
        });
      }
    })

    this.currentEquipmentService.getShapeRightClickDetector().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(shpae => {
      if(shpae && shpae.id && shpae.id!== 0){
        this.onEquipmnetEdit(shpae);
      }
    })
  }

  onToggleFileFormat(){
    const currentExtension = this.currentFile()?.fileLink?.split('.').pop();
    const newExtension = currentExtension === 'pdf'? 'jpg' : 'pdf';
    this.currentFileService.switchFileFormat(newExtension);
  }

  onNewShapeCreated(shape: any) {

    if(this.isGetJustTextEnabled()){
      this.startTextRecognition(shape);
      this.currentEquipmentService.removeShapeFromArray(shape);
      return;
    }
    
    this.currentEquipmentService.getCurrentPresetData().pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(presetData => {
        const newEq: EquipmentDto = presetData.setCoordinatesFromShape(shape);
        
        // Set the current equipment and open the form immediately
        this.currentEquipmentService.setCurrentShape(shape);
        this.currentEquipmentService.setCurrentEquipment(newEq);
        this.isEqFormOpen.set(true);
      
        // Start the text recognition process
        if(this.isTextRecongnitionEnabled())this.startTextRecognition(shape, newEq);
      })
    ).subscribe();
  }
  
  private startTextRecognition(shape: any, newEq?: EquipmentDto) {
    this.imageService.getText(this.currentFile()?.fileLink, shape).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(text => {
        if (text) {
          this.recognizedText.set(text.trim());
          this.clipboardService.setClipboardData(text.trim());
          if (newEq) {
            // Update the tag number when text is recognized and newEq exists
            newEq.tagNumber = text.trim();
            this.currentEquipmentService.setCurrentEquipment(newEq);
          }
        }
      }),
      catchError(error => {
        console.error('Error recognizing text:', error);
        return of(null);
      })
    ).subscribe();
  }

  toggleTextRecongnition(){
    this.isTextRecongnitionEnabled.set(!this.isTextRecongnitionEnabled());  
  }
  toggleGetJustText() {
    this.isGetJustTextEnabled.set(!this.isGetJustTextEnabled());  
  }

  closeEqForm(){
    this.isEqFormOpen.set(false);
    this.currentEquipmentService.clearCurrentEquipment();
    this.recognizedText.set('');
    this.currentEquipmentService.setCurrentShape(null);
  }

  onShapeSelected(shape: any) {
    this.currentEquipmentService.setCurrentShape(shape);
    // this.isEqFormOpen.set(true);
  }

  onEquipmnetEdit(shape: any) {
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

  initializeSelectedEqTypes() {
    const equipmentNotSelectedByDefault = ['connector', 'instrument', 'line'];
    this.selectedEqTypes.set(
      this.uniqueEquipmentTypes().map(type => ({
        type,
        selected: !equipmentNotSelectedByDefault.includes(type.toLowerCase())
      }))
    );
  setTimeout(() => {
    this.updateFilteredEquipment();
  }, 300);
  }

  updateFilteredEquipment() {
    const selectedTypes = this.selectedEqTypes()
      .filter(eq => eq.selected)
      .map(eq => eq.type);
  
    this.currentFileService.getElements().pipe(
      map(elements => elements.filter(el => {
        if (!el.eqType || !el.eqType.name) {
          return selectedTypes.includes('Unknown');
        }
        return selectedTypes.includes(el.eqType.name);
      }))
    ).subscribe(filteredEquipments => {
      this.currentFileService.setElementsToRender(filteredEquipments);
    });
  }

  onEqTypeChange(eqType: {type: string, selected: boolean}) {
    const updatedTypes = this.selectedEqTypes().map(et => 
      et.type === eqType.type ? {...et, selected: !et.selected} : et
    );
    this.selectedEqTypes.set(updatedTypes);
    this.updateFilteredEquipment();
  }

  applyEqValueChanges($event: EquipmentDto) {
    this.currentEquipment.set($event);
  }

  applyLpValueChanges($event: LotoPointDto) {
    this.lpToEdit.set($event);
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

  submitEquipment(equipment: EquipmentDto) {
    this.createEquipment(equipment);
  }

  createEquipmentAndAddLotoPoint(equipment: EquipmentDto) {
    this.createEquipment(equipment);
  }

  private createEquipment(equipment: EquipmentDto) {
    
    if (!equipment) {
      console.error('Invalid equipment');
      return;
    }

    const fileLink = this.currentFileService.getCurrentFile()?.fileLink;
    const fileId = this.currentFileService.getCurrentFile()?.id;
    const eqWithFile = new EquipmentDto({...equipment, mainFile: fileLink, mainFileId:fileId, files: [fileLink!] });
  
    this.isLoading.set(true);
  
    this.equipmentService.updateEquipment(eqWithFile).pipe(
      tap(resp => {
        // You could trigger a notification here
        // this.notificationService.showSuccess('Equipment updated successfully');
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error updating equipment:', error);
        this.isLoading.set(false);
        // this.notificationService.showError('Failed to update equipment');
        return throwError(() => new Error('Failed to update equipment'));
      })
    ).subscribe({
      next: (resp) => {
        if (resp && resp.responseData) {
          const updatedEquipment = new EquipmentDto(resp.responseData);
          const sh = updatedEquipment.toShapeObject();
          this.currentEquipmentService.updateCurrentShape(sh!);
          this.isEqFormOpen.set(false);
        } else {
          throw new Error('Invalid response from server');
        }
      },
      error: (error) => {
        console.error('Subscription error:', error);
        // Handle error, maybe show a user-friendly message
      }
    });
  }

  onEqDelete() {
    const eqId = this.currentEquipment()?.id;
    if (!eqId) {
      console.error('Invalid equipment ID for deletion');
      return;
    }
  
    this.equipmentService.deleteEquipment(eqId).pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(error => {
        console.error('Error deleting equipment:', error);
        // Optionally, you can show a user-friendly error message here
        return of(null);
      })
    ).subscribe({
      next: (resp) => {
        if (resp) {
          // Remove the equipment from the current file's elements
          // this.currentFileService.removeElementFromCurrentFile(eqId);
          
          // Clear the current equipment if it's the one being deleted
          if (this.currentEquipment()?.id === eqId) {
            this.currentEquipmentService.clearCurrentEquipment();
          }
          
          // Close the equipment form if it's open
          this.isEqFormOpen.set(false);
          
          // console.log('Equipment deleted successfully');
          // Optionally, you can show a success message here
        } else {
          console.warn('Equipment deletion did not return a response');
        }
      },
      error: (error) => {
        console.error('Error in equipment deletion subscription:', error);
        // Optionally, handle the error (e.g., show an error message to the user)
      }
    });
  }
/**********************************************************************************
 * LOTO POINT FORM PROCESSING
 ***********************************************************************************/
  onLotoPointFormSubmit(lotoPoint: LotoPointDto) {
    if (!lotoPoint) {
      console.error('Invalid LOTO point');
      return;
    }

    if(!lotoPoint.id || lotoPoint.id===0) {
      this.processNewLotoPoint(lotoPoint);
    }else{
      this.processExitingLotoPoint(lotoPoint);
    }

  }
  private processNewLotoPoint(lotoPoint: LotoPointDto): void {
      const currentEquipment = this.currentEquipment();
      if (currentEquipment) {
        // Create a new LotoPointDto with the current equipment added to the equipmentList
        const newLotoPoint = new LotoPointDto({
          ...lotoPoint,
          equipmentList: [currentEquipment]
        });

      this.lotoPointService.updateLotoPoint(newLotoPoint).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(resp => {
          if(resp && resp.responseData){
            const newLotoPoint = new LotoPointDto(resp.responseData);
            const currentEquipment = this.currentEquipment();
            if (currentEquipment) {
              currentEquipment.lotoPoints = currentEquipment.lotoPoints || [];
              currentEquipment.lotoPoints.push(newLotoPoint);
              this.currentEquipmentService.setCurrentEquipment(currentEquipment);
            }
            // Optionally, close the form or update UI
            this.lpToEdit.set(null);
            this.isLotoPointFormOpen.set(false);
          }
        }),
        catchError(error => {
          console.error('Error updating LOTO point:', error);
          return throwError(() => new Error('Failed to update LOTO point'));
        })
      ).subscribe({
        error: (error) => {
          console.error('Subscription error:', error);
          // Handle error, maybe show a user-friendly message
        }
      });
      }
  }
  private processExitingLotoPoint(lotoPoint: LotoPointDto): void {
      this.lotoPointService.updateLotoPoint(new LotoPointDto(lotoPoint)).pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(resp => {
          if (resp && resp.responseData) {
            const updatedLotoPoint = new LotoPointDto(resp.responseData);
            
            // Update the LOTO point in the current equipment
            const currentEquipment = this.currentEquipment();
            if (currentEquipment && currentEquipment.id) {
              const updatedEquipment = new EquipmentDto({
                ...currentEquipment,
                lotoPoints: currentEquipment.lotoPoints?.map(lp => 
                  lp.id === updatedLotoPoint.id ? updatedLotoPoint : lp
                )
              });
              
              this.currentEquipmentService.setCurrentEquipment(updatedEquipment);
            }
          } else {
            throw new Error('Invalid response from server');
          }
        }),
        catchError(error => {
          console.error('Error updating LOTO point:', error);
          // Optionally, you can emit an error event or show a user-friendly error message
          return of(null);
        })
      ).subscribe({
        next: () => {
          // Close the form after successful update
          this.isLotoPointFormOpen.set(false);
          this.lpToEdit.set(null);
        },
        error: () => {
          // Close the form even if there was an error
          this.isLotoPointFormOpen.set(false);
          this.lpToEdit.set(null);
        },
        complete: () => {
          // Ensure the form is closed when the observable completes
          this.isLotoPointFormOpen.set(false);
          this.lpToEdit.set(null);
        }
      });
  }

  onLotoPointFormDelete() {
    if (!this.lpToEdit() || !this.lpToEdit()?.id) {
      console.error('Invalid LOTO point for deletion');
      return;
    }

    this.lotoPointService.deleteLotoPoint(this.lpToEdit()?.id+'').pipe(
      takeUntilDestroyed(this.destroyRef),
      catchError(error => {
        console.error('Error deleting LOTO point:', error);
        // Optionally, you can show a user-friendly error message here
        return of(null);
      })
    ).subscribe({
      next: (resp) => {
        if (resp) {
          // this.currentEquipmentService.removeLotoPointFromCurrentEquipment(lotoPoint);
          // Optionally, you can show a success message here
          console.log('LOTO point deleted successfully');
        } else {
          console.warn('LOTO point deletion did not return a response');
        }
      },
      error: (error) => {
        console.error('Error in LOTO point deletion subscription:', error);
        // Optionally, handle the error (e.g., show an error message to the user)
      }
    });
  }

  onLotoPointFormOpen(lotoPoint: LotoPointDto) {
    this.lpToEdit.set(lotoPoint);
    this.isLotoPointFormOpen.set(true);
  }
  
  onLotoPointFormClose() {
    this.lpToEdit.set(null);
    this.isLotoPointFormOpen.set(false);
  }

  createNewLotoPoint(id: number): void {
    let presetData = {};
    this.currentEquipmentService.getCurrentPresetLotoPointData().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(dataPresetData => {presetData = dataPresetData});
    this.lpToEdit.set(new LotoPointDto(presetData));
    this.isLotoPointFormOpen.set(true);
  }

  /**********************************************************************************
 * LOTO POINT BULK EDITING
 ***********************************************************************************/

  openLpBulkEditMenu(){
    this.isLpBulkEditOpen.set(true);
  }

  onCloseLpBulkEditMenu(){
    this.isLpBulkEditOpen.set(false);
  }

  openTagNumberGenerator(){
    this.isTagNumberGeneratorOpen.set(true);
  }

  closeTagNumberGenerator(){
    this.isTagNumberGeneratorOpen.set(false);
  }

  
}

