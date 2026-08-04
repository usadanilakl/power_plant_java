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

    // A sheet wider than it is tall is a landscape form (e.g. the LOTO sign-on/sign-off sheet).
    // Electron's printToPDF is called without preferCSSPageSize, so the @page rule in styles.css
    // never reaches it — orientation has to be passed explicitly or a landscape sheet prints
    // portrait and gets clipped. The preload and IPC handler have always accepted this; nothing
    // ever sent it.
    const size = definition?.size;
    const landscape = !!size && Number(size.width) > Number(size.height);

    // Allow Angular to render the print layout before triggering print.
    // 500ms gives time for large forms (200+ containers) to fully render.
    setTimeout(() => {
      this.isPreparing.set(false);
      const electronAPI = (window as any).electronAPI;
      if (electronAPI?.printWithPreview) {
        electronAPI.printWithPreview({ landscape })
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