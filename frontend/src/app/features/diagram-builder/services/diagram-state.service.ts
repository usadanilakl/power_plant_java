import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { DiagramApiService } from './diagram-api.service';
import { DiagramDto, normalizeDiagramData, serializeDiagramData } from '../models/diagram.model';
import { DiagramData } from '../models/diagram-placement.model';
import { DiagramShapeManagerService } from './diagram-shape-manager.service';
import { Subject, debounceTime } from 'rxjs';

@Injectable()
export class DiagramStateService {
  private api = inject(DiagramApiService);
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
    const data: DiagramData = {
      schemaVersion: 1,
      placements: this.shapeManager.shapes(),
      connections: this.shapeManager.connections(),
    };
    const serialized = serializeDiagramData(data);

    const updated: DiagramDto = {
      ...diagram,
      shapesJson: serialized.shapesJson,
      connectionsJson: serialized.connectionsJson,
    };

    this.api.update(diagram.id, updated).subscribe({
      next: (res) => {
        if (res.responseData) {
          this.currentDiagram.set(res.responseData);
        }
        this.isDirty.set(false);
        this.isSaving.set(false);
      },
      error: () => this.isSaving.set(false),
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
