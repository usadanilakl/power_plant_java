import { Injectable, inject, signal, computed } from '@angular/core';
import { DiagramApiService } from './diagram-api.service';
import { DiagramDto, DiagramData, parseDiagramData, serializeDiagramData } from '../models/diagram.model';
import { DiagramShapeManagerService } from './diagram-shape-manager.service';
import { Subject, debounceTime } from 'rxjs';

@Injectable()
export class DiagramStateService {
  private api = inject(DiagramApiService);

  readonly currentDiagram = signal<DiagramDto | null>(null);
  readonly isDirty = signal(false);
  readonly isSaving = signal(false);
  readonly isLoading = signal(false);

  readonly diagramName = computed(() => this.currentDiagram()?.name ?? 'Untitled Diagram');

  private saveSubject = new Subject<void>();
  private shapeManager: DiagramShapeManagerService | null = null;

  constructor() {
    this.saveSubject.pipe(debounceTime(2000)).subscribe(() => {
      this.save();
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
          const data = parseDiagramData(res.responseData);
          if (this.shapeManager) {
            this.shapeManager.setShapes(data.shapes);
            this.shapeManager.setConnections(data.connections);
          }
          this.isDirty.set(false);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  createNewDiagram(name = 'Untitled Diagram'): void {
    const dto: DiagramDto = {
      name,
      canvasWidth: 1920,
      canvasHeight: 1080,
      gridSize: 20,
      shapesJson: '[]',
      connectionsJson: '[]',
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
        }
      },
    });
  }

  markDirty(): void {
    this.isDirty.set(true);
    this.saveSubject.next();
  }

  save(): void {
    const diagram = this.currentDiagram();
    if (!diagram || !diagram.id || !this.shapeManager) return;

    this.isSaving.set(true);
    const data: DiagramData = {
      shapes: this.shapeManager.shapes(),
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
