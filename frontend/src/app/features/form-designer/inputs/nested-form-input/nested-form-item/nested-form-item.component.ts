import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormContainerRendererComponent } from '../../../form-renderer/form-container-renderer/form-container-renderer.component';
import { PrintableFormDto } from '../../../../../models/forms/printable-form.model';

@Component({
  selector: 'app-nested-form-item',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormContainerRendererComponent],
  template: `
    <div [formGroup]="itemGroup">
      @for (container of formTemplate?.formContainers; track container.id) {
        <app-form-container-renderer
          [container]="container"
          [formGroup]="itemGroup"
          [readOnly]="readOnly"
        ></app-form-container-renderer>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      border: 1px solid #eee;
      padding: 1rem;
      margin-bottom: 1rem;
      border-radius: 4px;
    }
  `]
})
export class NestedFormItemComponent {
  @Input() itemGroup!: FormGroup;
  @Input() formTemplate: PrintableFormDto | null = null;
  @Input() readOnly: boolean = false;
}