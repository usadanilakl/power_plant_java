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

  /**
   * Generates a QR code and draws it onto a canvas element.
   * @param canvas The canvas element to draw on.
   */
  toCanvas(canvas: HTMLCanvasElement, data: string, options?: QrCodeOptions): Promise<void> {
    const finalOptions = { ...DEFAULT_QR_OPTIONS, ...options };
    return QRCode.toCanvas(canvas, data, finalOptions);
  }

  /**
   * Generates a QR code as an SVG string.
   * @param data The data to encode in the QR code.
   * @param options Configuration for the QR code.
   * @returns A promise that resolves with the SVG string.
   */
  toSvgString(data: string, options?: QrCodeOptions): Promise<string> {
    const finalOptions: QRCode.QRCodeToStringOptions = { 
      ...DEFAULT_QR_OPTIONS, 
      ...options, 
      type: 'svg' 
    };
    return QRCode.toString(data, finalOptions);
  }
}
