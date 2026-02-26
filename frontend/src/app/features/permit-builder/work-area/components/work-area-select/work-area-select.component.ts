import {
  Component, input, inject, signal, effect, ViewChild,
  AfterViewInit, computed, Injector, output, DestroyRef
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchableSelectInputComponent } from '../../../../../shared/reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component';
import { WorkAreaApiService } from '../../services/work-area-api.service';
import { WorkAreaDto } from '../../../../../models/permits/work-area.model';
import { Option } from '../../../../../models/option.model';

@Component({
  selector: 'app-work-area-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectInputComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: WorkAreaSelectComponent,
    multi: true
  }],
  template: `
    <div class="work-area-select">
      <app-searchable-select-input
        [label]="label()"
        [options]="options()"
        [categoryName]="''"
        #selectInput
      ></app-searchable-select-input>
    </div>
  `,
  styles: [`
    .work-area-select {
      width: 100%;
    }
  `]
})
export class WorkAreaSelectComponent implements ControlValueAccessor, AfterViewInit {
  private api = inject(WorkAreaApiService);
  private injector = inject(Injector);
  private destroyRef = inject(DestroyRef);

  @ViewChild('selectInput') selectInput!: SearchableSelectInputComponent;

  // Inputs
  label = input<string>('Work Area');

  // Outputs - emits full WorkAreaDto so parent can read constantHazards
  workAreaSelected = output<WorkAreaDto | null>();

  // State
  value = signal<any>(null);
  disabled = signal<boolean>(false);
  private workAreas = signal<WorkAreaDto[]>([]);

  // Options computed from loaded work areas
  options = computed<Option[]>(() => {
    return this.workAreas().map(wa => ({
      value: wa.id,
      label: wa.name,
    }));
  });

  // CVA internals
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private pendingValue: any = undefined;
  private hasPendingValue = false;

  constructor() {
    // Load work areas on init
    this.api.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (areas) => this.workAreas.set(areas),
    });
  }

  ngAfterViewInit(): void {
    if (this.selectInput) {
      this.selectInput.registerOnChange((val: any) => {
        this.value.set(val);
        this.onChange(val);
        this.emitSelectedWorkArea(val);
      });
      this.selectInput.registerOnTouched(() => this.onTouched());

      if (this.hasPendingValue) {
        this.selectInput.writeValue(this.pendingValue);
        this.hasPendingValue = false;
        this.pendingValue = undefined;
      }

      // Re-apply value when options load
      effect(() => {
        const opts = this.options();
        const val = this.value();
        if (opts.length > 0 && val !== null && val !== undefined && this.selectInput) {
          setTimeout(() => {
            if (this.selectInput) {
              this.selectInput.writeValue(val);
            }
          }, 0);
        }
      }, { injector: this.injector });
    }
  }

  // --- ControlValueAccessor ---

  writeValue(value: any): void {
    this.value.set(value);
    if (this.selectInput) {
      this.selectInput.writeValue(value);
    } else {
      this.pendingValue = value;
      this.hasPendingValue = true;
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (this.selectInput) {
      this.selectInput.setDisabledState(isDisabled);
    }
  }

  // --- Helpers ---

  private emitSelectedWorkArea(valueId: any): void {
    if (valueId === null || valueId === undefined) {
      this.workAreaSelected.emit(null);
      return;
    }
    const selected = this.workAreas().find(wa => wa.id === valueId) || null;
    this.workAreaSelected.emit(selected);
  }

  /** Reload work areas (e.g., after creating a new one) */
  refresh(): void {
    this.api.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (areas) => this.workAreas.set(areas),
    });
  }
}
