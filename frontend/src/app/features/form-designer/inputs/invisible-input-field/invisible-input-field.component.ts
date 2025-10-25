import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invisible-input-field',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './invisible-input-field.component.html',
  styleUrl: './invisible-input-field.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InvisibleInputFieldComponent),
      multi: true
    }
  ]
})
export class InvisibleInputFieldComponent implements ControlValueAccessor {
  @Input() type: 'text' | 'textarea' | 'date' | 'file' | 'number' | 'time' = 'text';
  @Output() valueChange = new EventEmitter<any>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInput') dateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('timeInput') timeInput?: ElementRef<HTMLInputElement>;
  @ViewChild('textInput') textInputRef?: ElementRef<HTMLTextAreaElement>;

  value: any = '';
  fileName: string = '';

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};


private initialFontSize: number = 16; // Default fallback
  private minFontSize: number = 8; // To prevent text from becoming unreadable

  ngAfterViewInit(): void {
    this.captureInitialFontSize();
    this.adjustFontSize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Adjust font size if the value is changed programmatically
    if (changes['value']) {
      this.adjustFontSize();
    }
  }

  private captureInitialFontSize(): void {
    if (this.textInputRef) {
      const computedStyle = window.getComputedStyle(this.textInputRef.nativeElement);
      this.initialFontSize = parseFloat(computedStyle.fontSize);
    }
  }

  private adjustFontSize(): void {
    if (this.type !== 'text' && this.type !== 'textarea') {
      return;
    }

    const el = this.textInputRef?.nativeElement;
    if (!el) return;

    // Reset to initial font size to handle text deletion
    el.style.fontSize = `${this.initialFontSize}px`;

    // Decrease font size until content fits
    while ((el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) && parseFloat(el.style.fontSize) > this.minFontSize) {
      const currentSize = parseFloat(el.style.fontSize);
      el.style.fontSize = `${currentSize - 1}px`;
    }
  }

  writeValue(value: any): void {
    this.value = value;
    // Defer adjustment until view is stable
    setTimeout(() => this.adjustFontSize(), 0);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onValueChange(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.value = target.value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
    this.adjustFontSize();
  }

  onFileChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.fileName = file.name;
      this.value = file; // Or handle file reading as needed
      this.onChange(this.value);
      this.valueChange.emit(this.value);
    }
    this.onTouched();
  }

  triggerFileDialog(): void {
    if (this.type === 'file' && this.fileInput) {
      this.fileInput.nativeElement.click();
    } else if (this.type === 'date' && this.dateInput) {
      // For browsers that support it, this opens the date picker.
      try {
        this.dateInput.nativeElement.showPicker();
      } catch (e) {
        // Fallback for browsers that don't support showPicker()
        this.dateInput.nativeElement.click();
      }
    } else if (this.type === 'time' && this.timeInput) {
      try {
        this.timeInput.nativeElement.showPicker();
      } catch (e) {
        this.timeInput.nativeElement.click();
      }
    }
  }
}


// import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule, ReactiveFormsModule } from '@angular/forms';
// import { CommonModule } from '@angular/common';

// @Component({
//   selector: 'app-invisible-input-field',
//   standalone: true,
//   imports: [CommonModule, FormsModule, ReactiveFormsModule],
//   templateUrl: './invisible-input-field.component.html',
//   styleUrl: './invisible-input-field.component.css',
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => InvisibleInputFieldComponent),
//       multi: true
//     }
//   ]
// })
// export class InvisibleInputFieldComponent implements ControlValueAccessor {
//   @Input() type: 'text' | 'textarea' | 'date' | 'file' | 'number' | 'time' = 'text';
//   @Output() valueChange = new EventEmitter<any>();

//   @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
//   @ViewChild('dateInput') dateInput?: ElementRef<HTMLInputElement>;
//   @ViewChild('timeInput') timeInput?: ElementRef<HTMLInputElement>;

//   value: any = '';
//   fileName: string = '';

//   private onChange: (value: any) => void = () => {};
//   private onTouched: () => void = () => {};


//   writeValue(value: any): void {
//     this.value = value;
//     if (this.type === 'file' && value) {
//       this.fileName = typeof value === 'string' ? value.split('\\').pop() || '' : 'File selected';
//     }
//   }

//   registerOnChange(fn: any): void {
//     this.onChange = fn;
//   }

//   registerOnTouched(fn: any): void {
//     this.onTouched = fn;
//   }

//   onValueChange(event: Event): void {
//     const target = event.target as HTMLInputElement;
//     this.value = target.value;
//     this.onChange(this.value);
//     this.valueChange.emit(this.value);
//     this.onTouched();
//   }

//   onFileChange(event: Event): void {
//     const target = event.target as HTMLInputElement;
//     if (target.files && target.files.length > 0) {
//       const file = target.files[0];
//       this.fileName = file.name;
//       this.value = file; // Or handle file reading as needed
//       this.onChange(this.value);
//       this.valueChange.emit(this.value);
//     }
//     this.onTouched();
//   }

//   triggerFileDialog(): void {
//     if (this.type === 'file' && this.fileInput) {
//       this.fileInput.nativeElement.click();
//     } else if (this.type === 'date' && this.dateInput) {
//       // For browsers that support it, this opens the date picker.
//       try {
//         this.dateInput.nativeElement.showPicker();
//       } catch (e) {
//         // Fallback for browsers that don't support showPicker()
//         this.dateInput.nativeElement.click();
//       }
//     } else if (this.type === 'time' && this.timeInput) {
//       try {
//         this.timeInput.nativeElement.showPicker();
//       } catch (e) {
//         this.timeInput.nativeElement.click();
//       }
//     }
//   }
// }