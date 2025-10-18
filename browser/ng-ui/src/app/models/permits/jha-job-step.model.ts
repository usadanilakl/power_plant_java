

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