import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormContainerDto } from '../../../../models/forms/form-container.model';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-form-container-properties',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './form-container-properties.component.html',
  styleUrl: './form-container-properties.component.css'
})
export class FormContainerPropertiesComponent {
  @Input() container: FormContainerDto | null = null;
  @Output() updateContainer = new EventEmitter<FormContainerDto>();
  @Output() deleteContainer = new EventEmitter<number>();

  onPropertyChange(): void {
    if (this.container) {
      // Emit a new instance to ensure change detection and immutability
      this.updateContainer.emit(new FormContainerDto(this.container));
    }
  }

  onDelete(): void {
    this.deleteContainer.emit(this.container?.id?? 0);
  }

}
