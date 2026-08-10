import {
  Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, computed, inject, signal,
} from '@angular/core';
import { DrawingSource, LotoDrawingService } from './loto-drawing.service';
import { PointDrawing } from './loto-standard.model';

interface DrawingFile {
  fileId: number;
  fileName?: string;
  imageWidth?: number | null;
  imageHeight?: number | null;
  rects: { x: number; y: number; width: number; height: number }[];
}

/**
 * Full-screen popup that shows a LOTO point's drawing(s) with the point's shape(s) highlighted, auto-zoomed,
 * with drag-to-pan + zoom. Descriptors are grouped by file, so one drawing shows ALL of the point's shapes on
 * it. The highlight border counter-scales with the zoom (via a CSS var) so it stays thin and never buries the
 * symbol. Reads image + descriptors from the offline cache (network fallback). Renders at <body> so
 * position:fixed anchors to the viewport regardless of a scrolled/transformed ancestor.
 */
@Component({
  selector: 'app-loto-drawing-viewer',
  standalone: true,
  template: `
    <div class="dv-backdrop" (click)="close.emit()">
      <div class="dv-modal" (click)="$event.stopPropagation()">
        <div class="dv-head">
          <span class="dv-title">{{ title }} · drawing</span>
          <button class="dv-x" (click)="close.emit()" aria-label="Close">✕</button>
        </div>

        @if (loading()) {
          <p class="dv-msg">Loading drawing…</p>
        } @else if (error()) {
          <p class="dv-msg dv-err">{{ error() }}</p>
        } @else {
          @if (files().length > 1) {
            <div class="dv-tabs">
              @for (f of files(); track f.fileId; let i = $index) {
                <button class="dv-tab" [class.active]="i === index()" (click)="select(i)">
                  {{ f.fileName || ('Drawing ' + (i + 1)) }}
                </button>
              }
            </div>
          }
          <div class="dv-viewport" #viewport
               (pointerdown)="onDown($event)" (pointermove)="onMove($event)"
               (pointerup)="onUp($event)" (pointercancel)="onUp($event)" (wheel)="onWheel($event)">
            <!--
              Zoom is applied as the stage's LAYOUT WIDTH, not as transform: scale().

              Safari rasterises a transformed layer once at its pre-transform size and then stretches
              that bitmap, so a scaled-up drawing goes soft on iPhone while Chrome — which
              re-rasterises at the composited scale — stays sharp. Sizing the stage in real pixels
              makes both engines re-render the image at the zoomed size. transform carries the pan
              offset only. The highlight rects are positioned in %, so they track the stage for free.
            -->
            <div class="dv-stage" [style.width.px]="stageW()" [style.transform]="transform()">
              @if (imgUrl()) {
                <img class="dv-img" [src]="imgUrl()" alt="drawing" (load)="onImgLoad($event)" draggable="false">
                @for (r of currentRects(); track $index) {
                  <div class="dv-hl" [style.--s]="scale()"
                       [style.left.%]="r.x / imgW() * 100"
                       [style.top.%]="r.y / imgH() * 100"
                       [style.width.%]="r.width / imgW() * 100"
                       [style.height.%]="r.height / imgH() * 100"></div>
                }
              }
            </div>
          </div>
          <div class="dv-controls">
            <button (click)="zoomBy(0.8)" aria-label="Zoom out">−</button>
            @if (currentRects().length) { <button (click)="zoomToPoint()">◎ Point</button> }
            <button (click)="fit()">Fit</button>
            <button (click)="zoomBy(1.25)" aria-label="Zoom in">+</button>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dv-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.72); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 0.5rem; }
    .dv-modal { background: var(--secondary-background, #1e1e1e); border-radius: 12px; width: min(96vw, 960px); max-height: 94vh; display: flex; flex-direction: column; overflow: hidden; }
    .dv-head { display: flex; align-items: center; justify-content: space-between; padding: 0.65rem 0.9rem; border-bottom: 1px solid var(--border-color); }
    .dv-title { font-weight: 700; color: var(--primary-text); font-size: 0.95rem; }
    .dv-x { background: none; border: none; color: var(--secondary-text, #888); font-size: 1.1rem; cursor: pointer; }
    .dv-msg { padding: 2.5rem 1rem; text-align: center; color: var(--secondary-text, #888); }
    .dv-err { color: #e74c3c; }
    .dv-tabs { display: flex; gap: 0.3rem; padding: 0.4rem 0.6rem; overflow-x: auto; border-bottom: 1px solid var(--border-color); }
    .dv-tab { flex-shrink: 0; background: transparent; border: 1px solid var(--border-color); color: var(--secondary-text, #888); border-radius: 8px; padding: 0.3rem 0.7rem; font-size: 0.78rem; cursor: pointer; font-family: inherit; }
    .dv-tab.active { background: var(--accent-color); border-color: var(--accent-color); color: #fff; }
    .dv-viewport { position: relative; flex: 1; min-height: 55vh; overflow: hidden; background: #2b2b2b; touch-action: none; cursor: grab; }
    .dv-viewport:active { cursor: grabbing; }
    /* Width is bound per-frame (see template). No scale() here — that is what blurs on iOS. */
    .dv-stage { position: absolute; top: 0; left: 0; transform-origin: 0 0; }
    .dv-img { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
    .dv-hl { position: absolute; border-style: solid; border-color: #ff3b30; border-width: calc(2px / var(--s, 1)); background: rgba(255,59,48,0.12); border-radius: calc(2px / var(--s, 1)); pointer-events: none; box-sizing: border-box; }
    .dv-controls { display: flex; gap: 0.5rem; justify-content: center; padding: 0.55rem; border-top: 1px solid var(--border-color); }
    .dv-controls button { background: var(--card-bg, #2a2a2a); color: var(--primary-text); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.4rem 0.9rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; }
  `]
})
export class LotoDrawingViewerComponent implements OnInit, OnDestroy {
  /** The entity id whose drawings to show — a standard id (default) or a LOTO permit id when source='permit'. */
  @Input({ required: true }) standardId!: number;
  @Input({ required: true }) pointId!: number;
  @Input() title = 'Point';
  /** Where the drawings come from — 'standard' (default) or 'permit'. */
  @Input() source: DrawingSource = 'standard';
  @Output() close = new EventEmitter<void>();

