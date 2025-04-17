import { Component, Input, Output, EventEmitter, forwardRef, ViewEncapsulation } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  templateUrl: './form-input.component.html',
  styleUrls: ['./form-input.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ]
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() type: string = 'text';
  @Input() value: any = '';
  @Output() valueChange = new EventEmitter<any>();

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    if (value !== undefined) {
      this.value = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInputChange(event: any) {
    this.value = event.target.value;
    this.onChange(this.value);
    this.onTouched();
    this.valueChange.emit(this.value);
  }
}

// import { Component, Input, forwardRef } from '@angular/core';
// import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// @Component({
//   selector: 'app-form-input',
//   templateUrl: './form-input.component.html',
//   styleUrls: ['./form-input.component.css'],
//   providers: [
//     {
//       provide: NG_VALUE_ACCESSOR,
//       useExisting: forwardRef(() => FormInputComponent),
//       multi: true
//     }
//   ]
// })
// export class FormInputComponent implements ControlValueAccessor {
//   @Input() label: string = '';
//   @Input() type: string = 'text';

//   value: any = '';

//   onChange: any = () => {};
//   onTouched: any = () => {};

//   writeValue(value: any): void {
//     this.value = value;
//   }

//   registerOnChange(fn: any): void {
//     this.onChange = fn;
//   }

//   registerOnTouched(fn: any): void {
//     this.onTouched = fn;
//   }

//   onInputChange(event: any) {
//     this.value = event.target.value;
//     this.onChange(this.value);
//     this.onTouched();
//   }
// }