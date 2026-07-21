import { Injectable, inject, signal } from '@angular/core';
import { QrCodeService } from '../qr-code/qr-code.service';

export interface NativePrintData {
  line1: string;
  line2: string;
  qrData?: string;
}

export type LabelArrangement = 'stacked' | 'inline';

export interface LabelSize {
  /** Width of one mirrored label in inches (each label is a fold-in-half strip) */
  widthIn: number;
  /** Height of one mirrored label in inches */
  heightIn: number;
  /** Font size for line 1 in points; line 2 is 2pt smaller */
  fontPt: number;
  /** Render QR code (requires qrData on the label) */
  withQr: boolean;
  /**
   * How multiple labels lay out when printing more than one at once:
   *  - 'stacked'  → labels stack top-to-bottom (tall page, roll unrolls vertically)
   *  - 'inline'   → labels sit side-by-side (wide page, roll unrolls horizontally)
   * Irrelevant for single-item prints (falls through to the same layout code).
   */
  arrangement: LabelArrangement;
}

const STORAGE_KEY = 'pwa_native_print_size';

export const DEFAULT_SIZE: LabelSize = {
  widthIn: 2.5,
  heightIn: 1.0,
  fontPt: 12,
  withQr: true,
  arrangement: 'stacked',
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
  // Single-item state (used by the existing per-row Print button). When set,
  // dataList is empty and the modal renders one label.
  data = signal<NativePrintData | null>(null);
  // Bulk-item state. When non-empty, the modal renders N labels arranged per
  // size().arrangement and prints them all in one print job. `data` is null
  // in this mode so the two mutually-exclude cleanly.
  dataList = signal<NativePrintData[]>([]);
  size = signal<LabelSize>(this.loadStoredSize());

  // Monotonic attempt counter — used to abort an in-flight doPrint when the
  // user closes the modal or clicks Print again mid-flight. See doPrint().
  private printAttemptSeq = 0;
  private currentAttemptId = 0;
  private persistTimer: any = null;

  openWithData(d: NativePrintData): void {
    this.data.set(d);
    this.dataList.set([]);
    this.isVisible.set(true);
  }

  /**
   * Open the modal for BULK print: caller passes N label-payloads and the
   * modal arranges them per size().arrangement (stacked or in-line). Empty
   * lists open in single-mode with a null placeholder (defensive; the caller
   * should not do this).
   */
  openWithList(list: NativePrintData[]): void {
    if (!list?.length) { this.data.set(null); this.dataList.set([]); this.isVisible.set(true); return; }
    this.data.set(null);
    this.dataList.set([...list]);
    this.isVisible.set(true);
  }

  isBulkMode(): boolean {
    return this.dataList().length > 0;
  }

  close(): void {
    // Bump the attempt counter so any in-flight doPrint bails before print()
    // fires — prevents "print dialog opens after user clicked Close" bug.
    this.currentAttemptId++;
    this.flushPendingPersist();
    this.isVisible.set(false);
    this.data.set(null);
    this.dataList.set([]);
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
    // Unify single- and bulk-mode into a single list<->one code path. Single
    // mode is treated as a bulk of length 1 so the page layout math applies
    // consistently.
    const items = this.isBulkMode() ? this.dataList() : (this.data() ? [this.data()!] : []);
    if (items.length === 0) return;
    const size = this.size();
    const attemptId = ++this.printAttemptSeq;
    this.currentAttemptId = attemptId;

    // Refuse to send a blank label. Any item with nothing to render (no
    // text and no QR) is skipped rather than printing a blank sticker.
    const printable = items.filter(d => {
      const willHaveQr = size.withQr && !!d.qrData;
      return !!(d.line1 || d.line2 || willHaveQr);
    });
    if (printable.length === 0) {
      throw new Error('Nothing to print — every selected item is blank.');
    }

    // Generate QR SVGs for every printable item in parallel. Each one is
    // small (~4KB) so N parallel toSvgString calls are fine even for 100+
    // items — the qrcode lib is synchronous-in-microtask internally.
    // margin: 4 per ISO/IEC 18004 quiet-zone spec.
    const qrSvgs = await Promise.all(printable.map(async d => {
      if (!(size.withQr && d.qrData)) return '';
      try {
        return await this.qrCodeService.toSvgString(d.qrData, { margin: 4 });
      } catch (e) {
        console.warn('[NativePrint] QR SVG generation failed for one item — printing without QR:', e);
        return '';
      }
    }));
    if (this.currentAttemptId !== attemptId) return; // superseded / closed

    const html = this.buildPageHtml(printable, qrSvgs, size);

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

  /**
   * Build the full print HTML for a list of labels. `@page size` and the
   * container flex-direction depend on `size.arrangement`:
   *   - stacked (column): total = w × (h × N) — labels go top-to-bottom
   *   - inline (row):     total = (w × N) × h — labels go left-to-right
   * Single-item calls flow through the same path with N=1, so N=1 output
   * matches the pre-bulk behavior.
   */
  private buildPageHtml(items: NativePrintData[], qrSvgs: string[], size: LabelSize): string {
    const w = size.widthIn;
    const h = size.heightIn;
    const fs1 = size.fontPt;
    const fs2 = Math.max(6, size.fontPt - 2);
    const n = items.length;
    const stacked = size.arrangement === 'stacked';
    const pageW = stacked ? w : w * n;
    const pageH = stacked ? h * n : h;

    // Compute qrEdge (per-label) — same math as before, kept in sync with the
    // modal's qrEdgeIn computed. Each label is w × h regardless of arrangement.
    const halfW = w / 2;
    const halfPad = 0.04;
    const availHalfW = Math.max(0.1, halfW - 2 * halfPad);
    const availH = Math.max(0.1, h - 2 * halfPad);
    const textReserve = ((fs1 + fs2) * 1.2) / 72;
    const qrEdge = Math.min(availHalfW, Math.max(0.1, availH - textReserve));

    const blocks = items.map((d, i) => this.buildLabelBlock(d, qrSvgs[i] || '')).join('');

    return `<!doctype html>
<html><head><meta charset="utf-8"><title>Labels</title>
<style>
  @page { size: ${pageW}in ${pageH}in; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .sheet {
    width: ${pageW}in;
    height: ${pageH}in;
    display: flex;
    flex-direction: ${stacked ? 'column' : 'row'};
    box-sizing: border-box;
    font-family: Arial, Helvetica, sans-serif;
    color: #000;
    background: #fff;
  }
  .label {
    width: ${w}in;
    height: ${h}in;
    display: flex;
    box-sizing: border-box;
    overflow: hidden;
    /* Faint boundary between labels on a shared strip — visible in the
       modal preview and mostly invisible on cheap printers. Skip on the
       last label to avoid a stray edge line. */
    ${n > 1 ? (stacked
      ? `border-bottom: 0.005in dashed #bbb;`
      : `border-right: 0.005in dashed #bbb;`
    ) : ''}
  }
  .label:last-child { ${stacked ? 'border-bottom: 0;' : 'border-right: 0;'} }
  .half {
    flex: 1 1 50%;
    height: 100%;
    padding: ${halfPad}in;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 0.03in;
    overflow: hidden;
  }
  .half.left { align-items: flex-start; text-align: left; border-right: 0.005in dashed #888; }
  .half.right { align-items: flex-end; text-align: right; }
  .qr { width: ${qrEdge}in; height: ${qrEdge}in; flex: 0 0 auto; }
  .qr svg { width: 100%; height: 100%; display: block; }
  .serial { font-size: ${fs1}pt; font-weight: 700; line-height: 1.1; word-break: break-word; }
  .name { font-size: ${fs2}pt; font-weight: 400; line-height: 1.15; word-break: break-word; }
</style>
</head>
<body><div class="sheet">${blocks}</div></body></html>`;
  }

  /** Single fold-in-half label. Two halves; right half mirrors position, not
   *  content (QR must stay unflipped so scanners decode it). */
  private buildLabelBlock(d: NativePrintData, qrSvg: string): string {
    const line1Esc = escapeHtml(d.line1 || '');
    const line2Esc = escapeHtml(d.line2 || '');
    const hasQr = !!qrSvg;
    const halfHtml = `
      ${hasQr ? `<div class="qr">${qrSvg}</div>` : ''}
      ${line1Esc ? `<div class="serial">${line1Esc}</div>` : ''}
      ${line2Esc ? `<div class="name">${line2Esc}</div>` : ''}
    `;
    return `<div class="label"><div class="half left">${halfHtml}</div><div class="half right">${halfHtml}</div></div>`;
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
        arrangement: parsed.arrangement === 'inline' ? 'inline' : 'stacked',
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
