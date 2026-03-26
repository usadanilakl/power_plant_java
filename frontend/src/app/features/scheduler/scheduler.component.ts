import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DagRendererComponent, LinkEvent, ContextMenuAction} from './components/dag-renderer/dag-renderer.component';
import {TaskDetailSidebarComponent} from './components/task-detail-sidebar/task-detail-sidebar.component';
import {FlowSelectorComponent} from './components/flow-selector/flow-selector.component';
import {SchedulerStateService} from '../../services/scheduler/scheduler-state.service';
import {SchedulerTaskDto} from '../../models/scheduler/scheduler-task.model';
import {FlowDto} from '../../models/scheduler/flow.model';

@Component({
  selector: 'app-scheduler',
  standalone: true,
  imports: [CommonModule, DagRendererComponent, TaskDetailSidebarComponent, FlowSelectorComponent],
  templateUrl: './scheduler.component.html',
  styleUrl: './scheduler.component.css'
})
export class SchedulerComponent implements OnInit {

  constructor(public state: SchedulerStateService) {}

  ngOnInit(): void {
    this.state.loadFlows();
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
  }

  onTaskDoubleClicked(task: SchedulerTaskDto): void {
    // Drill into a task to see its steps
    if (task.taskLevel === 'TASK') {
      this.state.drillInto(task);
    }
  }

  onCanvasClicked(): void {
    this.state.selectTask(null);
  }

  onSidebarClosed(): void {
    this.state.selectTask(null);
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
      // Adding a step to the drilled task
      this.state.addStep(drilled, name);
    } else {
      // Adding a top-level task
      const task = new SchedulerTaskDto({name, flowId: flow.id, taskLevel: 'TASK', taskType: 'ONE_TIME'});
      this.state.createTask(task);
    }
  }

  onLinkCreated(event: LinkEvent): void {
    // Find the target among visible tasks
    const visible = this.state.visibleTasks();
    const target = visible.find(t => t.id === event.targetId);
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

  onDrillOut(): void {
    this.state.drillOut();
  }
}
