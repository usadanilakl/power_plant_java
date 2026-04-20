import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterLink} from '@angular/router';
import {Subscription} from 'rxjs';
import {DagRendererComponent, LinkEvent, ContextMenuAction} from './components/dag-renderer/dag-renderer.component';
import {TaskDetailSidebarComponent} from './components/task-detail-sidebar/task-detail-sidebar.component';
import {FlowSelectorComponent} from './components/flow-selector/flow-selector.component';
import {SchedulerStateService} from '../../services/scheduler/scheduler-state.service';
import {SchedulerTaskDto} from '../../models/scheduler/scheduler-task.model';
import {TaskTemplateDto} from '../../models/scheduler/task-template.model';
import {FlowDto} from '../../models/scheduler/flow.model';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [CommonModule, RouterLink, DagRendererComponent, TaskDetailSidebarComponent, FlowSelectorComponent],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.css'
})
export class SchedulerComponent implements OnInit, OnDestroy {
  // Local properties driven by state — avoids signal-in-template issues
  selectedTask: SchedulerTaskDto | null = null;
  visibleTasks: SchedulerTaskDto[] = [];
  allTasks: SchedulerTaskDto[] = [];
  activeFlow: FlowDto | null = null;
  drilledTask: SchedulerTaskDto | null = null;
  templates: TaskTemplateDto[] = [];
  showTemplateMenu = false;
  viewMode: 'build' | 'execute' = 'build';

  private subs: Subscription[] = [];

  constructor(public state: SchedulerStateService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.state.loadFlows();
    this.state.loadTemplates();

    // Poll signals into local properties on a microtask so the template always has fresh data
    // Using effect() would be ideal but we need broad compatibility — setInterval is simple and reliable
    const poll = setInterval(() => {
      const newSelected = this.state.selectedTask();
      const newVisible = this.state.visibleTasks();
      const newAll = this.state.allTasks();
      const newFlow = this.state.activeFlow();
      const newDrilled = this.state.drilledTask();
      const newTemplates = this.state.templates();

      let changed = false;
      if (newSelected !== this.selectedTask) { this.selectedTask = newSelected; changed = true; }
      if (newVisible !== this.visibleTasks) { this.visibleTasks = newVisible; changed = true; }
      if (newAll !== this.allTasks) { this.allTasks = newAll; changed = true; }
      if (newFlow !== this.activeFlow) { this.activeFlow = newFlow; changed = true; }
      if (newDrilled !== this.drilledTask) { this.drilledTask = newDrilled; changed = true; }
      if (newTemplates !== this.templates) { this.templates = newTemplates; changed = true; }
      const newMode = this.state.viewMode();
      if (newMode !== this.viewMode) { this.viewMode = newMode; changed = true; }

      if (changed) this.cdr.detectChanges();
    }, 100);
    this.subs.push({ unsubscribe: () => clearInterval(poll) } as Subscription);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  onFlowSelected(flow: FlowDto): void {
    this.state.setActiveFlow(flow);
  }

  onCreateFlow(): void {
    const name = prompt('Flow name:');
    if (!name) return;
    this.state.createFlow(new FlowDto({name}));
  }

  onDeleteFlow(flow: FlowDto): void {
    this.state.deleteFlow(flow.id);
  }

  onTaskClicked(task: SchedulerTaskDto): void {
    this.state.selectTask(task);
    this.selectedTask = task;
    this.cdr.detectChanges();
  }

  onTaskDoubleClicked(task: SchedulerTaskDto): void {
    if (task.taskLevel === 'TASK') {
      this.state.drillInto(task);
    }
  }

  onCanvasClicked(): void {
    this.state.selectTask(null);
    this.selectedTask = null;
    this.cdr.detectChanges();
  }

  onSidebarClosed(): void {
    this.state.selectTask(null);
    this.selectedTask = null;
    this.cdr.detectChanges();
  }

  onTaskUpdated(task: SchedulerTaskDto): void {
    this.state.updateTask(task);
  }

  onTaskDeleted(task: SchedulerTaskDto): void {
    if (confirm(`Delete "${task.name}"?`)) {
      this.state.deleteTask(task.id);
    }
  }

  onStatusChanged(event: {task: SchedulerTaskDto, status: string}): void {
    event.task.statusName = event.status;
    this.state.updateTask(event.task);
  }

  onAddTask(): void {
    const flow = this.state.activeFlow();
    if (!flow) return;

    const drilled = this.state.drilledTask();
    const name = prompt(drilled ? 'Step name:' : 'Task name:');
    if (!name) return;

    if (drilled) {
      this.state.addStep(drilled, name);
    } else {
      const task = new SchedulerTaskDto({name, flowId: flow.id, taskLevel: 'TASK', taskType: 'ONE_TIME'});
      this.state.createTask(task);
    }
  }

  onLinkCreated(event: LinkEvent): void {
    const target = this.visibleTasks.find(t => t.id === event.targetId);
    if (!target) return;
    const updated = [...target.prerequisiteIds, event.sourceId];
    this.state.updatePrerequisites(event.targetId, updated);
  }

  onContextAction(event: ContextMenuAction): void {
    switch (event.action) {
      case 'delete':
        if (confirm(`Delete "${event.task.name}"?`)) {
          this.state.deleteTask(event.task.id);
        }
        break;
      case 'unlink':
        if (event.targetId != null) {
          const updated = event.task.prerequisiteIds.filter(id => id !== event.targetId);
          this.state.updatePrerequisites(event.task.id, updated);
        }
        break;
      case 'start':
        event.task.statusName = 'In Progress';
        this.state.updateTask(event.task);
        break;
      case 'complete':
        event.task.statusName = 'Completed';
        this.state.updateTask(event.task);
        break;
      case 'skip':
        event.task.statusName = 'Skipped';
        this.state.updateTask(event.task);
        break;
    }
  }

  onPrerequisitesChanged(event: {taskId: number, prerequisiteIds: number[]}): void {
    this.state.updatePrerequisites(event.taskId, event.prerequisiteIds);
  }

  onAddStepFromSidebar(parentTask: SchedulerTaskDto): void {
    const name = prompt('Step name:');
    if (!name) return;
    this.state.addStep(parentTask, name);
  }

  onDrillInto(task: SchedulerTaskDto): void {
    this.state.drillInto(task);
  }

  onFileUploaded(event: {taskId: number, file: File}): void {
    this.state.uploadAttachment(event.taskId, event.file);
  }

  onAttachmentRemoved(event: {taskId: number, fileId: number}): void {
    this.state.removeAttachment(event.taskId, event.fileId);
  }

  onReferenceAdded(event: {taskId: number, referenceType: string, referenceId: number}): void {
    this.state.addReference(event.taskId, event.referenceType, event.referenceId);
  }

  onReferenceRemoved(event: {taskId: number, refId: number}): void {
    this.state.removeReference(event.taskId, event.refId);
  }

  onSaveAsTemplate(task: SchedulerTaskDto): void {
    const name = prompt('Template name:', task.name);
    if (!name) return;
    this.state.saveTaskAsTemplate(task, name);
  }

  onDrillOut(): void {
    this.state.drillOut();
  }

  onToggleMode(): void {
    this.state.toggleViewMode();
  }

  toggleTemplateMenu(): void {
    this.showTemplateMenu = !this.showTemplateMenu;
  }

  onInstantiateTemplate(template: TaskTemplateDto): void {
    this.state.instantiateTemplate(template.id);
    this.showTemplateMenu = false;
  }
}
