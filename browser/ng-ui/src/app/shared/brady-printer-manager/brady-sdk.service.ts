import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, catchError, finalize, from, map, Observable, of, switchMap, throwError } from 'rxjs';

import { QrCodeService } from '../qr-code/qr-code.service';


export interface BradyPrinterState {
  isConnected: boolean;
  status: string | null;
  printerName: string | null;
  printerModel: string | null;
  error: string | null;
}

const INITIAL_STATE: BradyPrinterState = {
  isConnected: false,
  status: null,
  printerName: null,
  printerModel: null,
  error: null,
};

@Injectable({
  providedIn: 'root',
})
export class BradySdkService {
  private sdkInstance: any;
  private readonly isBrowser: boolean;

  private readonly stateSubject = new BehaviorSubject<BradyPrinterState>(INITIAL_STATE);
  public readonly state$ = this.stateSubject.asObservable();
  private qrCodeService = inject(QrCodeService);

  constructor() {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  }

  async initialize(): Promise<void> {
    if (!this.isBrowser) return;
    if (this.sdkInstance) return;

    try {
      const { default: BradySDK } = await import('@bradycorporation/brady-web-sdk');
      this.sdkInstance = new BradySDK(this.printerUpdatesCallback.bind(this));
      this.updateState({ isConnected: this.sdkInstance.isConnected() });
    } catch (error) {
      console.error('Failed to initialize Brady SDK', error);
      this.updateState({ error: 'Failed to initialize SDK.' });
    }
  }

  async scanForPrinters(): Promise<void> {
    if (!this.sdkInstance) {
      throw new Error('Brady SDK is not initialized. Call initialize() first.');
    }

    try {
      this.updateState({ status: 'Scanning for printers...' });
      const sessionId = localStorage.getItem('ownership_guid');
      const ownershipGuid = await this.sdkInstance.showDiscoveredBleDevices(sessionId);

      if (this.sdkInstance.isConnected() && ownershipGuid) {
        localStorage.setItem('ownership_guid', ownershipGuid);
      }

      this.updateState({
        isConnected: this.sdkInstance.isConnected(),
        status: this.sdkInstance.isConnected() ? 'Successfully Connected!' : 'Failed to connect.',
        error: this.sdkInstance.isConnected() ? null : 'Connection failed after selection.',
      });
    } catch (error: any) {
      console.error('Error during printer scan:', error);
      this.updateState({ error: error.message, status: 'Error during scan.' });
    }
  }

  async autoConnectOrScan(): Promise<void> {
    if (!this.isBrowser) return;
    if (!this.sdkInstance) {
      await this.initialize();
    }
    // If initialize() failed (dynamic import couldn't load, SDK constructor
    // threw), sdkInstance is still undefined. Don't fall through to
    // scanForPrinters — it would throw "Brady SDK is not initialized" and,
    // since callers fire this from setTimeout, become an unhandled rejection.
    // The state was already updated with the failure message inside initialize().
    if (!this.sdkInstance) return;

    if (this.sdkInstance.isConnected()) {
      this.printerUpdatesCallback();
    } else {
      await this.scanForPrinters();
    }
  }

  async disconnect(): Promise<void> {
    if (!this.sdkInstance || !this.sdkInstance.isConnected()) {
      return;
    }
    const success = await this.sdkInstance.disconnect();
    if (success) {
      this.updateState({ ...INITIAL_STATE, status: 'Disconnected Successfully!' });
    } else {
      this.updateState({ status: 'Disconnection Failed...', error: 'Failed to disconnect.' });
    }
  }

  printLabel(
    line1: string,
    line2: string,
    options: { withQr?: boolean; qrData?: string; offsetX?: number } = {}
  ): Observable<boolean> {
    // offsetX default 0. The desktop version defaults to -50 for a specific
    // LOTO tape calibration; that offset stalled the print (printer never
    // completes when the bitmap extends past its printable area). Test Print
    // uses offset 0 via printCanvas() and works — proving 0 is the safe
    // default for the tapes actually loaded here. Callers can override for
    // specific tape/model needs.
    const { withQr = true, qrData, offsetX = 0 } = options;

    return new Observable<boolean>(observer => {
      const createCanvas = withQr
        ? this.createImageFromStringsWithQr(line1, line2, qrData)
        : Promise.resolve(this.createImageFromStringsNoQr(line1, line2));

      createCanvas
        .then(canvas => {
          this.printCanvasWithOffset(canvas, offsetX).subscribe({
            next: success => {
              observer.next(success);
              observer.complete();
            },
            error: err => observer.error(err)
          });
        })
        .catch(err => observer.error(err));
    });
  }

