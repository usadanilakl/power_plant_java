import {Injectable, signal, computed} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
import {FlowDto} from '../../models/scheduler/flow.model';
import {SchedulerTaskDto} from '../../models/scheduler/scheduler-task.model';
import {TaskTemplateDto} from '../../models/scheduler/task-template.model';
import {FlowApiService} from './flow-api.service';
import {TaskApiService} from './task-api.service';
import {TaskTemplateApiService} from './task-template-api.service';

@Injectable({providedIn: 'root'})
export class SchedulerStateService {
  private flowsSubject = new BehaviorSubject<FlowDto[]>([]);
  flows$ = this.flowsSubject.asObservable();

  private tasksSubject = new BehaviorSubject<SchedulerTaskDto[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  activeFlow = signal<FlowDto | null>(null);
  selectedTask = signal<SchedulerTaskDto | null>(null);

  allTasks = signal<SchedulerTaskDto[]>([]);

  // Drill-down: null = viewing flow-level tasks, set = viewing steps of this task
  drilledTask = signal<SchedulerTaskDto | null>(null);

  // What the DAG renderer should show
  visibleTasks = computed(() => {
    const drilled = this.drilledTask();
    if (drilled) {
      // Show this task's steps (subTasks with taskLevel=STEP)
      return drilled.subTasks ?? [];
    }
    // Show top-level tasks
    return this.allTasks().filter(t => t.taskLevel === 'TASK' && !t.parentTaskId);
  });

  topLevelTasks = computed(() =>
    this.allTasks().filter(t => t.taskLevel === 'TASK' && !t.parentTaskId)
  );

  // Linking mode
  linkSource = signal<SchedulerTaskDto | null>(null);

  // Templates
  templates = signal<TaskTemplateDto[]>([]);

  constructor(
    private flowApi: FlowApiService,
    private taskApi: TaskApiService,
    private templateApi: TaskTemplateApiService,
  ) {}

  loadFlows(): void {
    this.flowApi.getAll().subscribe(res => {
      if (res.responseData) {
        const flows = res.responseData.map(FlowDto.fromJson);
        this.flowsSubject.next(flows);
      }
    });
  }

  loadTasksForFlow(flowId: number): void {
    this.taskApi.getByFlow(flowId).subscribe(res => {
      if (res.responseData) {
        const tasks = res.responseData.map(SchedulerTaskDto.fromJson);
        this.allTasks.set(tasks);
        this.tasksSubject.next(tasks);

        // Refresh drilled task if we're drilled in
        const drilled = this.drilledTask();
        if (drilled) {
          const updated = tasks.find(t => t.id === drilled.id);
          this.drilledTask.set(updated ?? null);
        }

        // Refresh selected task
        const selected = this.selectedTask();
        if (selected) {
          const allFlat = this.flattenTasks(tasks);
          const updated = allFlat.find(t => t.id === selected.id);
          this.selectedTask.set(updated ?? null);
        }
      }
    });
  }

  private flattenTasks(tasks: SchedulerTaskDto[]): SchedulerTaskDto[] {
    const result: SchedulerTaskDto[] = [];
    for (const t of tasks) {
      result.push(t);
      if (t.subTasks?.length) {
        result.push(...this.flattenTasks(t.subTasks));
      }
    }
    return result;
  }

  setActiveFlow(flow: FlowDto): void {
    this.activeFlow.set(flow);
    this.drilledTask.set(null);
    this.selectedTask.set(null);
    this.loadTasksForFlow(flow.id);
  }

  selectTask(task: SchedulerTaskDto | null): void {
    this.selectedTask.set(task);
  }

  // Drill into a task to see its steps
  drillInto(task: SchedulerTaskDto): void {
    this.drilledTask.set(task);
    this.selectedTask.set(null);
  }

  // Go back to flow-level view
  drillOut(): void {
    this.drilledTask.set(null);
    this.selectedTask.set(null);
  }

  createFlow(flow: FlowDto): void {
    this.flowApi.create(flow.toJson()).subscribe(res => {
      if (res.responseData) {
        this.loadFlows();
      }
    });
  }

  deleteFlow(flowId: number): void {
    this.flowApi.delete(flowId).subscribe(res => {
      this.loadFlows();
      if (this.activeFlow()?.id === flowId) {
        this.activeFlow.set(null);
        this.allTasks.set([]);
        this.tasksSubject.next([]);
        this.selectedTask.set(null);
        this.drilledTask.set(null);
      }
    });
  }

  createTask(task: SchedulerTaskDto): void {
    this.taskApi.create(task.toJson()).subscribe(res => {
      if (res.responseData) {
        this.reloadCurrentFlow();
      }
    });
  }

  updateTask(task: SchedulerTaskDto): void {
    this.taskApi.update(task.id, task.toJson()).subscribe(res => {
      if (res.responseData) {
        this.reloadCurrentFlow();
      }
    });
  }

  deleteTask(taskId: number): void {
    this.taskApi.delete(taskId).subscribe(res => {
      if (res.responseData) {
        this.reloadCurrentFlow();
        if (this.selectedTask()?.id === taskId) this.selectedTask.set(null);
      }
    });
  }

  updatePrerequisites(taskId: number, prerequisiteIds: number[]): void {
    this.taskApi.updatePrerequisites(taskId, prerequisiteIds).subscribe(res => {
      if (res.responseData) {
        this.reloadCurrentFlow();
      }
    });
  }

  addStep(parentTask: SchedulerTaskDto, stepName: string): void {
    const flow = this.activeFlow();
    if (!flow) return;
    const step = new SchedulerTaskDto({
      name: stepName,
      flowId: flow.id,
      parentTaskId: parentTask.id,
      taskLevel: 'STEP',
      taskType: parentTask.taskType,
    });
    this.taskApi.create(step.toJson()).subscribe(res => {
      if (res.responseData) {
        this.reloadCurrentFlow();
      }
    });
  }

  uploadAttachment(taskId: number, file: File): void {
    this.taskApi.uploadAttachment(taskId, file).subscribe(res => {
      if (res.responseData) {
        this.reloadCurrentFlow();
      }
    });
  }

  removeAttachment(taskId: number, fileId: number): void {
    this.taskApi.removeAttachment(taskId, fileId).subscribe(res => {
      if (res.responseData) {
        this.reloadCurrentFlow();
      }
    });
  }

  addReference(taskId: number, referenceType: string, referenceId: number): void {
    this.taskApi.addReference(taskId, referenceType, referenceId).subscribe(res => {
      if (res.responseData) this.reloadCurrentFlow();
    });
  }

  removeReference(taskId: number, refId: number): void {
    this.taskApi.removeReference(taskId, refId).subscribe(res => {
      if (res.responseData) this.reloadCurrentFlow();
    });
  }

  // Template operations
  loadTemplates(): void {
    this.templateApi.getAll().subscribe(res => {
      if (res.responseData) {
        this.templates.set(res.responseData.map(TaskTemplateDto.fromJson));
      }
    });
  }

  createTemplate(template: TaskTemplateDto): void {
    this.templateApi.create(template.toJson()).subscribe(res => {
      if (res.responseData) this.loadTemplates();
    });
  }

  updateTemplate(template: TaskTemplateDto): void {
    this.templateApi.update(template.id, template.toJson()).subscribe(res => {
      if (res.responseData) this.loadTemplates();
    });
  }

  deleteTemplate(id: number): void {
    this.templateApi.delete(id).subscribe(res => {
      this.loadTemplates();
    });
  }

  saveTaskAsTemplate(task: SchedulerTaskDto, templateName: string): void {
    const stepDefs = task.subTasks.map((s, i) => ({
      name: s.name,
      description: s.description,
      sortOrder: s.sortOrder ?? i,
    }));
    const template = new TaskTemplateDto({
      name: templateName,
      description: task.description,
      taskType: task.taskType,
      stepTemplatesJson: JSON.stringify(stepDefs),
    });
    this.templateApi.create(template.toJson()).subscribe(res => {
      if (res.responseData) this.loadTemplates();
    });
  }

  instantiateTemplate(templateId: number): void {
    const flow = this.activeFlow();
    if (!flow) return;
    this.templateApi.instantiate(templateId, flow.id).subscribe(res => {
      if (res.responseData) this.reloadCurrentFlow();
    });
  }

  private reloadCurrentFlow(): void {
    const flow = this.activeFlow();
    if (flow) this.loadTasksForFlow(flow.id);
  }
}
