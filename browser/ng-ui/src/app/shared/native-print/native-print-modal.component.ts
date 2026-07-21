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
  // Single-item QR SVG (empty in bulk mode).
  qrSvgHtml = signal<string>('');
  // Bulk-mode: parallel array to svc.dataList() holding the sized QR SVG for
  // each item, or '' if the item has no qrData or generation failed.
  qrSvgList = signal<string[]>([]);
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
  arrangement = computed(() => this.svc.size().arrangement);

  // Bulk-mode items (empty in single mode). All labels share the same size.
  // Filtered to match the service's `printable` filter in doPrint() so the
  // preview count, caption, and total page dimensions match what actually
  // prints. Without this mirror, an unpopulated selected item would show in
  // the preview but be silently dropped from the print, leaving the user to
  // wonder why the strip came out with one fewer label.
  items = computed(() => {
    const withQrOn = this.withQr();
    return this.svc.dataList().filter(d => !!(d.line1 || d.line2 || (withQrOn && d.qrData)));
  });
  itemCount = computed(() => Math.max(1, this.items().length));

  // QR footprint per half in the two-up fold-in-half layout. Each half is
  // widthIn/2 wide; QR sits at the top with two lines of text below. Must
  // match the sizing math in native-print.service.ts:buildLabelHtml exactly
  // or the preview and printed output diverge.
  qrEdgeIn = computed(() => {
    const w = this.widthIn(), h = this.heightIn();
    const fs1 = this.fontPt();
    const fs2 = Math.max(6, fs1 - 2);
    const halfPad = 0.04;
    const halfW = w / 2;
    const availHalfW = Math.max(0.1, halfW - 2 * halfPad);
    const availH = Math.max(0.1, h - 2 * halfPad);
    // Vertical space reserved for two lines of text scaled by fontPt (matches
    // buildLabelHtml so the preview accurately reflects the printed layout).
    const textReserve = ((fs1 + fs2) * 1.2) / 72;
    return Math.min(availHalfW, Math.max(0.1, availH - textReserve));
  });

  // Nothing renderable — disable Print button. In bulk mode, at least one
  // item must be printable.
  hasRenderableContent = computed(() => {
    const withQrOn = this.withQr();
    const check = (d: any) => !!(d?.line1 || d?.line2 || (withQrOn && d?.qrData));
    if (this.svc.isBulkMode()) return this.items().some(check);
    return check(this.svc.data());
  });

  totalWidthIn = computed(() =>
    this.arrangement() === 'stacked' ? this.widthIn() : this.widthIn() * this.itemCount()
  );
  totalHeightIn = computed(() =>
    this.arrangement() === 'stacked' ? this.heightIn() * this.itemCount() : this.heightIn()
  );

  // Scale the WYSIWYG preview to fit within a viewable box while keeping true
  // aspect ratio. Bulk mode grows the preview footprint by arrangement:
  // stacked → same width, tall; inline → wide, same height.
  // Must bound BOTH dimensions — a stacked 20-label preview at 20in tall
  // was reserving ~1920px of layout height and pushing the arrangement
  // toggle, sliders, and Print button entirely off-screen.
  private static readonly PREVIEW_MAX_W_IN = 4.5;
  private static readonly PREVIEW_MAX_H_IN = 4.5;
  previewScale = computed(() => {
    const totalW = this.totalWidthIn();
    const totalH = this.totalHeightIn();
    const scaleW = totalW > NativePrintModalComponent.PREVIEW_MAX_W_IN
      ? NativePrintModalComponent.PREVIEW_MAX_W_IN / totalW : 1;
    const scaleH = totalH > NativePrintModalComponent.PREVIEW_MAX_H_IN
      ? NativePrintModalComponent.PREVIEW_MAX_H_IN / totalH : 1;
    return Math.min(scaleW, scaleH);
  });
  // Layout-box dimensions for the outer wrapper. CSS transform:scale is paint
  // only — the transformed element still reserves its untransformed size in
  // layout. So we wrap the preview-frame in a container whose reserved size
  // matches the *scaled* dimensions, and let overflow:hidden clip the paint
  // area cleanly. Result: preview shrinks visually AND takes only the scaled
  // amount of layout room, so the sliders/buttons stay reachable.
  previewOuterWidthIn = computed(() => this.totalWidthIn() * this.previewScale());
  previewOuterHeightIn = computed(() => this.totalHeightIn() * this.previewScale());

  constructor() {
    // Re-render QR(s) whenever data / list / QR toggle changes. Uses an
    // attempt-id guard so a slow older batch can't overwrite a newer one.
    effect(() => {
      const with_ = this.withQr();
      const attemptId = ++this.qrRenderSeq;
      if (!this.svc.isVisible() || !with_) {
        this.qrSvgHtml.set('');
        this.qrSvgList.set([]);
        return;
      }
      if (this.svc.isBulkMode()) {
        const items = this.items();
        this.qrSvgHtml.set('');
        Promise.all(items.map(d =>
          d.qrData
            ? this.qrCodeService.toSvgString(d.qrData, { margin: 4 }).catch(() => '')
            : Promise.resolve('')
        )).then(svgs => {
          if (attemptId === this.qrRenderSeq) {
            this.qrSvgList.set(svgs.map(s => s ? this.sizeSvg(s) : ''));
          }
        });
      } else {
        const d = this.svc.data();
        this.qrSvgList.set([]);
        if (d?.qrData) {
          this.qrCodeService.toSvgString(d.qrData, { margin: 4 })
            .then(svg => { if (attemptId === this.qrRenderSeq) this.qrSvgHtml.set(this.sizeSvg(svg)); })
            .catch(() => { if (attemptId === this.qrRenderSeq) this.qrSvgHtml.set(''); });
        } else {
          this.qrSvgHtml.set('');
        }
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

  setArrangement(a: 'stacked' | 'inline'): void {
    this.svc.updateSize({ arrangement: a });
  }

  qrSvgFor(index: number): string {
    return this.qrSvgList()[index] || '';
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

  /**
   * The qrcode npm package emits an <svg> with only a viewBox attribute and
   * NO width/height. Inserted into the DOM via [innerHTML], the SVG then
   * defaults to the CSS-replaced-element intrinsic size (300x150 px on
   * WebKit/Blink) instead of filling its container. Angular's view-
   * encapsulation also breaks the natural "svg { width: 100% }" scoped
   * selector against innerHTML-injected content. Fix at the source: rewrite
   * the SVG's opening tag to carry preserveAspectRatio + 100% dimensions.
   * Purely additive — the existing viewBox stays authoritative for content.
   */
  private sizeSvg(svg: string): string {
    if (!svg) return svg;
    return svg.replace(
      /<svg([^>]*)>/,
      (_, attrs) => `<svg${attrs} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`
    );
  }
}
