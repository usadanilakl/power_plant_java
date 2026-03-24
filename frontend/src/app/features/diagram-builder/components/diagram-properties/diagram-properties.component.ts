import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiagramShapeManagerService } from '../../services/diagram-shape-manager.service';
import { DiagramStateService } from '../../services/diagram-state.service';
import { DiagramElement } from '../../models/diagram-shape.model';
import { RfLotoPointApiService } from '../../../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { Subject, debounceTime, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-diagram-properties',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="properties-panel">
      <h3>Properties</h3>

      @if (shapeManager.singleSelectedShape(); as shape) {
        <div class="property-section">
          <h4>Shape: {{ shape.type }}</h4>

          <label>X
            <input type="number" [ngModel]="shape.x"
              (ngModelChange)="updateShape(shape.id, { x: $event })" />
          </label>
          <label>Y
            <input type="number" [ngModel]="shape.y"
              (ngModelChange)="updateShape(shape.id, { y: $event })" />
          </label>
          <label>Width
            <input type="number" [ngModel]="shape.width" [min]="10"
              (ngModelChange)="updateShape(shape.id, { width: $event })" />
          </label>
          <label>Height
            <input type="number" [ngModel]="shape.height" [min]="10"
              (ngModelChange)="updateShape(shape.id, { height: $event })" />
          </label>
          <label>Rotation
            <input type="number" [ngModel]="shape.rotation || 0" [min]="0" [max]="360"
              (ngModelChange)="updateShape(shape.id, { rotation: $event })" />
          </label>
          <label>Color
            <input type="color" [ngModel]="shape.color || '#ffffff'"
              (ngModelChange)="updateShape(shape.id, { color: $event })" />
          </label>
          <label>Fill
            <input type="color" [ngModel]="shape.fillColor || '#000000'"
              (ngModelChange)="updateShape(shape.id, { fillColor: $event })" />
          </label>
          <label>Line Width
            <input type="number" [ngModel]="shape.lineWidth || 2" [min]="1" [max]="20"
              (ngModelChange)="updateShape(shape.id, { lineWidth: $event })" />
          </label>
          <label>Label
            <input type="text" [ngModel]="shape.label || ''"
              (ngModelChange)="updateShape(shape.id, { label: $event })" />
          </label>
        </div>

        <!-- Linked Entity Section -->
        <div class="property-section">
          <h4>Linked Equipment</h4>

          @if (shape.linkedEntityId && linkedLotoPoint()) {
            <div class="linked-entity-card">
              <div class="linked-field">
                <span class="linked-label">Tag</span>
                <span class="linked-value">{{ linkedLotoPoint()!.tagNumber }}</span>
              </div>
              <div class="linked-field">
                <span class="linked-label">Description</span>
                <span class="linked-value">{{ linkedLotoPoint()!.description || '—' }}</span>
              </div>
              <div class="linked-field">
                <span class="linked-label">Unit</span>
                <span class="linked-value">{{ linkedLotoPoint()!.unit || '—' }}</span>
              </div>
              @if (linkedLotoPoint()!.normPos) {
                <div class="linked-field">
                  <span class="linked-label">Normal Pos</span>
                  <span class="linked-value">{{ linkedLotoPoint()!.normPos!.name }}</span>
                </div>
              }
              @if (linkedLotoPoint()!.isoPos) {
                <div class="linked-field">
                  <span class="linked-label">Isolated Pos</span>
                  <span class="linked-value">{{ linkedLotoPoint()!.isoPos!.name }}</span>
                </div>
              }
              @if (linkedLotoPoint()!.eqType) {
                <div class="linked-field">
                  <span class="linked-label">Type</span>
                  <span class="linked-value">{{ linkedLotoPoint()!.eqType!.name }}</span>
                </div>
              }
              <button class="btn-unlink" (click)="unlinkEntity(shape.id)">Unlink</button>
            </div>
          } @else if (shape.linkedEntityId && !linkedLotoPoint()) {
            <p class="loading-text">Loading...</p>
          } @else {
            <!-- Search to link -->
            <div class="link-search">
              <input type="text" placeholder="Search LOTO point..."
                [ngModel]="searchQuery()"
                (ngModelChange)="onSearchInput($event)" />

              @if (searchResults().length > 0) {
                <div class="search-results">
                  @for (lp of searchResults(); track lp.id) {
                    <div class="search-result-item" (click)="linkEntity(shape.id, lp)">
                      <span class="result-tag">{{ lp.tagNumber }}</span>
                      <span class="result-desc">{{ lp.description || '' }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>

      } @else if (shapeManager.selectedShapes().length > 1) {
        <p class="info">{{ shapeManager.selectedShapes().length }} shapes selected</p>
      } @else {
        <!-- Diagram metadata -->
        @if (stateService.currentDiagram(); as diagram) {
          <div class="property-section">
            <h4>Diagram</h4>
            <label>Name
              <input type="text" [ngModel]="diagram.name"
                (ngModelChange)="stateService.updateDiagramMeta({ name: $event })" />
            </label>
            <label>Description
              <textarea [ngModel]="diagram.description"
                (ngModelChange)="stateService.updateDiagramMeta({ description: $event })">
              </textarea>
            </label>
          </div>
        }
        <p class="info">Select a shape to edit properties</p>
      }
    </div>
  `,
  styles: [`
    .properties-panel {
      width: 240px;
      background: #1a1a1a;
      border-left: 1px solid #333;
      padding: 12px;
      overflow-y: auto;
    }
    h3 { margin: 0 0 12px; font-size: 14px; color: #aaa; }
    h4 { margin: 0 0 8px; font-size: 13px; color: #ddd; text-transform: capitalize; }
    .property-section { margin-bottom: 16px; }
    label {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #999;
      margin-bottom: 6px;
      gap: 8px;
    }
    input, textarea {
      width: 120px;
      padding: 4px 6px;
      background: #2a2a2a;
      border: 1px solid #444;
      color: #ddd;
      border-radius: 3px;
      font-size: 12px;
    }
    input[type="color"] {
      width: 40px;
      height: 24px;
      padding: 0;
      cursor: pointer;
    }
    textarea {
      width: 120px;
      height: 60px;
      resize: vertical;
    }
    .info { font-size: 12px; color: #666; }

    /* Linked entity card */
    .linked-entity-card {
      background: #222;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 8px;
    }
    .linked-field {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      margin-bottom: 4px;
    }
    .linked-label { color: #888; }
    .linked-value { color: #ddd; text-align: right; max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
    .btn-unlink {
      margin-top: 8px;
      width: 100%;
      padding: 4px;
      background: #333;
      border: 1px solid #555;
      color: #f44336;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
    }
    .btn-unlink:hover { background: #422; border-color: #f44336; }
    .loading-text { font-size: 11px; color: #888; }

    /* Search */
    .link-search input {
      width: 100%;
      box-sizing: border-box;
      margin-bottom: 4px;
    }
    .search-results {
      max-height: 200px;
      overflow-y: auto;
      border: 1px solid #444;
      border-radius: 3px;
      background: #222;
    }
    .search-result-item {
      padding: 6px 8px;
      cursor: pointer;
      border-bottom: 1px solid #333;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .search-result-item:last-child { border-bottom: none; }
    .search-result-item:hover { background: #2a3a4a; }
    .result-tag { font-size: 12px; color: #4fc3f7; font-weight: 500; }
    .result-desc { font-size: 10px; color: #888; }
  `],
})
export class DiagramPropertiesComponent {
  shapeManager = inject(DiagramShapeManagerService);
  stateService = inject(DiagramStateService);
  private lotoApi = inject(RfLotoPointApiService);

  linkedLotoPoint = signal<LotoPointDto | null>(null);
  searchQuery = signal('');
  searchResults = signal<LotoPointDto[]>([]);

  private searchSubject = new Subject<string>();
  private lastFetchedId: number | null = null;

  constructor() {
    // Fetch linked LotoPoint when selection changes
    effect(() => {
      const shape = this.shapeManager.singleSelectedShape();
      const entityId = shape?.linkedEntityId;
      const entityType = shape?.linkedEntityType;

      if (entityId && entityType === 'loto-point' && entityId !== this.lastFetchedId) {
        this.lastFetchedId = entityId;
        this.linkedLotoPoint.set(null);
        this.lotoApi.getLotoPointById(String(entityId)).subscribe({
          next: (res) => this.linkedLotoPoint.set(res.responseData ?? null),
          error: () => this.linkedLotoPoint.set(null),
        });
      } else if (!entityId) {
        this.lastFetchedId = null;
        this.linkedLotoPoint.set(null);
      }

      // Clear search when selection changes
      this.searchQuery.set('');
      this.searchResults.set([]);
    });

    // Debounced search
    this.searchSubject.pipe(
      debounceTime(300),
      switchMap(query => {
        if (!query || query.length < 2) return of(null);
        return this.lotoApi.searchLotoPoints(
          { type: 'global', query, page: 1, pageSize: 20 },
          20
        );
      })
    ).subscribe(res => {
      this.searchResults.set(res?.responseData?.content ?? []);
    });
  }

  updateShape(id: number, updates: Partial<DiagramElement>): void {
    this.shapeManager.updateShape(id, updates);
    this.stateService.markDirty();
  }

  onSearchInput(query: string): void {
    this.searchQuery.set(query);
    this.searchSubject.next(query);
  }

  linkEntity(shapeId: number, lotoPoint: LotoPointDto): void {
    this.shapeManager.updateShape(shapeId, {
      linkedEntityId: lotoPoint.id!,
      linkedEntityType: 'loto-point',
      label: lotoPoint.tagNumber || undefined,
    } as any);
    this.linkedLotoPoint.set(lotoPoint);
    this.lastFetchedId = lotoPoint.id!;
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.stateService.markDirty();
  }

  unlinkEntity(shapeId: number): void {
    this.shapeManager.updateShape(shapeId, {
      linkedEntityId: undefined,
      linkedEntityType: undefined,
    } as any);
    this.linkedLotoPoint.set(null);
    this.lastFetchedId = null;
    this.stateService.markDirty();
  }
}
