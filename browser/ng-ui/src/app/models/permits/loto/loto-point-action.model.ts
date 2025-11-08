import { Column } from "../../inputs/column.model";
import { FormField } from "../../inputs/form-field.model";
import { BaseModel, IBaseModel } from "../base.model";


export type LotoPointActionType = 'ISOLATE' | 'RESTORE' | 'VERIFY_ISOLATION' | 'VERIFY_RESTORATION';

export interface ILotoPointAction extends IBaseModel {
  lotoPointId: string;
  actionType: LotoPointActionType;
  performedByUserId: string;
  performedAt: string;
  comments: string | null;
}

export class LotoPointAction extends BaseModel<ILotoPointAction> implements ILotoPointAction {
  lotoPointId: string;
  actionType: LotoPointActionType;
  performedByUserId: string;
  performedAt: string;
  comments: string | null;

  constructor(data: Partial<ILotoPointAction> = {}) {
    super(data);
    this.lotoPointId = data.lotoPointId ?? '';
    this.actionType = data.actionType ?? 'ISOLATE';
    this.performedByUserId = data.performedByUserId ?? '';
    this.performedAt = data.performedAt ?? new Date().toISOString();
    this.comments = data.comments ?? null;
  }

  getFormFields(): FormField[] {
    // TODO: Implement if needed for forms
    return [];
  }

  getTableColumns(): Column[] {
    // TODO: Implement if needed for tables
    return [];
  }
}