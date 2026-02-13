import { BaseDto, BaseModel } from '../base/base.model';
import { Column } from '../column.model';
import { FormField } from '../ui/form-field.model';

export type JhaFieldName = keyof JhaModel;

export interface IJobStep {
  sequence: number;
  description: string;
  hazard: string;
  safetyMeasures: string;
}

export class JobStep implements IJobStep {
  sequence: number;
  description: string;
  hazard: string;
  safetyMeasures: string;

  constructor(data: Partial<IJobStep> = {}) {
    this.sequence = data.sequence ?? 0;
    this.description = data.description ?? '';
    this.hazard = data.hazard ?? '';
    this.safetyMeasures = data.safetyMeasures ?? '';
  }

  getFormFields(): FormField[] {
    return [
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'hazard', label: 'Hazard', type: 'textarea' },
      { name: 'safetyMeasures', label: 'Safety Measure', type: 'textarea' }
    ];
  }
}

export interface JhaModel extends BaseModel {
  jobName: string | null;
  applicability: string | null;
  analysisBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  date: string | null;
  ppe: string | null;
  loto: string | null;
  confinedSpace: string | null;
  hazCom: string | null;
  handAndPowerTools: string | null;
  specialTools: string | null;
  jobSteps: IJobStep[] | null;
  sharepointId: string | null;
  localUuid: string | null;
  workRequestSharepointId: string | null;
  workRequestId: number | null;
  status: string | null;
  attachmentCount: number | null;
  timeSubmitted: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterPhone: string | null;
  submitterCompany: string | null;
}

export class JhaDto extends BaseDto implements JhaModel {
  jobName: string | null;
  applicability: string | null;
  analysisBy: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  date: string | null;
  ppe: string | null;
  loto: string | null;
  confinedSpace: string | null;
  hazCom: string | null;
  handAndPowerTools: string | null;
  specialTools: string | null;
  jobSteps: IJobStep[] | null;
  sharepointId: string | null;
  localUuid: string | null;
  workRequestSharepointId: string | null;
  workRequestId: number | null;
  status: string | null;
  attachmentCount: number | null;
  timeSubmitted: string | null;
  submitterName: string | null;
  submitterEmail: string | null;
  submitterPhone: string | null;
  submitterCompany: string | null;

