export interface IWorkRequestPa {
  PwaId: string;
  Company: string;
  DateOfWork: string;  // ISO datetime: "2026-02-11T15:20:00"
  LocationOfWork: string;
  WorkRequestedBy: string;
  AffectedEquipment: string;
  WorkScope: string;
  IsLOTORequired: boolean;
  IsHotWorkRequired: boolean;
  IsConfinedSpaceEntryRequired: boolean;
  ForemanName: string;
  FireWatchName: string;
  SpaceToBeEntered: string;
}

export class WorkRequestPa implements IWorkRequestPa {
  PwaId: string;
  Company: string;
  DateOfWork: string;
  LocationOfWork: string;
  WorkRequestedBy: string;
  AffectedEquipment: string;
  WorkScope: string;
  IsLOTORequired: boolean;
  IsHotWorkRequired: boolean;
  IsConfinedSpaceEntryRequired: boolean;
  ForemanName: string;
  FireWatchName: string;
  SpaceToBeEntered: string;

  constructor(data: Partial<IWorkRequestPa> = {}) {
    this.PwaId = data.PwaId ?? '';
    this.Company = data.Company ?? '';
    this.DateOfWork = data.DateOfWork ?? '';
    this.LocationOfWork = data.LocationOfWork ?? '';
    this.WorkRequestedBy = data.WorkRequestedBy ?? '';
    this.AffectedEquipment = data.AffectedEquipment ?? '';
    this.WorkScope = data.WorkScope ?? '';
    this.IsLOTORequired = data.IsLOTORequired ?? false;
    this.IsHotWorkRequired = data.IsHotWorkRequired ?? false;
    this.IsConfinedSpaceEntryRequired = data.IsConfinedSpaceEntryRequired ?? false;
    this.ForemanName = data.ForemanName ?? '';
    this.FireWatchName = data.FireWatchName ?? '';
    this.SpaceToBeEntered = data.SpaceToBeEntered ?? '';
  }
}
