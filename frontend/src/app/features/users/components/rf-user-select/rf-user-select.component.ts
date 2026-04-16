import { Component, input, inject, signal, effect, ViewChild, AfterViewInit, computed, Injector, output } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RfUserOptionService } from '../../services/rf-user-option.service';
import { UserDto } from '../../../../models/user.model';
import { SearchableSelectInputComponent } from '../../../../shared/reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component';

@Component({
  selector: 'app-rf-user-select',
  standalone: true,
  imports: [CommonModule, SearchableSelectInputComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: RfUserSelectComponent,
    multi: true
  }],
  templateUrl: './rf-user-select.component.html',
  styleUrls: ['./rf-user-select.component.css']
})
export class RfUserSelectComponent implements ControlValueAccessor, AfterViewInit {
  private userOptionService = inject(RfUserOptionService);
  private injector = inject(Injector);

  @ViewChild('selectInput') selectInput!: SearchableSelectInputComponent;

  // Inputs
  label = input<string>('User');
  roleFilter = input<string | undefined>(undefined);

  // Outputs
  userSelected = output<UserDto | null>();

  // State
  value = signal<any>(null);
  disabled = signal<boolean>(false);

  // Computed options
  options = computed(() => {
    const filter = this.roleFilter();
    if (filter) {
      return this.userOptionService.getFilteredOptions(filter);
    }
    return this.userOptionService.getUserOptions();
  });

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private pendingValue: any = undefined;
  private hasPendingValue = false;

  ngAfterViewInit(): void {
    if (this.selectInput) {
      this.selectInput.registerOnChange((val: any) => {
        this.value.set(val);
        this.onChange(val);
        this.emitSelectedUser(val);
      });
      this.selectInput.registerOnTouched(() => {
        this.onTouched();
      });

      // Apply pending value if writeValue was called before ngAfterViewInit
      if (this.hasPendingValue) {
        this.selectInput.writeValue(this.pendingValue);
        this.hasPendingValue = false;
        this.pendingValue = undefined;
      }

      // Re-apply value when options load to ensure display updates
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

  writeValue(value: any): void {
    this.value.set(value);
    if (this.selectInput) {
      this.selectInput.writeValue(value);
    } else {
      this.pendingValue = value;
      this.hasPendingValue = true;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (this.selectInput) {
      this.selectInput.setDisabledState(isDisabled);
    }
  }

  private emitSelectedUser(userId: any): void {
    if (userId === null || userId === undefined) {
      this.userSelected.emit(null);
      return;
    }
    const user = this.userOptionService.getUserById(Number(userId));
    this.userSelected.emit(user ?? null);
  }
}
