import {
  Component, DestroyRef, ElementRef, forwardRef, inject, signal, ViewChild, AfterViewInit, OnInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

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

interface ParsedShape {
  entry: ShapeEntry;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  areaNames: string[];
}

@Component({
  selector: 'app-work-area-map-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-area-map-select.component.html',
  styleUrl: './work-area-map-select.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WorkAreaMapSelectComponent),
      multi: true,
    },
  ],
})
export class WorkAreaMapSelectComponent implements ControlValueAccessor, OnInit, AfterViewInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomElement') zoomElement!: ElementRef<HTMLDivElement>;
  @ViewChild('mapImage') mapImage!: ElementRef<HTMLImageElement>;

  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);

  shapes = signal<ParsedShape[]>([]);
  selectedAreaName = signal<string | null>(null);
  selectedShape = signal<ParsedShape | null>(null);
  imageUrl = signal<string | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

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
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

  // --- ControlValueAccessor ---

  writeValue(value: string | null): void {
    this.selectedAreaName.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // --- Data Loading ---

  private loadData(): void {
    forkJoin({
      areas: this.http.get<WorkAreaEntry[]>('data/work-areas.json'),
      shapes: this.http.get<ShapeEntry[]>('data/work-area-shapes.json'),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ areas, shapes }) => {
        const areaMap = new Map(areas.map(a => [a.id, a.name]));
        const parsed = shapes.map(s => this.parseShape(s, areaMap));
        this.shapes.set(parsed);
        this.imageUrl.set('data/work-area-map-image.jpg');
        this.loading.set(false);

        // Restore selectedShape if writeValue was called before data loaded
        const pendingName = this.selectedAreaName();
        if (pendingName) {
          const match = parsed.find(s => s.areaNames.includes(pendingName));
          if (match) {
            this.selectedShape.set(match);
          }
        }
      },
      error: (err) => {
        console.error('Failed to load work area map data', err);
        this.errorMessage.set('Map data not available');
        this.loading.set(false);
      },
    });
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

    const areaNames = (entry.workAreaIds ?? [])
      .map(id => areaMap.get(id))
      .filter((name): name is string => !!name);

    if (areaNames.length === 0 && entry.label) {
      areaNames.push(entry.label);
    }
    if (areaNames.length === 0) {
      areaNames.push('Unknown');
    }

    return { entry, x, y, width, height, originalWidth, originalHeight, areaNames };
  }

  // --- Shape Positioning ---

  getShapeStyle(shape: ParsedShape): Record<string, string> {
    return {
      left: `${(shape.x / shape.originalWidth) * 100}%`,
      top: `${(shape.y / shape.originalHeight) * 100}%`,
      width: `${(shape.width / shape.originalWidth) * 100}%`,
      height: `${(shape.height / shape.originalHeight) * 100}%`,
    };
  }

  getLabelStyle(shape: ParsedShape): Record<string, string> {
    const leftPct = (shape.x / shape.originalWidth) * 100;
    const topPct = (shape.y / shape.originalHeight) * 100;
    const widthPct = (shape.width / shape.originalWidth) * 100;
    const heightPct = (shape.height / shape.originalHeight) * 100;
    // Center the label anchor on the shape, allow up to 2.5x shape width
    const maxWidthPct = widthPct * 2.5;
    return {
      left: `${leftPct + widthPct / 2}%`,
      top: `${topPct + heightPct / 2}%`,
      'max-width': `${maxWidthPct}%`,
      'max-height': `${heightPct}%`,
    };
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
    this.selectedShape.set(shape);
    if (shape.areaNames.length === 1) {
      this.setArea(shape.areaNames[0]);
    }
    // If multiple areas, user picks from the panel dropdown
  }

  setArea(name: string): void {
    this.selectedAreaName.set(name);
    this.onChange(name);
    this.onTouched();
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
