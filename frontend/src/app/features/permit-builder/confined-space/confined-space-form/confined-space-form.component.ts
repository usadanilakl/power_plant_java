import { Component, computed, DestroyRef, inject, input, OnInit, output, signal } from '@angular/core';
import { ReactiveFormComponent } from "../../../../shared/reactive-form/reactive-form.component";
import { CurrentValueService } from '../../../../services/current-value.service';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
import { Option } from '../../../../models/option.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-confined-space-form',
  imports: [ReactiveFormComponent],
  templateUrl: './confined-space-form.component.html',
  styleUrl: './confined-space-form.component.css'
})
export class ConfinedSpaceFormComponent implements OnInit  {

  private currentValueService = inject(CurrentValueService);
  private destroyRef = inject(DestroyRef);

  values = input<ConfinedSpaceDto>(new ConfinedSpaceDto());
  formSubmit = output<ConfinedSpaceDto>();
  formDelete = output<number>();
  valuesChange = output<ConfinedSpaceDto>();

  private spaces = signal<Option[]>([]);
  fields = computed(() => ConfinedSpaceDto.toFormFields(this.values(), this.spaces()));
  isFormReady = signal<boolean>(false);
  
  ngOnInit() {
    this.loadOptions('location', this.spaces);
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
    if (this.spaces().length > 0) {
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
