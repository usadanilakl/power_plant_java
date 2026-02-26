import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { WorkAreaDto, WorkAreaMapShapeDto, WorkAreaPermitCounts } from '../../../../models/permits/work-area.model';
import { WorkAreaApiService } from '../services/work-area-api.service';
import { RfRectangleShape, RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';

export type WorkAreaMapMode = 'dev' | 'operator' | 'overview';

@Injectable()
export class WorkAreaMapStateService {
  private api = inject(WorkAreaApiService);
  private destroyRef = inject(DestroyRef);

  // --- Core state ---
  mode = signal<WorkAreaMapMode>('operator');
  workAreas = signal<WorkAreaDto[]>([]);
  shapes = signal<WorkAreaMapShapeDto[]>([]);
  permitCounts = signal<WorkAreaPermitCounts[]>([]);
  isLoading = signal(false);

  // --- Map image ---
  plantMapImageUrl = signal<string>('');

  // --- Selection ---
  selectedShapeId = signal<number | null>(null);
  hoveredShapeId = signal<number | null>(null);
  selectedWorkArea = signal<WorkAreaDto | null>(null);

  // --- UI ---
  formOpen = signal(false);
  editingWorkArea = signal<WorkAreaDto | null>(null);

  // --- Info Window ---
  showInfoWindow = signal(false);
  infoWindowWorkAreas = signal<WorkAreaDto[]>([]);

  // --- Computed ---

  /** Convert WorkAreaMapShapeDtos to RfShapes for the InteractiveImageComponent */
  rfShapes = computed<RfShape[]>(() => {
    const shapes = this.shapes();
    const mode = this.mode();
    const permitCountsData = this.permitCounts();

    return shapes.map(shape => this.mapShapeToRf(shape, mode, permitCountsData));
  });

  /** Work areas associated with the currently hovered shape */
  hoveredShapeWorkAreas = computed(() => {
    const shapeId = this.hoveredShapeId();
    if (!shapeId) return [];
    const shape = this.shapes().find(s => s.id === shapeId);
    if (!shape) return [];
    return this.workAreas().filter(wa => shape.workAreaIds.includes(wa.id));
  });

  /** Work areas associated with the currently selected shape */
  selectedShapeWorkAreas = computed(() => {
    const shapeId = this.selectedShapeId();
    if (!shapeId) return [];
    const shape = this.shapes().find(s => s.id === shapeId);
    if (!shape) return [];
    return this.workAreas().filter(wa => shape.workAreaIds.includes(wa.id));
  });

  /** Permit counts for the currently hovered shape */
  hoveredShapePermitCounts = computed(() => {
    const workAreas = this.hoveredShapeWorkAreas();
    const counts = this.permitCounts();
    return workAreas.map(wa => counts.find(c => c.workArea?.id === wa.id)).filter(Boolean) as WorkAreaPermitCounts[];
  });

  /** Work areas not yet assigned to any shape */
  unassignedWorkAreas = computed(() => {
    const allShapeWorkAreaIds = new Set(this.shapes().flatMap(s => s.workAreaIds));
    return this.workAreas().filter(wa => !allShapeWorkAreaIds.has(wa.id));
  });

  // --- Data Loading ---

  loadAll(): void {
    this.isLoading.set(true);
    forkJoin({
      workAreas: this.api.getAll(),
      shapes: this.api.getAllShapes(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ workAreas, shapes }) => {
        this.workAreas.set(workAreas);
        this.shapes.set(shapes);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
    this.loadMapImage();
  }

  loadMapImage(): void {
    this.api.getMapImage().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (path) => {
        if (path) {
          this.plantMapImageUrl.set(path);
        }
      },
    });
  }

  uploadMapImage(file: File): void {
    this.isLoading.set(true);
    this.api.uploadMapImage(file).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (fileLink) => {
        this.plantMapImageUrl.set(fileLink);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  loadPermitCounts(): void {
    this.api.getWithPermitCounts().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => this.permitCounts.set(data),
    });
  }

  // --- Mode ---

  setMode(mode: WorkAreaMapMode): void {
    this.mode.set(mode);
    this.clearSelection();
    if (mode === 'overview') {
      this.loadPermitCounts();
    }
  }

  // --- Selection ---

  selectShape(shapeId: number | null): void {
    this.selectedShapeId.set(shapeId);
    if (shapeId) {
      const shape = this.shapes().find(s => s.id === shapeId);
      if (shape && shape.workAreaIds.length > 0) {
        const wa = this.workAreas().find(w => shape.workAreaIds.includes(w.id));
        this.selectedWorkArea.set(wa ?? null);
      }
    } else {
      this.selectedWorkArea.set(null);
    }
  }

  clearSelection(): void {
    this.selectedShapeId.set(null);
    this.hoveredShapeId.set(null);
    this.selectedWorkArea.set(null);
    this.hideInfoWindow();
  }

  // --- Info Window ---

  showShapeInfoWindow(shapeId: number): void {
    const shape = this.shapes().find(s => s.id === shapeId);
    if (shape && shape.workAreaIds.length > 0) {
      const workAreas = this.workAreas().filter(wa => shape.workAreaIds.includes(wa.id));
      this.infoWindowWorkAreas.set(workAreas);
      this.showInfoWindow.set(true);
    } else {
      this.infoWindowWorkAreas.set([]);
      this.showInfoWindow.set(true);
    }
  }

  hideInfoWindow(): void {
    this.showInfoWindow.set(false);
    this.infoWindowWorkAreas.set([]);
  }

  // --- Shape CRUD ---

  saveShape(shape: RfShape, autoSelect = false): void {
    const dto = this.rfShapeToDto(shape);
    this.api.saveShape(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.shapes.update(shapes => {
          const idx = shapes.findIndex(s => s.id === saved.id);
          if (idx >= 0) {
            const updated = [...shapes];
            updated[idx] = saved;
            return updated;
          }
          return [...shapes, saved];
        });
        if (autoSelect) {
          this.selectedShapeId.set(saved.id);
        }
      },
    });
  }

  deleteShape(shapeId: number): void {
    this.api.deleteShape(shapeId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.shapes.update(shapes => shapes.filter(s => s.id !== shapeId));
        if (this.selectedShapeId() === shapeId) {
          this.clearSelection();
        }
      },
    });
  }

  // --- Work Area Assignment ---

  assignWorkAreaToShape(workAreaId: number, shapeId: number): void {
    const shape = this.shapes().find(s => s.id === shapeId);
    if (!shape) return;

    const updatedDto: WorkAreaMapShapeDto = {
      ...shape,
      workAreaIds: [...new Set([...shape.workAreaIds, workAreaId])],
    };

    this.api.saveShape(updatedDto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.shapes.update(shapes => shapes.map(s => s.id === saved.id ? saved : s));

        // Also update the work area's shapeId
        const wa = this.workAreas().find(w => w.id === workAreaId);
        if (wa) {
          const updatedWa = new WorkAreaDto({ ...wa, shapeId: saved.id });
          this.api.save(updatedWa).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (savedWa) => {
              this.workAreas.update(areas => areas.map(a => a.id === savedWa.id ? savedWa : a));
            },
          });
        }
      },
    });
  }

  removeWorkAreaFromShape(workAreaId: number, shapeId: number): void {
    const shape = this.shapes().find(s => s.id === shapeId);
    if (!shape) return;

    const updatedDto: WorkAreaMapShapeDto = {
      ...shape,
      workAreaIds: shape.workAreaIds.filter(id => id !== workAreaId),
    };

    this.api.saveShape(updatedDto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.shapes.update(shapes => shapes.map(s => s.id === saved.id ? saved : s));
      },
    });
  }

  // --- Form ---

  openWorkAreaForm(workArea?: WorkAreaDto): void {
    this.editingWorkArea.set(workArea ?? new WorkAreaDto());
    this.formOpen.set(true);
  }

  closeWorkAreaForm(): void {
    this.formOpen.set(false);
    this.editingWorkArea.set(null);
  }

  // --- Work Area CRUD ---

  saveWorkArea(dto: WorkAreaDto): void {
    this.api.save(dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.workAreas.update(areas => {
          const idx = areas.findIndex(a => a.id === saved.id);
          if (idx >= 0) {
            const updated = [...areas];
            updated[idx] = saved;
            return updated;
          }
          return [...areas, saved];
        });
        this.closeWorkAreaForm();
      },
    });
  }

  deleteWorkArea(id: number): void {
    this.api.delete(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.workAreas.update(areas => areas.filter(a => a.id !== id));
        // Remove from any shapes that reference this work area
        this.shapes().forEach(shape => {
          if (shape.workAreaIds.includes(id)) {
            this.removeWorkAreaFromShape(id, shape.id);
          }
        });
        this.closeWorkAreaForm();
        if (this.selectedWorkArea()?.id === id) {
          this.selectedWorkArea.set(null);
        }
      },
    });
  }

  // --- Helpers ---

  private mapShapeToRf(
    shape: WorkAreaMapShapeDto,
    mode: WorkAreaMapMode,
    permitCounts: WorkAreaPermitCounts[]
  ): RfRectangleShape {
    let coords = { x: 0, y: 0, width: 100, height: 100, rotation: 0 };
    let picW = 1000;
    let picH = 800;

    // Parse coordinates JSON
    if (shape.coordinates) {
      try {
        // Handle both JSON and custom format: {startX:0,startY:0,...}
        const cleaned = shape.coordinates
          .replace(/(\w+):/g, '"$1":')
          .replace(/'/g, '"');
        const parsed = JSON.parse(cleaned);
        coords = {
          x: parsed.startX ?? parsed.x ?? 0,
          y: parsed.startY ?? parsed.y ?? 0,
          width: parsed.width ?? 100,
          height: parsed.height ?? 100,
          rotation: parsed.rotation ?? 0,
        };
      } catch {
        // Fallback - try direct parse
        try {
          const parsed = JSON.parse(shape.coordinates);
          coords = {
            x: parsed.startX ?? parsed.x ?? 0,
            y: parsed.startY ?? parsed.y ?? 0,
            width: parsed.width ?? 100,
            height: parsed.height ?? 100,
            rotation: parsed.rotation ?? 0,
          };
        } catch {
          // Use defaults
        }
      }
    }

    // Parse original picture size
    if (shape.originalPictureSize) {
      const match = shape.originalPictureSize.match(/width:(\d+),height:(\d+)/);
      if (match) {
        picW = parseInt(match[1], 10);
        picH = parseInt(match[2], 10);
      }
    }

    // Color based on mode
    let color = '#3b82f6'; // Blue default
    if (mode === 'overview') {
      const totalPermits = this.getShapeTotalPermits(shape, permitCounts);
      if (totalPermits > 5) color = '#ef4444';      // Red - high activity
      else if (totalPermits > 2) color = '#f59e0b';  // Amber - moderate
      else if (totalPermits > 0) color = '#22c55e';   // Green - low
      else color = '#94a3b8';                          // Gray - no permits
    }

    return {
      id: shape.id,
      fileId: 0,
      type: 'rectangle' as const,
      color,
      originalPictureWidth: picW,
      originalPictureHeight: picH,
      originalWidth: coords.width,
      originalHeight: coords.height,
      isSelected: false,
      isBulkSelected: false,
      currentImgWidth: picW,
      currentImgHeigth: picH,
      scaleToCurrentImage: 1,
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
      rotation: coords.rotation,
    };
  }

  private getShapeTotalPermits(shape: WorkAreaMapShapeDto, counts: WorkAreaPermitCounts[]): number {
    return shape.workAreaIds.reduce((total, waId) => {
      const c = counts.find(pc => pc.workArea?.id === waId);
      if (c) return total + c.safeWorkCount + c.hotWorkCount + c.confinedSpaceCount;
      return total;
    }, 0);
  }

  private rfShapeToDto(shape: RfShape): WorkAreaMapShapeDto {
    const rect = shape as RfRectangleShape;
    return {
      id: shape.id > 0 ? shape.id : 0, // 0 for new shapes (server generates ID)
      coordinates: JSON.stringify({
        startX: rect.x,
        startY: rect.y,
        endX: rect.x + rect.width,
        endY: rect.y + rect.height,
        width: rect.width,
        height: rect.height,
        rotation: rect.rotation || 0,
      }).replace(/^"|"$/g, '').replace(/\\/g, '').replace(/"(\w+)":/g, '$1:'),
      originalPictureSize: `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`,
      label: '',
      workAreaIds: [],
    };
  }
}
