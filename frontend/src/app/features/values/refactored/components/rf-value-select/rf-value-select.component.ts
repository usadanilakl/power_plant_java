import { Component, input, inject, signal, effect, ViewChild, AfterViewInit, computed, Injector } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RfValueService } from '../../services/rf-value.service';
import { SearchableSelectInputComponent } from '../../../../../shared/reactive-form/refactored/input-fields/searchable-select-input/searchable-select-input.component';

@Component({
  selector: 'app-rf-value-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectInputComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: RfValueSelectComponent,
    multi: true
  }],
  templateUrl: './rf-value-select.component.html',
  styleUrls: ['./rf-value-select.component.css']
})
export class RfValueSelectComponent implements ControlValueAccessor, AfterViewInit {
  private valueService = inject(RfValueService);
  private injector = inject(Injector);

  @ViewChild('selectInput') selectInput!: SearchableSelectInputComponent;

  // Inputs
  categoryAlias = input.required<string>();
  label = input<string>('Value');
  canManageValues = input<boolean>(true);

  // State
  value = signal<any>(null);
  disabled = signal<boolean>(false);

  // Computed options based on categoryAlias
  options = computed(() => {
    const alias = this.categoryAlias();
    console.log('RfValueSelect options computed running - alias:', alias);
    if (!alias) return [];
    const optionsSignal = this.valueService.getValueOptions(alias);
    const opts = optionsSignal();
    console.log('RfValueSelect options computed result:', opts, 'length:', opts?.length);
    return opts;
  });

  // Dialog state for Add/Edit
  showDialog = signal<boolean>(false);
  dialogMode = signal<'add' | 'edit'>('add');
  dialogValueName = '';
  dialogValueAlias = '';
  errorMessage = signal<string>('');

  // Delete confirmation state
  showDeleteConfirm = signal<boolean>(false);
  transferToValueId: number | null = null;
  selectedValueName = signal<string>('');
  transferOptions = signal<any[]>([]);

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private pendingValue: any = undefined;
  private hasPendingValue = false;

  ngAfterViewInit(): void {
    // Connect the child component's CVA to our CVA
    if (this.selectInput) {
      this.selectInput.registerOnChange((val: any) => {
        this.value.set(val);
        this.onChange(val);
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
      // Use injector to run effect in proper context
      effect(() => {
        const opts = this.options();
        const val = this.value();
        if (opts.length > 0 && val !== null && val !== undefined && this.selectInput) {
          // Trigger re-render by re-writing the value
          setTimeout(() => {
            if (this.selectInput) {
              this.selectInput.writeValue(val);
            }
          }, 0);
        }
      }, { injector: this.injector });
    }
  }

  // ==================== ControlValueAccessor Methods ====================

  writeValue(value: any): void {
    this.value.set(value);
    if (this.selectInput) {
      this.selectInput.writeValue(value);
    } else {
      // Store value to apply after view init
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

  // ==================== Searchable Select Event Handlers ====================

  onAddNew(): void {
    this.dialogMode.set('add');
    this.dialogValueName = '';
    this.dialogValueAlias = '';
    this.errorMessage.set('');
    this.showDialog.set(true);
  }

  onEdit(): void {
    const currentValue = this.value();
    if (!currentValue) {
      this.errorMessage.set('Please select a value to edit');
      return;
    }

    const selectedOption = this.options().find((opt: any) => opt.value === currentValue);
    if (!selectedOption) return;

    this.dialogMode.set('edit');
    this.dialogValueName = selectedOption.label;
    this.dialogValueAlias = '';
    this.errorMessage.set('');
    this.showDialog.set(true);
  }

  // ==================== Add/Edit Dialog ====================

  closeDialog(): void {
    this.showDialog.set(false);
    this.dialogValueName = '';
    this.dialogValueAlias = '';
    this.errorMessage.set('');
  }

  saveValue(): void {
    if (!this.dialogValueName.trim()) {
      this.errorMessage.set('Name is required');
      return;
    }

    const alias = this.categoryAlias();
    const isAddMode = this.dialogMode() === 'add';

    if (isAddMode) {
      // Create new value
      this.valueService.createValue(alias, this.dialogValueName, this.dialogValueAlias)
        .subscribe({
          next: (newValue) => {
            this.closeDialog();
            // Refresh options
            this.valueService.refreshCategory(alias);
            // Auto-select the newly created value
            this.value.set(newValue.id);
            this.onChange(newValue.id);
          },
          error: (error) => {
            this.errorMessage.set(error.error?.message || 'Error creating value');
          }
        });
    } else {
      // Update existing value
      const valueId = this.value();
      if (!valueId) return;

      this.valueService.updateValue(valueId, this.dialogValueName, this.dialogValueAlias)
        .subscribe({
          next: () => {
            this.closeDialog();
            // Refresh options
            this.valueService.refreshCategory(alias);
          },
          error: (error) => {
            this.errorMessage.set(error.error?.message || 'Error updating value');
          }
        });
    }
  }

  // ==================== Delete Dialog ====================

  openDeleteDialog(): void {
    const currentValue = this.value();
    if (!currentValue) return;

    const selectedOption = this.options().find((opt: any) => opt.value === currentValue);
    if (!selectedOption) return;

    this.selectedValueName.set(selectedOption.label);

    // Get transfer options (all options except current)
    const transfers = this.options().filter((opt: any) => opt.value !== currentValue);
    this.transferOptions.set(transfers);
    this.transferToValueId = null;
    this.errorMessage.set('');
    this.showDeleteConfirm.set(true);
  }

  closeDeleteDialog(): void {
    this.showDeleteConfirm.set(false);
    this.transferToValueId = null;
    this.errorMessage.set('');
  }

  confirmDelete(): void {
    const valueId = this.value();
    if (!valueId) return;

    const alias = this.categoryAlias();

    this.valueService.deleteValue(valueId, alias, this.transferToValueId || undefined)
      .subscribe({
        next: () => {
          this.closeDeleteDialog();
          // Clear selection
          this.value.set(null);
          this.onChange(null);
          // Refresh options
          this.valueService.refreshCategory(alias);
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Error deleting value');
        }
      });
  }
}
