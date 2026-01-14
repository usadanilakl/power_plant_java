import { Component, inject, signal } from '@angular/core';
import { CurrentPrintableFormService } from '../../../../services/forms/current-printable-form.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { PrintableFormDto } from '../../../../models/forms/printable-form.model';
import { PopupProjectionComponent } from "../../../../shared/popup-projection/popup-projection.component";
import { Router } from '@angular/router';
import { PrintableFormFormComponent } from "../printable-form-form/printable-form-form.component";

@Component({
  selector: 'app-printable-form-side-menu',
  standalone: true,
  imports: [PopupProjectionComponent, PrintableFormFormComponent],
  templateUrl: './printable-form-side-menu.component.html',
  styleUrl: './printable-form-side-menu.component.css'
})
export class PrintableFormSideMenuComponent {
  private currentPrintableFormService = inject(CurrentPrintableFormService);
  private router = inject(Router);

  forms = toSignal(this.currentPrintableFormService.allForms$, { initialValue: [] });
  isNewFormPopupOpen = signal(false);
  getFormName(form: PrintableFormDto){
    return form.name ?? 'Unnamed Form' + form.id;
  }
  setCurrentForm(form: PrintableFormDto): void {
    this.currentPrintableFormService.setCurrentFormById(form.id);
    this.router.navigate(['/form-designer/design']);
  }
  newFormPopup() {
    this.isNewFormPopupOpen.set(true);
  }
  closeNewFormPopup() {
    this.isNewFormPopupOpen.set(false);
  }
  // saveForm(formName: string): void {
  //   const form = new PrintableFormDto({ name: formName });
  //   this.currentPrintableFormService.updateForm(form);
  //   this.closeNewFormPopup();
  //   this.router.navigate(['/form-designer/design']);
  // }
  saveForm(form: PrintableFormDto): void {
    this.currentPrintableFormService.updateForm(form);
    this.closeNewFormPopup();
    this.router.navigate(['/form-designer/design']);
  }

  createnewForm(): void {
    const form = new PrintableFormDto();
    this.currentPrintableFormService.setCurrentFormWithDto(form);
    this.newFormPopup()
  }

  editExistingForm(form: PrintableFormDto): void {
    this.currentPrintableFormService.setCurrentFormById(form.id);
    this.newFormPopup();
  }

  handleRightClick(form: PrintableFormDto, event: MouseEvent): void {
    event.preventDefault(); // This is important to prevent the browser's default context menu
    this.editExistingForm(form);
  }

}
