import { Component, EventEmitter, Output, signal } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

/**
 * Full-screen camera barcode scanner for part item numbers. Supports QR + common 1D formats (Code128/39,
 * EAN/UPC, ITF) and DataMatrix. Emits the decoded string once, then the parent closes it (which stops the camera).
 */
@Component({
  selector: 'app-maximo-barcode-scanner',
  standalone: true,
  imports: [ZXingScannerModule],
  template: `
    <div class="bs-overlay" (click)="close.emit()">
      <div class="bs-modal" (click)="$event.stopPropagation()">
        <div class="bs-head"><span>Scan part barcode</span><button class="bs-x" (click)="close.emit()">✕</button></div>
        <div class="bs-frame">
          <zxing-scanner
            [formats]="formats"
            [device]="selectedDevice"
            (scanSuccess)="onScan($event)"
            (permissionResponse)="hasPermission.set($event)"
            (camerasFound)="onCameras($event)"
            (camerasNotFound)="hasDevices.set(false)">
          </zxing-scanner>
        </div>
        @if (!hasPermission()) {
          <p class="bs-msg">Camera permission needed — allow it in your browser, then reopen.</p>
        } @else if (!hasDevices()) {
          <p class="bs-msg">No camera detected on this device.</p>
        } @else {
          @if (devices().length > 1) {
            <select class="bs-cam" (change)="pick($any($event.target).selectedIndex)">
              @for (d of devices(); track d.deviceId) {
                <option [selected]="d.deviceId === selectedDevice?.deviceId">{{ d.label || 'Camera' }}</option>
              }
            </select>
          }
          <p class="bs-hint">Point the camera at the item's barcode.</p>
        }
      </div>
    </div>
  `,
  styles: [`
    .bs-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 0.5rem; }
    .bs-modal { background: var(--secondary-background, #1e1e1e); border-radius: 14px; width: min(96vw, 520px); overflow: hidden; }
    .bs-head { display: flex; align-items: center; justify-content: space-between; padding: 0.7rem 0.9rem; color: var(--primary-text); font-weight: 700; border-bottom: 1px solid var(--border-color); }
    .bs-x { background: none; border: none; color: var(--secondary-text, #888); font-size: 1.1rem; cursor: pointer; }
    .bs-frame { width: 100%; aspect-ratio: 4 / 3; background: #000; overflow: hidden; }
    .bs-frame ::ng-deep zxing-scanner, .bs-frame ::ng-deep video { width: 100%; height: 100%; object-fit: cover; }
    .bs-msg { padding: 1.2rem 1rem; text-align: center; color: #e74c3c; font-size: 0.9rem; }
    .bs-cam { display: block; width: calc(100% - 1.8rem); margin: 0.6rem 0.9rem 0; padding: 0.45rem; border: 1px solid var(--border-color); border-radius: 8px; background: var(--secondary-background); color: var(--primary-text); font-family: inherit; }
    .bs-hint { text-align: center; color: var(--secondary-text, #888); font-size: 0.82rem; padding: 0.6rem 1rem 1rem; margin: 0; }
  `]
})
export class MaximoBarcodeScannerComponent {
  @Output() scanned = new EventEmitter<string>();
  @Output() close = new EventEmitter<void>();

  readonly formats = [
    BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128, BarcodeFormat.CODE_39,
    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
    BarcodeFormat.ITF, BarcodeFormat.DATA_MATRIX,
  ];
  hasPermission = signal(true);
  hasDevices = signal(true);
  devices = signal<MediaDeviceInfo[]>([]);
  selectedDevice?: MediaDeviceInfo;
  private done = false;

  onScan(code: string): void {
    if (this.done || !code) return;
    this.done = true; // emit once — the parent tears us down
    this.scanned.emit(code.trim());
  }
  onCameras(devs: MediaDeviceInfo[]): void {
    this.devices.set(devs || []);
    this.hasDevices.set(!!(devs && devs.length));
    const back = devs?.find(d => /back|rear|environment/i.test(d.label));
    this.selectedDevice = back ?? devs?.[0];
  }
  pick(i: number): void { this.selectedDevice = this.devices()[i]; }
}
