export interface IJhaPa {
  PwaId: string;
  WorkRequestSharepointId?: string;
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
  JobSteps: string;
}

export class JhaPa implements IJhaPa {
  PwaId: string;
  WorkRequestSharepointId?: string;
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
  JobSteps: string;

  constructor(data: Partial<IJhaPa> = {}) {
    this.PwaId = data.PwaId ?? '';
    this.WorkRequestSharepointId = data.WorkRequestSharepointId;
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
    this.JobSteps = data.JobSteps ?? '[]';
  }
}
