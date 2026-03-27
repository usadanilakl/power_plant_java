import {BaseDto, BaseModel} from '../base/base.model';

export interface AttachmentInfo {
  id: number;
  name: string;
  fileLink: string;
}

export interface ReferenceInfo {
  id: number;           // TaskReference id (for removal)
  referenceType: string; // Equipment, User, DailyPermitPackage, etc.
  referenceId: number;   // ID of the referenced entity
}

export interface SchedulerTaskModel extends BaseModel {
  description: string;
  notes: string;
  taskLevel: string;
  taskType: string;
  statusId: number | null;
  statusName: string;
  flowId: number | null;
  parentTaskId: number | null;
  assigneeId: number | null;
  assigneeName: string;
  priorityId: number | null;
  dueDate: string | null;
  sortOrder: number | null;
  templateId: number | null;
  prerequisiteIds: number[];
  subTasks: SchedulerTaskModel[];
  dependentIds: number[];
  attachments: AttachmentInfo[];
  references: ReferenceInfo[];
}

export class SchedulerTaskDto extends BaseDto implements SchedulerTaskModel {
  description: string;
  notes: string;
  taskLevel: string;
  taskType: string;
  statusId: number | null;
  statusName: string;
  flowId: number | null;
  parentTaskId: number | null;
  assigneeId: number | null;
  assigneeName: string;
  priorityId: number | null;
  dueDate: string | null;
  sortOrder: number | null;
  templateId: number | null;
  prerequisiteIds: number[];
  subTasks: SchedulerTaskDto[];
  dependentIds: number[];
  attachments: AttachmentInfo[];
  references: ReferenceInfo[];

  constructor(data: Partial<SchedulerTaskModel> = {}) {
    super(data);
    this.description = data.description ?? '';
    this.notes = data.notes ?? '';
    this.taskLevel = data.taskLevel ?? 'TASK';
    this.taskType = data.taskType ?? 'ONE_TIME';
    this.statusId = data.statusId ?? null;
    this.statusName = data.statusName ?? '';
    this.flowId = data.flowId ?? null;
    this.parentTaskId = data.parentTaskId ?? null;
    this.assigneeId = data.assigneeId ?? null;
    this.assigneeName = data.assigneeName ?? '';
    this.priorityId = data.priorityId ?? null;
    this.dueDate = data.dueDate ?? null;
    this.sortOrder = data.sortOrder ?? null;
    this.templateId = data.templateId ?? null;
    this.prerequisiteIds = data.prerequisiteIds ?? [];
    this.subTasks = (data.subTasks ?? []).map(s => new SchedulerTaskDto(s));
    this.dependentIds = data.dependentIds ?? [];
    this.attachments = data.attachments ?? [];
    this.references = data.references ?? [];
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      notes: this.notes,
      taskLevel: this.taskLevel,
      taskType: this.taskType,
      statusId: this.statusId,
      flowId: this.flowId,
      parentTaskId: this.parentTaskId,
      assigneeId: this.assigneeId,
      priorityId: this.priorityId,
      dueDate: this.dueDate,
      sortOrder: this.sortOrder,
      templateId: this.templateId,
      prerequisiteIds: this.prerequisiteIds,
      subTaskIds: this.subTasks.map(s => s.id),
      attachmentIds: this.attachments.map(a => a.id),
    };
  }

  static override fromJson(json: any): SchedulerTaskDto {
    if (!json) return new SchedulerTaskDto();
    return new SchedulerTaskDto({
      id: json.id,
      name: json.name,
      description: json.description,
      notes: json.notes,
      taskLevel: json.taskLevel,
      taskType: json.taskType,
      statusId: json.status?.id ?? json.statusId ?? null,
      statusName: json.status?.name ?? json.statusName ?? '',
      flowId: json.flowId ?? null,
      parentTaskId: json.parentTaskId ?? null,
      assigneeId: json.assignee?.id ?? json.assigneeId ?? null,
      assigneeName: json.assignee?.name ?? json.assigneeName ?? '',
      priorityId: json.priority?.id ?? json.priorityId ?? null,
      dueDate: json.dueDate ?? null,
      sortOrder: json.sortOrder ?? null,
      templateId: json.template?.id ?? json.templateId ?? null,
      prerequisiteIds: json.prerequisites?.map((p: any) => p.id) ?? json.prerequisiteIds ?? [],
      subTasks: json.subTasks?.map((s: any) => SchedulerTaskDto.fromJson(s)) ?? [],
      dependentIds: json.dependents?.map((d: any) => d.id) ?? json.dependentIds ?? [],
      attachments: json.attachments?.map((a: any) => ({id: a.id, name: a.name, fileLink: a.fileLink})) ?? [],
      references: json.references?.map((r: any) => ({id: r.id, referenceType: r.referenceType, referenceId: r.referenceId})) ?? [],
    });
  }

  get isBlocked(): boolean {
    return this.prerequisiteIds.length > 0 && this.statusName !== 'Completed' && this.statusName !== 'Skipped';
  }

  get isMultiStep(): boolean {
    return this.subTasks.length > 0;
  }
}
