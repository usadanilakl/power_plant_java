import { Component, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiagramCanvasComponent } from '../../../../diagram-builder/components/diagram-canvas/diagram-canvas.component';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { DiagramApiService } from '../../../../diagram-builder/services/diagram-api.service';
import { SimEquipmentApiService } from '../../../../diagram-builder/services/sim-equipment-api.service';
import { DiagramDto, normalizeDiagramData, serializeDiagramData } from '../../../../diagram-builder/models/diagram.model';
import { AnchorPosition, DiagramConnection, DiagramPlacement } from '../../../../diagram-builder/models/diagram-placement.model';
import { EquipmentDto } from '../../../../../models/equipment/equipment.model';
import { normalizeSimRole, SimEquipmentDto } from '../../../../diagram-builder/models/sim-equipment.model';
import { SimNodeState } from '../../../../diagram-builder/simulation/models/simulation.model';

interface ConnectionSummary {
  id: number;
  sourceLabel: string;
  targetLabel: string;
  pipeLabel?: string;
  sourceEquipmentId?: number;
  targetEquipmentId?: number;
}

interface ReadinessSummary {
  sources: number;
  sinks: number;
  valves: number;
  pumps: number;
  vessels: number;
  connectedPlacements: number;
  warnings: string[];
}

@Component({
  selector: 'app-loto-builder-diagram-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule, DiagramCanvasComponent],
  template: `
    @if (builderState.isDiagramBuilderOpen()) {
      <div class="overlay" (click)="close()">
        <div class="panel" (click)="$event.stopPropagation()">
          <div class="header">
            <div class="title-block">
              <h2>Build Diagram</h2>
              <p>{{ subtitle() }}</p>
            </div>
            <div class="header-actions">
              @if (loading()) {
                <span class="status">Loading...</span>
              }
              <button class="btn" [disabled]="activeDiagramId() == null" (click)="openInStandalone()">
                Open Full Builder
              </button>
              <button class="btn close" (click)="close()">Close</button>
            </div>
          </div>

          <div class="body">
            <aside class="sidebar">
              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Diagrams</h3>
                  <button class="btn btn-small" [disabled]="loading()" (click)="refreshContextDiagrams()">Refresh</button>
                </div>
                <button class="btn btn-accent" [disabled]="loading()" (click)="createFresh()">+ New Diagram</button>

                @if (!loading() && contextDiagrams().length === 0) {
                  <p class="section-empty">No simulation diagrams for this P&ID yet.</p>
                } @else {
                  <div class="diagram-list">
                    @for (diagram of contextDiagrams(); track diagram.id) {
                      <button
                        class="diagram-item"
                        [class.active]="diagram.id === activeDiagramId()"
                        (click)="openDiagram(diagram.id!)">
                        <span class="diagram-name">{{ diagram.name || 'Untitled Diagram' }}</span>
                        <span class="diagram-meta">
                          @if (diagram.dateModified) {
                            {{ diagram.dateModified | date:'short' }}
                          } @else {
                            New
                          }
                        </span>
                      </button>
                    }
                  </div>
                }
              </section>

              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Source Objects</h3>
                </div>
                <p class="section-copy">
                  Use the visible P&ID context to seed reusable simulator definitions, then place or sync them into the active diagram.
                </p>
                <div class="metrics">
                  <span>{{ equipmentCount() }} visible equipment</span>
                  <span>{{ lotoPointCount() }} LOTO points</span>
                </div>
                <div class="action-stack">
                  <button class="btn" [disabled]="syncingSources() || equipmentCount() === 0" (click)="generateFromEquipment()">
                    Generate Equipment Templates
                  </button>
                  <button class="btn" [disabled]="syncingSources() || lotoPointCount() === 0" (click)="generateFromLotoPoints()">
                    Generate LOTO Templates
                  </button>
                  <button class="btn btn-accent" [disabled]="syncingSources() || activeDiagramId() == null || equipmentCount() === 0" (click)="placeEquipmentFromPid()">
                    Place Visible Equipment
                  </button>
                </div>
              </section>

              <section class="sidebar-section source-list-section">
                <div class="section-header">
                  <h3>Visible Equipment</h3>
                  <span class="section-hint">{{ placedEquipmentCount() }} placed</span>
                </div>
                @if (visibleEquipment().length === 0) {
                  <p class="section-empty">This file does not have positioned equipment to place yet.</p>
                } @else {
                  <div class="source-list">
                    @for (equipment of visibleEquipment(); track equipment.id) {
                      <div
                        class="source-item"
                        [class.highlighted]="builderState.hoveredShapeId() === equipment.id"
                        [class.placed]="isEquipmentPlaced(equipment.id)"
                        (mouseenter)="highlightSource(equipment.id)"
                        (mouseleave)="clearSourceHighlight(equipment.id)">
                        <div class="source-main" (click)="selectSource(equipment.id)">
                          <div class="source-title-row">
                            <span class="source-title">{{ equipment.tagNumber || equipment.name || 'Untitled Equipment' }}</span>
                            <span class="source-state">{{ isEquipmentPlaced(equipment.id) ? 'Placed' : 'Not Placed' }}</span>
                          </div>
                          <p class="source-description">{{ equipment.description || 'No description' }}</p>
                        </div>
                        <div class="source-actions">
                          <button class="btn btn-small" [disabled]="syncingSources()" (click)="generateOneEquipment(equipment); $event.stopPropagation()">
                            Generate
                          </button>
                          <button class="btn btn-small btn-accent" [disabled]="syncingSources() || activeDiagramId() == null" (click)="placeOneEquipment(equipment); $event.stopPropagation()">
                            {{ isEquipmentPlaced(equipment.id) ? 'Sync' : 'Place' }}
                          </button>
                          <button class="btn btn-small btn-danger" [disabled]="syncingSources() || !isEquipmentPlaced(equipment.id)" (click)="removeOneEquipment(equipment); $event.stopPropagation()">
                            Remove
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                }
              </section>

              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Selected Equipment</h3>
                  <span class="section-hint">
                    @if (selectedEquipment()) {
                      {{ isEquipmentPlaced(selectedEquipment()!.id) ? 'Placed' : 'Not Placed' }}
                    } @else {
                      None
                    }
                  </span>
                </div>
                @if (selectedEquipment(); as equipment) {
                  <div class="selected-card">
                    <div class="selected-title-row">
                      <span class="selected-title">{{ equipment.tagNumber || equipment.name || 'Untitled Equipment' }}</span>
                    </div>
                    <p class="selected-description">{{ equipment.description || 'No description' }}</p>
                    @if (simulationRunning() && selectedNodeState(); as nodeState) {
                      <div class="live-state-grid">
                        <span>P {{ nodeState.pressure | number:'1.0-1' }}</span>
                        <span>F {{ nodeState.flowRate | number:'1.0-1' }}</span>
                        <span>T {{ nodeState.temperature | number:'1.0-1' }}</span>
                        <span>{{ nodeState.isFlowing ? 'Flowing' : 'Stopped' }}</span>
                      </div>
                      @if (nodeState.warnings?.length) {
                        <div class="readiness-list">
                          @for (warning of nodeState.warnings!; track warning) {
                            <div class="readiness-item">{{ warning }}</div>
                          }
                        </div>
                      }
                    }
                    <div class="selected-actions">
                      <button class="btn btn-small" [disabled]="syncingSources()" (click)="generateOneEquipment(equipment)">
                        Generate
                      </button>
                      <button class="btn btn-small btn-accent" [disabled]="syncingSources() || activeDiagramId() == null" (click)="placeOneEquipment(equipment)">
                        {{ isEquipmentPlaced(equipment.id) ? 'Sync Placement' : 'Place In Diagram' }}
                      </button>
                      <button class="btn btn-small btn-danger" [disabled]="syncingSources() || !isEquipmentPlaced(equipment.id)" (click)="removeOneEquipment(equipment)">
                        Remove From Diagram
                      </button>
                    </div>
                    <div class="selected-actions">
                      <button class="btn btn-small" [disabled]="!isEquipmentPlaced(equipment.id)" (click)="useSelectedAsFrom()">
                        Use As From
                      </button>
                      <button class="btn btn-small" [disabled]="!isEquipmentPlaced(equipment.id)" (click)="useSelectedAsTo()">
                        Use As To
                      </button>
                      <button class="btn btn-small" [disabled]="!simulationRunning() || !isEquipmentPlaced(equipment.id)" (click)="operateSelectedEquipment()">
                        Operate
                      </button>
                    </div>
                  </div>
                } @else {
                  <p class="section-empty">Select a source item from the P&ID list or the embedded diagram to work with it here.</p>
                }
              </section>

              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Simulation Controls</h3>
                  <span class="section-hint">{{ simulationRunning() ? 'Running' : 'Stopped' }}</span>
                </div>
                <p class="section-copy">
                  Start the simulation for the active embedded diagram, then operate the selected valve or pump from the card above.
                </p>
                <div class="selected-actions">
                  <button class="btn btn-accent" [disabled]="activeDiagramId() == null" (click)="toggleEmbeddedSimulation()">
                    {{ simulationRunning() ? 'Stop Simulation' : 'Start Simulation' }}
                  </button>
                  <button class="btn btn-small" [disabled]="!simulationRunning()" (click)="resetEmbeddedSimulation()">
                    Reset
                  </button>
                </div>
              </section>

              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Diagram Health</h3>
                  <span class="section-hint">{{ disconnectedEquipment().length }} disconnected</span>
                </div>
                <div class="metrics">
                  <span>{{ placedEquipmentCount() }} placed equipment</span>
                  <span>{{ connectionCount() }} process connections</span>
                  <span>{{ disconnectedEquipment().length }} placed items without a connection</span>
                </div>
                @if (disconnectedEquipment().length > 0) {
                  <div class="action-stack">
                    <button class="btn btn-small" (click)="selectDisconnectedEquipment(disconnectedEquipment()[0].id)">
                      Focus First Disconnected
                    </button>
                  </div>
                  <div class="health-list">
                    @for (equipment of disconnectedEquipment(); track equipment.id) {
                      <button class="health-item" (click)="selectDisconnectedEquipment(equipment.id)">
                        {{ equipment.tagNumber || equipment.name || ('Equipment #' + equipment.id) }}
                      </button>
                    }
                  </div>
                } @else {
                  <p class="section-empty">All placed equipment currently has at least one connection.</p>
                }
              </section>

              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Simulation Readiness</h3>
                  <span class="section-hint">
                    @if (readinessSummary().warnings.length === 0) {
                      Ready
                    } @else {
                      {{ readinessSummary().warnings.length }} issues
                    }
                  </span>
                </div>
                <div class="metrics">
                  <span>{{ readinessSummary().sources }} sources</span>
                  <span>{{ readinessSummary().sinks }} sinks</span>
                  <span>{{ readinessSummary().valves }} valves</span>
                  <span>{{ readinessSummary().pumps }} pumps</span>
                  <span>{{ readinessSummary().vessels }} vessels</span>
                  <span>{{ readinessSummary().connectedPlacements }} connected placements</span>
                </div>
                @if (readinessSummary().warnings.length > 0) {
                  <div class="readiness-list">
                    @for (warning of readinessSummary().warnings; track warning) {
                      <div class="readiness-item">{{ warning }}</div>
                    }
                  </div>
                } @else {
                  <p class="section-empty">This diagram has the minimum structure to start a simulation run.</p>
                }
              </section>

              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Quick Connect</h3>
                  <span class="section-hint">{{ connectionCount() }} connections</span>
                </div>
                <p class="section-copy">
                  Pick two already placed items and create a process link with automatic anchors.
                </p>
                <label class="stacked-label">From
                  <select [ngModel]="connectFromEquipmentId() ?? ''" (ngModelChange)="connectFromEquipmentId.set(toNumberOrUndefined($event) ?? null)">
                    <option value="">Select source</option>
                    @for (equipment of placedEquipmentOptions(); track equipment.id) {
                      <option [value]="equipment.id">{{ equipment.tagNumber || equipment.name || ('Equipment #' + equipment.id) }}</option>
                    }
                  </select>
                </label>
                <label class="stacked-label">To
                  <select [ngModel]="connectToEquipmentId() ?? ''" (ngModelChange)="connectToEquipmentId.set(toNumberOrUndefined($event) ?? null)">
                    <option value="">Select target</option>
                    @for (equipment of placedEquipmentOptions(); track equipment.id) {
                      <option [value]="equipment.id">{{ equipment.tagNumber || equipment.name || ('Equipment #' + equipment.id) }}</option>
                    }
                  </select>
                </label>
                <label class="stacked-label">Pipe Template
                  <select [ngModel]="connectPipeTemplateId() ?? ''" (ngModelChange)="connectPipeTemplateId.set(toNumberOrUndefined($event) ?? null)">
                    <option value="">None</option>
                    @for (pipe of pipeTemplates(); track pipe.id) {
                      <option [value]="pipe.id">{{ pipe.name || ('Pipe #' + pipe.id) }}</option>
                    }
                  </select>
                </label>
                <div class="action-stack">
                  <button class="btn btn-accent"
                    [disabled]="syncingSources() || activeDiagramId() == null || connectFromEquipmentId() == null || connectToEquipmentId() == null || connectFromEquipmentId() === connectToEquipmentId()"
                    (click)="quickConnectSelected()">
                    Create Connection
                  </button>
                  @if (connectMessage()) {
                    <p class="inline-message">{{ connectMessage() }}</p>
                  }
                </div>
              </section>

              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Connections</h3>
                  <span class="section-hint">{{ connectionCount() }}</span>
                </div>
                @if (currentConnections().length === 0) {
                  <p class="section-empty">No process connections have been created on this diagram yet.</p>
                } @else {
                    <div class="connection-list">
                      @for (connection of currentConnections(); track connection.id) {
                        <div class="connection-item" [class.active]="selectedConnectionId() === connection.id">
                          <div class="connection-main">
                            <button class="connection-focus" (click)="focusConnection(connection.id)">
                              <span class="connection-title">{{ connection.sourceLabel }} -> {{ connection.targetLabel }}</span>
                            </button>
                            @if (connection.pipeLabel) {
                              <span class="connection-meta">{{ connection.pipeLabel }}</span>
                            }
                          </div>
                        <button class="btn btn-small btn-danger" [disabled]="syncingSources()" (click)="removeConnection(connection.id)">
                          Remove
                        </button>
                      </div>
                    }
                  </div>
                }
              </section>

              <section class="sidebar-section">
                <div class="section-header">
                  <h3>Selected Connection</h3>
                  <span class="section-hint">
                    @if (selectedConnection()) {
                      Active
                    } @else {
                      None
                    }
                  </span>
                </div>
                @if (selectedConnection(); as connection) {
                  <div class="selected-card">
                    <div class="selected-title-row">
                      <span class="selected-title">{{ connection.sourceLabel }} -> {{ connection.targetLabel }}</span>
                    </div>
                    <p class="selected-description">{{ connection.pipeLabel || 'No pipe template assigned' }}</p>
                    <div class="selected-actions">
                      <button class="btn btn-small" [disabled]="connection.sourceEquipmentId == null" (click)="useConnectionSourceAsFrom()">
                        Use Source As From
                      </button>
                      <button class="btn btn-small" [disabled]="connection.targetEquipmentId == null" (click)="useConnectionTargetAsTo()">
                        Use Target As To
                      </button>
                      <button class="btn btn-small btn-danger" [disabled]="syncingSources()" (click)="removeConnection(connection.id)">
                        Remove Connection
                      </button>
                    </div>
                  </div>
                } @else {
                  <p class="section-empty">Select a connection from the list or canvas to work with it here.</p>
                }
              </section>
            </aside>

            <div class="canvas-shell">
              @if (activeDiagramId() != null) {
                <app-diagram-canvas
                  [embeddedMode]="'builder'"
                  [embeddedDiagramId]="activeDiagramId()"
                  [backgroundImageUrl]="builderState.currentFile()?.fileLink || null"
                  [focusSourceEntityType]="'Equipment'"
                  [focusSourceEntityId]="builderState.selectedShapeId()"
                  [focusConnectionId]="selectedConnectionId()"
                  (selectedSourceChange)="onDiagramSelectedSource($event)"
                  (selectedConnectionChange)="selectedConnectionId.set($event)"
                  (simulationRunningChange)="simulationRunning.set($event)"
                  (selectedNodeStateChange)="selectedNodeState.set($event)"
                />
              } @else if (!loading()) {
                <div class="empty-state">
                  <p>No diagram is linked to this P&ID yet.</p>
                  <button class="btn" (click)="createFresh()">Create Diagram</button>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.72);
      z-index: 5000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .panel {
      width: min(96vw, 1800px);
      height: min(94vh, 1100px);
      background: #111;
      border: 1px solid #2f2f2f;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.45);
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 18px;
      border-bottom: 1px solid #2c2c2c;
      background: linear-gradient(180deg, #171717 0%, #111 100%);
      gap: 16px;
    }
    .title-block h2 {
      margin: 0;
      color: #f2f2f2;
      font-size: 18px;
    }
    .title-block p {
      margin: 4px 0 0;
      color: #8f8f8f;
      font-size: 12px;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .status {
      color: #8f8f8f;
      font-size: 12px;
    }
    .btn {
      padding: 8px 12px;
      background: #2a2a2a;
      color: #ddd;
      border: 1px solid #494949;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12px;
    }
    .btn:hover { background: #343434; }
    .btn.close { border-color: #6d4c41; }
    .body {
      flex: 1;
      min-height: 0;
      display: grid;
      grid-template-columns: 320px minmax(0, 1fr);
    }
    .sidebar {
      border-right: 1px solid #2c2c2c;
      background: linear-gradient(180deg, #151515 0%, #0f0f0f 100%);
      padding: 14px;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 12px;
      border: 1px solid #2f2f2f;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .section-header h3 {
      margin: 0;
      font-size: 13px;
      color: #f0f0f0;
    }
    .section-copy,
    .section-empty {
      margin: 0;
      color: #999;
      font-size: 12px;
      line-height: 1.4;
    }
    .metrics {
      display: flex;
      flex-direction: column;
      gap: 6px;
      color: #c8c8c8;
      font-size: 12px;
    }
    .action-stack {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .diagram-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 320px;
      overflow: auto;
    }
    .diagram-item {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 3px;
      width: 100%;
      padding: 10px;
      border-radius: 8px;
      border: 1px solid #343434;
      background: #171717;
      color: #ddd;
      cursor: pointer;
      text-align: left;
    }
    .diagram-item:hover {
      background: #1d1d1d;
      border-color: #4c4c4c;
    }
    .diagram-item.active {
      border-color: #2e7dd1;
      background: rgba(46, 125, 209, 0.12);
    }
    .diagram-name {
      font-size: 12px;
      font-weight: 600;
    }
    .diagram-meta {
      font-size: 11px;
      color: #8f8f8f;
    }
    .section-hint {
      font-size: 11px;
      color: #8f8f8f;
    }
    .source-list-section {
      min-height: 0;
    }
    .source-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      overflow: auto;
      max-height: 420px;
    }
    .source-item {
      border: 1px solid #343434;
      border-radius: 8px;
      padding: 10px;
      background: #151515;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .source-item.highlighted {
      border-color: #b98f38;
      background: rgba(185, 143, 56, 0.1);
    }
    .source-item.placed {
      border-color: #2e7d32;
    }
    .source-main {
      cursor: pointer;
    }
    .source-title-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: baseline;
    }
    .source-title {
      font-size: 12px;
      font-weight: 600;
      color: #ededed;
    }
    .source-state {
      font-size: 11px;
      color: #8f8f8f;
    }
    .source-description {
      margin: 4px 0 0;
      color: #999;
      font-size: 11px;
      line-height: 1.35;
    }
    .source-actions {
      display: flex;
      gap: 8px;
    }
    .selected-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px;
      border: 1px solid #343434;
      border-radius: 8px;
      background: #151515;
    }
    .selected-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .selected-title {
      font-size: 12px;
      font-weight: 600;
      color: #ededed;
    }
    .selected-description {
      margin: 0;
      color: #999;
      font-size: 11px;
      line-height: 1.35;
    }
    .live-state-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 6px;
      font-size: 11px;
      color: #cfd8dc;
    }
    .live-state-grid span {
      padding: 6px 8px;
      border: 1px solid #30424a;
      border-radius: 6px;
      background: rgba(50, 84, 96, 0.15);
    }
    .selected-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .stacked-label {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: 6px;
      font-size: 12px;
      color: #bbb;
    }
    .stacked-label select {
      width: 100%;
      padding: 8px 10px;
      background: #202020;
      border: 1px solid #444;
      color: #ddd;
      border-radius: 6px;
      font-size: 12px;
    }
    .inline-message {
      margin: 0;
      font-size: 11px;
      color: #8f8f8f;
      line-height: 1.4;
    }
    .connection-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 240px;
      overflow: auto;
    }
    .connection-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px;
      border: 1px solid #343434;
      border-radius: 8px;
      background: #151515;
    }
    .connection-item.active {
      border-color: #2e7dd1;
      background: rgba(46, 125, 209, 0.12);
    }
    .connection-main {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .connection-focus {
      padding: 0;
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      text-align: left;
    }
    .connection-title {
      font-size: 12px;
      color: #ededed;
      font-weight: 600;
    }
    .connection-meta {
      font-size: 11px;
      color: #8f8f8f;
    }
    .health-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 180px;
      overflow: auto;
    }
    .health-item {
      width: 100%;
      text-align: left;
      padding: 8px 10px;
      border: 1px solid #4f3a1b;
      border-radius: 8px;
      background: rgba(185, 143, 56, 0.1);
      color: #edd7a4;
      cursor: pointer;
      font-size: 12px;
    }
    .health-item:hover {
      background: rgba(185, 143, 56, 0.18);
    }
    .readiness-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .readiness-item {
      padding: 8px 10px;
      border: 1px solid #5a3420;
      border-radius: 8px;
      background: rgba(196, 114, 68, 0.12);
      color: #f1c0a6;
      font-size: 12px;
      line-height: 1.35;
    }
    .canvas-shell {
      min-width: 0;
      min-height: 0;
    }
    app-diagram-canvas {
      display: block;
      height: 100%;
    }
    .empty-state {
      height: 100%;
      display: flex;
      flex-direction: column;
      gap: 14px;
      justify-content: center;
      align-items: center;
      color: #888;
    }
    .btn-small {
      padding: 6px 10px;
      font-size: 11px;
    }
    .btn-accent {
      border-color: #2e7d32;
      background: #1c3c20;
    }
    .btn-accent:hover {
      background: #245029;
    }
    .btn-danger {
      border-color: #7d2e2e;
      background: #3b1d1d;
    }
    .btn-danger:hover {
      background: #522525;
    }
  `],
})
export class LotoBuilderDiagramOverlayComponent {
  @ViewChild(DiagramCanvasComponent) embeddedCanvas?: DiagramCanvasComponent;

