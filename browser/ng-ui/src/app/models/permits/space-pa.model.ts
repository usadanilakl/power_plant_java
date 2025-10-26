export interface ISpacePa {
  sharepointId: string;
  space: string;
  status: string;
  co: string;
  oxygen: string;
  lel: string;
  h2s: string;
  nh3: string;
  testerName: string;
  lastStatusChange: string;
  meterSerialNumber: string;
}

export class SpacePa implements ISpacePa {
  sharepointId: string;
  space: string;
  status: string;
  co: string;
  oxygen: string;
  lel: string;
  h2s: string;
  nh3: string;
  testerName: string;
  lastStatusChange: string;
  meterSerialNumber: string;

  constructor(data: Partial<ISpacePa> = {}) {
    this.sharepointId = data.sharepointId ?? '';
    this.space = data.space ?? '';
    this.status = data.status ?? '';
    this.co = data.co ?? '';
    this.oxygen = data.oxygen ?? '';
    this.lel = data.lel ?? '';
    this.h2s = data.h2s ?? '';
    this.nh3 = data.nh3 ?? '';
    this.testerName = data.testerName ?? '';
    this.lastStatusChange = data.lastStatusChange ?? '';
    this.meterSerialNumber = data.meterSerialNumber ?? '';
  }
}