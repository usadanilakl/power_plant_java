import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStateService } from '../services/form-state.service';
import { PrintableFormDto } from '../models/printable-form.model';
import { FormRendererComponent } from '../form-renderer/form-renderer.component';

@Component({
  selector: 'app-form-designer-preview',
  standalone: true,
  imports: [FormRendererComponent],
  templateUrl: './form-designer-preview.component.html',
  styleUrl: './form-designer-preview.component.css',
})
export class FormDesignerPreviewComponent {
  private formState = inject(FormStateService);

  form = toSignal(this.formState.form$, { initialValue: new PrintableFormDto() });
  data = signal<any>({});
}
