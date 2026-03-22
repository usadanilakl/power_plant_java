import { Injectable, computed, signal } from '@angular/core';
import { DiagramConnection, DiagramElement } from '../models/diagram-shape.model';

@Injectable()
export class DiagramShapeManagerService {
  private _shapes = signal<DiagramElement[]>([]);
  private _connections = signal<DiagramConnection[]>([]);
  private _selectedShapeIds = signal<Set<number>>(new Set());
  private _nextShapeId = 1;
  private _nextConnectionId = 1;

  readonly shapes = this._shapes.asReadonly();
  readonly connections = this._connections.asReadonly();
  readonly selectedShapeIds = this._selectedShapeIds.asReadonly();

  readonly selectedShapes = computed(() => {
    const ids = this._selectedShapeIds();
    return this._shapes().filter(s => ids.has(s.id));
  });

  readonly singleSelectedShape = computed(() => {
    const selected = this.selectedShapes();
    return selected.length === 1 ? selected[0] : null;
  });

  readonly hasSelection = computed(() => this._selectedShapeIds().size > 0);

  // --- Shape CRUD ---

  setShapes(shapes: DiagramElement[]): void {
    this._shapes.set([...shapes]);
    this._nextShapeId = shapes.length > 0
      ? Math.max(...shapes.map(s => s.id)) + 1
      : 1;
  }

  setConnections(connections: DiagramConnection[]): void {
    this._connections.set([...connections]);
    this._nextConnectionId = connections.length > 0
      ? Math.max(...connections.map(c => c.id)) + 1
      : 1;
  }

  addShape(shape: Omit<DiagramElement, 'id'>): DiagramElement {
    const newShape = { ...shape, id: this._nextShapeId++ } as DiagramElement;
    this._shapes.update(shapes => [...shapes, newShape]);
    return newShape;
  }

  updateShape(id: number, updates: Partial<DiagramElement>): void {
    this._shapes.update(shapes =>
      shapes.map(s => s.id === id ? { ...s, ...updates } as DiagramElement : s)
    );
  }

  deleteShape(id: number): void {
    this._shapes.update(shapes => shapes.filter(s => s.id !== id));
    this._connections.update(conns =>
      conns.filter(c => c.sourceShapeId !== id && c.targetShapeId !== id)
    );
    this._selectedShapeIds.update(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  deleteSelectedShapes(): void {
    const ids = this._selectedShapeIds();
    this._shapes.update(shapes => shapes.filter(s => !ids.has(s.id)));
    this._connections.update(conns =>
      conns.filter(c => !ids.has(c.sourceShapeId) && !ids.has(c.targetShapeId))
    );
    this._selectedShapeIds.set(new Set());
  }

  getShapeById(id: number): DiagramElement | undefined {
    return this._shapes().find(s => s.id === id);
  }

  // --- Connection CRUD ---

  addConnection(connection: Omit<DiagramConnection, 'id'>): DiagramConnection {
    const newConn = { ...connection, id: this._nextConnectionId++ };
    this._connections.update(conns => [...conns, newConn]);
    return newConn;
  }

  updateConnection(id: number, updates: Partial<DiagramConnection>): void {
    this._connections.update(conns =>
      conns.map(c => c.id === id ? { ...c, ...updates } : c)
    );
  }

  deleteConnection(id: number): void {
    this._connections.update(conns => conns.filter(c => c.id !== id));
  }

  // --- Selection ---

  selectShape(id: number, exclusive = true): void {
    if (exclusive) {
      this._selectedShapeIds.set(new Set([id]));
    } else {
      this._selectedShapeIds.update(ids => {
        const next = new Set(ids);
        next.add(id);
        return next;
      });
    }
  }

  deselectShape(id: number): void {
    this._selectedShapeIds.update(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  toggleShapeSelection(id: number): void {
    this._selectedShapeIds.update(ids => {
      const next = new Set(ids);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  selectMultiple(ids: number[]): void {
    this._selectedShapeIds.set(new Set(ids));
  }

  clearSelection(): void {
    this._selectedShapeIds.set(new Set());
  }

  isSelected(id: number): boolean {
    return this._selectedShapeIds().has(id);
  }
}
