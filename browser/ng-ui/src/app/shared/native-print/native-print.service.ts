import { Injectable, inject, signal } from '@angular/core';
import { QrCodeService } from '../qr-code/qr-code.service';

export interface NativePrintData {
  line1: string;
  line2: string;
  qrData?: string;
}

export interface LabelSize {
  /** Width in inches */
  widthIn: number;
  /** Height in inches */
  heightIn: number;
  /** Font size for line 1 in points; line 2 is 2pt smaller */
  fontPt: number;
  /** Render QR code (requires qrData on the label) */
  withQr: boolean;
}

const STORAGE_KEY = 'pwa_native_print_size';

export const DEFAULT_SIZE: LabelSize = {
  widthIn: 2.5,
  heightIn: 1.0,
  fontPt: 12,
  withQr: true,
};

/**
 * Prints inventory labels via the OS print pipeline (window.print()).
 *
 * Unlike the Brady BLE path which talks directly to a specific printer, this
 * one hands off to whichever printer Windows has installed — the user picks
 * the target in the browser's print dialog. Any driver-installed label
 * printer (Dymo, Brother QL, Zebra), or a regular sheet printer, works.
 *
 * The label HTML is rendered in a hidden iframe with `@page size` set to the
 * user's chosen dimensions. The browser then rasterises it via the printer
 * driver — quality is bounded by the driver's respect for @page size, which
 * varies. See lastPrintOutcome() for the (limited) feedback we can give.
 */
@Injectable({ providedIn: 'root' })
export class NativePrintService {
  private qrCodeService = inject(QrCodeService);

  // Modal state
  isVisible = signal(false);
  data = signal<NativePrintData | null>(null);
  size = signal<LabelSize>(this.loadStoredSize());

  // Monotonic attempt counter — used to abort an in-flight doPrint when the
  // user closes the modal or clicks Print again mid-flight. See doPrint().
  private printAttemptSeq = 0;
  private currentAttemptId = 0;
  private persistTimer: any = null;

  openWithData(d: NativePrintData): void {
    this.data.set(d);
    this.isVisible.set(true);
  }

  close(): void {
    // Bump the attempt counter so any in-flight doPrint bails before print()
    // fires — prevents "print dialog opens after user clicked Close" bug.
    this.currentAttemptId++;
    this.flushPendingPersist();
    this.isVisible.set(false);
    this.data.set(null);
  }

