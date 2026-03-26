import {BaseDto, BaseModel} from '../base/base.model';

export interface FlowModel extends BaseModel {
  description: string;
  statusId: number | null;
  templateId: number | null;
}

export class FlowDto extends BaseDto implements FlowModel {
  description: string;
  statusId: number | null;
  templateId: number | null;

  constructor(data: Partial<FlowModel> = {}) {
    super(data);
    this.description = data.description ?? '';
    this.statusId = data.statusId ?? null;
    this.templateId = data.templateId ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      description: this.description,
      statusId: this.statusId,
      templateId: this.templateId,
    };
  }

  static override fromJson(json: any): FlowDto {
    if (!json) return new FlowDto();
    return new FlowDto({
      id: json.id,
      name: json.name,
      description: json.description,
      statusId: json.status?.id ?? json.statusId ?? null,
      templateId: json.template?.id ?? json.templateId ?? null,
    });
  }
}
