import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

export interface QrCodeOptions {
  width?: number;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

const DEFAULT_QR_OPTIONS: Partial<QRCode.QRCodeToDataURLOptions> = {
  errorCorrectionLevel: 'H',
  margin: 2,
};

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {

  toCanvas(canvas: HTMLCanvasElement, data: string, options?: QrCodeOptions): Promise<void> {
    const finalOptions = { ...DEFAULT_QR_OPTIONS, ...options };
    return QRCode.toCanvas(canvas, data, finalOptions);
  }

  /**
   * PNG data URL. Needed where the QR has to become a file rather than pixels on screen — sharing
   * it through the OS share sheet, or saving it to print.
   */
  toDataUrl(data: string, options?: QrCodeOptions): Promise<string> {
    const finalOptions = { ...DEFAULT_QR_OPTIONS, ...options };
    return QRCode.toDataURL(data, finalOptions);
  }

  toSvgString(data: string, options?: QrCodeOptions): Promise<string> {
    const finalOptions: QRCode.QRCodeToStringOptions = {
      ...DEFAULT_QR_OPTIONS,
      ...options,
      type: 'svg'
    };
    return QRCode.toString(data, finalOptions);
  }
}
