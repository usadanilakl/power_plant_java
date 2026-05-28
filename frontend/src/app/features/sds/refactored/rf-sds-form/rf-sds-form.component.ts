import { Component, inject, computed, viewChild } from '@angular/core';
import { RfReactiveFormComponent } from '../../../../shared/reactive-form/refactored/reactive-form/rf-reactive-form.component';
import { RfSdsStateService } from '../services/rf-sds-state.service';
import { SdsChemicalDto } from '../../../../models/sds/sds-chemical.model';

@Component({
  selector: 'app-rf-sds-form',
  standalone: true,
  imports: [RfReactiveFormComponent],
  template: `
    <div class="address-bar">
      <span class="address-hint">Suggested Book/Section is pre-filled — edit if needed.</span>
      <button type="button" class="btn-newbook" (click)="onStartNewBook()">+ Start new book</button>
    </div>
    <app-rf-reactive-form
      [fields]="fields()"
      [entity]="entity()"
      (formSubmit)="onSubmit($event)"
      (formDelete)="onDelete()">
    </app-rf-reactive-form>
  `,
  styles: [`
    :host { display: block; padding: 16px; }
    .address-bar { display: flex; align-items: center; justify-content: space-between; gap: 8px;
      margin-bottom: 8px; flex-wrap: wrap; }
    .address-hint { font-size: 12px; color: var(--secondary-text); }
    .btn-newbook { padding: 4px 12px; border: 1px solid var(--accent-color); border-radius: 4px;
      background: var(--card-background); color: var(--accent-color); cursor: pointer; font-size: 12px; }
    .btn-newbook:hover { background: var(--hover-background); }
  `]
})
export class RfSdsFormComponent {
  protected stateService = inject(RfSdsStateService);

  private formRef = viewChild(RfReactiveFormComponent);

  entity = computed(() => this.stateService.selectedItem() ?? new SdsChemicalDto());

  fields = computed(() => {
    const entity = this.entity();
    return SdsChemicalDto.toFormFields(entity);
  });

  /** Bump the live form to the next book at Section 1, preserving typed names/locations. */
  onStartNewBook(): void {
    const child = this.formRef();
    if (!child) return;
    const currentBook = Number(child.form.get('bookNumber')?.value) || 0;
    child.form.patchValue({ bookNumber: currentBook + 1, sectionNumber: 1 });
  }

  onSubmit(formValues: any): void {
    const entity = this.entity();
    const updated = new SdsChemicalDto({
      ...entity,
      ...formValues,
    });
    if (entity.id) updated.id = entity.id;
    this.stateService.submitForm(updated);
  }

  onDelete(): void {
    const entity = this.entity();
    if (entity?.id) {
      this.stateService.deleteItem(entity.id);
    }
  }
}
