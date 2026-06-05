import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerComponent, ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { QrScannerService } from './qr-scanner.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [
    CommonModule,
    ZXingScannerModule,
  ],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css'],
})
export class QrScannerComponent {
  qrScannerService = inject(QrScannerService);

  @ViewChild('scanner') scanner!: ZXingScannerComponent;

  allowedFormats = [BarcodeFormat.QR_CODE];
  hasPermission: boolean = false;
  hasDevices: boolean = false;
  selectedDevice: MediaDeviceInfo | undefined;
  availableDevices: MediaDeviceInfo[] = [];

  onScanSuccess(resultString: string): void {
    this.qrScannerService.onScanSuccess(resultString);
  }

  onPermissions(permissions: boolean): void {
    this.hasPermission = permissions;
    if (!permissions) {
      console.error('[QR Scanner] Camera permission was denied.');
    }
  }

  onCamerasFound(devices: MediaDeviceInfo[]): void {
    this.availableDevices = devices;
    this.hasDevices = devices && devices.length > 0;
    if (!this.hasDevices) {
      console.warn('[QR Scanner] No cameras detected.');
      return;
    }
    // Prefer back/environment camera on mobile, otherwise first available.
    const back = devices.find(d => /back|rear|environment/i.test(d.label));
    this.selectedDevice = back ?? devices[0];
  }

  onCamerasNotFound(): void {
    this.hasDevices = false;
    console.warn('[QR Scanner] No cameras found.');
  }

  pickDevice(device: MediaDeviceInfo): void {
    this.selectedDevice = device;
  }

  close(): void {
    this.qrScannerService.closeScanner();
  }
}