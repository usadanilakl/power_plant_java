import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, effect, forwardRef, HostListener, inject, input, NgZone, OnDestroy, signal, ViewChild, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ServerApiService } from '../../../services/server-api.service';
import { SupabaseDataService } from '../../../services/supabase-data.service';

interface WorkAreaEntry {
  id: number;
  name: string;
  isConfinedSpace?: boolean;
  areaTypeName?: string;
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
  isConfinedSpace?: boolean;
  areaTypeName?: string;
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
  /** Adjusts helper copy when the map is used to find equipment instead of filling a work form. */
  pickerPurpose = input<'work-area' | 'equipment'>('work-area');

  /**
   * Work-area types this picker accepts, by type name (case-insensitive). Empty / null — the
   * default — accepts every type, so existing pickers are unaffected.
   *
   * Lets each host narrow the map to areas that make sense for its job. Areas that are not accepted
   * are dropped from their shape, and a shape left with no acceptable area is not drawn at all.
   */
  allowedAreaTypes = input<string[] | null>(null);

  /** Work-area types to drop, by type name (case-insensitive). Applied after allowedAreaTypes. */
  excludedAreaTypes = input<string[] | null>(null);

  /**
   * Drop confined spaces. Uses the hub's `isConfinedSpace` flag (any confined-space hazard set on
   * the area) OR an area type named "confined space", so it does not depend on how the area-type
   * Value is spelled.
   */
  excludeConfinedSpaces = input<boolean>(false);

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomElement') zoomElement!: ElementRef<HTMLDivElement>;
  @ViewChild('mapImage') mapImage!: ElementRef<HTMLImageElement>;
  @ViewChild('mapOverlay') mapOverlay!: ElementRef<HTMLDivElement>;

