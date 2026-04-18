import {BaseDto, BaseModel} from '../base/base.model';

export interface TaskTemplateModel extends BaseModel {
  description: string;
  taskType: string;
  defaultPriorityId: number | null;
  stepTemplatesJson: string;
  defaultReferenceTypesJson: string;
}

export class TaskTemplateDto extends BaseDto implements TaskTemplateModel {
  description: string;
  taskType: string;
  defaultPriorityId: number | null;
  stepTemplatesJson: string;
  defaultReferenceTypesJson: string;

  constructor(data: Partial<TaskTemplateModel> = {}) {
    super(data);
    this.description = data.description ?? '';
    this.taskType = data.taskType ?? 'RECURRING';
    this.defaultPriorityId = data.defaultPriorityId ?? null;
    this.stepTemplatesJson = data.stepTemplatesJson ?? '[]';
    this.defaultReferenceTypesJson = data.defaultReferenceTypesJson ?? '[]';
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      taskType: this.taskType,
      defaultPriority: this.defaultPriorityId ? {id: this.defaultPriorityId} : null,
      stepTemplatesJson: this.stepTemplatesJson,
      defaultReferenceTypesJson: this.defaultReferenceTypesJson,
    };
  }

  static override fromJson(json: any): TaskTemplateDto {
    if (!json) return new TaskTemplateDto();
    return new TaskTemplateDto({
      id: json.id,
      name: json.name,
      description: json.description,
      taskType: json.taskType,
      defaultPriorityId: json.defaultPriority?.id ?? json.defaultPriorityId ?? null,
      stepTemplatesJson: json.stepTemplatesJson ?? '[]',
      defaultReferenceTypesJson: json.defaultReferenceTypesJson ?? '[]',
    });
  }

  get stepTemplates(): StepTemplate[] {
    try { return JSON.parse(this.stepTemplatesJson); } catch { return []; }
  }
}

export interface StepTemplateReference {
  referenceType: string;   // Equipment, FileObject, LotoPoint, User, DailyPermitPackage, etc.
  referenceId: number;
  label?: string;          // human-readable label for display (e.g. "P&ID Drawing 2A")
}

export interface StepTemplate {
  stepKey: string;         // stable identifier for re-imports/versioning (e.g. "step-001")
  name: string;
  description: string;
  sortOrder: number;
  prerequisiteStepKeys: string[];   // stepKeys this step depends on (empty = depends on previous)
  references: StepTemplateReference[];  // seeded references copied to live task on instantiation
  warning: string;         // safety warning text (displayed prominently)
  caution: string;         // caution text
  requiresSignoff: boolean;  // step completion requires supervisor signoff
  expectedDurationMinutes: number | null;  // estimated time for planning
}
