import { FormField } from "../inputs/form-field.model";

export interface IJobStep {
  description: string;
  hazard: string;
  safetyMeasures: string;
}

export class JobStep implements IJobStep {
  description: string;
  hazard: string;
  safetyMeasures: string;

  constructor(data: Partial<IJobStep> = {}) {
    this.description = data.description ?? '';
    this.hazard = data.hazard ?? '';
    this.safetyMeasures = data.safetyMeasures ?? '';
  }
}

export interface IJha {
  jobName: string;
  applicability: string;
  status: string;
  analysisBy: string;
  reviewedBy: string;
  approvedBy: string;
  date: string;
  ppe: string;
  loto: string;
  hazCom: string;
  handAndPowerTools: string;
  specialTools: string;
  jobSteps: IJobStep[];
}

export class Jha implements IJha {
  jobName: string;
  applicability: string;
  status: string;
  analysisBy: string;
  reviewedBy: string;
  approvedBy: string;
  date: string;
  ppe: string;
  loto: string;
  hazCom: string;
  handAndPowerTools: string;
  specialTools: string;
  jobSteps: JobStep[];

  constructor(data: Partial<IJha> = {}) {
    this.jobName = data.jobName ?? '';
    this.applicability = data.applicability ?? '';
    this.status = data.status ?? 'new';
    this.analysisBy = data.analysisBy ?? '';
    this.reviewedBy = data.reviewedBy ?? '';
    this.approvedBy = data.approvedBy ?? '';
    this.date = data.date ?? '';
    this.ppe = data.ppe ?? '';
    this.loto = data.loto ?? '';
    this.hazCom = data.hazCom ?? '';
    this.handAndPowerTools = data.handAndPowerTools ?? '';
    this.specialTools = data.specialTools ?? '';
    this.jobSteps = data.jobSteps?.map(step => new JobStep(step)) ?? [];
  }

  toFormFields(options?: { fields?: (keyof IJha)[] }): FormField[] {
    const allFormFields: FormField[] = [
      { name: 'jobName', label: 'Job Name/Title', type: 'text', initialValue: this.jobName },
      { name: 'applicability', label: 'Applicability', type: 'text', initialValue: this.applicability },
      { name: 'analysisBy', label: 'Analysis By', type: 'text', initialValue: this.analysisBy },
      { name: 'reviewedBy', label: 'Reviewed By', type: 'text', initialValue: this.reviewedBy },
      { name: 'approvedBy', label: 'Approved By', type: 'text', initialValue: this.approvedBy },
      { name: 'date', label: 'Date', type: 'date', initialValue: this.date },
      { name: 'ppe', label: 'Personal Protective Equipment (PPE)', type: 'textarea', initialValue: this.ppe },
      { name: 'loto', label: 'LOTO', type: 'textarea', initialValue: this.loto },
      { name: 'hazCom', label: 'HazCom', type: 'textarea', initialValue: this.hazCom },
      { name: 'handAndPowerTools', label: 'Hand and Power Tools', type: 'textarea', initialValue: this.handAndPowerTools },
      { name: 'specialTools', label: 'Special Tools', type: 'textarea', initialValue: this.specialTools },
      { name: 'jobSteps', label: 'Job Steps', type: 'multi-input', initialValue: this.jobSteps },
    ];

    if (options?.fields) {
      return allFormFields.filter(field => options.fields!.includes(field.name as keyof IJha));
    }

    return allFormFields;
  }
}