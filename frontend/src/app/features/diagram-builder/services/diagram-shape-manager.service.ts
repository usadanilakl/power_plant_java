import { Injectable, computed, signal } from '@angular/core';
import { DiagramConnection, DiagramElement } from '../models/diagram-shape.model';

let groupCounter = 0;

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

  readonly selectionCount = computed(() => this._selectedShapeIds().size);

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
    if (ids.size === 0) return;
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
    const shape = this.getShapeById(id);
    if (!shape) return;

    // If shape is in a group, select all group members
    const groupIds = shape.groupId
      ? this._shapes().filter(s => s.groupId === shape.groupId).map(s => s.id)
      : [id];

    if (exclusive) {
      this._selectedShapeIds.set(new Set(groupIds));
    } else {
      this._selectedShapeIds.update(ids => {
        const next = new Set(ids);
        for (const gid of groupIds) next.add(gid);
        return next;
      });
    }
  }

  deselectShape(id: number): void {
    const shape = this.getShapeById(id);
    const groupIds = shape?.groupId
      ? this._shapes().filter(s => s.groupId === shape.groupId).map(s => s.id)
      : [id];

    this._selectedShapeIds.update(ids => {
      const next = new Set(ids);
      for (const gid of groupIds) next.delete(gid);
      return next;
    });
  }

  toggleShapeSelection(id: number): void {
    if (this.isSelected(id)) {
      this.deselectShape(id);
    } else {
      this.selectShape(id, false);
    }
  }

  selectMultiple(ids: number[]): void {
    this._selectedShapeIds.set(new Set(ids));
  }

  selectShapesInRect(x1: number, y1: number, x2: number, y2: number): void {
    const left = Math.min(x1, x2);
    const top = Math.min(y1, y2);
    const right = Math.max(x1, x2);
    const bottom = Math.max(y1, y2);

    const hitIds = new Set<number>();
    for (const s of this._shapes()) {
      // Shape intersects rect if any part overlaps
      if (s.x + s.width >= left && s.x <= right &&
          s.y + s.height >= top && s.y <= bottom) {
        hitIds.add(s.id);
        // Also select group members
        if (s.groupId) {
          for (const gs of this._shapes()) {
            if (gs.groupId === s.groupId) hitIds.add(gs.id);
          }
        }
      }
    }
    this._selectedShapeIds.set(hitIds);
  }

  clearSelection(): void {
    this._selectedShapeIds.set(new Set());
  }

  isSelected(id: number): boolean {
    return this._selectedShapeIds().has(id);
  }

  // --- Grouping ---

  groupSelected(): string | null {
    const selected = this.selectedShapes();
    if (selected.length < 2) return null;

    const groupId = `group-${++groupCounter}-${Date.now()}`;
    this._shapes.update(shapes =>
      shapes.map(s => this._selectedShapeIds().has(s.id)
        ? { ...s, groupId } as DiagramElement
        : s
      )
    );
    return groupId;
  }

  ungroupSelected(): void {
    this._shapes.update(shapes =>
      shapes.map(s => this._selectedShapeIds().has(s.id)
        ? { ...s, groupId: undefined } as DiagramElement
        : s
      )
    );
  }

  hasGroupInSelection(): boolean {
    return this.selectedShapes().some(s => !!s.groupId);
  }
}
