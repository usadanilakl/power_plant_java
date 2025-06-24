import { Component, DestroyRef, output, signal } from '@angular/core';
import { ImageZoomInteractiveComponent } from "../../../shared/image/image-zoom-interactive/image-zoom-interactive.component";
import { FileDto } from '../../../models/file/file.model';
import { Subscription } from 'rxjs';
import { CurrentFileService } from '../../../services/current-file.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ImageService } from '../../../services/text-recognition.service';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';
import { FileBulkEditorMenuComponent } from "./file-bulk-editor-menu/file-bulk-editor-menu.component";
import { Shape } from '../../../models/shape.model';

@Component({
  selector: 'app-file-editor',
  imports: [ImageZoomInteractiveComponent, FileBulkEditorMenuComponent],
  templateUrl: './file-editor.component.html',
  styleUrl: './file-editor.component.css'
})
export class FileEditorComponent {

  openMenu = output<boolean>();

  currentFile = signal<FileDto | null>(null);
  recognizedText = signal<string | null>(null);
  visibleShapes = signal<Shape[]>([]);
  isMenuOpen = signal<boolean>(false);;

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
}

