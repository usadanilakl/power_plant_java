import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, effect, forwardRef, HostListener, inject, NgZone, OnDestroy, signal, ViewChild, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServerApiService } from '../../../services/server-api.service';

interface WorkAreaEntry {
  id: number;
  name: string;
}

interface ShapeEntry {
  id: number;
  coordinates: string;
  originalPictureSize: string;
  label: string;
  workAreaIds: number[];
}

interface AreaRef {
  id: number;
  name: string;
}

interface ParsedShape {
  entry: ShapeEntry;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  areas: AreaRef[];
  areaNames: string[];
  style: Record<string, string>;
  labelStyle: Record<string, string>;
}

@Component({
  selector: 'app-work-area-map-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-area-map-select.component.html',
  styleUrl: './work-area-map-select.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WorkAreaMapSelectComponent),
      multi: true,
    },
  ],
})
export class WorkAreaMapSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomElement') zoomElement!: ElementRef<HTMLDivElement>;
  @ViewChild('mapImage') mapImage!: ElementRef<HTMLImageElement>;

  private http = inject(HttpClient);
  private serverApi = inject(ServerApiService);
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private cleanupListeners: (() => void)[] = [];

  shapes = signal<ParsedShape[]>([]);
  selectedAreaName = signal<string | null>(null);
  selectedShape = signal<ParsedShape | null>(null);
  imageUrl = signal<string | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  // Responsive
  isMobile = signal(false);
  overlayOpen = signal(false);
  hoveredShape = signal<ParsedShape | null>(null);
  private mediaQuery = window.matchMedia('(max-width: 768px)');
  private mediaHandler = (e: MediaQueryListEvent) => {
    this.ngZone.run(() => {
      this.isMobile.set(e.matches);
      if (!e.matches && this.overlayOpen()) {
        this.closeOverlay();
      }
    });
  };

  // Transform state
  private scale = 1;
  private translateX = 0;
  private translateY = 0;

  // Pan state
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private panStartTranslateX = 0;
  private panStartTranslateY = 0;

  // Pinch state
  private initialPinchDistance = 0;
  private initialPinchScale = 1;

  // Tap detection
  private touchStartTime = 0;
  private touchStartPos = { x: 0, y: 0 };
  private readonly TAP_THRESHOLD = 10;
  private readonly TAP_DURATION = 300;

  // CVA
  private onChange: (value: AreaRef | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.isMobile.set(this.mediaQuery.matches);
    this.mediaQuery.addEventListener('change', this.mediaHandler);
    this.loadData();
  }

  private listenersAttached = false;

  constructor() {
    effect(() => {
      const loading = this.loading();
      const mobile = this.isMobile();
      const overlay = this.overlayOpen();

      // Map DOM is present when: not loading AND (desktop OR overlay open)
      const mapVisible = !loading && (!mobile || overlay);

      if (mapVisible && !this.listenersAttached) {
        Promise.resolve().then(() => this.attachListeners());
      }
    });
  }

  private attachListeners(): void {
    if (this.listenersAttached) return;
    const el = this.mapContainer?.nativeElement;
    if (!el) return;
    this.listenersAttached = true;

    this.ngZone.runOutsideAngular(() => {
      const listen = (event: string, handler: (e: any) => void, options?: AddEventListenerOptions) => {
        el.addEventListener(event, handler, options);
        this.cleanupListeners.push(() => el.removeEventListener(event, handler));
      };

      listen('wheel', (e: WheelEvent) => this.onWheel(e), { passive: false });
      listen('mousedown', (e: MouseEvent) => this.onMouseDown(e));
      listen('mousemove', (e: MouseEvent) => this.onMouseMove(e));
      listen('mouseup', () => this.onMouseUp());
      listen('mouseleave', () => this.onMouseUp());
      listen('touchstart', (e: TouchEvent) => this.onTouchStart(e), { passive: true });
      listen('touchmove', (e: TouchEvent) => this.onTouchMove(e), { passive: false });
      listen('touchend', (e: TouchEvent) => this.onTouchEnd(e));
    });
  }

  private detachListeners(): void {
    this.cleanupListeners.forEach(fn => fn());
    this.cleanupListeners = [];
    this.listenersAttached = false;
  }

  ngOnDestroy(): void {
    this.detachListeners();
    this.mediaQuery.removeEventListener('change', this.mediaHandler);
    if (this.overlayOpen()) {
      document.body.style.overflow = '';
    }
  }

  // --- Overlay ---

  openOverlay(): void {
    this.overlayOpen.set(true);
    document.body.style.overflow = 'hidden';
    this.resetZoom();
  }

  closeOverlay(): void {
    this.detachListeners();
    this.overlayOpen.set(false);
    document.body.style.overflow = '';
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.overlayOpen()) {
      this.closeOverlay();
    }
  }

  // --- ControlValueAccessor ---

  writeValue(value: AreaRef | string | null): void {
    if (typeof value === 'string') {
      this.selectedAreaName.set(value);
    } else if (value && typeof value === 'object') {
      this.selectedAreaName.set(value.name);
    } else {
      this.selectedAreaName.set(null);
    }
  }

  registerOnChange(fn: (value: AreaRef | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // --- Data Loading ---

  private loadData(): void {
    this.loadAreasWithFallback((areas) => {
      this.loadShapesFromStatic((shapes) => {
        this.handleLoadedData(areas, shapes);
      }, () => {
        console.warn('[PWA] Failed to load static work-area shapes');
        this.errorMessage.set('Map data not available');
        this.loading.set(false);
      });
    }, () => {
      console.warn('[PWA] Failed to load work areas from server and static json');
      this.errorMessage.set('Map data not available');
      this.loading.set(false);
    });
  }

  private loadAreasWithFallback(next: (areas: WorkAreaEntry[]) => void, fail: () => void): void {
    this.serverApi.getWorkAreas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (areas) => {
        next(areas);
      },
      error: () => {
        this.http.get<WorkAreaEntry[]>('data/work-areas.json')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next,
            error: fail,
          });
      }
    });
  }

  private loadShapesFromStatic(next: (shapes: ShapeEntry[]) => void, fail: () => void): void {
    this.http.get<ShapeEntry[]>('data/work-area-shapes.json')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next,
        error: fail,
      });
  }

  private handleLoadedData(areas: WorkAreaEntry[], shapes: ShapeEntry[]): void {
    const areaMap = new Map(areas.map(a => [a.id, a.name]));
    const parsed = shapes.map(s => this.parseShape(s, areaMap));
    this.shapes.set(parsed);
    this.imageUrl.set('data/work-area-map-image.jpg');
    this.loading.set(false);

    const pendingName = this.selectedAreaName();
    if (pendingName) {
      const match = parsed.find(s => s.areaNames.includes(pendingName));
      if (match) {
        this.selectedShape.set(match);
      }
    }
  }

  private parseShape(entry: ShapeEntry, areaMap: Map<number, string>): ParsedShape {
    let x = 0, y = 0, width = 100, height = 100;
    let originalWidth = 1000, originalHeight = 1000;

    try {
      const jsonStr = entry.coordinates.replace(/(\w+)\s*:/g, '"$1":');
      const coords = JSON.parse(jsonStr);
      x = coords.startX ?? coords.x ?? 0;
      y = coords.startY ?? coords.y ?? 0;
      width = coords.width ?? 100;
      height = coords.height ?? 100;
    } catch { /* use defaults */ }

    try {
      const sizeStr = entry.originalPictureSize ?? '';
      const wMatch = sizeStr.match(/width\s*:\s*(\d+)/);
      const hMatch = sizeStr.match(/height\s*:\s*(\d+)/);
      if (wMatch) originalWidth = parseFloat(wMatch[1]);
      if (hMatch) originalHeight = parseFloat(hMatch[1]);
    } catch { /* use defaults */ }

    const areas: AreaRef[] = (entry.workAreaIds ?? [])
      .map(id => {
        const name = areaMap.get(id);
        return name ? { id, name } : null;
      })
      .filter((a): a is AreaRef => !!a);

    const areaNames = areas.map(a => a.name);

    if (areas.length === 0 && entry.label) {
      areas.push({ id: 0, name: entry.label });
      areaNames.push(entry.label);
    }
    if (areas.length === 0) {
      areas.push({ id: 0, name: 'Unknown' });
      areaNames.push('Unknown');
    }

    const leftPct = (x / originalWidth) * 100;
    const topPct = (y / originalHeight) * 100;
    const widthPct = (width / originalWidth) * 100;
    const heightPct = (height / originalHeight) * 100;

    const style: Record<string, string> = {
      left: `${leftPct}%`,
      top: `${topPct}%`,
      width: `${widthPct}%`,
      height: `${heightPct}%`,
    };

    const labelStyle: Record<string, string> = {
      left: `${leftPct + widthPct / 2}%`,
      top: `${topPct + heightPct / 2}%`,
      'max-width': `${widthPct * 2.5}%`,
      'max-height': `${heightPct}%`,
    };

    return { entry, x, y, width, height, originalWidth, originalHeight, areas, areaNames, style, labelStyle };
  }

  getDisplayName(shape: ParsedShape): string {
    return shape.areaNames.length === 1 ? shape.areaNames[0] : shape.areaNames.join(' / ');
  }

  isSelected(shape: ParsedShape): boolean {
    const selected = this.selectedAreaName();
    return !!selected && shape.areaNames.includes(selected);
  }

  // --- Selection ---

  selectShape(shape: ParsedShape): void {
    this.ngZone.run(() => {
      this.selectedShape.set(shape);
      // On mobile overlay: don't auto-select — let user see details first
      if (shape.areas.length === 1 && !(this.isMobile() && this.overlayOpen())) {
        this.setArea(shape.areas[0]);
      }
    });
  }

  setArea(area: AreaRef): void {
    this.selectedAreaName.set(area.name);
    this.onChange(area);
    this.onTouched();
  }

  /** Called from overlay confirm button */
  confirmAndClose(): void {
    const shape = this.selectedShape();
    if (shape) {
      // If single-area shape was tapped but not yet committed to form, do it now
      if (shape.areas.length === 1 && !this.selectedAreaName()) {
        this.setArea(shape.areas[0]);
      } else if (shape.areas.length === 1) {
        // Already set from a previous interaction — just ensure it's set
        this.setArea(shape.areas[0]);
      }
      // Multi-area: selectedAreaName should already be set via area button tap
    }
    this.closeOverlay();
  }

  // --- Mouse Events ---

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.min(Math.max(0.5, this.scale * factor), 8);

    const container = this.mapContainer.nativeElement;
    const rect = container.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    this.translateX = mouseX - (mouseX - this.translateX) * (newScale / this.scale);
    this.translateY = mouseY - (mouseY - this.translateY) * (newScale / this.scale);
    this.scale = newScale;
    this.applyTransform();
  }

  onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    this.isPanning = true;
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panStartTranslateX = this.translateX;
    this.panStartTranslateY = this.translateY;
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return;
    event.preventDefault();
    this.translateX = this.panStartTranslateX + (event.clientX - this.panStartX);
    this.translateY = this.panStartTranslateY + (event.clientY - this.panStartY);
    this.applyTransform();
  }

  onMouseUp(): void {
    this.isPanning = false;
  }

  // --- Touch Events ---

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.isPanning = true;
      this.panStartX = touch.clientX;
      this.panStartY = touch.clientY;
      this.panStartTranslateX = this.translateX;
      this.panStartTranslateY = this.translateY;
      this.touchStartTime = Date.now();
      this.touchStartPos = { x: touch.clientX, y: touch.clientY };
    } else if (event.touches.length === 2) {
      this.isPanning = false;
      this.initialPinchDistance = this.getTouchDistance(event.touches);
      this.initialPinchScale = this.scale;
    }
  }

  onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    if (event.touches.length === 1 && this.isPanning) {
      const touch = event.touches[0];
      this.translateX = this.panStartTranslateX + (touch.clientX - this.panStartX);
      this.translateY = this.panStartTranslateY + (touch.clientY - this.panStartY);
      this.applyTransform();
    } else if (event.touches.length === 2) {
      const newDistance = this.getTouchDistance(event.touches);
      const newScale = Math.min(Math.max(0.5, this.initialPinchScale * (newDistance / this.initialPinchDistance)), 8);

      const midX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
      const midY = (event.touches[0].clientY + event.touches[1].clientY) / 2;

      const container = this.mapContainer.nativeElement;
      const rect = container.getBoundingClientRect();
      const cx = midX - rect.left;
      const cy = midY - rect.top;

      this.translateX = cx - (cx - this.translateX) * (newScale / this.scale);
      this.translateY = cy - (cy - this.translateY) * (newScale / this.scale);
      this.scale = newScale;
      this.applyTransform();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0 && event.changedTouches.length === 1) {
      const touch = event.changedTouches[0];
      const dx = Math.abs(touch.clientX - this.touchStartPos.x);
      const dy = Math.abs(touch.clientY - this.touchStartPos.y);
      const elapsed = Date.now() - this.touchStartTime;

      if (dx < this.TAP_THRESHOLD && dy < this.TAP_THRESHOLD && elapsed < this.TAP_DURATION) {
        this.handleTap(touch.clientX, touch.clientY);
      }
    }
    this.isPanning = false;
  }

  private handleTap(clientX: number, clientY: number): void {
    const zoomEl = this.zoomElement.nativeElement;
    const rect = zoomEl.getBoundingClientRect();

    const relX = (clientX - rect.left) / rect.width;
    const relY = (clientY - rect.top) / rect.height;

    for (const shape of this.shapes()) {
      const sx = shape.x / shape.originalWidth;
      const sy = shape.y / shape.originalHeight;
      const sw = shape.width / shape.originalWidth;
      const sh = shape.height / shape.originalHeight;

      if (relX >= sx && relX <= sx + sw && relY >= sy && relY <= sy + sh) {
        this.selectShape(shape);
        return;
      }
    }
  }

  private getTouchDistance(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // --- Transform ---

  private applyTransform(): void {
    if (this.zoomElement) {
      const el = this.zoomElement.nativeElement;
      el.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
  }

  resetZoom(): void {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.applyTransform();
  }
}
