import { Component, ElementRef, EventEmitter, forwardRef, HostListener, Input, Output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-file-input',
  standalone: true,
  imports: [],
  templateUrl: './file-input.component.html',
  styleUrl: './file-input.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FileInputComponent),
      multi: true
    }
  ]
})
export class FileInputComponent implements ControlValueAccessor {
  @Input() label: string = 'Choose File';
  @Input() accept: string = '*/*';
  @Output() fileSelected = new EventEmitter<{ file: File; nameWithoutExtension: string }>();

  file: File | null = null;
  onChange: Function = () => {};
  onTouched: Function = () => {};
  isDragover: boolean = false;

  constructor(private host: ElementRef<HTMLInputElement>) {}

  @HostListener('change', ['$event']) emitFiles(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = target.files;
    const file = files && files.item(0);
    this.handleFile(file);
  }

  @HostListener('dragover', ['$event']) onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = true;
  }

  @HostListener('dragleave', ['$event']) onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
  }

  @HostListener('drop', ['$event']) onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragover = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  writeValue(value: null) {
    // clear file input
    this.host.nativeElement.value = '';
    this.file = null;
  }

  registerOnChange(fn: Function) {
    this.onChange = fn;
  }

  registerOnTouched(fn: Function) {
    this.onTouched = fn;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File | null) {
    this.file = file;
    this.onChange(file);
    this.onTouched();

    // Emit file selection event with the filename (without extension)
    if (file) {
      const nameWithoutExtension = this.getNameWithoutExtension(file.name);
      this.fileSelected.emit({ file, nameWithoutExtension });
    }
  }

  private getNameWithoutExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
  }
}
