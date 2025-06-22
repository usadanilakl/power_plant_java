import { Component, DestroyRef, signal } from '@angular/core';
import { ImageZoomInteractiveComponent } from "../../../shared/image/image-zoom-interactive/image-zoom-interactive.component";
import { FileDto } from '../../../models/file/file.model';
import { Subscription } from 'rxjs';
import { CurrentFileService } from '../../../services/current-file.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-file-editor',
  imports: [ImageZoomInteractiveComponent],
  templateUrl: './file-editor.component.html',
  styleUrl: './file-editor.component.css'
})
export class FileEditorComponent {
  currentFile = signal<FileDto | null>(null);

  constructor(
    protected currentFileService: CurrentFileService,
    private destroyRef: DestroyRef
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

}
