import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, catchError, from, map, Observable, of, switchMap } from 'rxjs';

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
  private sdkInstance: any; // Use 'any' since BradySDK is not a known type
  private readonly isBrowser: boolean;

  private readonly stateSubject = new BehaviorSubject<BradyPrinterState>(INITIAL_STATE);
  public readonly state$ = this.stateSubject.asObservable();
  private qrCodeService = inject(QrCodeService);

  constructor() {
    this.isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  }

  /**
   * Initializes the Brady Web SDK. This should be called once when the application starts.
   */
  async initialize(): Promise<void> {
    if (!this.isBrowser) return;
    if (this.sdkInstance) {
      console.warn('Brady SDK has already been initialized.');
      return;
    }

    try {
      const { default: BradySDK } = await import('@bradycorporation/brady-web-sdk');
      // The SDK is initialized with the callback that will update our state subject.
      this.sdkInstance = new BradySDK(this.printerUpdatesCallback.bind(this));
      console.log('Brady SDK initialized successfully.');
      this.updateState({ isConnected: this.sdkInstance.isConnected() });
    } catch (error) {
      console.error('Failed to initialize Brady SDK', error);
      this.updateState({ error: 'Failed to initialize SDK.' });
    }
  }

  /**
   * Scans for nearby BLE printers and prompts the user to select one.
   * Manages the ownership GUID in localStorage.
   */
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

  /**
   * Automatically connects to a known printer or initiates a scan if not connected.
   * Initializes the SDK if not already initialized.
   */
  async autoConnectOrScan(): Promise<void> {
    if (!this.isBrowser) return;
    if (!this.sdkInstance) {
      await this.initialize();
    }

    if (this.sdkInstance?.isConnected()) {
      this.printerUpdatesCallback(); // Refresh state
    } else {
      await this.scanForPrinters();
    }
  }

  /**
   * Disconnects from the currently connected printer.
   */
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

  /**
   * High-level method to print a label with two lines of text and optional QR code.
   * Handles canvas creation and printing in one call.
   * @param line1 Top text for the label.
   * @param line2 Bottom text for the label.
   * @param options Optional configuration for QR code and offset.
   * @returns An observable that resolves with the printing status.
   */
  printLabel(
    line1: string,
    line2: string,
    options: { withQr?: boolean; qrData?: string; offsetX?: number } = {}
  ): Observable<boolean> {
    const { withQr = true, qrData, offsetX = -50 } = options;

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

  /**
   * Prints a canvas image to the connected printer with a horizontal offset.
   * @param canvas The HTMLCanvasElement to print.
   * @param offsetX The horizontal offset in dots. A negative value moves the print left.
   * @param offsetY The vertical offset in dots (default 0).
   * @returns An observable that resolves with the printing status.
   */
  printCanvasWithOffset(canvas: HTMLCanvasElement, offsetX: number, offsetY = 0): Observable<boolean> {
    return this.printCanvas(canvas, { offsetX, offsetY });
  }

  /**
   * Prints a canvas image to the connected printer.
   * @param canvas The HTMLCanvasElement to print.
   * @param printOptions Optional printing parameters for offset.
   * @returns An observable that resolves with the printing status.
   */
  printCanvas(canvas: HTMLCanvasElement, printOptions: { offsetX?: number; offsetY?: number } = {}): Observable<boolean> {
    if (!this.sdkInstance?.isConnected()) {
      this.updateState({ error: 'Printer not connected.' });
      throw new Error('Printer not connected.');
    }

    const { offsetX = 0, offsetY = 0 } = printOptions;

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
      switchMap(imageToPrint => {
        return from(this.sdkInstance.printBitmap(imageToPrint, offsetX, offsetY));
      }),
      map(result => !!result),
      catchError(err => {
        console.error('Printing failed', err);
        this.updateState({ error: 'Printing failed.' });
        return of(false);
      })
    );
  }

  /**
   * Creates a canvas image from two strings and an optional QR code, designed for a label.
   * This is a utility function that can be called to generate the print content.
   * @param string1 Top text for the label.
   * @param string2 Bottom text for the label.
   * @param qrCodeData Optional data to be encoded in a QR code.
   * @returns A promise that resolves with the generated HTMLCanvasElement.
   */
  async createImageFromStrings(string1: string, string2: string, qrCodeData = `${string1} ${string2}`): Promise<HTMLCanvasElement> {
    try {
      const canvas = document.createElement('canvas');
      const dpi = 100;
      const singleWidth = 2.5 * dpi;
      const spacing = 0.6 * dpi;
      canvas.width = singleWidth * 2 + spacing;
      canvas.height = 1 * dpi;

      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'black';
      ctx.font = `${0.2 * dpi}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Draw text
      ctx.fillText(string1, canvas.width / 2, canvas.height * 0.25);
      ctx.fillText(string2, canvas.width / 2, canvas.height * 0.75);

      // Draw QR code if data is provided
      if (qrCodeData) {
        const qrSize = 0.8 * dpi;
        const qrX = 0.1 * dpi;
        const qrY = (canvas.height - qrSize) / 2;

        // Create a temporary canvas for the QR code
        const qrCanvas = document.createElement('canvas');
        await this.qrCodeService.toCanvas(qrCanvas, qrCodeData, {
          width: qrSize,
          margin: 0, // We handle positioning, so no margin needed here
        });

        // Draw the generated QR code onto our main canvas
        ctx.drawImage(qrCanvas, qrX, qrY);
      }

      return canvas;
    } catch (error) {
      console.error('Failed to create image with QR code:', error);
      throw error; // Re-throw the error to be handled by the caller
    }
  }
  


  createImageFromStringsNoQr(string1: string, string2: string): HTMLCanvasElement {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const dpi = 100; // Assuming 100 DPI
    const singleWidth = 2.15 * dpi; // 2.5 inches at 100 DPI
    const spacing = 0.1 * dpi; // 0.6 inches spacing
    canvas.width = singleWidth * 2 + spacing; // Two labels plus spacing
    canvas.height = 0.7 * dpi; // 1 inch at 100 DPI
    const verticalPadding = 0.1 * dpi;

    // Get the 2D rendering context
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get 2D context from canvas');
    }

    // Set background to white
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Function to get lines of text
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

    // Function to fit text
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

      // If we can't fit the text, return the smallest possible font size and split lines
      context.font = `1px Arial`;
      return { fontSize: 1, lines: getLines(context, text, maxWidth) };
    };

    // Function to draw a single label
    const drawLabel = (context: CanvasRenderingContext2D, x: number, width: number, str1: string, str2: string) => {
      const { fontSize: fontSize1, lines: lines1 } = fitText(context, str1, width, canvas.height / 2);
      const { fontSize: fontSize2, lines: lines2 } = fitText(context, str2, width, canvas.height / 2);

      const topTextY = canvas.height * 0.25 + verticalPadding;
      const bottomTextY = canvas.height * 0.75;

      // Draw the first string
      context.fillStyle = 'black';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.font = `${fontSize1}px Arial`;
      lines1.forEach((line, i) => {
        const y = topTextY + (i - (lines1.length - 1) / 2) * fontSize1;
        context.fillText(line, x + width / 2, y);
      });

      // Draw the second string
      context.font = `${fontSize2}px Arial`;
      lines2.forEach((line, i) => {
        const y = bottomTextY + (i - (lines2.length - 1) / 2) * fontSize2;
        context.fillText(line, x + width / 2, y);
      });
    };

    // Draw two independent labels
    drawLabel(ctx, 0, singleWidth, string1, string2);
    drawLabel(ctx, singleWidth + spacing, singleWidth, string1, string2);

    // Draw a separator line between the labels
    ctx.beginPath();
    ctx.moveTo(singleWidth + spacing / 2, 0);
    ctx.lineTo(singleWidth + spacing / 2, canvas.height);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.stroke();

    return canvas;
  }

async createImageFromStringsWithQr(string1: string, string2: string, qrCodeData = `${string1} ${string2}`): Promise<HTMLCanvasElement> {
  const qrData = qrCodeData || `${string1} ${string2}`;

  // Create a canvas element
  const canvas = document.createElement('canvas');
  const dpi = 100; // Assuming 100 DPI
  const singleWidth = 3.05 * dpi; // 2.7 inches at 100 DPI
  const spacing = 0.1 * dpi; // 0.6 inches spacing
  const verticalPadding = 0.15 * dpi;

  canvas.width = singleWidth * 2 + spacing; // Two labels plus spacing
  canvas.height = 1 * dpi; // 0.75 inch at 100 DPI

  // Get the 2D rendering context
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2D context from canvas');
  }

  // Set background to white
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Function to get lines of text
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

  // Function to fit text
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

    // If we can't fit the text, return the smallest possible font size and split lines
    context.font = `1px Arial`;
    return { fontSize: 1, lines: getLines(context, text, maxWidth) };
  };

  // Function to draw a single label with QR code
  const drawLabelWithQr = async (context: CanvasRenderingContext2D, x: number, width: number, str1: string, str2: string) => {
    // QR code takes full height, so its width is also the height
    const qrSize = canvas.height;
    const qrPadding = 0.1 * dpi;
    const textWidth = width - qrSize - qrPadding;
    const textX = x + qrSize + qrPadding;

    // Draw QR Code
    const qrCanvas = document.createElement('canvas');
    await this.qrCodeService.toCanvas(qrCanvas, qrData, {
      width: qrSize,
      margin: 3, // Small margin for readability
    });
    context.drawImage(qrCanvas, x, verticalPadding / 2);

    // Fit and draw text
    const { fontSize: fontSize1, lines: lines1 } = fitText(context, str1, textWidth, canvas.height / 2);
    const { fontSize: fontSize2, lines: lines2 } = fitText(context, str2, textWidth, canvas.height / 2);

      const topTextY = canvas.height * 0.25 + verticalPadding/2;
      const bottomTextY = canvas.height * 0.75;

    // Draw the first string
    context.fillStyle = 'black';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.font = `${fontSize1}px Arial`;
    lines1.forEach((line, i) => {
      const y = topTextY + (i - (lines1.length - 1) / 2) * fontSize1;
      context.fillText(line, textX + textWidth / 2, y);
    });

    // Draw the second string
    context.font = `${fontSize2}px Arial`;
    lines2.forEach((line, i) => {
      const y = bottomTextY + (i - (lines2.length - 1) / 2) * fontSize2;
      context.fillText(line, textX + textWidth / 2, y);
    });
  };

  // Draw two independent labels
  await drawLabelWithQr(ctx, 0, singleWidth, string1, string2);
  await drawLabelWithQr(ctx, singleWidth + spacing, singleWidth, string1, string2);

  // Draw a separator line between the labels
  ctx.beginPath();
  ctx.moveTo(singleWidth + spacing / 2, 0);
  ctx.lineTo(singleWidth + spacing / 2, canvas.height);
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.stroke();

  return canvas;
}

  /**
   * Callback function passed to the Brady SDK to receive updates on printer status.
   */
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

  /**
   * Updates the service's state and notifies subscribers.
   * @param partialState A partial state object to merge with the current state.
   */
  private updateState(partialState: Partial<BradyPrinterState>): void {
    const currentState = this.stateSubject.getValue();
    this.stateSubject.next({ ...currentState, ...partialState });
  }
}
