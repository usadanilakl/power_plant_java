import { Injectable, Signal, signal } from '@angular/core';
import { PrintableFormDto } from '../../models/forms/printable-form.model';

export interface ReadyToPrintForm {
  definition: PrintableFormDto;
  data: Signal<any>;
}

@Injectable({
  providedIn: 'root'
})
export class PrintService {
  printableForm = signal<ReadyToPrintForm | null>(null);
  isPreparing = signal(false);

  printForm(definition: PrintableFormDto, data: any) {
    const dataSignal = signal(data);
    this.isPreparing.set(true);
    this.printableForm.set({ definition, data: dataSignal });

    // Allow Angular to render the print layout before triggering print.
    // 500ms gives time for large forms (200+ containers) to fully render.
    setTimeout(() => {
      this.isPreparing.set(false);
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.printWithPreview) {
        electronAPI.printWithPreview()
          .then(() => this.printableForm.set(null))
          .catch(() => this.printableForm.set(null));
      } else if (electronAPI?.printCurrentPage) {
        electronAPI.printCurrentPage({ silent: false })
          .then(() => this.printableForm.set(null))
          .catch(() => this.printableForm.set(null));
      } else {
        window.print();
        this.printableForm.set(null);
      }
    }, 500);
  }
}