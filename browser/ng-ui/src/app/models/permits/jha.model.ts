import { Column } from "../inputs/column.model";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "./base.model";
import { IJobStep, JobStep } from "./jha-job-step.model";
import { JhaPa } from "./jha-pa.model";

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
  sharepointId: string;
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
  sharepointId: string;

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
    this.sharepointId = data.sharepointId?? '';
  }

  // getFormFields(): FormField[] {
  //   return [
  //     { name: 'jobName', label: 'Job Name/Title', type: 'text', initialValue: this.jobName },
  //     { name: 'applicability', label: 'Applicability', type: 'text', initialValue: this.applicability },
  //     { name: 'analysisBy', label: 'Analysis By', type: 'text', initialValue: this.analysisBy },
  //     { name: 'reviewedBy', label: 'Reviewed By', type: 'text', initialValue: this.reviewedBy },
  //     { name: 'approvedBy', label: 'Approved By', type: 'text', initialValue: this.approvedBy },
  //     { name: 'date', label: 'Date', type: 'date', initialValue: this.date },
  //     { name: 'ppe', label: 'Personal Protective Equipment (PPE)', type: 'textarea', initialValue: this.ppe },
  //     { name: 'loto', label: 'LOTO', type: 'textarea', initialValue: this.loto },
  //     { name: 'hazCom', label: 'HazCom', type: 'textarea', initialValue: this.hazCom },
  //     { name: 'handAndPowerTools', label: 'Hand and Power Tools', type: 'textarea', initialValue: this.handAndPowerTools },
  //     { name: 'specialTools', label: 'Special Tools', type: 'textarea', initialValue: this.specialTools },
  //     { name: 'jobSteps', label: 'Job Steps', type: 'multi-input', initialValue: this.jobSteps },
  //     { name:'sharepointId', label: 'Sharepoint ID', type: 'text', initialValue: this.sharepointId },
  //   ];
  // }

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
      { name: 'sharepointId', label: 'Sharepoint ID', type: 'text', initialValue: this.sharepointId },
      {
        name: 'jobSteps',
        label: 'Job Steps',
        type: 'form-array',
        initialValue: this.jobSteps,
        fields: [
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'hazard', label: 'Hazard', type: 'textarea' },
          { name: 'safetyMeasures', label: 'Safety Measure', type: 'textarea' }
        ]
      }
    ];
  }
  
    getTableColumns(): Column[] {
      return [
        { id: 'jobName', header: 'Job Name', accessorKey: 'jobName' },
        { id: 'analysisBy', header: 'Analysis By', accessorKey: 'analysisBy' },
        { id: 'status', header: 'Status', accessorKey: 'status' },
        { id: 'sharepointId', header: 'Sharepoint ID', accessorKey:'sharepointId' },
        {
          id: 'updatedAt',
          header: 'Last Updated',
          accessorFn: (item: IJha) => new Date(item.updatedAt).toLocaleDateString()
        },
      ];
    }
    
    convertToPaModel(): JhaPa {
      return new JhaPa({
        jobName: this.jobName,
        applicability: this.applicability,
        analysisBy: this.analysisBy,
        reviewedBy: this.reviewedBy,
        approvedBy: this.approvedBy,
        date: this.date,
        ppe: this.ppe,
        loto: this.loto,
        hazCom: this.hazCom,
        handAndPowerTools: this.handAndPowerTools,
        specialTools: this.specialTools,
        jobSteps: this.jobSteps,
        sharepointId: this.sharepointId,
      });
    }
  getEmailBody(): string {
    const paModel = this.convertToPaModel();
    const fieldLabels: { [key: string]: string } = {
      jobName: 'Job Name/Title',
      applicability: 'Applicability',
      analysisBy: 'Analysis By',
      reviewedBy: 'Reviewed By',
      approvedBy: 'Approved By',
      date: 'Date',
      ppe: 'Personal Protective Equipment (PPE)',
      loto: 'LOTO',
      hazCom: 'HazCom',
      handAndPowerTools: 'Hand and Power Tools',
      specialTools: 'Special Tools',
      jobSteps: 'Job Steps',
      sharepointId: 'Sharepoint ID'
    };

    let body = '';
    for (const key in paModel) {
      if (Object.prototype.hasOwnProperty.call(paModel, key)) {
        const label = fieldLabels[key] || key;
        const value = (paModel as any)[key];

        if (key === 'jobSteps' && Array.isArray(value) && value.length > 0) {
          body += `${label}:\n`;
          value.forEach((step, index) => {
            body += `  Step ${index + 1}:\n`;
            body += `    Description: ${step.description || ''}\n`;
            body += `    Hazards: ${step.hazards || ''}\n`;
            body += `    Controls: ${step.controls || ''}\n`;
          });
        } else if (value && typeof value !== 'object') { // Only include fields that have a value and are not objects
          body += `${label}: ${value}\n`;
        }
      }
    }
    return body;
  }

  getJobStepFormFields(): FormField[] {
    const jobSteps = this.jobSteps || [];
    const group = { label: 'Job Steps' };
    const result: FormField[] = [];

    jobSteps.forEach((step, index) => {
      result.push(
        {
          name: `jobSteps.${index}.description`,
          label: `Step ${index + 1}: Description`,
          type: 'textarea',
          group: group,
        },
        {
          name: `jobSteps.${index}.hazards`,
          label: `Step ${index + 1}: Hazards`,
          type: 'textarea',
          group: group,
        },
        {
          name: `jobSteps.${index}.controls`,
          label: `Step ${index + 1}: Controls`,
          type: 'textarea',
          group: group,
        }
      );
    });

    return result;
  }

    addJobStep(): Jha {
      const newJobSteps = [...(this.jobSteps || []), new JobStep()];
      return new Jha({ ...this, jobSteps: newJobSteps });
    }
  


}