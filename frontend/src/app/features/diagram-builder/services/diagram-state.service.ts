import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Subject, debounceTime } from 'rxjs';
import { DiagramApiService } from './diagram-api.service';
import { DiagramPlacementApiService } from './diagram-placement-api.service';
import { DiagramConnectionApiService } from './diagram-connection-api.service';
import { DiagramDto, normalizeDiagramData, serializeDiagramData } from '../models/diagram.model';
import { DiagramData } from '../models/diagram-placement.model';
import { DiagramShapeManagerService } from './diagram-shape-manager.service';
import { dtoToPlacement, placementToDto } from '../models/diagram-placement-dto.model';
import { dtoToConnection, connectionToDto } from '../models/diagram-connection-dto.model';

@Injectable()
export class DiagramStateService {
  private api = inject(DiagramApiService);
  private placementApi = inject(DiagramPlacementApiService);
  private connectionApi = inject(DiagramConnectionApiService);
  private router = inject(Router);

  readonly currentDiagram = signal<DiagramDto | null>(null);
  readonly isDirty = signal(false);
  readonly isSaving = signal(false);
  readonly isLoading = signal(false);

  readonly diagramName = computed(() => this.currentDiagram()?.name ?? 'Untitled Diagram');

  private saveSubject = new Subject<void>();
  private shapeManager: DiagramShapeManagerService | null = null;

  constructor() {
    this.saveSubject.pipe(debounceTime(2000)).subscribe(() => {
      this.saveNow();
    });
  }

  setShapeManager(manager: DiagramShapeManagerService): void {
    this.shapeManager = manager;
  }

  loadDiagram(id: number): void {
    this.isLoading.set(true);

    // Load diagram metadata + try entity endpoints in parallel
    forkJoin({
      diagram: this.api.getById(id),
      placements: this.placementApi.getByDiagram(id),
      connections: this.connectionApi.getByDiagram(id),
    }).subscribe({
      next: ({ diagram, placements, connections }) => {
        if (!diagram.responseData) {
          this.isLoading.set(false);
          return;
        }

        this.currentDiagram.set(diagram.responseData);

        const hasEntities = placements.responseData && placements.responseData.length > 0;

        if (hasEntities && this.shapeManager) {
          // Load from normalized entities
          const shapes = placements.responseData!.map(dtoToPlacement);
          const conns = (connections.responseData ?? []).map(dtoToConnection);
          this.shapeManager.setShapes(shapes);
          this.shapeManager.setConnections(conns);
        } else if (this.shapeManager) {
          // Fallback: parse legacy JSON blob
          const data = normalizeDiagramData(diagram.responseData);
          this.shapeManager.setShapes(data.placements);
          this.shapeManager.setConnections(data.connections);
        }

        this.isDirty.set(false);
        this.isLoading.set(false);
      },
      error: () => {
        // If entity endpoints fail, fall back to JSON-only load
        this.api.getById(id).subscribe({
          next: (res) => {
            if (res.responseData) {
              this.currentDiagram.set(res.responseData);
              const data = normalizeDiagramData(res.responseData);
              if (this.shapeManager) {
                this.shapeManager.setShapes(data.placements);
                this.shapeManager.setConnections(data.connections);
              }
              this.isDirty.set(false);
            }
            this.isLoading.set(false);
          },
          error: () => this.isLoading.set(false),
        });
      },
    });
  }

  createNewDiagram(
    name = 'Untitled Diagram',
    context?: { contextFileId?: number; contextFileName?: string }
  ): void {
    const dto: DiagramDto = {
      name,
      canvasWidth: 1920,
      canvasHeight: 1080,
      gridSize: 20,
      shapesJson: JSON.stringify({ schemaVersion: 1, placements: [], connections: [] }),
      connectionsJson: '',
      contextFileId: context?.contextFileId,
      contextFileName: context?.contextFileName,
    };
    this.api.create(dto).subscribe({
      next: (res) => {
        if (res.responseData) {
          this.currentDiagram.set(res.responseData);
          if (this.shapeManager) {
            this.shapeManager.setShapes([]);
            this.shapeManager.setConnections([]);
          }
          this.isDirty.set(false);
          if (res.responseData.id != null) {
            this.router.navigate(['diagram-builder', 'build', res.responseData.id], { replaceUrl: true });
          }
        }
      },
    });
  }

  markDirty(): void {
    this.isDirty.set(true);
    this.saveSubject.next();
  }

  saveNow(): void {
    const diagram = this.currentDiagram();
    if (!diagram || !diagram.id || !this.shapeManager) return;

    this.isSaving.set(true);
    const shapes = this.shapeManager.shapes();
    const connections = this.shapeManager.connections();
    const diagramId = diagram.id;

    // Save to normalized entity endpoints
    const placementDtos = shapes.map(p => placementToDto(p, diagramId));
    const connectionDtos = connections.map(c => connectionToDto(c, diagramId));

    // Dual-write: also update JSON blob for backward compatibility
    const data: DiagramData = { schemaVersion: 1, placements: shapes, connections };
    const serialized = serializeDiagramData(data);
    const updatedDiagram: DiagramDto = {
      ...diagram,
      shapesJson: serialized.shapesJson,
      connectionsJson: serialized.connectionsJson,
    };

    forkJoin({
      diagram: this.api.update(diagramId, updatedDiagram),
      placements: this.placementApi.bulkSave(diagramId, placementDtos),
      connections: this.connectionApi.bulkSave(diagramId, connectionDtos),
    }).subscribe({
      next: ({ diagram: diagRes }) => {
        // Only adopt the saved DTO / clear dirty if we're STILL on this diagram — a stale save of a diagram we've
        // since switched away from (e.g. plant-map drill: save parent, then load child) must not clobber currentDiagram.
        if (this.currentDiagram()?.id === diagramId) {
          if (diagRes.responseData) this.currentDiagram.set(diagRes.responseData);
          this.isDirty.set(false);
        }
        this.isSaving.set(false);
      },
      error: () => {
        // If entity save fails, fall back to JSON-only save
        this.api.update(diagramId, updatedDiagram).subscribe({
          next: (res) => {
            if (this.currentDiagram()?.id === diagramId) {
              if (res.responseData) this.currentDiagram.set(res.responseData);
              this.isDirty.set(false);
            }
            this.isSaving.set(false);
          },
          error: () => this.isSaving.set(false),
        });
      },
    });
  }

  updateDiagramMeta(updates: Partial<DiagramDto>): void {
    const current = this.currentDiagram();
    if (current) {
      this.currentDiagram.set({ ...current, ...updates });
      this.markDirty();
    }
  }
}
