import { Column } from "../inputs/column.model";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "./base.model";

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

export interface IJha extends IBaseModel {
  jobName: string;
  applicability: string;
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

export class Jha extends BaseModel<IJha> implements IJha {
  jobName: string;
  applicability: string;
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
    super(data);
    this.jobName = data.jobName ?? '';
    this.applicability = data.applicability ?? '';
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

  getFormFields(): FormField[] {
    return [
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
  }
  
    getTableColumns(): Column[] {
      return [
        { id: 'jobName', header: 'Job Name', accessorKey: 'jobName' },
        { id: 'analysisBy', header: 'Analysis By', accessorKey: 'analysisBy' },
        { id: 'status', header: 'Status', accessorKey: 'status' },
        {
          id: 'updatedAt',
          header: 'Last Updated',
          accessorFn: (item: IJha) => new Date(item.updatedAt).toLocaleDateString()
        },
      ];
    }
}