import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { SafeWorkDto } from '../../../../models/permits/safe-work.model';
import { ReactiveFormComponent } from "../../../../shared/reactive-form/reactive-form.component";
import { Option } from '../../../../models/option.model';
import { CurrentValueService } from '../../../../services/current-value.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-safe-work-form',
  imports: [ReactiveFormComponent],
  templateUrl: './safe-work-form.component.html',
  styleUrl: './safe-work-form.component.css'
})
export class SafeWorkFormComponent implements OnInit  {

  private currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  values = input<SafeWorkDto>(new SafeWorkDto());
  formSubmit = output<SafeWorkDto>();
  formDelete = output<number>();
  valuesChange = output<SafeWorkDto>();

  private locations = signal<Option[]>([]);
  fields = computed(() => SafeWorkDto.toFormFields(this.values(),this.locations()));
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
