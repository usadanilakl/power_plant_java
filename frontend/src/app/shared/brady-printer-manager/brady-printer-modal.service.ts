import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BradyPrinterModalService {
  // Signal to control the visibility of the printer manager component
  isVisible = signal(false);

  open(): void {
    this.isVisible.set(true);
  }

  close(): void {
    this.isVisible.set(false);
  }
}
