import { IJobStep, JobStep } from "./jha-job-step.model";


export interface IJhaPa {
  WorkRequestId?: number;
  JobName: string;
  Applicability: string;
  AnalysisBy: string;
  ReviewedBy: string;
  ApprovedBy: string;
  Date: string;
  PPE: string;
  LOTO: string;
  ConfinedSpace: string;
  HazCom: string;
  HandAndPowerTools: string;
  SpecialTools: string;
  JobSteps: IJobStep[];
}

export class JhaPa implements IJhaPa {
  WorkRequestId?: number;
  JobName: string;
  Applicability: string;
  AnalysisBy: string;
  ReviewedBy: string;
  ApprovedBy: string;
  Date: string;
  PPE: string;
  LOTO: string;
  ConfinedSpace: string;
  HazCom: string;
  HandAndPowerTools: string;
  SpecialTools: string;
  JobSteps: JobStep[];

  constructor(data: Partial<IJhaPa> = {}) {
    this.WorkRequestId = data.WorkRequestId;
    this.JobName = data.JobName ?? '';
    this.Applicability = data.Applicability ?? '';
    this.AnalysisBy = data.AnalysisBy ?? '';
    this.ReviewedBy = data.ReviewedBy ?? '';
    this.ApprovedBy = data.ApprovedBy ?? '';
    this.Date = data.Date ?? '';
    this.PPE = data.PPE ?? '';
    this.LOTO = data.LOTO ?? '';
    this.ConfinedSpace = data.ConfinedSpace ?? '';
    this.HazCom = data.HazCom ?? '';
    this.HandAndPowerTools = data.HandAndPowerTools ?? '';
    this.SpecialTools = data.SpecialTools ?? '';
    this.JobSteps = data.JobSteps?.map(step => new JobStep(step)) ?? [];
  }
}