  updateSize(patch: Partial<LabelSize>): void {
    const next = { ...this.size(), ...patch };
    this.size.set(next);
    // Debounce localStorage writes: slider drag emits many events/sec, and
    // synchronous JSON.stringify+setItem in the hot loop causes jank on
    // low-end Android. Flush after 200ms of quiet OR immediately on close.
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => this.flushPendingPersist(), 200);
  }

  private flushPendingPersist(): void {
    if (this.persistTimer) {
      clearTimeout(this.persistTimer);
      this.persistTimer = null;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.size())); } catch { /* private mode / quota */ }
  }

  /**
   * Renders the label into a hidden iframe and triggers the browser print
   * dialog. Resolves once print() has returned. Note: window.print() is
   * synchronous on desktop (blocks until dialog dismissed) but non-blocking
   * on iOS Safari AirPrint — the resolve does NOT mean the label printed.
   * Caller cannot distinguish accept vs cancel; the browser doesn't tell us.
   *
   * Aborts (returns silently) if close() was called during any await — that
   * prevents a print dialog from appearing after the user thought they
   * cancelled.
   */
  async doPrint(): Promise<void> {
    const d = this.data();
    if (!d) return;
    const size = this.size();
    const attemptId = ++this.printAttemptSeq;
    this.currentAttemptId = attemptId;

    // Refuse to send a blank label. buildLabelHtml would produce a
    // stylistically-valid but empty label if line1/line2/qrSvg are all
    // empty — a wasted sticker. The Print button is also disabled in the UI
    // for this case; this is defense-in-depth against programmatic callers.
    const willHaveQr = size.withQr && !!d.qrData;
    if (!d.line1 && !d.line2 && !willHaveQr) {
      throw new Error('Nothing to print — provide line1, line2, or a QR code.');
    }

    // Generate the QR as an SVG string so it scales cleanly at any @page size.
    // Falls back to text-only if qrData is missing OR SVG generation fails.
    // margin: 4 per ISO/IEC 18004 quiet-zone spec — industrial scanners
    // (Zebra/Honeywell) can refuse to decode QR codes with smaller quiet
    // zones, especially at the small end of the label-size slider.
    let qrSvg = '';
    if (willHaveQr) {
      try {
        qrSvg = await this.qrCodeService.toSvgString(d.qrData!, { margin: 4 });
      } catch (e) {
        console.warn('[NativePrint] QR SVG generation failed, printing without QR:', e);
      }
    }
    if (this.currentAttemptId !== attemptId) return; // superseded / closed

    const html = this.buildLabelHtml(d.line1, d.line2, qrSvg, size);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';

    // Wrap iframe DOM setup in try/finally: if document.open/write/close
    // throws (e.g. hostile browser extension, tab-unload race), we still
    // remove the iframe. Without this the iframe leaks on every failed click.
    let printed = false;
    try {
      document.body.appendChild(iframe);
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) throw new Error('Could not access iframe document for printing.');
      doc.open();
      doc.write(html);
      doc.close();

      // Wait for images/fonts to settle before invoking print. Without this,
      // Chrome sometimes prints an empty page (the print dialog opens before
      // the SVG has rasterised into the iframe).
      await new Promise<void>(resolve => {
        const win = iframe.contentWindow;
        if (!win) { resolve(); return; }
        if (doc.readyState === 'complete') { resolve(); return; }
        win.addEventListener('load', () => resolve(), { once: true });
        // Hard safety timeout — never leave the caller hanging on a slow driver.
        setTimeout(() => resolve(), 500);
      });

      // Last chance to bail before showing the print dialog. If the user
      // closed the modal during the SVG generation or load wait, don't
      // ambush them with a print dialog they didn't ask for.
      if (this.currentAttemptId !== attemptId) return;

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      printed = true;
    } finally {
      // Cleanup: on desktop print() is synchronous so the driver already has
      // the spool by the time we get here — 2s is a courtesy grace. On iOS
      // Safari print() returns immediately (AirPrint sheet is async); user
      // may take 10+ seconds to pick a destination. Give mobile 15s.
      // If we never called print() (error path), remove immediately.
      const isMobile = /iPad|iPhone|iPod|Android/i.test(navigator.userAgent || '');
      const grace = printed ? (isMobile ? 15000 : 2000) : 0;
      setTimeout(() => iframe.remove(), grace);
    }
  }

  private buildLabelHtml(line1: string, line2: string, qrSvg: string, size: LabelSize): string {
    const w = size.widthIn;
    const h = size.heightIn;
    const fs1 = size.fontPt;
    const fs2 = Math.max(6, size.fontPt - 2);
    const line1Esc = escapeHtml(line1 || '');
    const line2Esc = escapeHtml(line2 || '');
    const hasQr = !!qrSvg;
    // Cap the QR edge to the SHORTER label side minus padding/gap and leave
    // at least 0.2in for text. Without this cap, a portrait label
    // (height > width) would compute a QR wider than the whole label and
    // squeeze .text to zero width — printed output shows a clipped QR and
    // no text. Also cap at 60% of width so wide-short labels don't devote
    // the whole label to the QR.
    const availH = Math.max(0, h - 0.08);
    const availW = Math.max(0, w - 0.08 - 0.06);
    const qrEdge = Math.min(availH, Math.max(0.1, availW - 0.2), w * 0.6);
    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Label</title>
<style>
  @page { size: ${w}in ${h}in; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .label {
    width: ${w}in;
    height: ${h}in;
    display: flex;
    align-items: center;
    padding: 0.04in;
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    background: #fff;
    overflow: hidden;
  }
  .qr { width: ${qrEdge}in; height: ${qrEdge}in; margin-right: 0.06in; flex: 0 0 auto; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .text { flex: 1 1 auto; display: flex; flex-direction: column; justify-content: center; min-width: 0; }
  .line1 { font-size: ${fs1}pt; font-weight: 700; line-height: 1.1; word-break: break-word; }
  .line2 { font-size: ${fs2}pt; font-weight: 400; line-height: 1.15; word-break: break-word; margin-top: 0.03in; }
</style>
</head>
<body>
  <div class="label">
    ${hasQr ? `<div class="qr">${qrSvg}</div>` : ''}
    <div class="text">
      <div class="line1">${line1Esc}</div>
      ${line2Esc ? `<div class="line2">${line2Esc}</div>` : ''}
    </div>
  </div>
</body></html>`;
  }

  private loadStoredSize(): LabelSize {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_SIZE };
      const parsed = JSON.parse(raw);
      return {
        widthIn: clamp(parsed.widthIn, 0.5, 10, DEFAULT_SIZE.widthIn),
        heightIn: clamp(parsed.heightIn, 0.25, 6, DEFAULT_SIZE.heightIn),
        fontPt: clamp(parsed.fontPt, 6, 48, DEFAULT_SIZE.fontPt),
        withQr: parsed.withQr !== false,
      };
    } catch {
      return { ...DEFAULT_SIZE };
    }
  }
}

function clamp(v: any, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
