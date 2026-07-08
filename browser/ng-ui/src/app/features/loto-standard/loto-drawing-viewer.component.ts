import {
  Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, computed, inject, signal,
} from '@angular/core';
import { LotoDrawingService } from './loto-drawing.service';
import { PointDrawing } from './loto-standard.model';

/**
 * Full-screen popup that shows a LOTO point's drawing with the point's rectangle highlighted, auto-zoomed to it,
 * with drag-to-pan + zoom controls. Reads the image + descriptors from the offline cache (falls back to network),
 * so it works in the field with no signal once the standard has been opened online.
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
          @if (drawings().length > 1) {
            <div class="dv-tabs">
              @for (d of drawings(); track d.fileId; let i = $index) {
                <button class="dv-tab" [class.active]="i === index()" (click)="select(i)">
                  {{ d.fileName || ('Drawing ' + (i + 1)) }}
                </button>
              }
            </div>
          }
          <div class="dv-viewport" #viewport
               (pointerdown)="onDown($event)" (pointermove)="onMove($event)"
               (pointerup)="onUp($event)" (pointercancel)="onUp($event)" (wheel)="onWheel($event)">
            <div class="dv-stage" [style.transform]="transform()">
              @if (imgUrl()) {
                <img class="dv-img" [src]="imgUrl()" alt="drawing" (load)="onImgLoad()" draggable="false">
                @if (current(); as d) {
                  <div class="dv-hl"
                       [style.left.%]="d.x / d.imageWidth * 100"
                       [style.top.%]="d.y / d.imageHeight * 100"
                       [style.width.%]="d.width / d.imageWidth * 100"
                       [style.height.%]="d.height / d.imageHeight * 100"></div>
                }
              }
            </div>
          </div>
          <div class="dv-controls">
            <button (click)="zoomBy(0.8)" aria-label="Zoom out">−</button>
            <button (click)="zoomToPoint()">◎ Point</button>
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
    .dv-stage { position: absolute; top: 0; left: 0; width: 100%; transform-origin: 0 0; }
    .dv-img { display: block; width: 100%; height: auto; user-select: none; -webkit-user-drag: none; }
    .dv-hl { position: absolute; border: 3px solid #ff3b30; box-shadow: 0 0 0 9999px rgba(0,0,0,0.28); border-radius: 3px; pointer-events: none; }
    .dv-controls { display: flex; gap: 0.5rem; justify-content: center; padding: 0.55rem; border-top: 1px solid var(--border-color); }
    .dv-controls button { background: var(--card-bg, #2a2a2a); color: var(--primary-text); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.4rem 0.9rem; font-size: 0.9rem; font-weight: 700; cursor: pointer; font-family: inherit; }
  `]
})
export class LotoDrawingViewerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) standardId!: number;
  @Input({ required: true }) pointId!: number;
  @Input() title = 'Point';
  @Output() close = new EventEmitter<void>();

  @ViewChild('viewport') viewport?: ElementRef<HTMLElement>;

  private drawingService = inject(LotoDrawingService);

  drawings = signal<PointDrawing[]>([]);
  index = signal(0);
  imgUrl = signal<string | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private scale = signal(1);
  private tx = signal(0);
  private ty = signal(0);
  transform = computed(() => `translate(${this.tx()}px, ${this.ty()}px) scale(${this.scale()})`);

  current = computed<PointDrawing | null>(() => this.drawings()[this.index()] ?? null);

  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private objectUrl: string | null = null;

  async ngOnInit(): Promise<void> {
    try {
      const list = await this.drawingService.drawingsForPoint(this.standardId, this.pointId);
      this.drawings.set(list);
      if (!list.length) { this.error.set('No drawing linked to this point.'); this.loading.set(false); return; }
      await this.load(0);
    } catch {
      this.error.set('Could not load the drawing. If offline, open this standard once on a connection first.');
      this.loading.set(false);
    }
  }

  ngOnDestroy(): void { this.revoke(); }

  async select(i: number): Promise<void> { if (i !== this.index()) await this.load(i); }

  private async load(i: number): Promise<void> {
    this.loading.set(true);
    this.revoke();
    this.index.set(i);
    const d = this.drawings()[i];
    const url = await this.drawingService.imageObjectUrl(d.fileId);
    if (!url) { this.error.set('Drawing image is not available offline. Reconnect to fetch it.'); this.loading.set(false); return; }
    this.objectUrl = url;
    this.imgUrl.set(url);
    this.loading.set(false);
  }

  onImgLoad(): void { this.zoomToPoint(); }

  // ── Zoom / pan ─────────────────────────────────────────────────────────────
  private vp(): { w: number; h: number } {
    const el = this.viewport?.nativeElement;
    return { w: el?.clientWidth ?? 300, h: el?.clientHeight ?? 300 };
  }

  zoomToPoint(): void {
    const d = this.current(); const { w, h } = this.vp();
    if (!d || !w || !h) return;
    // stage width == viewport width at scale 1; stage height follows the image aspect.
    const stageH = w * d.imageHeight / d.imageWidth;
    const hlH = d.height / d.imageHeight * stageH;
    const hlCx = (d.x + d.width / 2) / d.imageWidth * w;
    const hlCy = (d.y + d.height / 2) / d.imageHeight * stageH;
    const s = Math.min(6, Math.max(1, (h * 0.45) / Math.max(hlH, 1)));
    this.scale.set(s);
    this.tx.set(w / 2 - s * hlCx);
    this.ty.set(h / 2 - s * hlCy);
  }

  fit(): void {
    const d = this.current(); const { w, h } = this.vp();
    if (!d || !w) { this.scale.set(1); this.tx.set(0); this.ty.set(0); return; }
    const stageH = w * d.imageHeight / d.imageWidth;
    const s = Math.min(1, h / Math.max(stageH, 1));
    this.scale.set(s);
    this.tx.set((w - w * s) / 2);
    this.ty.set(0);
  }

  zoomBy(factor: number): void {
    const { w, h } = this.vp();
    const s0 = this.scale();
    const s = Math.min(8, Math.max(0.2, s0 * factor));
    // keep the viewport centre stable
    this.tx.set(w / 2 - (w / 2 - this.tx()) * (s / s0));
    this.ty.set(h / 2 - (h / 2 - this.ty()) * (s / s0));
    this.scale.set(s);
  }

  onWheel(e: WheelEvent): void { e.preventDefault(); this.zoomBy(e.deltaY < 0 ? 1.12 : 0.89); }
  onDown(e: PointerEvent): void { this.dragging = true; this.lastX = e.clientX; this.lastY = e.clientY; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); }
  onMove(e: PointerEvent): void {
    if (!this.dragging) return;
    this.tx.set(this.tx() + (e.clientX - this.lastX));
    this.ty.set(this.ty() + (e.clientY - this.lastY));
    this.lastX = e.clientX; this.lastY = e.clientY;
  }
  onUp(_e: PointerEvent): void { this.dragging = false; }

  private revoke(): void {
    if (this.objectUrl) { URL.revokeObjectURL(this.objectUrl); this.objectUrl = null; }
    this.imgUrl.set(null);
  }
}
