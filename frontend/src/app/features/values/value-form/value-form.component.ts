import { Component, computed, inject, input, signal, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ValueDto } from '../../../models/value.model';
import { CurrentValueService } from '../../../services/current-value.service';
import { ValueService, ValueReferenceReport } from '../../../services/value.service';

@Component({
  selector: 'app-value-form',
  imports: [FormsModule, CommonModule],
  templateUrl: './value-form.component.html',
  styleUrl: './value-form.component.css',
  standalone: true,
})
export class ValueFormComponent {
  private currentValueService = inject(CurrentValueService);
  private valueService = inject(ValueService);

  categoryAlias = input<string>();

  valueToEditId = signal<number | null>(null);
  transferValueId = signal<number | null>(null);
  editingName = signal<string | null>('');
  editingAlias = signal<string>('');

  values = signal<ValueDto[]>([]);

  // --- References ---
  references = signal<ValueReferenceReport | null>(null);
  referencesLoading = signal(false);
  busy = signal(false);
  message = signal<{ text: string; kind: 'ok' | 'error' } | null>(null);

  selectedValue = computed(() => this.values().find(v => v.id === this.valueToEditId()) ?? null);

  /** Total references; null while unknown (nothing selected / still loading). */
  referenceCount = computed(() => this.references()?.totalCount ?? null);

  /**
   * Delete is allowed only once nothing points at the value. Mirrors the server gate — the endpoint
   * re-checks and answers 409, so this is a UX affordance, not the safety mechanism.
   */
  canDelete = computed(() =>
    this.valueToEditId() !== null &&
    !this.referencesLoading() &&
    !this.busy() &&
    this.references() !== null &&
    this.references()!.totalCount === 0
  );

  canRepoint = computed(() =>
    this.valueToEditId() !== null &&
    this.transferValueId() !== null &&
    this.transferValueId() !== this.valueToEditId() &&
    !this.busy() &&
    (this.references()?.totalCount ?? 0) > 0
  );

  /** Every other value in the category — a value can't be repointed onto itself. */
  transferTargets = computed(() => this.values().filter(v => v.id !== this.valueToEditId()));

  constructor() {
    effect(() => {
      if (this.categoryAlias()) {
        this.loadValues();
      }
    });
  }

  loadValues() {
    this.currentValueService.getValuesByCategory(this.categoryAlias()!).subscribe({
      next: values => this.values.set(values),
      error: error => console.error('Error loading values:', error),
    });
  }

  onValueSelect(valueId: number | null) {
    this.valueToEditId.set(valueId);
    this.transferValueId.set(null);
    this.message.set(null);
    const selectedValue = this.values().find(v => v.id === valueId);
    this.editingName.set(selectedValue?.name ?? '');
    this.editingAlias.set(selectedValue?.alias ?? '');
    this.loadReferences();
  }

  onTransferValueSelect(valueId: number | null) {
    this.transferValueId.set(valueId);
  }

  onNameChange(newName: string) {
    this.editingName.set(newName);
  }

  onAliasChange(newAlias: string) {
    this.editingAlias.set(newAlias);
  }

  private loadReferences() {
    const id = this.valueToEditId();
    if (id === null) {
      this.references.set(null);
      return;
    }
    this.referencesLoading.set(true);
    this.references.set(null);
    this.valueService.getValueReferences(id).subscribe({
      next: response => {
        this.references.set(response.responseData);
        this.referencesLoading.set(false);
      },
      error: error => {
        console.error('Error loading value references:', error);
        this.referencesLoading.set(false);
        this.message.set({ text: 'Could not load references — delete stays disabled.', kind: 'error' });
      },
    });
  }

  submitEdit() {
    const id = this.valueToEditId();
    const name = this.editingName();
    if (!id || !name) return;

    this.busy.set(true);
    this.currentValueService.updateValue(id, name, this.editingAlias()).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set({ text: 'Value updated.', kind: 'ok' });
        this.loadValues();
      },
      error: error => {
        console.error('Error updating value:', error);
        this.busy.set(false);
        this.message.set({ text: 'Failed to update value.', kind: 'error' });
      },
    });
  }

  /** Move every reference onto the chosen value, then re-check so Delete can unlock. */
  submitRepoint() {
    const id = this.valueToEditId();
    const targetId = this.transferValueId();
    if (!id || !targetId) return;

    this.busy.set(true);
    this.valueService.repointValue(id, targetId).subscribe({
      next: response => {
        this.busy.set(false);
        const moved = response.responseData ?? 0;
        this.message.set({ text: `Repointed ${moved} reference${moved === 1 ? '' : 's'}.`, kind: 'ok' });
        this.transferValueId.set(null);
        this.loadReferences();
      },
      error: error => {
        console.error('Error repointing value:', error);
        this.busy.set(false);
        this.message.set({ text: 'Failed to repoint references.', kind: 'error' });
      },
    });
  }

  submitDelete() {
    const id = this.valueToEditId();
    if (!id || !this.canDelete()) return;
    if (!confirm(`Delete "${this.selectedValue()?.name}"? Nothing references it.`)) return;

    this.busy.set(true);
    this.valueService.deleteValueIfUnreferenced(id).subscribe({
      next: () => {
        this.busy.set(false);
        this.message.set({ text: 'Value deleted.', kind: 'ok' });
        this.valueToEditId.set(null);
        this.references.set(null);
        this.editingName.set('');
        this.editingAlias.set('');
        this.loadValues();
      },
      error: error => {
        console.error('Error deleting value:', error);
        this.busy.set(false);
        // 409 = the server found references the UI didn't know about yet; re-sync the list.
        this.message.set({
          text: error?.status === 409
            ? 'Value still has references — refreshed the list below.'
            : 'Failed to delete value.',
          kind: 'error',
        });
        this.loadReferences();
      },
    });
  }

  refreshReferences() {
    this.loadReferences();
  }
}
