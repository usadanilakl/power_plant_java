import { Injectable, signal } from '@angular/core';

/**
 * A reference image traced behind the designer sheet.
 *
 * <p>Sizes and offsets are in SHEET pixels (96dpi), the same space container positions live in,
 * so the backdrop and the containers drawn over it share one coordinate system and the zoom
 * transform on the sheet scales both together.
 */
export interface FormBackdrop {
  dataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
  /** Displayed size of the image, in sheet px. */
  width: number;
  height: number;
  /** Top-left of the image relative to the sheet origin, in sheet px. May be negative. */
  x: number;
  y: number;
  opacity: number;
  visible: boolean;
}

const DB_NAME = 'pp-form-designer';
const DB_VERSION = 1;
const STORE = 'backdrops';

/**
 * Designer-only backdrop layer: load a photo or screenshot of the paper form and trace containers
 * directly over it.
 *
 * <p><b>Deliberately never persisted server-side.</b> A full-page screenshot is several hundred KB;
 * carrying it as a FormContainer would put that base64 in a CRDT-synced {@code content_json} and
 * replicate it over SSE to every desktop — the same write-amplification that has already inflated
 * this database once. It would also print on the finished permit and be selectable and deletable
 * by accident. So the image lives in IndexedDB on the machine doing the drawing, is scoped to
 * {@code formId:page}, and no renderer outside the designer canvas ever sees it.
 */
@Injectable({ providedIn: 'root' })
export class FormBackdropService {
  /** Backdrop for the page currently open in the designer, or null. */
  readonly current = signal<FormBackdrop | null>(null);

  /** Two-point calibration mode: 0 = off, 1 = awaiting top-left, 2 = awaiting bottom-right. */
  readonly calibrationStep = signal<0 | 1 | 2>(0);

  private firstPoint: { x: number; y: number } | null = null;
  private key: string | null = null;
  private db: Promise<IDBDatabase> | null = null;

  // ---------------------------------------------------------------- persistence

  private open(): Promise<IDBDatabase> {
    if (!this.db) {
      this.db = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    }
    return this.db;
  }

  private async tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await this.open();
    return new Promise<T>((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  }

  // ---------------------------------------------------------------- page lifecycle

  /** Point the service at a form page and load whatever backdrop that page has. */
  async select(formId: string | number | undefined, page: number): Promise<void> {
    this.cancelCalibration();
    this.key = formId === undefined || formId === null ? null : `${formId}:${page}`;
    if (!this.key || typeof indexedDB === 'undefined') {
      this.current.set(null);
      return;
    }
    try {
      const found = await this.tx<FormBackdrop | undefined>('readonly', s => s.get(this.key!));
      this.current.set(found ?? null);
    } catch {
      this.current.set(null);
    }
  }

  private async persist(): Promise<void> {
    const b = this.current();
    if (!this.key || typeof indexedDB === 'undefined') return;
    try {
      if (b) await this.tx('readwrite', s => s.put(b, this.key!));
      else await this.tx('readwrite', s => s.delete(this.key!));
    } catch {
      // A full or unavailable IndexedDB must not break the designer; the backdrop is an aid.
    }
  }

  // ---------------------------------------------------------------- image loading

  /** Read a File (picker or clipboard) and fit it to the sheet as the new backdrop. */
  loadFile(file: File, sheetW: number, sheetH: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onerror = () => reject(new Error('Not a readable image'));
        img.onload = () => {
          this.current.set({
            dataUrl,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            ...this.fitBox(img.naturalWidth, img.naturalHeight, sheetW, sheetH),
            opacity: 0.45,
            visible: true,
          });
          this.persist();
          resolve();
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  }

  /** Largest centred box with the image's aspect ratio that fits the sheet. */
  private fitBox(iw: number, ih: number, sheetW: number, sheetH: number) {
    const scale = Math.min(sheetW / iw, sheetH / ih);
    const width = iw * scale;
    const height = ih * scale;
    return { width, height, x: (sheetW - width) / 2, y: (sheetH - height) / 2 };
  }

  // ---------------------------------------------------------------- adjustments

  update(patch: Partial<FormBackdrop>): void {
    const b = this.current();
    if (!b) return;
    this.current.set({ ...b, ...patch });
    this.persist();
  }

  nudge(dx: number, dy: number): void {
    const b = this.current();
    if (b) this.update({ x: b.x + dx, y: b.y + dy });
  }

  /** Scale about the image's own top-left, so repeated steps do not drift. */
  zoom(factor: number): void {
    const b = this.current();
    if (b) this.update({ width: b.width * factor, height: b.height * factor });
  }

  fitToSheet(sheetW: number, sheetH: number): void {
    const b = this.current();
    if (b) this.update(this.fitBox(b.naturalWidth, b.naturalHeight, sheetW, sheetH));
  }

  /** Stretch the image edge-to-edge, ignoring its aspect ratio. */
  stretchToSheet(sheetW: number, sheetH: number): void {
    this.update({ x: 0, y: 0, width: sheetW, height: sheetH });
  }

  clear(): void {
    this.cancelCalibration();
    this.current.set(null);
    this.persist();
  }

  // ---------------------------------------------------------------- calibration

  /**
   * Two-point calibration. Fitting a screenshot to the sheet by eye leaves a scale error that
   * compounds across the page — every container traced near the bottom lands progressively wrong.
   * Instead the operator clicks the two opposite corners of the form's printed frame and the
   * transform is solved so those points land exactly on the sheet corners.
   */
  startCalibration(): void {
    if (!this.current()) return;
    this.firstPoint = null;
    this.calibrationStep.set(1);
  }

  cancelCalibration(): void {
    this.firstPoint = null;
    this.calibrationStep.set(0);
  }

  /**
   * Feed a click, in sheet coordinates. The first click marks the frame's top-left, the second its
   * bottom-right; on the second the backdrop is re-solved so that rectangle fills the sheet.
   */
  calibrationClick(p: { x: number; y: number }, sheetW: number, sheetH: number): void {
    const step = this.calibrationStep();
    if (step === 0) return;
    if (step === 1) {
      this.firstPoint = p;
      this.calibrationStep.set(2);
      return;
    }
    const b = this.current();
    const p1 = this.firstPoint;
    this.cancelCalibration();
    if (!b || !p1) return;

    // Where the two clicks fall within the image, as fractions of its displayed box.
    const f1x = (p1.x - b.x) / b.width;
    const f1y = (p1.y - b.y) / b.height;
    const f2x = (p.x - b.x) / b.width;
    const f2y = (p.y - b.y) / b.height;
    const dx = f2x - f1x;
    const dy = f2y - f1y;
    // Degenerate clicks (same point, or dragged the wrong way) would divide by ~0 and throw the
    // image off the sheet. Leave the backdrop untouched instead.
    if (Math.abs(dx) < 1e-4 || Math.abs(dy) < 1e-4) return;

    const width = sheetW / dx;
    const height = sheetH / dy;
    this.update({ width, height, x: -f1x * width, y: -f1y * height });
  }
}
