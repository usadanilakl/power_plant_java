import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-color-picker',
  template: `
    <input type="color" (change)="onColorChange($event)">
  `
})
export class ColorPickerComponent {
  @Output() colorSelected = new EventEmitter<string>();

  onColorChange(event: Event) {
    const color = (event.target as HTMLInputElement).value;
    this.colorSelected.emit(color);
  }
}