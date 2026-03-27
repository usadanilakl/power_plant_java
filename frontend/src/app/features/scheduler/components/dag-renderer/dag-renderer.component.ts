import {
  Component, ElementRef, ViewChild, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, AfterViewInit, OnDestroy, NgZone
} from '@angular/core';
import {CommonModule} from '@angular/common';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';
import {SchedulerTaskDto} from '../../../../models/scheduler/scheduler-task.model';

cytoscape.use(dagre);

export interface LinkEvent {
  sourceId: number;
  targetId: number;
}

export interface ContextMenuAction {
  task: SchedulerTaskDto;
  action: 'delete' | 'link-from' | 'unlink' | 'add-step';
  targetId?: number;
}

interface CtxConnection {
  label: string;
  prereqId: number;
  dependentId: number;
}

@Component({
  selector: 'app-dag-renderer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dag-wrapper">
      <div #cyContainer class="dag-container"></div>

      <!-- Link mode banner -->
      <div class="link-banner" *ngIf="linkMode">
        Linking from "{{ linkSourceName }}" — click a target task, or
        <button (click)="cancelLink()">Cancel</button>
      </div>

      <!-- Context menu -->
      <div class="context-menu" *ngIf="contextMenu"
           [style.left.px]="contextMenu.x" [style.top.px]="contextMenu.y">
        <button (click)="onCtxAction('link-from')">Link from here...</button>

        <!-- Show existing connections to remove -->
        <ng-container *ngIf="contextMenu.connections.length > 0">
          <div class="ctx-separator"></div>
          <div class="ctx-label">Remove connection:</div>
          <button *ngFor="let conn of contextMenu.connections"
                  class="ctx-unlink"
                  (click)="onCtxUnlink(conn)">
            {{ conn.label }}
          </button>
        </ng-container>

        <div class="ctx-separator"></div>
        <button class="ctx-danger" (click)="onCtxAction('delete')">Delete</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; flex: 1; min-width: 0; min-height: 0; height: 100%; }
    .dag-wrapper { position: relative; width: 100%; height: 100%; overflow: hidden; }
    .dag-container { width: 100%; height: 100%; }
    .link-banner {
      position: absolute; top: 8px; left: 50%; transform: translateX(-50%);
      background: #3b82f6; color: #fff; padding: 6px 16px; border-radius: 6px;
      font-size: 12px; display: flex; align-items: center; gap: 8px; z-index: 10;
    }
    .link-banner button {
      background: rgba(255,255,255,0.2); border: none; color: #fff;
      padding: 2px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;
    }
    .context-menu {
      position: absolute; z-index: 20; background: #1e1e2e; border: 1px solid #444;
      border-radius: 6px; padding: 4px 0; min-width: 200px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .context-menu button {
      display: block; width: 100%; text-align: left; background: none; border: none;
      color: #cdd6f4; padding: 6px 14px; font-size: 12px; cursor: pointer;
    }
    .context-menu button:hover { background: #313244; }
    .ctx-separator { height: 1px; background: #333; margin: 4px 0; }
    .ctx-label { padding: 4px 14px; font-size: 10px; color: #888; text-transform: uppercase; }
    .ctx-unlink { color: #f59e0b !important; }
    .ctx-unlink:hover { background: #332b00 !important; }
    .ctx-danger { color: #ef4444 !important; }
    .ctx-danger:hover { background: #330000 !important; }
  `]
})
export class DagRendererComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('cyContainer') cyContainer!: ElementRef;

  @Input() tasks: SchedulerTaskDto[] = [];
  @Input() selectedTaskId: number | null = null;
  @Output() taskClicked = new EventEmitter<SchedulerTaskDto>();
  @Output() taskDoubleClicked = new EventEmitter<SchedulerTaskDto>();
  @Output() canvasClicked = new EventEmitter<void>();
  @Output() linkCreated = new EventEmitter<LinkEvent>();
  @Output() contextAction = new EventEmitter<ContextMenuAction>();

  private cy: cytoscape.Core | null = null;

  linkMode = false;
  linkSourceId: number | null = null;
  linkSourceName = '';

  contextMenu: {x: number, y: number, task: SchedulerTaskDto, connections: CtxConnection[]} | null = null;
  private nodeJustClicked = false;

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit(): void {
    this.initCytoscape();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.cy) return;
    if (changes['tasks']) {
      this.updateGraph();
    } else if (changes['selectedTaskId']) {
      this.updateSelection();
      // Sidebar opening/closing changes container size — tell Cytoscape
      setTimeout(() => this.cy?.resize(), 200);
    }
  }

  ngOnDestroy(): void {
    this.cy?.destroy();
  }

  private initCytoscape(): void {
    this.cy = cytoscape({
      container: this.cyContainer.nativeElement,
      style: this.getStylesheet(),
      layout: {name: 'preset'},
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    // Left click on node
    this.cy.on('tap', 'node', (evt) => this.ngZone.run(() => {
      this.nodeJustClicked = true;
      this.closeContextMenu();
      const task = this.findTaskFromEvent(evt);
      if (!task) return;

      if (this.linkMode) {
        if (this.linkSourceId !== null && this.linkSourceId !== task.id) {
          this.linkCreated.emit({sourceId: this.linkSourceId, targetId: task.id});
        }
        this.cancelLink();
      } else {
        this.taskClicked.emit(task);
      }
    }));

    // Double click on node
    this.cy.on('dbltap', 'node', (evt) => this.ngZone.run(() => {
      const task = this.findTaskFromEvent(evt);
      if (task) this.taskDoubleClicked.emit(task);
    }));

    // Left click on canvas (background only)
    this.cy.on('tap', (evt) => this.ngZone.run(() => {
      // Skip if a node handler already ran for this tap
      if (this.nodeJustClicked) {
        this.nodeJustClicked = false;
        return;
      }
      this.closeContextMenu();
      if (this.linkMode) {
        this.cancelLink();
      } else {
        this.canvasClicked.emit();
      }
    }));

    // Right click on node — context menu with connections
    this.cy.on('cxttap', 'node', (evt) => this.ngZone.run(() => {
      const task = this.findTaskFromEvent(evt);
      if (!task) return;

      const connections = this.getConnectionsForTask(task);
      const pos = evt.renderedPosition;
      this.contextMenu = {x: pos.x, y: pos.y, task, connections};
    }));

    // Right click on canvas
    this.cy.on('cxttap', (evt) => this.ngZone.run(() => {
      if (evt.target === this.cy) this.closeContextMenu();
    }));

    // Right click on edge — quick unlink
    this.cy.on('cxttap', 'edge', (evt) => this.ngZone.run(() => {
      const edgeData = evt.target.data();
      const sourceTaskId = Number(edgeData.source.replace('task-', ''));
      const targetTaskId = Number(edgeData.target.replace('task-', ''));
      const targetTask = this.tasks.find(t => t.id === targetTaskId);
      if (targetTask) {
        this.contextAction.emit({task: targetTask, action: 'unlink', targetId: sourceTaskId});
      }
    }));

    this.updateGraph();
  }

  private findTaskFromEvent(evt: any): SchedulerTaskDto | undefined {
    const nodeData = evt.target.data();
    const taskId = Number(nodeData.taskId);
    return this.tasks.find(t => t.id === taskId);
  }

  private getConnectionsForTask(task: SchedulerTaskDto): CtxConnection[] {
    const connections: CtxConnection[] = [];

    // Prerequisites: this task depends on...
    for (const pid of task.prerequisiteIds) {
      const prereq = this.tasks.find(t => t.id === pid);
      if (prereq) {
        connections.push({
          label: `${prereq.name || '#' + pid} → this`,
          prereqId: pid,
          dependentId: task.id,
        });
      }
    }

    // Dependents: ... depends on this task
    for (const other of this.tasks) {
      if (other.prerequisiteIds.includes(task.id)) {
        connections.push({
          label: `this → ${other.name || '#' + other.id}`,
          prereqId: task.id,
          dependentId: other.id,
        });
      }
    }

    return connections;
  }

  private getTaskName(id: number): string {
    return this.tasks.find(t => t.id === id)?.name || `#${id}`;
  }

  onCtxAction(action: 'delete' | 'link-from' | 'add-step'): void {
    if (!this.contextMenu) return;
    const task = this.contextMenu.task;
    this.closeContextMenu();

    if (action === 'link-from') {
      this.linkMode = true;
      this.linkSourceId = task.id;
      this.linkSourceName = task.name || `Task #${task.id}`;
    } else {
      this.contextAction.emit({task, action});
    }
  }

  onCtxUnlink(conn: CtxConnection): void {
    const dependent = this.tasks.find(t => t.id === conn.dependentId);
    if (!dependent) return;
    this.closeContextMenu();
    this.contextAction.emit({task: dependent, action: 'unlink', targetId: conn.prereqId});
  }

  cancelLink(): void {
    this.linkMode = false;
    this.linkSourceId = null;
    this.linkSourceName = '';
  }

  private closeContextMenu(): void {
    this.contextMenu = null;
  }

  private updateGraph(): void {
    if (!this.cy) return;

    this.cy.elements().remove();

    const nodes = this.tasks.map(task => ({
      data: {
        id: `task-${task.id}`,
        taskId: task.id,
        label: task.name || `Task ${task.id}`,
        status: this.getComputedStatus(task),
        taskLevel: task.taskLevel,
        isMultiStep: task.isMultiStep ? 'true' : undefined,
        isSelected: task.id === this.selectedTaskId ? 'true' : undefined,
      }
    }));

    const edges: cytoscape.ElementDefinition[] = [];
    this.tasks.forEach(task => {
      task.prerequisiteIds.forEach(preId => {
        if (this.tasks.some(t => t.id === preId)) {
          edges.push({
            data: {
              id: `edge-${preId}-${task.id}`,
              source: `task-${preId}`,
              target: `task-${task.id}`,
            }
          });
        }
      });
    });

    this.cy.add([...nodes, ...edges]);

    this.cy.layout({
      name: 'dagre' as any,
      rankDir: 'TB',
      nodeSep: 60,
      rankSep: 80,
      edgeSep: 20,
      animate: false,
      padding: 30,
    } as any).run();

    this.cy.fit(undefined, 30);
  }

  private updateSelection(): void {
    if (!this.cy) return;
    // Just update the isSelected data on each node — no layout/fit
    this.cy.nodes().forEach(node => {
      const taskId = Number(node.data('taskId'));
      if (taskId === this.selectedTaskId) {
        node.data('isSelected', 'true');
      } else {
        node.removeData('isSelected');
      }
    });
  }

  private getComputedStatus(task: SchedulerTaskDto): string {
    const stored = task.statusName?.toLowerCase() ?? '';
    if (stored === 'completed' || stored === 'skipped' || stored === 'in progress') {
      return stored;
    }
    if (task.prerequisiteIds.length === 0) return 'ready';
    const allPrereqsDone = task.prerequisiteIds.every(pid => {
      const prereq = this.tasks.find(t => t.id === pid);
      return prereq && (prereq.statusName === 'Completed' || prereq.statusName === 'Skipped');
    });
    return allPrereqsDone ? 'ready' : 'blocked';
  }

  private getStylesheet(): any[] {
    return [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#fff',
          'font-size': '11px',
          'text-wrap': 'wrap',
          'text-max-width': '100px',
          'width': 120,
          'height': 50,
          'shape': 'roundrectangle',
          'background-color': '#6b7280',
          'border-width': 2,
          'border-color': '#4b5563',
        }
      },
      {
        selector: 'node[status = "ready"]',
        style: {'background-color': '#3b82f6', 'border-color': '#2563eb'}
      },
      {
        selector: 'node[status = "in progress"]',
        style: {'background-color': '#eab308', 'border-color': '#ca8a04', 'color': '#000'}
      },
      {
        selector: 'node[status = "completed"]',
        style: {'background-color': '#22c55e', 'border-color': '#16a34a'}
      },
      {
        selector: 'node[status = "blocked"]',
        style: {'background-color': '#ef4444', 'border-color': '#dc2626'}
      },
      {
        selector: 'node[status = "skipped"]',
        style: {'background-color': '#9ca3af', 'border-color': '#6b7280'}
      },
      {
        selector: 'node[?isSelected]',
        style: {'border-width': 4, 'border-color': '#f59e0b'}
      },
      {
        selector: 'node[?isMultiStep]',
        style: {'border-style': 'double', 'border-width': 4}
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#555',
          'target-arrow-color': '#555',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1.3,
        }
      },
      {
        selector: 'edge:active',
        style: {
          'width': 5,
          'line-color': '#f59e0b',
          'target-arrow-color': '#f59e0b',
          'overlay-opacity': 0.1,
        }
      },
    ];
  }

  fitView(): void {
    this.cy?.fit(undefined, 30);
  }
}