  @ViewChild('viewport') viewport?: ElementRef<HTMLElement>;

  private drawingService = inject(LotoDrawingService);
  private host = inject(ElementRef<HTMLElement>);

  private drawings = signal<PointDrawing[]>([]);
  index = signal(0);
  imgUrl = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private natW = signal(0);
  private natH = signal(0);
  scale = signal(1);
  private tx = signal(0);
  private ty = signal(0);
  /** Pan only — the zoom lives in {@link stageW} so the image re-rasterises sharply. */
  transform = computed(() => `translate(${this.tx()}px, ${this.ty()}px)`);

  /** Viewport size, tracked as signals so the stage width can be a computed. */
  private baseW = signal(0);
  private baseH = signal(0);
  /** Stage width in real pixels: viewport width at scale 1, multiplied by the zoom. */
  stageW = computed(() => Math.max(1, this.baseW() * this.scale()));

  private static readonly MIN_SCALE = 0.2;
  private static readonly MAX_SCALE = 8;

  /** Descriptors grouped into one entry per file, each carrying that file's highlight rectangles. */
  files = computed<DrawingFile[]>(() => {
    const byId = new Map<number, DrawingFile>();
    for (const d of this.drawings()) {
      let f = byId.get(d.fileId);
      if (!f) { f = { fileId: d.fileId, fileName: d.fileName, imageWidth: d.imageWidth, imageHeight: d.imageHeight, rects: [] }; byId.set(d.fileId, f); }
      if (d.imageWidth && !f.imageWidth) f.imageWidth = d.imageWidth;
      if (d.imageHeight && !f.imageHeight) f.imageHeight = d.imageHeight;
      if (d.x != null && d.y != null && d.width != null && d.height != null) {
        f.rects.push({ x: d.x, y: d.y, width: d.width, height: d.height });
      }
    }
    return [...byId.values()];
  });
  private currentFile = computed<DrawingFile | null>(() => this.files()[this.index()] ?? null);
  currentRects = computed(() => this.currentFile()?.rects ?? []);
  imgW = computed(() => this.currentFile()?.imageWidth || this.natW() || 1);
  imgH = computed(() => this.currentFile()?.imageHeight || this.natH() || 1);

  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private objectUrl: string | null = null;

  /** Live pointers by id — size 1 pans, size 2 pinches. */
  private pointers = new Map<number, { x: number; y: number }>();
  private pinchDist = 0;
  private pinchMid = { x: 0, y: 0 };
  private lastTap = { t: 0, x: 0, y: 0 };

