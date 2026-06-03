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

  // ── Manage values dialog (lists existing values with delete buttons) ───────
  showManageDialog = signal<boolean>(false);
  // Delete-confirm sub-dialog inside the manage panel.
  showDeleteConfirm = signal<boolean>(false);
  /** Signal (not plain field) so {@link transferOptions} re-computes when it changes. */
  deleteTargetId = signal<number | null>(null);
  deleteTargetName = signal<string>('');
  /** Optional transfer-to-another value-id so existing references aren't orphaned. */
  transferToValueId: number | null = null;
  /** Eligible transfer targets = all values in the category except the one being deleted. */
  transferOptions = computed(() => {
    const id = this.deleteTargetId();
    return this.options().filter((o: any) => o.value !== id);
  });
  isDeleting = signal<boolean>(false);

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

  /** True iff the add dialog was launched from inside the manage panel. */
  private addLaunchedFromManage = false;

  onAddNew(): void {
    // If add was triggered from within manage, hide manage so the add overlay
    // isn't obscured by it (both default to z-index 1000). We re-open manage
    // when the add dialog closes/saves so the user lands back on the list.
    if (this.showManageDialog()) {
      this.addLaunchedFromManage = true;
      this.showManageDialog.set(false);
    }
    this.dialogMode.set('add');
    this.dialogValueName = '';
    this.dialogValueAlias = '';
    this.errorMessage.set('');
    this.showDialog.set(true);
  }

  onEdit(): void {
    // For multi-select, the "edit" affordance opens the manage panel where the
    // user can both add new values and delete existing ones safely (with an
    // optional transfer to keep existing references from being orphaned).
    this.openManageDialog();
  }

  // ==================== Manage / Delete ====================

  openManageDialog(): void {
    this.showManageDialog.set(true);
  }

  closeManageDialog(): void {
    this.showManageDialog.set(false);
    this.closeDeleteConfirm();
  }

  openDeleteConfirm(option: any): void {
    this.deleteTargetId.set(option?.value ?? null);
    this.deleteTargetName.set(option?.label ?? '');
    this.transferToValueId = null;
    this.errorMessage.set('');
    this.showDeleteConfirm.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirm.set(false);
    this.deleteTargetId.set(null);
    this.deleteTargetName.set('');
    this.transferToValueId = null;
    this.isDeleting.set(false);
    this.errorMessage.set('');
  }

  /**
   * Delete the selected value. If `transferToValueId` is set the backend
   * re-points existing references at that target; otherwise the references
   * are simply detached. The backend (`valueService.deleteValue`) is the
   * single source of truth on the safety policy.
   */
  confirmDelete(): void {
    const id = this.deleteTargetId();
    if (id == null) return;
    const alias = this.categoryAlias();
    const transferId = this.transferToValueId;

    this.isDeleting.set(true);
    this.errorMessage.set('');

    this.valueService.deleteValue(id, alias, transferId || undefined).subscribe({
      next: () => {
        this.isDeleting.set(false);
        // Drop the deleted id from the current selection; if a transfer target
        // was chosen and isn't already selected, add it.
        this.values.update(current => {
          const filtered = current.filter(v => v !== id);
          if (transferId && !filtered.includes(transferId)) filtered.push(transferId);
          return filtered;
        });
        this.onChange(this.values());
        if (this.multiSelectInput) {
          this.multiSelectInput.writeValue(this.values());
        }
        // Refresh the category so the menu list updates.
        this.valueService.refreshCategory(alias);
        this.closeDeleteConfirm();
      },
      error: (error) => {
        this.isDeleting.set(false);
        this.errorMessage.set(error.error?.message || 'Error deleting value');
      }
    });
  }

  // ==================== Add Dialog ====================

  closeDialog(): void {
    this.showDialog.set(false);
    this.dialogValueName = '';
    this.dialogValueAlias = '';
    this.errorMessage.set('');
    // Restore the manage panel if add was launched from inside it.
    if (this.addLaunchedFromManage) {
      this.addLaunchedFromManage = false;
      this.showManageDialog.set(true);
    }
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