  printCanvasWithOffset(canvas: HTMLCanvasElement, offsetX: number, offsetY = 0): Observable<boolean> {
    return this.printCanvas(canvas, { offsetX, offsetY });
  }

  printCanvas(canvas: HTMLCanvasElement, printOptions: { offsetX?: number; offsetY?: number } = {}): Observable<boolean> {
    if (!this.sdkInstance?.isConnected()) {
      this.updateState({ error: 'Printer not connected.' });
      throw new Error('Printer not connected.');
    }

    const { offsetX = 0, offsetY = 0 } = printOptions;

    // NOTE: intentionally does NOT revoke the blob URL. An earlier version
    // did (via finalize on observable completion) — but Brady SDK's
    // printBitmap promise resolves BEFORE the BLE transfer actually
    // finishes, so revoking on complete killed the still-in-flight print
    // and it stalled ~60s then failed. Match desktop behavior (leak the
    // blob URL). The leak is bounded by page lifetime — a small cost for
    // a functional print flow. Do not add revocation without confirming
    // it survives a real end-to-end print cycle.
    const imageToPrint$ = new Observable<HTMLImageElement>(observer => {
      canvas.toBlob(blob => {
        if (!blob) {
          observer.error(new Error('Canvas could not be converted to blob.'));
          return;
        }
        const img = new Image();
        img.onload = () => {
          observer.next(img);
          observer.complete();
        };
        img.onerror = () => observer.error(new Error('Failed to load image from blob.'));
        img.src = URL.createObjectURL(blob);
      });
    });

    return imageToPrint$.pipe(
      switchMap(imageToPrint => from(this.sdkInstance.printBitmap(imageToPrint, offsetX, offsetY))),
      map(result => !!result),
      catchError(err => {
        console.error('Printing failed', err);
        this.updateState({ error: 'Printing failed.' });
        return of(false);
      })
    );
  }