  protected builderState = inject(LotoBuilderStateService);
  private diagramApi = inject(DiagramApiService);
  private simEquipmentApi = inject(SimEquipmentApiService);
  private router = inject(Router);

  loading = signal(false);
  syncingSources = signal(false);
  activeDiagramId = signal<number | null>(null);
  contextDiagrams = signal<DiagramDto[]>([]);
  placedEquipmentIds = signal<Set<number>>(new Set());
  placedEquipmentPlacementMap = signal<Map<number, DiagramPlacement>>(new Map());
  currentConnections = signal<ConnectionSummary[]>([]);
  connectionCount = signal(0);
  disconnectedEquipmentIds = signal<Set<number>>(new Set());
  selectedConnectionId = signal<number | null>(null);
  simulationRunning = signal(false);
  selectedNodeState = signal<SimNodeState | null>(null);
  readinessSummary = signal<ReadinessSummary>({
    sources: 0,
    sinks: 0,
    valves: 0,
    pumps: 0,
    vessels: 0,
    connectedPlacements: 0,
    warnings: [],
  });
  connectFromEquipmentId = signal<number | null>(null);
  connectToEquipmentId = signal<number | null>(null);
  connectPipeTemplateId = signal<number | null>(null);
  connectMessage = signal<string | null>(null);
  equipmentCount = computed(() => this.builderState.currentEquipment().length);
  lotoPointCount = computed(() => this.builderState.allLotoPointsInFile().length);
  visibleEquipment = computed(() =>
    [...this.builderState.currentEquipment()]
      .filter(item => item.id != null)
      .sort((a, b) => (a.tagNumber || a.name || '').localeCompare(b.tagNumber || b.name || ''))
  );
  selectedEquipment = computed(() => {
    const selectedId = this.builderState.selectedShapeId();
    if (selectedId == null) return null;
    return this.visibleEquipment().find(item => item.id === selectedId) ?? null;
  });
  placedEquipmentCount = computed(() => this.placedEquipmentIds().size);
  placedEquipmentOptions = computed(() =>
    this.visibleEquipment().filter(item => item.id != null && this.placedEquipmentIds().has(item.id))
  );
  selectedConnection = computed(() =>
    this.currentConnections().find(connection => connection.id === this.selectedConnectionId()) ?? null
  );
  disconnectedEquipment = computed(() =>
    this.visibleEquipment().filter(item => item.id != null && this.disconnectedEquipmentIds().has(item.id))
  );
  pipeTemplates = computed(() =>
    this.simEquipmentApi.equipmentList().filter(eq => normalizeSimRole(eq.simRole) === 'pipe')
  );

