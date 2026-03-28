import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PopupWindowService {
  private popupRef: Window | null = null;
  private readonly popupName = 'dailyPackagePopup';

  openOrFocus(url: string, width = 1200, height = 850): void {
    if (this.popupRef && !this.popupRef.closed) {
      this.popupRef.location.href = url;
      this.popupRef.focus();
      return;
    }

    const left = Math.round((screen.width - width) / 2);
    const top = Math.round((screen.height - height) / 2);
    this.popupRef = window.open(
      url,
      this.popupName,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  }

  closePopup(): void {
    if (this.popupRef && !this.popupRef.closed) {
      this.popupRef.close();
    }
    this.popupRef = null;
  }
}
