import { Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QrScannerService {
  // Signal to control the visibility of the scanner component
  isScannerVisible = signal(false);

  // Subject to emit the successful scan result
  private scanSuccess$ = new Subject<string>();

  /**
   * Opens the QR scanner and returns an observable that emits the scanned value.
   * The observable completes after one emission.
   */
  public openScanner() {
    this.isScannerVisible.set(true);
    return this.scanSuccess$.asObservable();
  }

  /**
   * Called by the QrScannerComponent when a scan is successful.
   * @param result The string data from the QR code.
   */
  public onScanSuccess(result: string): void {
    this.isScannerVisible.set(false);
    this.scanSuccess$.next(result);
  }

  /**
   * Called by the QrScannerComponent to close the scanner (e.g., user cancels).
   */
  public closeScanner(): void {
    this.isScannerVisible.set(false);
  }
}