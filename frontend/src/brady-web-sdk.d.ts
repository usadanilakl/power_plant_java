declare module 'brady-web-sdk' {
  export default class BradySdk {
    constructor(callback: (changedProperties: any) => void);
    showDiscoveredBleDevices(sessionId: string | null): Promise<string>;
    disconnect(): Promise<boolean>;
    printBitmap(image: HTMLImageElement, numCopies: number, cutOption: string): Promise<boolean>;
    isConnected(): boolean;
    status: string;
    printerName: string;
    printerModel: string;
  }
}