import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { FormStateService } from '../services/form-state.service';
import { PrintableFormDto } from '../models/printable-form.model';
import { PopupProjectionComponent } from '../../../shared/popup-projection/popup-projection.component';
import { FormMetadataDialogComponent } from '../form-metadata-dialog/form-metadata-dialog.component';

@Component({
  selector: 'app-form-designer-left-menu',
  standalone: true,
  imports: [PopupProjectionComponent, FormMetadataDialogComponent],
  templateUrl: './form-designer-left-menu.component.html',
  styleUrl: './form-designer-left-menu.component.css',
})
export class FormDesignerLeftMenuComponent {
  private formState = inject(FormStateService);
  private router = inject(Router);

  forms = toSignal(this.formState.allForms$, { initialValue: [] });
  isPopupOpen = signal(false);

  getFormName(form: PrintableFormDto): string {
    return form.name || 'Unnamed Form ' + form.id;
  }

  setCurrentForm(form: PrintableFormDto): void {
    this.formState.setCurrentFormById(form.id);
    this.router.navigate(['/form-designer/design']);
  }

  createNewForm(): void {
    this.formState.setCurrentFormWithDto(new PrintableFormDto());
    this.isPopupOpen.set(true);
  }

  editExistingForm(form: PrintableFormDto): void {
    this.formState.setCurrentFormById(form.id);
    this.isPopupOpen.set(true);
  }

  handleRightClick(form: PrintableFormDto, event: MouseEvent): void {
    event.preventDefault();
    this.editExistingForm(form);
  }

  closePopup(): void {
    this.isPopupOpen.set(false);
  }

  saveForm(form: PrintableFormDto): void {
    this.formState.updateForm(form);
    this.closePopup();
    this.router.navigate(['/form-designer/design']);
  }

  deleteForm(formId: number): void {
    this.formState.deleteForm(formId);
    this.closePopup();
  }
}
