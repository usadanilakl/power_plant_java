import { Injectable, computed, signal } from '@angular/core';
import { DiagramConnection, DiagramPlacement } from '../models/diagram-placement.model';

let groupCounter = 0;

@Injectable()
export class DiagramShapeManagerService {
  private _shapes = signal<DiagramPlacement[]>([]);
  private _connections = signal<DiagramConnection[]>([]);
  private _selectedShapeIds = signal<Set<number>>(new Set());
  private _selectedConnectionId = signal<number | null>(null);
  private _nextShapeId = 1;
  private _nextConnectionId = 1;

  readonly shapes = this._shapes.asReadonly();
  readonly connections = this._connections.asReadonly();
  readonly selectedShapeIds = this._selectedShapeIds.asReadonly();
  readonly selectedConnectionId = this._selectedConnectionId.asReadonly();

  readonly selectedShapes = computed(() => {
    const ids = this._selectedShapeIds();
    return this._shapes().filter(s => ids.has(s.id));
  });

  readonly singleSelectedShape = computed(() => {
    const selected = this.selectedShapes();
    return selected.length === 1 ? selected[0] : null;
  });

  readonly singleSelectedConnection = computed(() => {
    const id = this._selectedConnectionId();
    return id == null ? null : this._connections().find(c => c.id === id) ?? null;
  });

  readonly hasSelection = computed(() => this._selectedShapeIds().size > 0 || this._selectedConnectionId() != null);

  readonly selectionCount = computed(() => this._selectedShapeIds().size);

  // --- Shape CRUD ---

  setShapes(shapes: DiagramPlacement[]): void {
    this._shapes.set([...shapes]);
    this._nextShapeId = shapes.length > 0
      ? Math.max(...shapes.map(s => s.id)) + 1
      : 1;
  }

  setConnections(connections: DiagramConnection[]): void {
    this._connections.set([...connections]);
    this._selectedConnectionId.set(null);
    this._nextConnectionId = connections.length > 0
      ? Math.max(...connections.map(c => c.id)) + 1
      : 1;
  }

  addShape(shape: Omit<DiagramPlacement, 'id'>): DiagramPlacement {
    const newShape = { ...shape, id: this._nextShapeId++ } as DiagramPlacement;
    this._shapes.update(shapes => [...shapes, newShape]);
    return newShape;
  }

  updateShape(id: number, updates: Partial<DiagramPlacement>): void {
    this._shapes.update(shapes =>
      shapes.map(s => s.id === id ? { ...s, ...updates } as DiagramPlacement : s)
    );
  }

  deleteShape(id: number): void {
    this._shapes.update(shapes => shapes.filter(s => s.id !== id));
    this._connections.update(conns =>
      conns.filter(c => c.sourcePlacementId !== id && c.targetPlacementId !== id)
    );
    this._selectedShapeIds.update(ids => {
      const next = new Set(ids);
      next.delete(id);
      return next;
    });
  }

  deleteSelectedShapes(): void {
    const ids = this._selectedShapeIds();
    const selectedConnectionId = this._selectedConnectionId();
    if (ids.size === 0 && selectedConnectionId == null) return;

    if (ids.size > 0) {
      this._shapes.update(shapes => shapes.filter(s => !ids.has(s.id)));
      this._connections.update(conns =>
        conns.filter(c => !ids.has(c.sourcePlacementId) && !ids.has(c.targetPlacementId))
      );
      this._selectedShapeIds.set(new Set());
    }

    if (selectedConnectionId != null) {
      this._connections.update(conns => conns.filter(c => c.id !== selectedConnectionId));
      this._selectedConnectionId.set(null);
    }
  }

  getShapeById(id: number): DiagramPlacement | undefined {
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
    if (this._selectedConnectionId() === id) {
      this._selectedConnectionId.set(null);
    }
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
      this._selectedConnectionId.set(null);
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
    this._selectedConnectionId.set(null);
  }

  selectConnection(id: number): void {
    const connection = this._connections().find(c => c.id === id);
    if (!connection) return;
    this._selectedShapeIds.set(new Set());
    this._selectedConnectionId.set(id);
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
    this._selectedConnectionId.set(null);
  }

  clearSelection(): void {
    this._selectedShapeIds.set(new Set());
    this._selectedConnectionId.set(null);
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
        ? { ...s, groupId } as DiagramPlacement
        : s
      )
    );
    return groupId;
  }

  ungroupSelected(): void {
    this._shapes.update(shapes =>
      shapes.map(s => this._selectedShapeIds().has(s.id)
        ? { ...s, groupId: undefined } as DiagramPlacement
        : s
      )
    );
  }

  hasGroupInSelection(): boolean {
    return this.selectedShapes().some(s => !!s.groupId);
  }
}
