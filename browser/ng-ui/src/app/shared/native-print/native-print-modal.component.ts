import { Component, computed, effect, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NativePrintService } from './native-print.service';
import { PopupComponent } from '../menus/popup/popup.component';
import { QrCodeService } from '../qr-code/qr-code.service';

@Component({
  selector: 'app-native-print-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupComponent],
  templateUrl: './native-print-modal.component.html',
  styleUrls: ['./native-print-modal.component.css'],
})
export class NativePrintModalComponent {
  svc = inject(NativePrintService);
  private qrCodeService = inject(QrCodeService);

  @ViewChild('previewQr') previewQr?: ElementRef<HTMLDivElement>;

  printing = signal(false);
  printStatus = signal('');
  qrSvgHtml = signal<string>('');
  // Monotonic counter for async QR-SVG generations. Guards against a slow
  // older toSvgString() promise resolving after a newer render and stamping
  // the wrong QR into the preview (harmless for the actual print, since the
  // service re-generates the SVG at print time, but confusing in the UI).
  private qrRenderSeq = 0;

  // Derived preview inputs from the service's live size signal
  widthIn = computed(() => this.svc.size().widthIn);
  heightIn = computed(() => this.svc.size().heightIn);
  fontPt = computed(() => this.svc.size().fontPt);
  // Preview line-2 font matches what buildLabelHtml uses (Math.max(6, fs-2)).
  // Without this floor, the preview shows sub-6pt text at fontPt=6/7 while
  // the printed output clamps to 6pt — the "WYSIWYG" contract breaks.
  line2FontPt = computed(() => Math.max(6, this.fontPt() - 2));
  withQr = computed(() => this.svc.size().withQr);

  // QR footprint on the label. Constrained to the SHORTER edge minus padding
  // so a portrait label (heightIn > widthIn) doesn't overflow horizontally
  // and squeeze the text region to zero width.
  qrEdgeIn = computed(() => {
    const w = this.widthIn(), h = this.heightIn();
    // Match service side: 0.04in padding on each side, 0.06in gap right of QR.
    const availableH = Math.max(0, h - 0.08);
    const availableW = Math.max(0, w - 0.08 - 0.06);
    // Leave at least 0.2in for text. If it can't fit, cap QR at 60% of width.
    return Math.min(availableH, Math.max(0.1, availableW - 0.2), w * 0.6);
  });

  // Nothing renderable — disable Print button.
  hasRenderableContent = computed(() => {
    const d = this.svc.data();
    if (!d) return false;
    const willHaveQr = this.withQr() && !!d.qrData;
    return !!(d.line1 || d.line2 || willHaveQr);
  });

  // Scale the WYSIWYG preview to fit within a viewable box while keeping true
  // aspect ratio. The preview is drawn at real inch dimensions (via CSS `in`
  // units) and then CSS-transformed for screen display.
  previewScale = computed(() => {
    const w = this.widthIn();
    const maxWidthIn = 4.5; // preview area budget
    return w > maxWidthIn ? maxWidthIn / w : 1;
  });

  constructor() {
    // Re-render QR whenever data or QR toggle changes. Uses an attempt-id
    // guard so a slow older promise can't overwrite a newer one.
    effect(() => {
      const d = this.svc.data();
      const with_ = this.withQr();
      const attemptId = ++this.qrRenderSeq;
      if (this.svc.isVisible() && d && with_ && d.qrData) {
        this.qrCodeService.toSvgString(d.qrData, { margin: 4 })
          .then(svg => { if (attemptId === this.qrRenderSeq) this.qrSvgHtml.set(svg); })
          .catch(() => { if (attemptId === this.qrRenderSeq) this.qrSvgHtml.set(''); });
      } else {
        this.qrSvgHtml.set('');
      }
    });

    // Clear status when modal opens
    effect(() => {
      if (this.svc.isVisible()) this.printStatus.set('');
    });
  }

  onSizeChange(field: 'widthIn' | 'heightIn' | 'fontPt', value: number | string): void {
    const n = Number(value);
    if (!Number.isFinite(n)) return;
    this.svc.updateSize({ [field]: n } as any);
  }

  toggleQr(): void {
    this.svc.updateSize({ withQr: !this.withQr() });
  }

  async onPrint(): Promise<void> {
    if (this.printing()) return;
    this.printing.set(true);
    this.printStatus.set('Opening print dialog…');
    try {
      await this.svc.doPrint();
      // Deliberately does NOT say "Sent to printer" — window.print() returns
      // identically for accept and cancel, so we cannot tell. A confident
      // success message would mislead users who cancelled at the dialog and
      // then blame the printer when nothing came out.
      this.printStatus.set('Print dialog closed. If you clicked Print, check your printer.');
    } catch (e: any) {
      this.printStatus.set('Print failed: ' + (e?.message ?? e));
      console.error('[NativePrint] Print failed:', e);
    } finally {
      this.printing.set(false);
    }
  }

  close(): void {
    this.svc.close();
  }
}
