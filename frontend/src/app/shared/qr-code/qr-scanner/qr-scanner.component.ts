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
  hasPermission = false;

  onScanSuccess(resultString: string): void {
    this.qrScannerService.onScanSuccess(resultString);
  }

  onPermissions(permissions: boolean): void {
    this.hasPermission = permissions;
    if (!permissions) {
      console.error('Camera permission is required to scan QR codes.');
    }
  }

  close(): void {
    this.qrScannerService.closeScanner();
  }
}