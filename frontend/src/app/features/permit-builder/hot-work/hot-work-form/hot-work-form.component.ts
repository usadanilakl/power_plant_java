import { Component, computed, DestroyRef, inject, Input, input, OnInit, output, Signal, signal } from '@angular/core';
import { CurrentValueService } from '../../../../services/current-value.service';
import { HotWorkDto } from '../../../../models/permits/hot-work.model';
import { Option } from '../../../../models/option.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SmartFormComponent } from "../../../../shared/reactive-form/smart-form/smart-form.component";

@Component({
  selector: 'app-hot-work-form',
  imports: [SmartFormComponent],
  templateUrl: './hot-work-form.component.html',
  styleUrl: './hot-work-form.component.css'
})
export class HotWorkFormComponent implements OnInit  {

  private currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  // values = input<HotWorkDto>(new HotWorkDto());
  @Input() values: Signal<HotWorkDto> = signal(new HotWorkDto());
  submitButtonText = input<string>('Submit');
  deleteButtonText = input<string>('Delete');
  
  formChange = output<HotWorkDto>();
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
