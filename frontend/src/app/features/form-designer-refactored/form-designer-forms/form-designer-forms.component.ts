import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormStateService } from '../services/form-state.service';
import { PrintableFormDto } from '../models/printable-form.model';
import { Column } from '../../../models/column.model';

@Component({
  selector: 'app-form-designer-forms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './form-designer-forms.component.html',
  styleUrl: './form-designer-forms.component.css',
})
export class FormDesignerFormsComponent {
  private formState = inject(FormStateService);
  private router = inject(Router);

  forms = toSignal(this.formState.allForms$, { initialValue: [] });
  columns = PrintableFormDto.toTableColumns(['name', 'formType', 'isVerified']);

  selectForm(form: PrintableFormDto): void {
    this.formState.setCurrentFormById(form.id);
    this.router.navigate(['/form-designer/design']);
  }

  copyForm(form: PrintableFormDto, event: MouseEvent): void {
    event.stopPropagation();
    this.formState.copyForm(form.id);
  }

  getCellValue(form: PrintableFormDto, column: Column): string {
    if (column.accessorFn) return column.accessorFn(form);
    if (column.accessorKey) return (form as any)[column.accessorKey] ?? '';
    return '';
  }

  getCellStyle(form: PrintableFormDto, column: Column): any {
    return column.conditionalStyling ? column.conditionalStyling(form) : {};
  }
}