  /**
   * Two-up label with QR + text. PWA version requires explicit qrData — no
   * environment-based URL prefix, so a caller that forgets to supply one gets
   * a preview/print without a QR (safer than printing a broken URL).
   */
  async createImageFromStringsWithQr(string1: string, string2: string, qrCodeData?: string): Promise<HTMLCanvasElement> {
    const qrData = qrCodeData || '';

    const canvas = document.createElement('canvas');
    const dpi = 100;
    const singleWidth = 3.05 * dpi;
    const spacing = 0.1 * dpi;
    const verticalPadding = 0.15 * dpi;

    canvas.width = singleWidth * 2 + spacing;
    canvas.height = 1 * dpi;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from canvas');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const getLines = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      if (!text) return [];
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';

      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const fitText = (context: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number): { fontSize: number; lines: string[] } => {
      let fontSize = 100;
      while (fontSize > 1) {
        context.font = `${fontSize}px Arial`;
        const lines = getLines(context, text, maxWidth);
        const totalHeight = fontSize * lines.length;
        const allLinesFit = lines.every(line => context.measureText(line).width <= maxWidth);
        if (totalHeight <= maxHeight && allLinesFit) {
          return { fontSize, lines };
        }
        fontSize--;
      }
      context.font = `1px Arial`;
      return { fontSize: 1, lines: getLines(context, text, maxWidth) };
    };

    const drawLabelWithQr = async (context: CanvasRenderingContext2D, x: number, width: number, str1: string, str2: string) => {
      // Collapse the QR column when qrData is missing so text uses the full
      // label width instead of leaving a blank ~1-inch region on the left.
      const hasQr = !!qrData;
      const qrSize = hasQr ? canvas.height : 0;
      const qrPadding = hasQr ? 0.1 * dpi : 0;
      const textWidth = width - qrSize - qrPadding;
      const textX = x + qrSize + qrPadding;

      if (hasQr) {
        const qrCanvas = document.createElement('canvas');
        // margin=1 (was 3) — cuts internal white padding so the QR pattern
        // itself is larger inside the same canvas footprint. margin=0 tends
        // to trip some scanners that rely on a quiet zone, so keep 1 module.
        await this.qrCodeService.toCanvas(qrCanvas, qrData, {
          width: qrSize,
          margin: 1,
        });
        // Draw at y=0 (was verticalPadding/2) so the QR fills the full label
        // height instead of being centered with clipping on the bottom.
        context.drawImage(qrCanvas, x, 0);
      }

      const { fontSize: fontSize1, lines: lines1 } = fitText(context, str1, textWidth, canvas.height / 2);
      const { fontSize: fontSize2, lines: lines2 } = fitText(context, str2, textWidth, canvas.height / 2);

      const topTextY = canvas.height * 0.25 + verticalPadding / 2;
      const bottomTextY = canvas.height * 0.75;

      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `${fontSize1}px Arial`;
      lines1.forEach((line, i) => {
        const y = topTextY + (i - (lines1.length - 1) / 2) * fontSize1;
        context.fillText(line, textX + textWidth / 2, y);
      });

      context.font = `${fontSize2}px Arial`;
      lines2.forEach((line, i) => {
        const y = bottomTextY + (i - (lines2.length - 1) / 2) * fontSize2;
        context.fillText(line, textX + textWidth / 2, y);
      });
    };

    await drawLabelWithQr(ctx, 0, singleWidth, string1, string2);
    await drawLabelWithQr(ctx, singleWidth + spacing, singleWidth, string1, string2);

    ctx.beginPath();
    ctx.moveTo(singleWidth + spacing / 2, 0);
    ctx.lineTo(singleWidth + spacing / 2, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    return canvas;
  }

  createImageFromStringsNoQr(string1: string, string2: string): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    const dpi = 100;
    const singleWidth = 2.15 * dpi;
    const spacing = 0.1 * dpi;
    canvas.width = singleWidth * 2 + spacing;
    canvas.height = 0.7 * dpi;
    const verticalPadding = 0.1 * dpi;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context from canvas');

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const getLines = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
      if (!text) return [];
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = words[0] || '';
      for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = context.measureText(currentLine + ' ' + word).width;
        if (width < maxWidth) {
          currentLine += ' ' + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      lines.push(currentLine);
      return lines;
    };

    const fitText = (context: CanvasRenderingContext2D, text: string, maxWidth: number, maxHeight: number): { fontSize: number; lines: string[] } => {
      let fontSize = 100;
      while (fontSize > 1) {
        context.font = `${fontSize}px Arial`;
        const lines = getLines(context, text, maxWidth);
        const totalHeight = fontSize * lines.length;
        const allLinesFit = lines.every(line => context.measureText(line).width <= maxWidth);
        if (totalHeight <= maxHeight && allLinesFit) {
          return { fontSize, lines };
        }
        fontSize--;
      }
      context.font = `1px Arial`;
      return { fontSize: 1, lines: getLines(context, text, maxWidth) };
    };

    const drawLabel = (context: CanvasRenderingContext2D, x: number, width: number, str1: string, str2: string) => {
      const { fontSize: fontSize1, lines: lines1 } = fitText(context, str1, width, canvas.height / 2);
      const { fontSize: fontSize2, lines: lines2 } = fitText(context, str2, width, canvas.height / 2);

      const topTextY = canvas.height * 0.25 + verticalPadding;
      const bottomTextY = canvas.height * 0.75;

      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `${fontSize1}px Arial`;
      lines1.forEach((line, i) => {
        const y = topTextY + (i - (lines1.length - 1) / 2) * fontSize1;
        context.fillText(line, x + width / 2, y);
      });

      context.font = `${fontSize2}px Arial`;
      lines2.forEach((line, i) => {
        const y = bottomTextY + (i - (lines2.length - 1) / 2) * fontSize2;
        context.fillText(line, x + width / 2, y);
      });
    };

    drawLabel(ctx, 0, singleWidth, string1, string2);
    drawLabel(ctx, singleWidth + spacing, singleWidth, string1, string2);

    ctx.beginPath();
    ctx.moveTo(singleWidth + spacing / 2, 0);
    ctx.lineTo(singleWidth + spacing / 2, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    return canvas;
  }

  private printerUpdatesCallback(): void {
    if (!this.sdkInstance) return;

    const isConnected = this.sdkInstance.isConnected();
    this.updateState({
      isConnected,
      printerName: isConnected ? (this.sdkInstance.getPrinterSerialNumber?.() ?? 'Brady Printer') : null,
      printerModel: null,
      status: isConnected ? 'Connected' : 'Disconnected',
      error: null,
    });
  }

  private updateState(partialState: Partial<BradyPrinterState>): void {
    const currentState = this.stateSubject.getValue();
    this.stateSubject.next({ ...currentState, ...partialState });
  }
}
