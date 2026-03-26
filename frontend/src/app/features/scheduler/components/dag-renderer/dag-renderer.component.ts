import {
  Component, ElementRef, ViewChild, Input, Output, EventEmitter,
  OnChanges, SimpleChanges, AfterViewInit, OnDestroy
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
        <button (click)="onCtxAction('delete')">Delete task</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .dag-wrapper { position: relative; width: 100%; height: 100%; }
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
      border-radius: 6px; padding: 4px 0; min-width: 160px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .context-menu button {
      display: block; width: 100%; text-align: left; background: none; border: none;
      color: #cdd6f4; padding: 6px 14px; font-size: 12px; cursor: pointer;
    }
    .context-menu button:hover { background: #313244; }
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

  // Link mode state
  linkMode = false;
  linkSourceId: number | null = null;
  linkSourceName = '';

  // Context menu state
  contextMenu: {x: number, y: number, task: SchedulerTaskDto} | null = null;

  ngAfterViewInit(): void {
    this.initCytoscape();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.cy && (changes['tasks'] || changes['selectedTaskId'])) {
      this.updateGraph();
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
    this.cy.on('tap', 'node', (evt) => {
      this.closeContextMenu();
      const nodeData = evt.target.data();
      const task = this.tasks.find(t => t.id === nodeData.taskId);
      if (!task) return;

      if (this.linkMode) {
        // Complete the link
        if (this.linkSourceId !== null && this.linkSourceId !== task.id) {
          this.linkCreated.emit({sourceId: this.linkSourceId, targetId: task.id});
        }
        this.cancelLink();
      } else {
        this.taskClicked.emit(task);
      }
    });

    // Double click on node — drill into steps
    this.cy.on('dbltap', 'node', (evt) => {
      const nodeData = evt.target.data();
      const task = this.tasks.find(t => t.id === nodeData.taskId);
      if (task) this.taskDoubleClicked.emit(task);
    });

    // Left click on canvas
    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) {
        this.closeContextMenu();
        if (this.linkMode) {
          this.cancelLink();
        } else {
          this.canvasClicked.emit();
        }
      }
    });

    // Right click on node
    this.cy.on('cxttap', 'node', (evt) => {
      const nodeData = evt.target.data();
      const task = this.tasks.find(t => t.id === nodeData.taskId);
      if (!task) return;

      const pos = evt.renderedPosition;
      this.contextMenu = {x: pos.x, y: pos.y, task};
    });

    // Right click on canvas closes menu
    this.cy.on('cxttap', (evt) => {
      if (evt.target === this.cy) this.closeContextMenu();
    });

    // Right click on edge to unlink
    this.cy.on('cxttap', 'edge', (evt) => {
      const edgeData = evt.target.data();
      const sourceTaskId = Number(edgeData.source.replace('task-', ''));
      const targetTaskId = Number(edgeData.target.replace('task-', ''));
      const targetTask = this.tasks.find(t => t.id === targetTaskId);
      if (targetTask && confirm(`Remove dependency: "${this.getTaskName(sourceTaskId)}" → "${targetTask.name}"?`)) {
        this.contextAction.emit({task: targetTask, action: 'unlink', targetId: sourceTaskId});
      }
    });

    this.updateGraph();
  }

  private getTaskName(id: number): string {
    return this.tasks.find(t => t.id === id)?.name || `Task #${id}`;
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
          'width': 2,
          'line-color': '#6b7280',
          'target-arrow-color': '#6b7280',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'arrow-scale': 1.2,
        }
      },
    ];
  }

  fitView(): void {
    this.cy?.fit(undefined, 30);
  }
}
