
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {
  private clipboardData: string = '';

  setClipboardData(data: string) {
    this.clipboardData = data;
    console.log('Data copied to clipboard',data);
  }

  getClipboardData(): string {
    return this.clipboardData;
  }
}