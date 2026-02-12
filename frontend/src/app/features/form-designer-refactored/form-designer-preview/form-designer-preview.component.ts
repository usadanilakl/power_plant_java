import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStateService } from '../services/form-state.service';
import { EntityLoaderService } from '../services/entity-loader.service';
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
  private entityLoader = inject(EntityLoaderService);

  form = toSignal(this.formState.form$, { initialValue: new PrintableFormDto() });

  data = computed(() => {
    const formType = this.form()?.formType;
    if (!formType) return {};
    return this.entityLoader.getSampleData(formType);
  });
}
