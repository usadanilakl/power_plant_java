import { Column } from "../column.model";
import { FormField } from "../ui/form-field.model";

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
    this.sequence = data.sequence?? 0;
    this.description = data.description ?? '';
    this.hazard = data.hazard ?? '';
    this.safetyMeasures = data.safetyMeasures ?? '';
  }
  getFormFields(): FormField[] {
    return [
          { name: 'description', label: 'Description', type: 'textarea' },
          { name: 'hazard', label: 'Hazard', type: 'textarea' },
          { name: 'safetyMeasures', label: 'Safety Measure', type: 'textarea' }
        ]
  }
}

export interface IJha {
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
}

export class Jha implements IJha {
  
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
  jobSteps: JobStep[];
  sharepointId: string;

  constructor(data: Partial<IJha> = {}) {
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
    this.sharepointId = data.sharepointId?? '';
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
      { name: 'confinedSpace', label: 'Confined Space', type: 'textarea', initialValue: this.loto },
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

      ];
    }

    addJobStep(): Jha {
      const newJobSteps = [...(this.jobSteps || []), new JobStep()];
      return new Jha({ ...this, jobSteps: newJobSteps });
    }


    static getTestJobSteps(): JobStep[] {
      return [
        new JobStep({ sequence: 1, description: 'Inspect work area', hazard: 'Slips, trips, and falls', safetyMeasures: 'Clear debris, mark hazards' }),
        new JobStep({ sequence: 2, description: 'Set up equipment', hazard: 'Pinch points, heavy lifting', safetyMeasures: 'Use proper PPE, team lifting' }),
        new JobStep({ sequence: 3, description: 'Perform maintenance', hazard: 'Electrical shock, moving parts', safetyMeasures: 'Lock-out/Tag-out, machine guarding' }),
        new JobStep({ sequence: 4, description: 'Test system', hazard: 'Unexpected startup', safetyMeasures: 'Follow test procedures, clear communication some, this is really long description to test how text will fit into the input field, if it will stay readable.' }),
        new JobStep({ sequence: 5, description: 'Clean up work area', hazard: 'Chemical exposure, ergonomic strain', safetyMeasures: 'Use proper cleaning agents, correct posture' }),
        new JobStep({ sequence: 6, description: 'Document and report', hazard: 'Miscommunication', safetyMeasures: 'Double-check records, verbal confirmation' }),
      ];
    }
  static getData() {
    const jobSteps = Jha.getTestJobSteps();
    return new Jha({
      jobName: 'Test Job',
      applicability: 'Test Applicability',
      analysisBy: 'Test Analysis By',
      reviewedBy: 'Test Reviewed By',
      approvedBy: 'Test Approved By',
      date: '2022-01-01',
      ppe: 'Test PPE',
      loto: 'Test LOTO',
      hazCom: 'Test HazCom',
      handAndPowerTools: 'Test Hand and Power Tools',
      specialTools: 'Test Special Tools',
      jobSteps
    })
  }
  


}