  async ngOnInit(): Promise<void> {
    document.body.appendChild(this.host.nativeElement);

    // iOS Safari drives pinch through its own non-standard gesture events and zooms the whole PAGE,
    // ignoring touch-action. Without this the viewer's pinch fights Safari's document zoom.
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      this.host.nativeElement.addEventListener(type, this.blockPageZoom, { passive: false });
    }
    window.addEventListener('resize', this.onViewportResize);
    window.addEventListener('orientationchange', this.onViewportResize);

    try {
      const list = await this.drawingService.drawingsForPoint(this.standardId, this.pointId, this.source);
      this.drawings.set(list);
      if (!this.files().length) { this.error.set('No drawing linked to this point.'); this.loading.set(false); return; }
      await this.load(0);
    } catch {
      this.error.set('Could not load the drawing. If offline, open this standard once on a connection first.');
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void {
    for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
      this.host.nativeElement.removeEventListener(type, this.blockPageZoom);
    }
    window.removeEventListener('resize', this.onViewportResize);
    window.removeEventListener('orientationchange', this.onViewportResize);
    this.revoke();
    this.host.nativeElement.remove();
  }

  private blockPageZoom = (e: Event) => e.preventDefault();

  /** Re-measure and re-fit; the old framing is meaningless at a new viewport size. */
  private onViewportResize = () => {
    const wasFitted = this.scale() <= 1.01;
    this.measure();
    if (wasFitted) this.fit();
  };

  async select(i: number): Promise<void> { if (i !== this.index()) await this.load(i); }

  private async load(i: number): Promise<void> {
    this.loading.set(true);
    this.revoke();
    this.index.set(i);
    this.natW.set(0); this.natH.set(0);
    const f = this.files()[i];
    const url = await this.drawingService.imageObjectUrl(f.fileId, this.source);
    if (!url) { this.error.set('Drawing image is not available offline. Reconnect to fetch it.'); this.loading.set(false); return; }
    this.objectUrl = url;
    this.imgUrl.set(url);
    this.loading.set(false);
    // The viewport is behind @if(loading()), so it only exists after this change is rendered.
    // Measure on the next tick so the stage gets a real width before the image paints, rather
    // than briefly laying out at the 1px floor.
    setTimeout(() => this.measure());
  }

  onImgLoad(e: Event): void {
    const img = e.target as HTMLImageElement;
    this.natW.set(img.naturalWidth); this.natH.set(img.naturalHeight);
    // The viewport only has a box once the image is in it — measure before framing against it.
    this.measure();
    if (this.currentRects().length) this.zoomToPoint(); else this.fit();
  }

  // ── Zoom / pan ─────────────────────────────────────────────────────────────
  /** Re-read the viewport box. Called on image load and whenever the window/orientation changes. */
  private measure(): void {
    const el = this.viewport?.nativeElement;
    if (!el) return;
    this.baseW.set(el.clientWidth || 300);
    this.baseH.set(el.clientHeight || 300);
  }

  private vp(): { w: number; h: number } {
    if (!this.baseW()) this.measure();
    return { w: this.baseW() || 300, h: this.baseH() || 300 };
  }

  /** Pointer position relative to the viewport box — the anchor space zoom math works in. */
  private local(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.viewport?.nativeElement.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  }

  /**
   * Zoom by `factor` while holding the point under (ax, ay) — viewport coordinates — still.
   * That anchor is what makes pinch feel attached to the fingers rather than to the centre.
   */
  private zoomAt(factor: number, ax: number, ay: number): void {
    const s0 = this.scale();
    const s = Math.min(LotoDrawingViewerComponent.MAX_SCALE,
                       Math.max(LotoDrawingViewerComponent.MIN_SCALE, s0 * factor));
    if (s === s0) return;
    this.tx.set(ax - (ax - this.tx()) * (s / s0));
    this.ty.set(ay - (ay - this.ty()) * (s / s0));
    this.scale.set(s);
  }
  /** Displayed stage height at scale 1 (stage width == viewport width; height follows the image aspect). */
  private stageHeight(w: number): number {
    if (this.natW() && this.natH()) return w * this.natH() / this.natW();
    return w * this.imgH() / this.imgW();
  }

