export interface ISpaceTestResult {
  SpaceId: number;
  Co: number;
  Oxygen: number;
  Lel: number;
  H2s: number;
  Nh3: number;
  TesterId: number;
  MeterSerialNumber: number;
}

export class SpaceTestResult implements ISpaceTestResult {

  SpaceId: number;
  Co: number;
  Oxygen: number;
  Lel: number;
  H2s: number;
  Nh3: number;
  TesterId: number;
  MeterSerialNumber: number;

  constructor(data: Partial<ISpaceTestResult> = {}) {
    this.SpaceId = data.SpaceId ?? 0;
    this.Co = data.Co ?? 1000;
    this.Oxygen = data.Oxygen ?? 1000;
    this.Lel = data.Lel ?? 1000;
    this.H2s = data.H2s ?? 1000;
    this.Nh3 = data.Nh3 ?? 1000;
    this.TesterId = data.TesterId ?? 0;
    this.MeterSerialNumber = data.MeterSerialNumber ?? 0;
  }
}
