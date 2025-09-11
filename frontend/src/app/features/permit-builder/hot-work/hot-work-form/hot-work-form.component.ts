import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { CurrentValueService } from '../../../../services/current-value.service';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { Option } from '../../../../models/option.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormComponent } from "../../../../shared/reactive-form/reactive-form.component";

@Component({
  selector: 'app-hot-work-form',
  imports: [ReactiveFormComponent],
  templateUrl: './hot-work-form.component.html',
  styleUrl: './hot-work-form.component.css'
})
export class HotWorkFormComponent implements OnInit  {

  private currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  values = input<HotWorkDto>(new HotWorkDto());
  formSubmit = output<HotWorkDto>();
  formDelete = output<number>();
  valuesChange = output<HotWorkDto>();

  private locations = signal<Option[]>([]);
  fields = computed(() => HotWorkDto.toFormFields(this.values(), this.locations()));
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
    if (this.locations().length > 0) {
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
