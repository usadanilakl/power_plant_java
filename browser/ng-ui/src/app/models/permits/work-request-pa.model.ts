import { Validators } from "@angular/forms";
import { FormField } from "../inputs/form-field.model";
import { BaseModel, IBaseModel } from "./base.model";
import { futureOrPresentDateValidator } from "../../shared/forms/validators/date.validators";

export interface IWorkRequestPa{
  company: string;
  dateOfWork: string;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLOTORequired: string;
  isHotWorkRequired: string;
  isConfinedSpaceEntryRequired: string;
  foremanName: string;
  fireWatchName: string;
  spaceToBeEntered: string;
}

export class WorkRequestPa implements IWorkRequestPa {
  company: string;
  dateOfWork: string;
  timeOfWork: string;
  locationOfWork: string;
  workRequestedBy: string;
  affectedEquipment: string;
  workScope: string;
  isLOTORequired: string;
  isHotWorkRequired: string;
  isConfinedSpaceEntryRequired: string;
  foremanName: string;
  fireWatchName: string;
  spaceToBeEntered: string;

  constructor(data: Partial<IWorkRequestPa> = {}) {
    this.company = data.company ?? '';
    this.dateOfWork = data.dateOfWork ?? '';
    this.timeOfWork = data.timeOfWork ?? '';
    this.locationOfWork = data.locationOfWork ?? '';
    this.workRequestedBy = data.workRequestedBy ?? '';
    this.affectedEquipment = data.affectedEquipment ?? '';
    this.workScope = data.workScope ?? '';
    this.isLOTORequired = data.isLOTORequired ?? 'No';
    this.isHotWorkRequired = data.isHotWorkRequired ?? 'No';
    this.isConfinedSpaceEntryRequired = data.isConfinedSpaceEntryRequired ?? 'No';
    this.foremanName = data.foremanName ?? '';
    this.fireWatchName = data.fireWatchName ?? '';
    this.spaceToBeEntered = data.spaceToBeEntered ?? '';
  }
}