  subtitle = computed(() => {
    const file = this.builderState.currentFile();
    return file ? `P&ID Context: ${file.name}` : 'No file selected';
  });

  constructor() {
    effect(() => {
      const isOpen = this.builderState.isDiagramBuilderOpen();
      const file = this.builderState.currentFile();
      const requestedId = this.builderState.currentDiagramId();

      if (!isOpen) {
        this.activeDiagramId.set(null);
        this.contextDiagrams.set([]);
        this.placedEquipmentIds.set(new Set());
        this.placedEquipmentPlacementMap.set(new Map());
        this.currentConnections.set([]);
        this.disconnectedEquipmentIds.set(new Set());
        this.readinessSummary.set({
          sources: 0,
          sinks: 0,
          valves: 0,
          pumps: 0,
          vessels: 0,
          connectedPlacements: 0,
          warnings: [],
        });
        this.connectionCount.set(0);
        this.connectMessage.set(null);
        return;
      }

      if (!file?.id) {
        this.activeDiagramId.set(null);
        this.contextDiagrams.set([]);
        this.placedEquipmentIds.set(new Set());
        this.placedEquipmentPlacementMap.set(new Map());
        this.currentConnections.set([]);
        this.disconnectedEquipmentIds.set(new Set());
        this.readinessSummary.set({
          sources: 0,
          sinks: 0,
          valves: 0,
          pumps: 0,
          vessels: 0,
          connectedPlacements: 0,
          warnings: [],
        });
        this.connectionCount.set(0);
        this.connectMessage.set(null);
        return;
      }

      if (requestedId != null) {
        this.activeDiagramId.set(requestedId);
      }
      this.loadContextDiagrams(file.id, requestedId);
    });

    effect(() => {
      const diagramId = this.activeDiagramId();
      const isOpen = this.builderState.isDiagramBuilderOpen();
      if (!isOpen || diagramId == null) {
        this.placedEquipmentIds.set(new Set());
        this.placedEquipmentPlacementMap.set(new Map());
        this.currentConnections.set([]);
        this.disconnectedEquipmentIds.set(new Set());
        this.readinessSummary.set({
          sources: 0,
          sinks: 0,
          valves: 0,
          pumps: 0,
          vessels: 0,
          connectedPlacements: 0,
          warnings: [],
        });
        this.connectionCount.set(0);
        return;
      }
      this.refreshPlacedEquipmentIds(diagramId);
    });
  }

