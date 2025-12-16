import { Component, computed, inject, input } from '@angular/core';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { LotoPointMapperService } from '../services/rf-loto-point-mapper.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { FormField } from '../../../../models/ui/form-field.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-rf-loto-point-form',
  imports: [],
  templateUrl: './rf-loto-point-form.component.html',
  styleUrl: './rf-loto-point-form.component.css',
})
export class RfLotoPointFormComponent {
  protected stateService = inject(RfLotoPointStateService);
  protected mapperService = inject(LotoPointMapperService);

  entityInput = input<LotoPointDto>();
  fieldsInput = input<FormField[]>();

  private entityFromState = this.stateService.selectedItem
  entity = computed(() => this.entityInput() ?? this.entityFromState() ?? new LotoPointDto()  );

  private defaultFields = computed(
    () =>
      this.mapperService.toFormFields(this.entity()) ??
      []
  );
  fields = computed(() => this.fieldsInput() ?? this.defaultFields());

  onAnyValueChange(item: LotoPointDto) {
    this.stateService.saveDraft(item);
  }

  onSubmit(item: LotoPointDto) {
    this.stateService.submitNewRequest(item);
  }
}
