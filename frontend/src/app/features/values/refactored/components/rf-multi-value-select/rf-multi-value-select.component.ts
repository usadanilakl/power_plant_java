import { Component, input, inject, signal, effect, ViewChild, AfterViewInit, computed } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RfValueService } from '../../services/rf-value.service';
import { SearchableMultiSelectInputComponent } from '../../../../../shared/reactive-form/refactored/input-fields/searchable-multi-select-input/searchable-multi-select-input.component';

@Component({
  selector: 'app-rf-multi-value-select',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableMultiSelectInputComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: RfMultiValueSelectComponent,
    multi: true
  }],
  templateUrl: './rf-multi-value-select.component.html',
  styleUrls: ['./rf-multi-value-select.component.css']
})
export class RfMultiValueSelectComponent implements ControlValueAccessor, AfterViewInit {
  private valueService = inject(RfValueService);

  @ViewChild('multiSelectInput') multiSelectInput!: SearchableMultiSelectInputComponent;

  // Inputs
  categoryAlias = input.required<string>();
  label = input<string>('Values');
  canManageValues = input<boolean>(true);

  // State
  private values = signal<any[]>([]);
  disabled = signal<boolean>(false);

  // Computed options based on categoryAlias
  options = computed(() => {
    const alias = this.categoryAlias();
    if (!alias) return [];
    const optionsSignal = this.valueService.getValueOptions(alias);
    return optionsSignal();
  });

  // Dialog state for Add/Edit
  showDialog = signal<boolean>(false);
  dialogMode = signal<'add' | 'edit'>('add');
  dialogValueName = '';
  dialogValueAlias = '';
  errorMessage = signal<string>('');

  // ControlValueAccessor
  private onChange = (value: any) => {};
  private onTouched = () => {};
  private pendingValue: any = undefined;
  private hasPendingValue = false;

  ngAfterViewInit(): void {
    // Connect the child component's CVA to our CVA
    if (this.multiSelectInput) {
      this.multiSelectInput.registerOnChange((val: any) => {
        this.values.set(val);
        this.onChange(val);
      });
      this.multiSelectInput.registerOnTouched(() => {
        this.onTouched();
      });

      // Apply pending value if writeValue was called before ngAfterViewInit
      if (this.hasPendingValue) {
        this.multiSelectInput.writeValue(this.pendingValue);
        this.hasPendingValue = false;
        this.pendingValue = undefined;
      }
    }
  }

  // ==================== ControlValueAccessor Methods ====================

  writeValue(value: any): void {
    this.values.set(value || []);
    if (this.multiSelectInput) {
      this.multiSelectInput.writeValue(value || []);
    } else {
      // Store value to apply after view init
      this.pendingValue = value || [];
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
    // Note: SearchableMultiSelectInputComponent doesn't have setDisabledState yet
  }

  // ==================== Searchable Multi-Select Event Handlers ====================

  onAddNew(): void {
    this.dialogMode.set('add');
    this.dialogValueName = '';
    this.dialogValueAlias = '';
    this.errorMessage.set('');
    this.showDialog.set(true);
  }

  onEdit(): void {
    // For multi-select, edit just opens the add dialog
    // User can add new values to the category
    this.onAddNew();
  }

  // ==================== Add Dialog ====================

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

    // Always create new value for multi-select
    this.valueService.createValue(alias, this.dialogValueName, this.dialogValueAlias)
      .subscribe({
        next: (newValue) => {
          this.closeDialog();
          // Refresh options
          this.valueService.refreshCategory(alias);
          // Auto-add the newly created value to selected values
          this.values.update(current => [...current, newValue.id]);
          this.onChange(this.values());
        },
        error: (error) => {
          this.errorMessage.set(error.error?.message || 'Error creating value');
        }
      });
  }
}
