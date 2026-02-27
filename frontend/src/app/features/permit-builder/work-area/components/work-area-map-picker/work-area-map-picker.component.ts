import {
  Component, DestroyRef, ElementRef, forwardRef, inject, signal, ViewChild, OnInit, output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { WorkAreaApiService } from '../../services/work-area-api.service';
import { WorkAreaDto, WorkAreaMapShapeDto } from '../../../../../models/permits/work-area.model';

interface ParsedShape {
  dto: WorkAreaMapShapeDto;
  x: number;
  y: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  workAreas: WorkAreaDto[];
}

@Component({
  selector: 'app-work-area-map-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work-area-map-picker.component.html',
  styleUrl: './work-area-map-picker.component.css',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WorkAreaMapPickerComponent),
      multi: true,
    },
  ],
})
export class WorkAreaMapPickerComponent implements ControlValueAccessor, OnInit {
  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomElement') zoomElement!: ElementRef<HTMLDivElement>;

  private api = inject(WorkAreaApiService);
  private destroyRef = inject(DestroyRef);

  workAreaSelected = output<WorkAreaDto | null>();

  shapes = signal<ParsedShape[]>([]);
  selectedWorkAreaId = signal<number | null>(null);
  selectedShape = signal<ParsedShape | null>(null);
  imageUrl = signal<string | null>(null);
  loading = signal(true);
  errorMessage = signal<string | null>(null);

  private allWorkAreas: WorkAreaDto[] = [];

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

  // CVA
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.loadData();
  }

  // --- ControlValueAccessor ---

  writeValue(value: number | null): void {
    this.selectedWorkAreaId.set(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // --- Data Loading ---

  private loadData(): void {
    forkJoin({
      areas: this.api.getAll(),
      shapes: this.api.getAllShapes(),
      imagePath: this.api.getMapImage(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ areas, shapes, imagePath }) => {
        this.allWorkAreas = areas;
        const areaMap = new Map(areas.map(a => [a.id, a]));
        const parsed = shapes.map(s => this.parseShape(s, areaMap));
        this.shapes.set(parsed);
        if (imagePath) {
          const url = imagePath.startsWith('/') || imagePath.startsWith('http') ? imagePath : '/' + imagePath;
          this.imageUrl.set(url.replaceAll('pdf', 'jpg'));
        }
        this.loading.set(false);

        // Restore selectedShape if writeValue was called before data loaded
        const pendingId = this.selectedWorkAreaId();
        if (pendingId) {
          const match = parsed.find(s => s.workAreas.some(wa => wa.id === pendingId));
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

  private parseShape(dto: WorkAreaMapShapeDto, areaMap: Map<number, WorkAreaDto>): ParsedShape {
    let x = 0, y = 0, width = 100, height = 100;
    let originalWidth = 1000, originalHeight = 1000;

    try {
      const jsonStr = dto.coordinates.replace(/(\w+)\s*:/g, '"$1":');
      const coords = JSON.parse(jsonStr);
      x = coords.startX ?? coords.x ?? 0;
      y = coords.startY ?? coords.y ?? 0;
      width = coords.width ?? 100;
      height = coords.height ?? 100;
    } catch { /* use defaults */ }

    try {
      const sizeStr = dto.originalPictureSize ?? '';
      const wMatch = sizeStr.match(/width\s*:\s*(\d+)/);
      const hMatch = sizeStr.match(/height\s*:\s*(\d+)/);
      if (wMatch) originalWidth = parseFloat(wMatch[1]);
      if (hMatch) originalHeight = parseFloat(hMatch[1]);
    } catch { /* use defaults */ }

    const workAreas = (dto.workAreaIds ?? [])
      .map(id => areaMap.get(id))
      .filter((wa): wa is WorkAreaDto => !!wa);

    return { dto, x, y, width, height, originalWidth, originalHeight, workAreas };
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
    const maxWidthPct = widthPct * 2;
    return {
      left: `${leftPct + widthPct / 2}%`,
      top: `${topPct + heightPct / 2}%`,
      'max-width': `${maxWidthPct}%`,
      'max-height': `${heightPct}%`,
    };
  }

  getDisplayName(shape: ParsedShape): string {
    const names = shape.workAreas.map(wa => wa.name);
    if (names.length === 0) return shape.dto.label || 'Unknown';
    return names.length === 1 ? names[0] : names.join(' / ');
  }

  isSelected(shape: ParsedShape): boolean {
    const selectedId = this.selectedWorkAreaId();
    return !!selectedId && shape.workAreas.some(wa => wa.id === selectedId);
  }

  // --- Selection ---

  selectShape(shape: ParsedShape): void {
    this.selectedShape.set(shape);
    if (shape.workAreas.length === 1) {
      this.setWorkArea(shape.workAreas[0]);
    }
  }

  setWorkArea(workArea: WorkAreaDto): void {
    this.selectedWorkAreaId.set(workArea.id);
    this.onChange(workArea.id);
    this.onTouched();
    this.workAreaSelected.emit(workArea);
  }

  isAreaSelected(workArea: WorkAreaDto): boolean {
    return this.selectedWorkAreaId() === workArea.id;
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
