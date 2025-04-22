import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-popup-projection',
  standalone: true,
  imports: [NgClass],
  templateUrl: './popup-projection.component.html',
  styleUrl: './popup-projection.component.css'
})
export class PopupProjectionComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() size: 'small' | 'medium' | 'large' | 'auto' = 'auto';
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }

}
