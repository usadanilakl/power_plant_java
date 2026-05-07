import { BaseDto, BaseModel } from '../base/base.model';

export interface PointWalkdownState {
  checked: boolean;
  checkedBy: string | null;
  checkedAt: string | null;
  notes: string | null;
}

export interface WalkdownChecklistModel extends BaseModel {
  lotoId: number | null;
  lotoSnapshotId: number | null;
  requestedBy: string | null;
  requestedAt: string | null;
  completedBy: string | null;
  completedAt: string | null;
  completed: boolean;
  notes: string | null;
  pointStates: Record<number, PointWalkdownState>;
  dateCreated: string | null;
}

export class WalkdownChecklistDto extends BaseDto implements WalkdownChecklistModel {
  lotoId: number | null;
  lotoSnapshotId: number | null;
  requestedBy: string | null;
  requestedAt: string | null;
  completedBy: string | null;
  completedAt: string | null;
  completed: boolean;
  notes: string | null;
  pointStates: Record<number, PointWalkdownState>;
  dateCreated: string | null;

  constructor(data: Partial<WalkdownChecklistModel> = {}) {
    super(data);
    this.lotoId = data.lotoId ?? null;
    this.lotoSnapshotId = data.lotoSnapshotId ?? null;
    this.requestedBy = data.requestedBy ?? null;
    this.requestedAt = data.requestedAt ?? null;
    this.completedBy = data.completedBy ?? null;
    this.completedAt = data.completedAt ?? null;
    this.completed = data.completed ?? false;
    this.notes = data.notes ?? null;
    this.pointStates = data.pointStates ?? {};
    this.dateCreated = data.dateCreated ?? null;
  }

  static override fromJson(json: any): WalkdownChecklistDto {
    if (!json) return new WalkdownChecklistDto();
    return new WalkdownChecklistDto({
      ...super.fromJson(json),
      lotoId: json.lotoId ?? null,
      lotoSnapshotId: json.lotoSnapshotId ?? null,
      requestedBy: json.requestedBy ?? null,
      requestedAt: json.requestedAt ?? null,
      completedBy: json.completedBy ?? null,
      completedAt: json.completedAt ?? null,
      completed: json.completed ?? false,
      notes: json.notes ?? null,
      pointStates: json.pointStates ?? {},
      dateCreated: json.dateCreated ?? null,
    });
  }
}