  zoomToPoint(): void {
    const r = this.currentRects()[0]; const { w, h } = this.vp();
    if (!r || !w || !h) { this.fit(); return; }
    const stageH = this.stageHeight(w);
    const cx = (r.x + r.width / 2) / this.imgW() * w;
    const cy = (r.y + r.height / 2) / this.imgH() * stageH;
    const hlH = r.height / this.imgH() * stageH;
    const s = Math.min(6, Math.max(1, (h * 0.4) / Math.max(hlH, 1)));
    this.scale.set(s);
    this.tx.set(w / 2 - s * cx);
    this.ty.set(h / 2 - s * cy);
  }

  fit(): void {
    const { w, h } = this.vp();
    if (!w) { this.scale.set(1); this.tx.set(0); this.ty.set(0); return; }
    const s = Math.min(1, h / Math.max(this.stageHeight(w), 1));
    this.scale.set(s);
    this.tx.set((w - w * s) / 2);
    this.ty.set(0);
  }

  /** Button zoom — anchored to the middle of the viewport. */
  zoomBy(factor: number): void {
    const { w, h } = this.vp();
    this.zoomAt(factor, w / 2, h / 2);
  }

  /** Wheel/trackpad zoom, anchored under the cursor. */
  onWheel(e: WheelEvent): void {
    e.preventDefault();
    const p = this.local(e.clientX, e.clientY);
    this.zoomAt(e.deltaY < 0 ? 1.12 : 0.89, p.x, p.y);
  }

  // ── Pointer gestures: one finger pans, two pinch-zoom ──────────────────────

  onDown(e: PointerEvent): void {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size === 2) {
      this.beginPinch();
    } else if (this.pointers.size === 1) {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    }
  }

  onMove(e: PointerEvent): void {
    if (!this.pointers.has(e.pointerId)) return;
    this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.pointers.size >= 2) { this.updatePinch(); return; }
    if (!this.dragging) return;

    this.tx.set(this.tx() + (e.clientX - this.lastX));
    this.ty.set(this.ty() + (e.clientY - this.lastY));
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  onUp(e: PointerEvent): void {
    this.pointers.delete(e.pointerId);
    this.maybeDoubleTap(e);

    if (this.pointers.size === 1) {
      // Lifting one finger of a pinch: re-seat the pan origin on the finger that is still
      // down, otherwise the image jumps by the distance between the two touch points.
      const remaining = this.pointers.values().next().value!;
      this.lastX = remaining.x;
      this.lastY = remaining.y;
      this.dragging = true;
    } else if (this.pointers.size === 0) {
      this.dragging = false;
    }
  }

  private beginPinch(): void {
    // A pinch is not a drag — stop panning so the second finger doesn't also translate.
    this.dragging = false;
    const [a, b] = [...this.pointers.values()];
    this.pinchDist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    this.pinchMid = this.local((a.x + b.x) / 2, (a.y + b.y) / 2);
  }

  private updatePinch(): void {
    const [a, b] = [...this.pointers.values()];
    const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
    const mid = this.local((a.x + b.x) / 2, (a.y + b.y) / 2);

    this.zoomAt(dist / this.pinchDist, this.pinchMid.x, this.pinchMid.y);
    // Two-finger drag pans as well as zooms, which is what the gesture is expected to do.
    this.tx.set(this.tx() + (mid.x - this.pinchMid.x));
    this.ty.set(this.ty() + (mid.y - this.pinchMid.y));

    this.pinchDist = dist;
    this.pinchMid = mid;
  }

  /** Double-tap toggles between fit and a close-up on the tapped spot. */
  private maybeDoubleTap(e: PointerEvent): void {
    if (e.pointerType === 'mouse') return;
    const now = Date.now();
    const near = Math.hypot(e.clientX - this.lastTap.x, e.clientY - this.lastTap.y) < 30;
    if (now - this.lastTap.t < 300 && near) {
      this.lastTap = { t: 0, x: 0, y: 0 };
      const p = this.local(e.clientX, e.clientY);
      if (this.scale() > 1.2) this.fit();
      else this.zoomAt(2.5 / this.scale(), p.x, p.y);
      return;
    }
    this.lastTap = { t: now, x: e.clientX, y: e.clientY };
  }

  private revoke(): void {
    if (this.objectUrl) { URL.revokeObjectURL(this.objectUrl); this.objectUrl = null; }
    this.imgUrl.set(null);
  }
}