  private http = inject(HttpClient);
  private serverApi = inject(ServerApiService);
  private supabaseData = inject(SupabaseDataService);
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);
  private elementRef = inject(ElementRef);
  private cleanupListeners: (() => void)[] = [];
  private overlayMovedToBody = false;
  private hasFitOnce = false;

  shapes = signal<ParsedShape[]>([]);
  /**
   * Is there anything on the map to pick? False when the hub is unreachable AND no snapshot is
   * cached — the bundled static work-areas.json / work-area-shapes.json ship empty, so an offline
   * cold start legitimately has nothing to draw. The template says so instead of rendering a blank
   * frame the requester cannot interact with.
   */
  hasShapes = computed(() => this.shapes().length > 0);
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
  currentScale = signal(1);
  private scale = 1;
  private translateX = 0;
  private translateY = 0;
  // Pinch/wheel scale clamps. Min is deliberately loose so the fit-scale (which can be
  // as low as 0.1 for a large image in a small container on a narrow phone) still lives
  // inside the allowed range — a min of 0.8 caused pinch-out from a small fit to snap
  // UP to 0.8 (the clamp), making pinch feel broken. 0.05..12 is a comfortable range for
  // the plant map without letting the user zoom to a dot or blow it up beyond usefulness.
  private static readonly MIN_SCALE = 0.05;
  private static readonly MAX_SCALE = 12;

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
    // Clean up overlay from body if still there
    if (this.overlayMovedToBody) {
      const el = this.mapOverlay?.nativeElement;
      if (el?.parentNode === document.body) {
        document.body.removeChild(el);
      }
    }
  }

  // ResizeObserver auto-refit was removed — it fired during transient layout changes
  // (iOS keyboard open/close, address-bar hide/show, flex layout settling in the mobile
  // overlay) and refit the map to a bad container size, shrinking it to a dot. Auto-fit
  // now runs only on mount (image load + openOverlay); users hit "Fit to view" to refit
  // after rotation.

  // --- Overlay ---

  openOverlay(): void {
    this.overlayOpen.set(true);
    document.body.style.overflow = 'hidden';
    this.resetZoom();
    this.hasFitOnce = false; // fresh open → allow the load handler to compute the initial fit
    // Move overlay to body so transforms on parent containers don't break position:fixed.
    // Fit after layout is stable: DOM append → element pickup → double rAF for two frames
    // of layout. A single setTimeout was firing before flex layout resolved container height
    // on some devices, leaving the map at a tiny scale that pinch-zoom couldn't recover from.
    setTimeout(() => {
      this.moveOverlayToBody();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        // Cache-hit path: onImageLoaded may not fire (image already cached), so zoom-element
        // may not have its explicit natural-size dimensions yet. Set them here too so the
        // transform can scale a real box, not a 0×0 one.
        this.sizeZoomElementToImage();
        this.fitToContainer();
      }));
    }, 0);
  }

  /** Set .zoom-element to the image's natural pixel dimensions. See onImageLoaded comment. */
  private sizeZoomElementToImage(): void {
    const img = this.mapImage?.nativeElement;
    const zoom = this.zoomElement?.nativeElement;
    if (img && zoom && img.naturalWidth && img.naturalHeight) {
      zoom.style.width = img.naturalWidth + 'px';
      zoom.style.height = img.naturalHeight + 'px';
    }
  }

  closeOverlay(): void {
    this.detachListeners();
    this.returnOverlayFromBody();
    this.overlayOpen.set(false);
    document.body.style.overflow = '';
  }

  private moveOverlayToBody(): void {
    const el = this.mapOverlay?.nativeElement;
    if (el && !this.overlayMovedToBody) {
      document.body.appendChild(el);
      this.overlayMovedToBody = true;
    }
  }

  private returnOverlayFromBody(): void {
    const el = this.mapOverlay?.nativeElement;
    if (el && this.overlayMovedToBody) {
      this.elementRef.nativeElement.appendChild(el);
      this.overlayMovedToBody = false;
    }
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
      this.loadShapesWithFallback((shapes) => {
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
        const fromStatic = () => this.http.get<WorkAreaEntry[]>('data/work-areas.json')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next,
            error: fail,
          });
        this.supabaseData.snapshotOrElse('work_areas', rows => next(rows as WorkAreaEntry[]), fromStatic);
      }
    });
  }

  private loadShapesWithFallback(next: (shapes: ShapeEntry[]) => void, fail: () => void): void {
    this.serverApi.getWorkAreaShapes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (shapes) => {
        next(shapes as ShapeEntry[]);
      },
      error: () => {
        const fromStatic = () => this.http.get<ShapeEntry[]>('data/work-area-shapes.json')
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next,
            error: fail,
          });
        this.supabaseData.snapshotOrElse('work_area_shapes', rows => next(rows as ShapeEntry[]), fromStatic);
      }
    });
  }

  private handleLoadedData(areas: WorkAreaEntry[], shapes: ShapeEntry[]): void {
    const areaMap = new Map(this.acceptedAreas(areas).map(a => [a.id, a]));
    // A shape whose every area was filtered out has nothing to offer this picker, so it is not
    // drawn. parseShape's label/"Unknown" placeholders only stand in for shapes that never had
    // areas — they must not resurrect a shape we deliberately emptied.
    const parsed = shapes
      .filter(s => this.hasAcceptedArea(s, areaMap))
      .map(s => this.parseShape(s, areaMap));
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

  /** Areas this picker accepts. With nothing configured, everything is accepted. */
  private acceptedAreas(areas: WorkAreaEntry[]): WorkAreaEntry[] {
    const allowed = this.normalizeTypeList(this.allowedAreaTypes());
    const excluded = this.normalizeTypeList(this.excludedAreaTypes());
    const dropConfinedSpaces = this.excludeConfinedSpaces();

    if (allowed.length === 0 && excluded.length === 0 && !dropConfinedSpaces) return areas;

    return areas.filter(area => {
      const type = (area.areaTypeName ?? '').trim().toLowerCase();
      if (allowed.length > 0 && !allowed.includes(type)) return false;
      if (excluded.includes(type)) return false;
      if (dropConfinedSpaces && (area.isConfinedSpace === true || type.includes('confined space'))) {
        return false;
      }
      return true;
    });
  }

  private normalizeTypeList(types: string[] | null): string[] {
    return (types ?? []).map(t => (t ?? '').trim().toLowerCase()).filter(Boolean);
  }

  /**
   * Whether a shape still has at least one accepted area. Shapes that never had any area keep
   * their label-only rendering (unfiltered pickers behave exactly as before).
   */
  private hasAcceptedArea(entry: ShapeEntry, areaMap: Map<number, WorkAreaEntry>): boolean {
    const ids = entry.workAreaIds ?? [];
    if (ids.length === 0) return true;
    return ids.some(id => areaMap.has(id));
  }

  private parseShape(entry: ShapeEntry, areaMap: Map<number, WorkAreaEntry>): ParsedShape {
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
        const areaEntry = areaMap.get(id);
        if (!areaEntry) return null;
        const ref: AreaRef = { id, name: areaEntry.name };
        if (areaEntry.isConfinedSpace) ref.isConfinedSpace = true;
        if (areaEntry.areaTypeName) ref.areaTypeName = areaEntry.areaTypeName;
        return ref;
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
    const newScale = Math.min(Math.max(WorkAreaMapSelectComponent.MIN_SCALE, this.scale * factor), WorkAreaMapSelectComponent.MAX_SCALE);

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
      const newScale = Math.min(Math.max(WorkAreaMapSelectComponent.MIN_SCALE, this.initialPinchScale * (newDistance / this.initialPinchDistance)), WorkAreaMapSelectComponent.MAX_SCALE);

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
    this.ngZone.run(() => this.currentScale.set(this.scale));
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

  /** Public trigger for the "Fit to view" button — a manual escape hatch when the
   *  automatic fit runs before layout is stable and leaves the image at a bad scale.
   *  Also re-syncs zoom-element size to natural image dims in case the DOM was recreated. */
  fitToContainerNow(): void {
    this.sizeZoomElementToImage();
    this.fitToContainer();
  }

  onImageLoaded(): void {
    // Give .zoom-element explicit natural dimensions so the child image renders at
    // predictable size regardless of parent context. Was `display: inline-block` with the
    // child `<img>` at `width: 100%` — a circular sizing dependency that resolved to 0×0
    // on mobile Safari after moveOverlayToBody, making everything transform-scaled to a
    // dot even when the fit math computed the right scale.
    const img = this.mapImage?.nativeElement;
    const zoom = this.zoomElement?.nativeElement;
    if (img && zoom && img.naturalWidth && img.naturalHeight) {
      zoom.style.width = img.naturalWidth + 'px';
      zoom.style.height = img.naturalHeight + 'px';
    }
    // Cache-hit case: image `load` fires before container has settled its layout.
    // rAF-once is enough here because the container is already in the DOM by the time
    // the load event dispatches (unlike openOverlay which needs two frames to catch up
    // to the flex layout that just changed).
    requestAnimationFrame(() => this.fitToContainer());
  }

  /**
   * Scale the image so it fits ENTIRELY within the container (both width and height),
   * with a small padding so the shapes near edges aren't flush against the border.
   * Old version only fit width — a wide container with a portrait-ish image (or a very
   * short container after keyboard opens on mobile) left the image tiny because
   * containerHeight was ignored. Also guards against a zero-width container (layout
   * not-yet-settled): in that case we skip and rely on the ResizeObserver refit.
   */
  private fitToContainer(): void {
    const container = this.mapContainer?.nativeElement;
    const img = this.mapImage?.nativeElement;
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    if (cw <= 0 || ch <= 0) return; // container hasn't laid out — ResizeObserver will re-fire

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    // Fit-inside: whichever dimension runs out first bounds the scale. Small padding
    // (0.98) prevents shapes on the extreme edges from being cut off by anti-aliasing.
    const fitScale = Math.min(cw / iw, ch / ih) * 0.98;
    if (fitScale <= 0 || !isFinite(fitScale)) return;

    this.scale = fitScale;
    // Center the fitted image inside the container so blank space is distributed evenly
    // (before this the image was pinned to top-left, wasting space on wider containers).
    this.translateX = Math.max(0, (cw - iw * fitScale) / 2);
    this.translateY = Math.max(0, (ch - ih * fitScale) / 2);
    this.applyTransform();
  }

  // --- Counter-scaling for shapes/labels at current zoom ---

  getShapeBorderStyle(shape: ParsedShape, selected: boolean): Record<string, string> {
    const inv = 1 / this.currentScale();
    const bw = selected ? 3 * inv : 2 * inv;
    return {
      ...shape.style,
      'border-width': `${bw}px`,
      'border-radius': `${4 * inv}px`,
      'outline-width': selected ? `${3 * inv}px` : '0',
    };
  }

  getTooltipStyle(): Record<string, string> {
    const inv = 1 / this.currentScale();
    const fontSize = Math.min(Math.max(12 * inv, 6), 16);
    return {
      'font-size': `${fontSize}px`,
      'padding': `${Math.min(4 * inv, 6)}px ${Math.min(8 * inv, 10)}px`,
      'border-radius': `${Math.min(4 * inv, 6)}px`,
      'bottom': `calc(100% + ${Math.min(4 * inv, 6)}px)`,
      'max-width': `${Math.min(200 * inv, 250)}px`,
      'overflow': 'hidden',
      'text-overflow': 'ellipsis',
      'white-space': 'nowrap',
    };
  }
}
