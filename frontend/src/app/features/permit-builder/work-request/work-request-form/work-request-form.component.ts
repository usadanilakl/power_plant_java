import { Component, computed, DestroyRef, inject, Input, OnInit, output, Signal, signal } from '@angular/core';
import { CurrentValueService } from '../../../../services/current-value.service';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { WorkRequestDto } from '../../../../models/permits/work-request.model';
import { Option } from '../../../../models/option.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../../shared/reactive-form/reactive-form.component";

@Component({
  selector: 'app-work-request-form',
  standalone: true,
  imports: [ReactiveFormComponent],
  templateUrl: './work-request-form.component.html',
  styleUrl: './work-request-form.component.css'
})
export class WorkRequestFormComponent implements OnInit  {

  private currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  // values = input<SafeWorkDto>(new SafeWorkDto());
  @Input() values: Signal<WorkRequestDto> = signal(new WorkRequestDto());
  formChange = output<WorkRequestDto>();
  formSubmit = output<WorkRequestDto>();
  formDelete = output<number>();
  valuesChange = output<WorkRequestDto>();

  private locations = signal<Option[]>([]);
  fields = computed(() => WorkRequestDto.toFormFields(this.values(),this.locations()));
  isFormReady = signal<boolean>(false);
  
  ngOnInit() {
    this.loadOptions('location', this.locations);
  }
  
  private loadOptions(category: string, optionsSignal: ReturnType<typeof signal<Option[]>>) {
    this.currentValueService.getOptionsByCategory(category).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(options => {
      optionsSignal.set(options);
      this.checkFormReady();
    });
  }

    private checkFormReady() {
    if (this.locations().length > 0 ) {
      this.isFormReady.set(true);
    }
  }

  onFormSubmit(formData: any) {
    this.formSubmit.emit(formData);
  }

  onFormDelete() {
    this.formDelete.emit(this.values().id);
  }
}
