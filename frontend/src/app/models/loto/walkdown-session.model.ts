import { BaseDto, BaseModel } from '../base/base.model';

export interface WalkdownSessionPointState {
  checked: boolean;
  checkedBy: string | null;
  checkedAt: string | null;
  notes: string | null;
}

export interface WalkdownSessionModel extends BaseModel {
  lotoId: number | null;
  crewName: string | null;
  startedBy: string | null;
  startedAt: string | null;
  completedBy: string | null;
  completedAt: string | null;
  completed: boolean;
  sessionNotes: string | null;
  pointStates: Record<number, WalkdownSessionPointState>;
}

export class WalkdownSessionDto extends BaseDto implements WalkdownSessionModel {
  lotoId: number | null;
  crewName: string | null;
  startedBy: string | null;
  startedAt: string | null;
  completedBy: string | null;
  completedAt: string | null;
  completed: boolean;
  sessionNotes: string | null;
  pointStates: Record<number, WalkdownSessionPointState>;

  constructor(data: Partial<WalkdownSessionModel> = {}) {
    super(data);
    this.lotoId = data.lotoId ?? null;
    this.crewName = data.crewName ?? null;
    this.startedBy = data.startedBy ?? null;
    this.startedAt = data.startedAt ?? null;
    this.completedBy = data.completedBy ?? null;
    this.completedAt = data.completedAt ?? null;
    this.completed = data.completed ?? false;
    this.sessionNotes = data.sessionNotes ?? null;
    this.pointStates = data.pointStates ?? {};
  }

  static override fromJson(json: any): WalkdownSessionDto {
    if (!json) return new WalkdownSessionDto();
    return new WalkdownSessionDto({
      ...super.fromJson(json),
      lotoId: json.lotoId ?? null,
      crewName: json.crewName ?? null,
      startedBy: json.startedBy ?? null,
      startedAt: json.startedAt ?? null,
      completedBy: json.completedBy ?? null,
      completedAt: json.completedAt ?? null,
      completed: json.completed ?? false,
      sessionNotes: json.sessionNotes ?? null,
      pointStates: json.pointStates ?? {},
    });
  }
}
