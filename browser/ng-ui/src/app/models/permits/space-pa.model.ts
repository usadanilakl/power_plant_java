import { Space } from "./space.model";

export interface ISpacePa {
  ID: number;
  Space: string;
  Status: string;
  Co: number;
  Oxygen: number;
  Lel: number;
  H2s: number;
  Nh3: number;
  TesterName: string;
  LastStatusChange: string;
  MeterSerialNumber: number;
}

export interface ISpacePaOutgoing{
  space: string;
  status: string;
}

export class SpacePaOutgoing{
  Space: string;
  Status: string;

  constructor(data: Partial<ISpacePaOutgoing> = {}) {
    this.Space = data.space?? '';
    this.Status = data.status?? '';
  }
}

export class SpacePa implements ISpacePa {
  ID: number;
  Space: string;
  Status: string;
  Co: number;
  Oxygen: number;
  Lel: number;
  H2s: number;
  Nh3: number;
  TesterName: string;
  LastStatusChange: string;
  MeterSerialNumber: number;

  constructor(data: Partial<ISpacePa> = {}) {
    if (typeof data === 'string') data = JSON.parse(data);
    this.ID = data.ID ?? 0;
    this.Space = data.Space ?? '';
    this.Status = data.Status ?? '';
    this.Co = data.Co ?? 1000;
    this.Oxygen = data.Oxygen ?? 1000;
    this.Lel = data.Lel ?? 1000;
    this.H2s = data.H2s ?? 1000;
    this.Nh3 = data.Nh3 ?? 1000;
    this.TesterName = data.TesterName ?? '';
    this.LastStatusChange = data.LastStatusChange ?? '';
    this.MeterSerialNumber = data.MeterSerialNumber ?? 0;
  }
  
  convertToSpace() {
    return new Space({
      sharepointId: this.ID,
      space: this.Space,
      status: this.Status,
      co: this.Co,
      oxygen: this.Oxygen,
      lel: this.Lel,
      h2s: this.H2s,
      nh3: this.Nh3,
      testerName: this.TesterName,
      lastStatusChange: this.LastStatusChange,
      meterSerialNumber: this.MeterSerialNumber,
    })
  }
}