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
  @Input() contentOutputs: { [key: string]: (event: any) => void } = {};
  @Output() close = new EventEmitter<void>();
  @Input() size: 'small' | 'medium' | 'large' | 'auto' = 'auto';

  onClose() {
    this.close.emit();
  }

  onContentOutput(outputName: string, $event: any) {
    if (this.contentOutputs[outputName]) {
      this.contentOutputs[outputName]($event);
    }
  }
}