
import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-rf-popup-projection',
  standalone: true,
  imports: [NgClass],
  templateUrl: './rf-popup-projection.component.html',
  styleUrl: './rf-popup-projection.component.css'
})
export class RfPopupProjectionComponent {

  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() size: 'small' | 'medium' | 'large' | 'auto' = 'auto';
  @Input() zIndex: number = 10000;  // Default z-index, can be overridden for nested popups
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}
