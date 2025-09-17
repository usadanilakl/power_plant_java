import { Component, Input, Output, EventEmitter, forwardRef, ViewChild, ElementRef } from '@angular/core';
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
  @Input() type: 'text' | 'date' | 'file' | 'number' | 'time' = 'text';
  @Output() valueChange = new EventEmitter<any>();

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @ViewChild('dateInput') dateInput?: ElementRef<HTMLInputElement>;
  @ViewChild('timeInput') timeInput?: ElementRef<HTMLInputElement>;

  value: any = '';
  fileName: string = '';

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value;
    if (this.type === 'file' && value) {
      this.fileName = typeof value === 'string' ? value.split('\\').pop() || '' : 'File selected';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onValueChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
    this.valueChange.emit(this.value);
    this.onTouched();
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