import { Component, Input, HostListener, ElementRef, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.css'],
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

  file: File | null = null;
  onChange: Function = () => {};
  onTouched: Function = () => {};
  isDragover: boolean = false;

  constructor(private host: ElementRef<HTMLInputElement>) {}

  @HostListener('change', ['$event.target.files']) emitFiles(event: FileList) {
    const file = event && event.item(0);
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
  }
}

// import { Component, Input, HostListener, ElementRef, forwardRef } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-file-input',
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: './file-input.component.html',
//   styleUrls: ['./file-input.component.css'],
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => FileInputComponent),
//       multi: true
//     }
//   ]
// })
// export class FileInputComponent implements ControlValueAccessor {
//   @Input() label: string = 'Choose File';
//   @Input() accept: string = '*/*';

//   file: File | null = null;
//   onChange: Function = () => {};
//   onTouched: Function = () => {};

//   constructor(private host: ElementRef<HTMLInputElement>) {}

//   @HostListener('change', ['$event.target.files']) emitFiles(event: FileList) {
//     const file = event && event.item(0);
//     this.file = file;
//     this.onChange(file);
//     this.onTouched();
//   }

//   writeValue(value: null) {
//     // clear file input
//     this.host.nativeElement.value = '';
//     this.file = null;
//   }

//   registerOnChange(fn: Function) {
//     this.onChange = fn;
//   }

//   registerOnTouched(fn: Function) {
//     this.onTouched = fn;
//   }

//   onFileSelected(event: Event) {
//     const input = event.target as HTMLInputElement;
//     if (input.files && input.files.length > 0) {
//       this.file = input.files[0];
//       this.onChange(this.file);
//       this.onTouched();
//     }
//   }
// }
