import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { WorkAreaDto, WorkAreaMapShapeDto, WorkAreaPermitCounts } from '../../../../models/permits/work-area.model';
import { WorkAreaApiService } from '../services/work-area-api.service';
import { RfRectangleShape, RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';
import { SyncUpdateService } from '../../../../services/sync/sync-update.service';
import { SharedDataService } from '../../../../services/shared-data.service';
import { LotoStandardService } from '../../../../services/loto/loto-standard.service';
import { Option } from '../../../../models/option.model';
import { workAreaShapeToCoordinates, workAreaShapeToRf } from '../work-area-shape.util';

export type WorkAreaMapMode = 'dev' | 'operator' | 'overview';

/** A work area's location link, resolved for display: the location's name plus its unit pin. */
export interface ResolvedLocation {
  id: string;
  name: string;
  /** 'U1' / 'U2' when the link is pinned to a unit, '' when it covers both. */
  unitLabel: string;
}

@Injectable()
export class WorkAreaMapStateService {
  private api = inject(WorkAreaApiService);
  private destroyRef = inject(DestroyRef);
  private syncUpdateService = inject(SyncUpdateService);
  private sharedDataService = inject(SharedDataService);
  private lotoStandardService = inject(LotoStandardService);

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

  // --- Reference options (shared) ---
  // Location and LOTO-standard names live here rather than in a single component because both the
  // edit form (which needs them as dropdown options) and the read-only info window (which needs
  // them to turn stored ids into readable names) depend on them.
  locationOptions = signal<Option[]>([]);
  lotoStandardOptions = signal<Option[]>([]);
  private referenceOptionsRequested = false;

  private locationNamesById = computed(
    () => new Map(this.locationOptions().map(o => [String(o.value), o.label]))
  );
  private lotoStandardNamesById = computed(
    () => new Map(this.lotoStandardOptions().map(o => [String(o.value), o.label]))
  );

  constructor() {
    this.syncUpdateService.getEntityTypeUpdates$('WorkArea')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reloadDataPreservingSelection());

    this.syncUpdateService.getEntityTypeUpdates$('WorkAreaMapShape')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.reloadDataPreservingSelection();
        this.loadMapImage();
      });

    // Refetch on SSE reconnect. SSE is at-most-once — any WorkArea /
    // WorkAreaMapShape broadcast that landed during the abort window is
    // dropped. reloadDataPreservingSelection is already the "refetch and
    // keep whatever the user has selected" path; also refresh the map
    // image because a peer's shape edit during the disconnect window
    // could have re-rendered it server-side.
    this.syncUpdateService.reconnected$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.reloadDataPreservingSelection();
        this.loadMapImage();
      });
  }

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

  /**
   * Load the Location / LOTO-standard name lists once per page visit. `SharedDataService` caches
   * with shareReplay so a repeat call is cheap, but the flag keeps a re-entrant caller from piling
   * up LOTO-standard requests (that one is not cached).
   */
  loadReferenceOptions(): void {
    if (this.referenceOptionsRequested) return;
    this.referenceOptionsRequested = true;

    this.sharedDataService.loadLocations()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: locations => this.locationOptions.set(
          locations.map(loc => ({ value: loc.id, label: loc.name || `Location ${loc.id}` }))
        ),
        error: () => this.locationOptions.set([]),
      });

    this.lotoStandardService.getAllLotoStandards()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: response => this.lotoStandardOptions.set(
          (response.responseData ?? []).map(std => ({ value: std.id, label: std.name || `Standard ${std.id}` }))
        ),
        error: () => this.lotoStandardOptions.set([]),
      });
  }

  /** This area's locations as names + unit pins, for read-only display. */
  resolvedLocations(area: WorkAreaDto): ResolvedLocation[] {
    const names = this.locationNamesById();
    const pins = area.locationUnitFilters ?? {};
    return (area.locationIds ?? []).map(id => {
      const key = String(id);
      const pin = pins[key];
      return {
        id: key,
        name: names.get(key) ?? `Location ${key}`,
        unitLabel: pin === '01' ? 'U1' : pin === '02' ? 'U2' : '',
      };
    });
  }

  /** This area's LOTO standards by name, for read-only display. */
  resolvedLotoStandardNames(area: WorkAreaDto): string[] {
    const names = this.lotoStandardNamesById();
    return (area.constantLotoIds ?? []).map(id => names.get(String(id)) ?? `Standard ${id}`);
  }

  /** Active permit counts for one area, or null when none are loaded (non-overview modes). */
  permitCountsFor(workAreaId: number): WorkAreaPermitCounts | null {
    return this.permitCounts().find(pc => pc.workArea?.id === workAreaId) ?? null;
  }

  loadAll(): void {
    this.loadReferenceOptions();
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

  private reloadDataPreservingSelection(): void {
    const selectedShapeId = this.selectedShapeId();
    const selectedWorkAreaId = this.selectedWorkArea()?.id ?? null;

    forkJoin({
      workAreas: this.api.getAll(),
      shapes: this.api.getAllShapes(),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ workAreas, shapes }) => {
        this.workAreas.set(workAreas);
        this.shapes.set(shapes);

        if (selectedShapeId && shapes.some(shape => shape.id === selectedShapeId)) {
          this.selectedShapeId.set(selectedShapeId);
        } else if (selectedShapeId) {
          this.selectedShapeId.set(null);
        }

        if (selectedWorkAreaId) {
          this.selectedWorkArea.set(workAreas.find(area => area.id === selectedWorkAreaId) ?? null);
        }
      },
    });
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
        this.reloadDataPreservingSelection();
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
        this.reloadDataPreservingSelection();
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
        this.selectedWorkArea.set(saved);
        this.closeWorkAreaForm();
      },
    });
  }

  openCounterpartForm(source?: WorkAreaDto): void {
    const base = source ?? this.selectedWorkArea() ?? this.editingWorkArea();
    if (!base) return;

    this.editingWorkArea.set(new WorkAreaDto({
      ...base,
      id: 0,
      name: this.transformCounterpartText(base.name),
      description: this.transformCounterpartText(base.description ?? ''),
      // A counterpart is the same area on the other unit, so its per-location unit
      // pins flip with the name (U1 → U2). Locations themselves are unit-agnostic
      // and carry over as-is.
      locationUnitFilters: this.flipUnitFilters(base.locationUnitFilters),
      shapeId: null,
    }));
    this.formOpen.set(true);
  }

  /** Swap 01 ↔ 02 in a per-location unit-filter map; unpinned locations stay unpinned. */
  private flipUnitFilters(filters: Record<string, string> | null | undefined): Record<string, string> {
    return Object.entries(filters ?? {}).reduce<Record<string, string>>((acc, [locationId, unit]) => {
      if (unit === '01') acc[locationId] = '02';
      else if (unit === '02') acc[locationId] = '01';
      return acc;
    }, {});
  }

  private transformCounterpartText(value: string): string {
    if (!value) return value;

    const replacements: Array<[RegExp, string]> = [
      [/\bU1\b/g, '__UNIT_A__'],
      [/\bU2\b/g, 'U1'],
      [/__UNIT_A__/g, 'U2'],
      [/\bUnit 1\b/g, '__UNIT_ONE__'],
      [/\bUnit 2\b/g, 'Unit 1'],
      [/__UNIT_ONE__/g, 'Unit 2'],
      [/\bunit 1\b/g, '__unit_one__'],
      [/\bunit 2\b/g, 'unit 1'],
      [/__unit_one__/g, 'unit 2'],
    ];

    let transformed = value;
    for (const [pattern, replacement] of replacements) {
      transformed = transformed.replace(pattern, replacement);
    }

    return transformed === value ? `${value} Copy` : transformed;
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
    // Color based on mode
    let color = '#3b82f6'; // Blue default
    if (mode === 'overview') {
      const totalPermits = this.getShapeTotalPermits(shape, permitCounts);
      if (totalPermits > 5) color = '#ef4444';      // Red - high activity
      else if (totalPermits > 2) color = '#f59e0b';  // Amber - moderate
      else if (totalPermits > 0) color = '#22c55e';   // Green - low
      else color = '#94a3b8';                          // Gray - no permits
    }
    return workAreaShapeToRf(shape, color);
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
    const existing = shape.id > 0 ? this.shapes().find(item => item.id === shape.id) : null;
    return {
      id: shape.id > 0 ? shape.id : 0, // 0 for new shapes (server generates ID)
      coordinates: workAreaShapeToCoordinates(rect),
      originalPictureSize: `width:${shape.originalPictureWidth},height:${shape.originalPictureHeight}`,
      label: '',
      workAreaIds: existing?.workAreaIds ?? [],
    };
  }
}