  createFresh(): void {
    const file = this.builderState.currentFile();
    if (!file?.id) return;

    this.loading.set(true);
    this.diagramApi.create({
      name: `${file.name} - Simulation`,
      description: `Simulation diagram created from LOTO builder for ${file.name}.`,
      canvasWidth: this.derivedCanvasWidth(),
      canvasHeight: this.derivedCanvasHeight(),
      gridSize: 20,
      shapesJson: JSON.stringify({ schemaVersion: 1, placements: [], connections: [] }),
      connectionsJson: '',
      contextFileId: file.id,
      contextFileName: file.name,
    }).subscribe({
      next: (res) => {
        const nextId = res.responseData?.id ?? null;
        this.activeDiagramId.set(nextId);
        this.builderState.currentDiagramId.set(nextId);
        this.refreshContextDiagrams(nextId);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  generateFromEquipment(): void {
    const items = this.builderState.currentEquipment().map(item => item.id).filter((id): id is number => id != null);
    this.syncingSources.set(true);
    this.runSequential(items, (id) => this.simEquipmentApi.fromEquipment(id), () => {
      this.simEquipmentApi.loadAllIntoCache();
      this.syncingSources.set(false);
    });
  }

  generateFromLotoPoints(): void {
    const items = this.builderState.allLotoPointsInFile().map(item => item.id).filter((id): id is number => id != null);
    this.syncingSources.set(true);
    this.runSequential(items, (id) => this.simEquipmentApi.fromLotoPoint(id), () => {
      this.simEquipmentApi.loadAllIntoCache();
      this.syncingSources.set(false);
    });
  }

  placeEquipmentFromPid(): void {
    const equipmentItems = this.builderState.currentEquipment()
      .filter(item => item.id != null);
    this.placeEquipmentItems(equipmentItems);
  }

  generateOneEquipment(equipment: EquipmentDto): void {
    const equipmentId = equipment.id;
    if (equipmentId == null || this.syncingSources()) return;

    this.syncingSources.set(true);
    this.simEquipmentApi.fromEquipment(equipmentId).subscribe({
      next: (res) => {
        if (res.responseData) {
          this.simEquipmentApi.upsertCached(res.responseData);
        }
        this.syncingSources.set(false);
      },
      error: () => this.syncingSources.set(false),
    });
  }

  placeOneEquipment(equipment: EquipmentDto): void {
    this.placeEquipmentItems([equipment]);
  }

  removeOneEquipment(equipment: EquipmentDto): void {
    const equipmentId = equipment.id;
    const diagramId = this.activeDiagramId();
    if (equipmentId == null || diagramId == null || this.syncingSources()) {
      return;
    }

    this.syncingSources.set(true);
    this.connectMessage.set(null);
    this.diagramApi.getById(diagramId).subscribe({
      next: (res) => {
        const dto = res.responseData;
        if (!dto) {
          this.syncingSources.set(false);
          return;
        }

        const data = normalizeDiagramData(dto);
        const placementToRemove = data.placements.find(placement =>
          placement.sourceEntityType === 'Equipment' && placement.sourceEntityId === equipmentId
        );

        if (!placementToRemove) {
          this.syncingSources.set(false);
          return;
        }

        data.placements = data.placements.filter(placement => placement.id !== placementToRemove.id);
        data.connections = data.connections.filter(connection =>
          connection.sourcePlacementId !== placementToRemove.id &&
          connection.targetPlacementId !== placementToRemove.id
        );

        const serialized = serializeDiagramData(data);
        this.diagramApi.update(diagramId, {
          ...dto,
          shapesJson: serialized.shapesJson,
          connectionsJson: serialized.connectionsJson,
        }).subscribe({
          next: () => {
            if (this.connectFromEquipmentId() === equipmentId) {
              this.connectFromEquipmentId.set(null);
            }
            if (this.connectToEquipmentId() === equipmentId) {
              this.connectToEquipmentId.set(null);
            }
            this.connectMessage.set(`Removed ${equipment.tagNumber || equipment.name || 'equipment'} from the active diagram.`);
            this.refreshContextDiagrams(diagramId);
            this.refreshPlacedEquipmentIds(diagramId);
            this.syncingSources.set(false);
          },
          error: () => {
            this.connectMessage.set('Failed to remove equipment from the active diagram.');
            this.syncingSources.set(false);
          },
        });
      },
      error: () => {
        this.connectMessage.set('Failed to load the active diagram.');
        this.syncingSources.set(false);
      },
    });
  }

  highlightSource(equipmentId: number | null | undefined): void {
    if (equipmentId == null) return;
    this.builderState.hoveredShapeId.set(equipmentId);
  }

  clearSourceHighlight(equipmentId: number | null | undefined): void {
    if (equipmentId == null) return;
    if (this.builderState.hoveredShapeId() === equipmentId) {
      this.builderState.hoveredShapeId.set(null);
    }
  }

  selectSource(equipmentId: number | null | undefined): void {
    if (equipmentId == null) return;
    this.builderState.selectedShapeId.set(equipmentId);
    this.builderState.hoveredShapeId.set(equipmentId);
  }

  isEquipmentPlaced(equipmentId: number | null | undefined): boolean {
    if (equipmentId == null) return false;
    return this.placedEquipmentIds().has(equipmentId);
  }

  onDiagramSelectedSource(selection: { sourceEntityType: string | null; sourceEntityId: number | null }): void {
    if (selection.sourceEntityType === 'Equipment' && selection.sourceEntityId != null) {
      this.selectedConnectionId.set(null);
      this.builderState.selectedShapeId.set(selection.sourceEntityId);
      this.builderState.hoveredShapeId.set(selection.sourceEntityId);
      return;
    }

    if (selection.sourceEntityId == null) {
      this.builderState.hoveredShapeId.set(null);
    }
  }

  focusConnection(connectionId: number): void {
    this.selectedConnectionId.set(connectionId);
  }

  toggleEmbeddedSimulation(): void {
    this.embeddedCanvas?.toggleSimulation();
  }

  resetEmbeddedSimulation(): void {
    this.embeddedCanvas?.resetSimulation();
  }

  operateSelectedEquipment(): void {
    const operated = this.embeddedCanvas?.operateSelectedEquipment() ?? false;
    if (!operated) {
      this.connectMessage.set('Select a placed pump or valve and start the simulation before operating it.');
    }
  }

  useConnectionSourceAsFrom(): void {
    const equipmentId = this.selectedConnection()?.sourceEquipmentId;
    if (equipmentId == null) return;
    this.connectFromEquipmentId.set(equipmentId);
    this.selectSource(equipmentId);
    this.connectMessage.set('Selected connection source as quick-connect source.');
  }

  useConnectionTargetAsTo(): void {
    const equipmentId = this.selectedConnection()?.targetEquipmentId;
    if (equipmentId == null) return;
    this.connectToEquipmentId.set(equipmentId);
    this.selectSource(equipmentId);
    this.connectMessage.set('Selected connection target as quick-connect target.');
  }

  useSelectedAsFrom(): void {
    const equipmentId = this.selectedEquipment()?.id;
    if (equipmentId == null || !this.isEquipmentPlaced(equipmentId)) return;
    this.connectFromEquipmentId.set(equipmentId);
    this.connectMessage.set(`Selected ${this.selectedEquipment()?.tagNumber || this.selectedEquipment()?.name || 'equipment'} as connection source.`);
  }

  useSelectedAsTo(): void {
    const equipmentId = this.selectedEquipment()?.id;
    if (equipmentId == null || !this.isEquipmentPlaced(equipmentId)) return;
    this.connectToEquipmentId.set(equipmentId);
    this.connectMessage.set(`Selected ${this.selectedEquipment()?.tagNumber || this.selectedEquipment()?.name || 'equipment'} as connection target.`);
  }

  selectDisconnectedEquipment(equipmentId: number | null | undefined): void {
    if (equipmentId == null) return;
    this.selectSource(equipmentId);
    this.connectMessage.set(`Focused disconnected equipment ${this.selectedEquipment()?.tagNumber || this.selectedEquipment()?.name || 'item'}.`);
  }

  quickConnectSelected(): void {
    const diagramId = this.activeDiagramId();
    const fromEquipmentId = this.connectFromEquipmentId();
    const toEquipmentId = this.connectToEquipmentId();
    if (diagramId == null || fromEquipmentId == null || toEquipmentId == null || fromEquipmentId === toEquipmentId || this.syncingSources()) {
      return;
    }

    const placementMap = this.placedEquipmentPlacementMap();
    const sourcePlacement = placementMap.get(fromEquipmentId);
    const targetPlacement = placementMap.get(toEquipmentId);
    if (!sourcePlacement || !targetPlacement) {
      this.connectMessage.set('Both equipment items need to be placed on the active diagram first.');
      return;
    }

    this.syncingSources.set(true);
    this.connectMessage.set(null);
    this.diagramApi.getById(diagramId).subscribe({
      next: (res) => {
        const dto = res.responseData;
        if (!dto) {
          this.connectMessage.set('Failed to load the active diagram.');
          this.syncingSources.set(false);
          return;
        }

        const data = normalizeDiagramData(dto);
        const alreadyExists = data.connections.some(connection =>
          (connection.sourcePlacementId === sourcePlacement.id && connection.targetPlacementId === targetPlacement.id) ||
          (connection.sourcePlacementId === targetPlacement.id && connection.targetPlacementId === sourcePlacement.id)
        );

        if (alreadyExists) {
          this.connectMessage.set('Those two items are already connected on this diagram.');
          this.syncingSources.set(false);
          return;
        }

        const anchors = this.chooseAnchors(sourcePlacement, targetPlacement);
        const nextConnectionId = data.connections.reduce((max, item) => Math.max(max, item.id), 0) + 1;
        const pipeTemplate = this.simEquipmentApi.getCachedById(this.connectPipeTemplateId());
        const newConnection: DiagramConnection = {
          id: nextConnectionId,
          sourcePlacementId: sourcePlacement.id,
          targetPlacementId: targetPlacement.id,
          sourceAnchor: anchors.sourceAnchor,
          targetAnchor: anchors.targetAnchor,
          pipeTemplateId: pipeTemplate?.id,
          pipeName: pipeTemplate?.name || undefined,
          pipeParamsJson: pipeTemplate?.simParamsJson || undefined,
          lineStyle: 'solid',
          lineWidth: 2,
          color: '#888888',
        };

        data.connections.push(newConnection);
        const serialized = serializeDiagramData(data);
        this.diagramApi.update(diagramId, {
          ...dto,
          shapesJson: serialized.shapesJson,
          connectionsJson: serialized.connectionsJson,
        }).subscribe({
          next: () => {
            this.connectMessage.set(`Connected ${sourcePlacement.name || sourcePlacement.label || 'source'} to ${targetPlacement.name || targetPlacement.label || 'target'}.`);
            this.refreshContextDiagrams(diagramId);
            this.refreshPlacedEquipmentIds(diagramId);
            this.syncingSources.set(false);
          },
          error: () => {
            this.connectMessage.set('Failed to save the new connection.');
            this.syncingSources.set(false);
          },
        });
      },
      error: () => {
        this.connectMessage.set('Failed to load the active diagram.');
        this.syncingSources.set(false);
      },
    });
  }

  removeConnection(connectionId: number): void {
    const diagramId = this.activeDiagramId();
    if (diagramId == null || this.syncingSources()) {
      return;
    }

    this.syncingSources.set(true);
    this.connectMessage.set(null);
    this.diagramApi.getById(diagramId).subscribe({
      next: (res) => {
        const dto = res.responseData;
        if (!dto) {
          this.syncingSources.set(false);
          return;
        }

        const data = normalizeDiagramData(dto);
        const existed = data.connections.some(connection => connection.id === connectionId);
        if (!existed) {
          this.syncingSources.set(false);
          return;
        }

        data.connections = data.connections.filter(connection => connection.id !== connectionId);
        const serialized = serializeDiagramData(data);
        this.diagramApi.update(diagramId, {
          ...dto,
          shapesJson: serialized.shapesJson,
          connectionsJson: serialized.connectionsJson,
        }).subscribe({
          next: () => {
            if (this.selectedConnectionId() === connectionId) {
              this.selectedConnectionId.set(null);
            }
            this.connectMessage.set('Removed connection from the active diagram.');
            this.refreshContextDiagrams(diagramId);
            this.refreshPlacedEquipmentIds(diagramId);
            this.syncingSources.set(false);
          },
          error: () => {
            this.connectMessage.set('Failed to remove the connection.');
            this.syncingSources.set(false);
          },
        });
      },
      error: () => {
        this.connectMessage.set('Failed to load the active diagram.');
        this.syncingSources.set(false);
      },
    });
  }

  private runSequential(
    ids: number[],
    action: (id: number) => { subscribe: (observer: { next?: () => void; error?: () => void }) => void },
    onDone: () => void
  ): void {
    const queue = [...ids];
    const next = () => {
      const id = queue.shift();
      if (id == null) {
        onDone();
        return;
      }
      action(id).subscribe({
        next: () => next(),
        error: () => next(),
      });
    };
    next();
  }

  private derivedCanvasWidth(): number {
    const firstShape = this.builderState.currentShapes()[0];
    return firstShape?.originalPictureWidth || 1920;
  }

  private derivedCanvasHeight(): number {
    const firstShape = this.builderState.currentShapes()[0];
    return firstShape?.originalPictureHeight || 1080;
  }

  private chooseAnchors(source: DiagramPlacement, target: DiagramPlacement): { sourceAnchor: AnchorPosition; targetAnchor: AnchorPosition } {
    const sourceCenterX = source.x + source.width / 2;
    const sourceCenterY = source.y + source.height / 2;
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;
    const dx = targetCenterX - sourceCenterX;
    const dy = targetCenterY - sourceCenterY;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return dx >= 0
        ? { sourceAnchor: 'right', targetAnchor: 'left' }
        : { sourceAnchor: 'left', targetAnchor: 'right' };
    }

    return dy >= 0
      ? { sourceAnchor: 'bottom', targetAnchor: 'top' }
      : { sourceAnchor: 'top', targetAnchor: 'bottom' };
  }

  private placeEquipmentItems(equipmentItems: EquipmentDto[]): void {
    const diagramId = this.activeDiagramId();
    if (diagramId == null || equipmentItems.length === 0 || this.syncingSources()) {
      return;
    }

    const shapeMap = new Map(this.builderState.currentShapes().map(shape => [shape.id, shape]));
    const placeableItems = equipmentItems
      .filter(item => item.id != null && shapeMap.has(item.id!));

    if (placeableItems.length === 0) {
      return;
    }

    this.syncingSources.set(true);
    const resolved: Array<{ equipment: EquipmentDto; simEquipmentId: number }> = [];

    this.runSequential(
      placeableItems.map(item => item.id!).filter((id): id is number => id != null),
      (id) => ({
        subscribe: ({ next, error }: { next?: () => void; error?: () => void }) => {
          this.simEquipmentApi.fromEquipment(id).subscribe({
            next: (res) => {
              const saved = res.responseData;
              if (saved?.id != null) {
                this.simEquipmentApi.upsertCached(saved);
                const equipment = placeableItems.find(item => item.id === id);
                if (equipment) {
                  resolved.push({ equipment, simEquipmentId: saved.id });
                }
              }
              next?.();
            },
            error: () => error?.(),
          });
        }
      }),
      () => {
        this.diagramApi.getById(diagramId).subscribe({
          next: (res) => {
            const dto = res.responseData;
            if (!dto) {
              this.syncingSources.set(false);
              return;
            }

            const data = normalizeDiagramData(dto);
            let nextId = data.placements.reduce((max, item) => Math.max(max, item.id), 0) + 1;

            for (const item of resolved) {
              const equipmentId = item.equipment.id!;
              const existing = data.placements.find(p =>
                p.sourceEntityType === 'Equipment' && p.sourceEntityId === equipmentId
              );
              if (existing) {
                continue;
              }

              const shape = shapeMap.get(equipmentId);
              if (!shape || (shape.type !== 'rectangle' && shape.type !== 'svg-symbol')) {
                continue;
              }

              const simEquipment = this.simEquipmentApi.getCachedById(item.simEquipmentId);
              const placement: DiagramPlacement = {
                id: nextId++,
                simEquipmentId: item.simEquipmentId,
                name: simEquipment?.name || item.equipment.tagNumber || 'Equipment',
                description: simEquipment?.description || item.equipment.description || undefined,
                simRole: simEquipment?.simRole || 'junction',
                simParamsJson: simEquipment?.simParamsJson || '{"schemaVersion":1}',
                sourceEntityType: 'Equipment',
                sourceEntityId: equipmentId,
                x: shape.x,
                y: shape.y,
                width: shape.width,
                height: shape.height,
                rotation: (shape as any).rotation || 0,
                type: shape.type === 'svg-symbol' ? 'symbol' : 'rectangle',
                symbolId: shape.type === 'svg-symbol' ? shape.symbolId : simEquipment?.symbolId || undefined,
                svgPath: shape.type === 'svg-symbol' ? shape.svgPath : simEquipment?.svgPath || undefined,
                originalWidth: shape.type === 'svg-symbol' ? shape.originalWidth : simEquipment?.defaultWidth || undefined,
                originalHeight: shape.type === 'svg-symbol' ? shape.originalHeight : simEquipment?.defaultHeight || undefined,
                color: simEquipment?.defaultColor || shape.color || '#ffffff',
                label: simEquipment?.name || item.equipment.tagNumber || undefined,
                lineWidth: 2,
              };
              data.placements.push(placement);
            }

            const serialized = serializeDiagramData(data);
            this.diagramApi.update(diagramId, {
              ...dto,
              shapesJson: serialized.shapesJson,
              connectionsJson: serialized.connectionsJson,
            }).subscribe({
              next: () => {
                this.builderState.currentDiagramId.set(diagramId);
                this.activeDiagramId.set(diagramId);
                this.refreshContextDiagrams(diagramId);
                this.refreshPlacedEquipmentIds(diagramId);
                this.syncingSources.set(false);
              },
              error: () => this.syncingSources.set(false),
            });
          },
          error: () => this.syncingSources.set(false),
        });
      }
    );
  }

  private refreshPlacedEquipmentIds(diagramId: number): void {
    this.diagramApi.getById(diagramId).subscribe({
      next: (res) => {
        const dto = res.responseData;
        if (!dto) {
          this.placedEquipmentIds.set(new Set());
          this.placedEquipmentPlacementMap.set(new Map());
          this.currentConnections.set([]);
          this.disconnectedEquipmentIds.set(new Set());
          this.readinessSummary.set({
            sources: 0,
            sinks: 0,
            valves: 0,
            pumps: 0,
            vessels: 0,
            connectedPlacements: 0,
            warnings: [],
          });
          this.connectionCount.set(0);
          return;
        }
        const data = normalizeDiagramData(dto);
        const nextPlaced = new Set<number>();
        const nextPlacementMap = new Map<number, DiagramPlacement>();
        const placementLabelMap = new Map<number, string>();
        const connectedPlacementIds = new Set<number>();
        const roleCounts = {
          sources: 0,
          sinks: 0,
          valves: 0,
          pumps: 0,
          vessels: 0,
        };
        for (const placement of data.placements) {
          placementLabelMap.set(
            placement.id,
            placement.name || placement.label || (placement.sourceEntityId != null ? `Equipment #${placement.sourceEntityId}` : `Placement #${placement.id}`)
          );
          const role = normalizeSimRole(placement.simRole);
          if (role === 'source') roleCounts.sources += 1;
          if (role === 'sink') roleCounts.sinks += 1;
          if (role === 'valve') roleCounts.valves += 1;
          if (role === 'pump') roleCounts.pumps += 1;
          if (role === 'vessel') roleCounts.vessels += 1;
          if (placement.sourceEntityType === 'Equipment' && placement.sourceEntityId != null) {
            nextPlaced.add(placement.sourceEntityId);
            nextPlacementMap.set(placement.sourceEntityId, placement);
          }
        }
        const nextConnections: ConnectionSummary[] = data.connections.map(connection => {
          connectedPlacementIds.add(connection.sourcePlacementId);
          connectedPlacementIds.add(connection.targetPlacementId);
          const pipeTemplate = this.simEquipmentApi.getCachedById(connection.pipeTemplateId);
          const sourcePlacement = data.placements.find(placement => placement.id === connection.sourcePlacementId);
          const targetPlacement = data.placements.find(placement => placement.id === connection.targetPlacementId);
          return {
            id: connection.id,
            sourceLabel: placementLabelMap.get(connection.sourcePlacementId) || `Placement #${connection.sourcePlacementId}`,
            targetLabel: placementLabelMap.get(connection.targetPlacementId) || `Placement #${connection.targetPlacementId}`,
            pipeLabel: connection.pipeName || pipeTemplate?.name || undefined,
            sourceEquipmentId: sourcePlacement?.sourceEntityType === 'Equipment' ? sourcePlacement.sourceEntityId : undefined,
            targetEquipmentId: targetPlacement?.sourceEntityType === 'Equipment' ? targetPlacement.sourceEntityId : undefined,
          };
        });
        const nextDisconnected = new Set<number>();
        for (const [equipmentId, placement] of nextPlacementMap.entries()) {
          if (!connectedPlacementIds.has(placement.id)) {
            nextDisconnected.add(equipmentId);
          }
        }
        const warnings: string[] = [];
        if (nextPlaced.size === 0) {
          warnings.push('No equipment has been placed on this diagram yet.');
        }
        if (data.connections.length === 0) {
          warnings.push('No process connections exist yet.');
        }
        if (roleCounts.sources === 0) {
          warnings.push('Add at least one source to drive flow into the simulation.');
        }
        if (roleCounts.sinks === 0) {
          warnings.push('Add at least one sink so flow has an endpoint.');
        }
        if (nextDisconnected.size > 0) {
          warnings.push(`${nextDisconnected.size} placed equipment item(s) are still disconnected.`);
        }
        this.placedEquipmentIds.set(nextPlaced);
        this.placedEquipmentPlacementMap.set(nextPlacementMap);
        this.currentConnections.set(nextConnections);
        this.disconnectedEquipmentIds.set(nextDisconnected);
        this.readinessSummary.set({
          sources: roleCounts.sources,
          sinks: roleCounts.sinks,
          valves: roleCounts.valves,
          pumps: roleCounts.pumps,
          vessels: roleCounts.vessels,
          connectedPlacements: connectedPlacementIds.size,
          warnings,
        });
        this.connectionCount.set(data.connections.length);
      },
      error: () => {
        this.placedEquipmentIds.set(new Set());
        this.placedEquipmentPlacementMap.set(new Map());
        this.currentConnections.set([]);
        this.disconnectedEquipmentIds.set(new Set());
        this.readinessSummary.set({
          sources: 0,
          sinks: 0,
          valves: 0,
          pumps: 0,
          vessels: 0,
          connectedPlacements: 0,
          warnings: [],
        });
        this.connectionCount.set(0);
      },
    });
  }

  toNumberOrUndefined(value: string | number | null | undefined): number | undefined {
    if (value == null || value === '') return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  openDiagram(id: number): void {
    this.builderState.currentDiagramId.set(id);
    this.activeDiagramId.set(id);
  }

  openInStandalone(): void {
    const diagramId = this.activeDiagramId();
    if (diagramId == null) return;
    this.router.navigate(['/diagram-builder', 'build', diagramId]);
  }

  refreshContextDiagrams(preferredDiagramId?: number | null): void {
    const fileId = this.builderState.currentFile()?.id;
    if (!fileId) return;
    this.loadContextDiagrams(fileId, preferredDiagramId ?? this.activeDiagramId());
  }

  private loadContextDiagrams(fileId: number, preferredDiagramId?: number | null): void {
    this.loading.set(true);
    this.diagramApi.getByContextFile(fileId).subscribe({
      next: (res) => {
        const diagrams = res.responseData || [];
        this.contextDiagrams.set(diagrams);

        const requestedId = preferredDiagramId ?? this.builderState.currentDiagramId();
        const preferred = requestedId != null
          ? diagrams.find(diagram => diagram.id === requestedId) ?? null
          : null;
        const fallback = diagrams[0] || null;
        const active = preferred ?? fallback;

        this.activeDiagramId.set(active?.id ?? null);
        this.builderState.currentDiagramId.set(active?.id ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.contextDiagrams.set([]);
        this.activeDiagramId.set(null);
        this.loading.set(false);
      },
    });
  }

  close(): void {
    this.builderState.closeDiagramBuilder();
  }
}
