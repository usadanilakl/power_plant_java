import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { ImageZoomInteractiveComponent } from "../../../shared/image/image-zoom-interactive/image-zoom-interactive.component";
import { FileDto } from '../../../models/file/file.model';
import { CurrentFileService } from '../../../services/current-file.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ImageService } from '../../../services/text-recognition.service';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';
import { FileBulkEditorMenuComponent } from "./file-bulk-editor-menu/file-bulk-editor-menu.component";
import { Shape } from '../../../models/shape.model';
import { map } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-editor',
  imports: [ImageZoomInteractiveComponent, FileBulkEditorMenuComponent, CommonModule],
  templateUrl: './file-editor.component.html',
  styleUrl: './file-editor.component.css',
  standalone: true,
})
export class FileEditorComponent {


  openMenu = output<boolean>();

  currentFile = signal<FileDto | null>(null);
  recognizedText = signal<string | null>(null);
  visibleShapes = signal<Shape[]>([]);
  isMenuOpen = signal<boolean>(false);
  selectedEqTypes = signal<{type: string, selected: boolean}[]>([]);



  constructor(
    protected currentFileService: CurrentFileService,
    private currentEquipmentService: CurrentEquipmentService,
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
        // console.log('Current file:', file);
      }
    });
    this.setEquipmentTypes();
  }

  onNewShapeCreated(shape: any) {
    console.log('New shape created:', shape);
    this.imageService.getText(this.currentFile()?.fileLink, shape).subscribe(
      text => {
        console.log('Recognized text:', text);
        this.recognizedText.set(text);
      },
      error => console.error('Error recognizing text:', error)
    )
  }

  onShapeSelected(shape: any) {
    console.log('Shape selected:', shape);
    this.currentEquipmentService.setCurrentShape(shape);
  }

  handleVisibleShapes($event: Shape[]) {
    this.visibleShapes.set($event);
  }

  onMenuOpen(): void {
    this.isMenuOpen.set(!this.isMenuOpen())  ;
    this.openMenu.emit(this.isMenuOpen());
  }

  setEquipmentTypes() {
    this.currentFileService.getElements().subscribe(elements => {
      const equipmentNotSelectedByDefault = ['connector', 'instrument', 'line'];
      
      // Create a Set of unique equipment types
      const uniqueEqTypes = new Set(elements.map(el => el.eqType.name));
      
      // Convert the Set back to an array and map it to the required structure
      const eqTypes = Array.from(uniqueEqTypes).map(type => ({
        type: type,
        selected: !equipmentNotSelectedByDefault.includes(type.toLowerCase())
      }));
      
      this.selectedEqTypes.set(eqTypes);
    });
  }

onEqTypeChange(eqType: {type: string, selected: boolean}) {
  eqType.selected = !eqType.selected;
  const selectedTypes = this.selectedEqTypes()
    .filter(eq => eq.selected)
    .map(eq => eq.type);

  this.currentFileService.getElements().pipe(
    map(elements => elements.filter(el => selectedTypes.includes(el.eqType.name)))
  ).subscribe(filteredEquipments => {
    this.currentFileService.setElementsToRender(filteredEquipments);
  });
}



  
}