  constructor(data: Partial<JhaModel> = {}) {
    super(data);
    this.jobName = data.jobName ?? null;
    this.applicability = data.applicability ?? null;
    this.analysisBy = data.analysisBy ?? null;
    this.reviewedBy = data.reviewedBy ?? null;
    this.approvedBy = data.approvedBy ?? null;
    this.date = data.date ?? null;
    this.ppe = data.ppe ?? null;
    this.loto = data.loto ?? null;
    this.confinedSpace = data.confinedSpace ?? null;
    this.hazCom = data.hazCom ?? null;
    this.handAndPowerTools = data.handAndPowerTools ?? null;
    this.specialTools = data.specialTools ?? null;
    this.jobSteps = data.jobSteps ?? null;
    this.sharepointId = data.sharepointId ?? null;
    this.localUuid = data.localUuid ?? null;
    this.workRequestSharepointId = data.workRequestSharepointId ?? null;
    this.workRequestId = data.workRequestId ?? null;
    this.status = data.status ?? null;
    this.attachmentCount = data.attachmentCount ?? null;
    this.timeSubmitted = data.timeSubmitted ?? null;
    this.submitterName = data.submitterName ?? null;
    this.submitterEmail = data.submitterEmail ?? null;
    this.submitterPhone = data.submitterPhone ?? null;
    this.submitterCompany = data.submitterCompany ?? null;
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      jobName: this.jobName,
      applicability: this.applicability,
      analysisBy: this.analysisBy,
      reviewedBy: this.reviewedBy,
      approvedBy: this.approvedBy,
      date: this.date,
      ppe: this.ppe,
      loto: this.loto,
      confinedSpace: this.confinedSpace,
      hazCom: this.hazCom,
      handAndPowerTools: this.handAndPowerTools,
      specialTools: this.specialTools,
      jobSteps: this.jobSteps,
      sharepointId: this.sharepointId,
      localUuid: this.localUuid,
      workRequestSharepointId: this.workRequestSharepointId,
      workRequestId: this.workRequestId,
      status: this.status,
      attachmentCount: this.attachmentCount,
      timeSubmitted: this.timeSubmitted,
      submitterName: this.submitterName,
      submitterEmail: this.submitterEmail,
      submitterPhone: this.submitterPhone,
      submitterCompany: this.submitterCompany,
    };
  }

  static override fromJson(json: any): JhaDto {
    if (!json) return new JhaDto();
    return new JhaDto({
      ...super.fromJson(json),
      jobName: json.jobName || null,
      applicability: json.applicability || null,
      analysisBy: json.analysisBy || null,
      reviewedBy: json.reviewedBy || null,
      approvedBy: json.approvedBy || null,
      date: json.date || null,
      ppe: json.ppe || null,
      loto: json.loto || null,
      confinedSpace: json.confinedSpace || null,
      hazCom: json.hazCom || null,
      handAndPowerTools: json.handAndPowerTools || null,
      specialTools: json.specialTools || null,
      jobSteps: json.jobSteps || null,
      sharepointId: json.sharepointId || null,
      localUuid: json.localUuid || null,
      workRequestSharepointId: json.workRequestSharepointId || null,
      workRequestId: json.workRequestId ?? null,
      status: json.status || null,
      attachmentCount: json.attachmentCount ?? null,
      timeSubmitted: json.timeSubmitted || null,
      submitterName: json.submitterName || null,
      submitterEmail: json.submitterEmail || null,
      submitterPhone: json.submitterPhone || null,
      submitterCompany: json.submitterCompany || null,
    });
  }

  static isValidKey(key: string): key is keyof JhaModel {
    return [
      'id', 'jobName', 'applicability', 'analysisBy', 'reviewedBy', 'approvedBy',
      'date', 'ppe', 'loto', 'confinedSpace', 'hazCom', 'handAndPowerTools',
      'specialTools', 'jobSteps', 'sharepointId', 'localUuid', 'workRequestSharepointId',
      'workRequestId', 'status', 'attachmentCount', 'timeSubmitted',
      'submitterName', 'submitterEmail', 'submitterPhone', 'submitterCompany',
      'isVerified', 'name', 'objectType'
    ].includes(key);
  }

  getFormFields(): FormField[] {
    return [
      { name: 'jobName', label: 'Job Name/Title', type: 'text', initialValue: this.jobName },
      { name: 'applicability', label: 'Applicability', type: 'text', initialValue: this.applicability },
      { name: 'analysisBy', label: 'Analysis By', type: 'text', initialValue: this.analysisBy },
      { name: 'reviewedBy', label: 'Reviewed By', type: 'text', initialValue: this.reviewedBy },
      { name: 'approvedBy', label: 'Approved By', type: 'text', initialValue: this.approvedBy },
      { name: 'date', label: 'Date', type: 'date', initialValue: this.date },
      { name: 'ppe', label: 'PPE', type: 'textarea', initialValue: this.ppe },
      { name: 'loto', label: 'LOTO', type: 'textarea', initialValue: this.loto },
      { name: 'confinedSpace', label: 'Confined Space', type: 'textarea', initialValue: this.confinedSpace },
      { name: 'hazCom', label: 'HazCom', type: 'textarea', initialValue: this.hazCom },
      { name: 'handAndPowerTools', label: 'Hand and Power Tools', type: 'textarea', initialValue: this.handAndPowerTools },
      { name: 'specialTools', label: 'Special Tools', type: 'textarea', initialValue: this.specialTools },
    ];
  }
}

/** @deprecated Use JhaDto instead */
export { JhaDto as Jha };
