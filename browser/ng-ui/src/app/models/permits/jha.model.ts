import { Validators } from "@angular/forms";
import { Column } from "../inputs/column.model";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "./base.model";
import { IJobStep, JobStep } from "./jha-job-step.model";
import { JhaPa } from "./jha-pa.model";
import { IAttachment } from "./attachment.model";

export interface IJha extends IBaseModel {
  jobName: string;
  applicability: string;
  analysisBy: string;
  reviewedBy: string;
  approvedBy: string;
  date: string;
  ppe: string;
  loto: string;
  confinedSpace: string;
  hazCom: string;
  handAndPowerTools: string;
  specialTools: string;
  jobSteps: IJobStep[];
  sharepointId: string;
  localUuid: string;
  workRequestId?: number;
  workRequestLocalUuid?: string;
  workRequestSharepointId?: string;
  submissionStatus: 'draft' | 'pending' | 'submitted' | 'failed';
  attachments: IAttachment[];
}

export class Jha extends BaseModel<IJha> implements IJha {

  jobName: string;
  applicability: string;
  analysisBy: string;
  reviewedBy: string;
  approvedBy: string;
  date: string;
  ppe: string;
  confinedSpace: string;
  loto: string;
  hazCom: string;
  handAndPowerTools: string;
  specialTools: string;
  jobSteps: JobStep[];
  sharepointId: string;
  localUuid: string;
  workRequestId?: number;
  workRequestLocalUuid?: string;
  workRequestSharepointId?: string;
  submissionStatus: 'draft' | 'pending' | 'submitted' | 'failed';
  attachments: IAttachment[];

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
    this.confinedSpace = data.confinedSpace ?? '';
    this.hazCom = data.hazCom ?? '';
    this.handAndPowerTools = data.handAndPowerTools ?? '';
    this.specialTools = data.specialTools ?? '';
    this.jobSteps = data.jobSteps?.map(step => new JobStep(step)) ?? [];
    this.sharepointId = data.sharepointId ?? '';
    this.localUuid = data.localUuid ?? crypto.randomUUID();
    this.workRequestId = data.workRequestId;
    this.workRequestLocalUuid = data.workRequestLocalUuid;
    this.workRequestSharepointId = data.workRequestSharepointId;
    this.submissionStatus = data.submissionStatus ?? 'draft';
    this.attachments = data.attachments ?? [];
  }

  getFormFields(): FormField[] {
    return [
      { name: 'jobName', label: 'Job Name/Title', type: 'text', initialValue: this.jobName, placeholder: 'e.g. Boiler Feed Pump Maintenance', validators: [Validators.required] },
      { name: 'applicability', label: 'Applicability', type: 'text', initialValue: this.applicability, placeholder: 'e.g. OPs, Maintenance', validators: [Validators.required] },
      { name: 'analysisBy', label: 'Analysis By', type: 'text', initialValue: this.analysisBy, placeholder: 'Name or initials', validators: [Validators.required] },
      { name: 'date', label: 'Date', type: 'date', initialValue: this.date, validators: [Validators.required] },
      { name: 'ppe', label: 'Personal Protective Equipment (PPE)', type: 'textarea', initialValue: this.ppe, placeholder: 'e.g. Hard hat, safety glasses, gloves', validators: [Validators.required] },
      { name: 'loto', label: 'LOTO', type: 'textarea', initialValue: this.loto, placeholder: 'LOTO requirements, if applicable. Put NA if not applicable', validators: [Validators.required] },
      { name: 'confinedSpace', label: 'Confined Space', type: 'textarea', initialValue: this.confinedSpace, placeholder: 'Confined space requirements, if applicable. Put NA if not applicable', validators: [Validators.required] },
      { name: 'hazCom', label: 'HazCom', type: 'textarea', initialValue: this.hazCom, placeholder: 'Hazardous materials involved, if any. Put NA if not applicable', validators: [Validators.required] },
      { name: 'handAndPowerTools', label: 'Hand and Power Tools', type: 'textarea', initialValue: this.handAndPowerTools, placeholder: 'List tools required. Put NA if not applicable', validators: [Validators.required] },
      { name: 'specialTools', label: 'Special Tools', type: 'textarea', initialValue: this.specialTools, placeholder: 'List special tools or equipment. Put NA if not applicable', validators: [Validators.required] },
      { name: 'sharepointId', label: 'Sharepoint ID', type: 'text', initialValue: this.sharepointId, readonly: true },
      {
        name: 'jobSteps',
        label: 'Job Steps',
        type: 'form-array',
        initialValue: this.jobSteps,
        fields: [
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'What will be done in this step', validators: [Validators.required] },
          { name: 'hazard', label: 'Hazard', type: 'textarea', placeholder: 'Potential hazards for this step', validators: [Validators.required] },
          { name: 'safetyMeasures', label: 'Safety Measure', type: 'textarea', placeholder: 'How to mitigate the hazard', validators: [Validators.required] }
        ]
      },
      { name: 'files', label: 'Attachments', type: 'file', accept: 'image/*,.pdf,.doc,.docx', multiple: true, initialValue: this.attachments.filter(a => a.type !== 'signature'), group: { label: 'Attachments' } },
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
          accessorFn: (item: IJha) => new Date(item.updatedAt).toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'short', timeStyle: 'short' })
        },
      ];
    }

    getAttachmentsByType(type: 'photo' | 'signature' | 'document'): IAttachment[] {
      return this.attachments.filter(a => a.type === type);
    }

    convertToPaModel(): JhaPa {
      return new JhaPa({
        PwaId: this.localUuid,
        WorkRequestSharepointId: this.workRequestSharepointId,
        JobName: this.jobName,
        Applicability: this.applicability,
        AnalysisBy: this.analysisBy,
        ReviewedBy: this.reviewedBy,
        ApprovedBy: this.approvedBy,
        Date: this.date,
        PPE: this.ppe,
        LOTO: this.loto,
        ConfinedSpace: this.confinedSpace,
        HazCom: this.hazCom,
        HandAndPowerTools: this.handAndPowerTools,
        SpecialTools: this.specialTools,
        JobSteps: JSON.stringify(this.jobSteps),
      });
    }
  getEmailBody(): string {
    const paModel = this.convertToPaModel();
    const fieldLabels: { [key: string]: string } = {
      JobName: 'Job Name/Title',
      Applicability: 'Applicability',
      AnalysisBy: 'Analysis By',
      ReviewedBy: 'Reviewed By',
      ApprovedBy: 'Approved By',
      Date: 'Date',
      PPE: 'Personal Protective Equipment (PPE)',
      LOTO: 'LOTO',
      ConfinedSpace: 'Confined Space',
      HazCom: 'HazCom',
      HandAndPowerTools: 'Hand and Power Tools',
      SpecialTools: 'Special Tools',
      JobSteps: 'Job Steps'
    };

    let body = '';
    for (const key in paModel) {
      if (Object.prototype.hasOwnProperty.call(paModel, key)) {
        const label = fieldLabels[key] || key;
        const value = (paModel as any)[key];

        if (key === 'JobSteps' && value) {
          try {
            const steps = typeof value === 'string' ? JSON.parse(value) : value;
            if (Array.isArray(steps) && steps.length > 0) {
              body += `${label}:\n`;
              steps.forEach((step: any, index: number) => {
                body += `  Step ${index + 1}:\n`;
                body += `    Description: ${step.description || ''}\n`;
                body += `    Hazard: ${step.hazard || ''}\n`;
                body += `    Safety Measures: ${step.safetyMeasures || ''}\n`;
              });
            }
          } catch { /* skip malformed */ }
        } else if (value && typeof value !== 'object') {
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
