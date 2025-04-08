import { Component, Input, Output, EventEmitter, Type } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.css'
})
export class PopupComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() contentComponent!: Type<any>;
  @Input() contentInputs: { [key: string]: any } = {};
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}