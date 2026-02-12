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

  printForm(definition: PrintableFormDto, data: any) {
    const dataSignal = signal(data);
    this.printableForm.set({ definition, data: dataSignal });

    console.log('Printing form:', this.printableForm());

    // Use a timeout to allow Angular to render the print component
    // with the new data before the print dialog opens.
    setTimeout(() => {
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.printCurrentPage) {
        electronAPI.printCurrentPage({ silent: false }).then(() => {
          this.printableForm.set(null);
        });
      } else {
        window.print();
        this.printableForm.set(null);
      }
    }, 50);
  }
}