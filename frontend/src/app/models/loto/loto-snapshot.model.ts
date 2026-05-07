import { BaseDto, BaseModel } from '../base/base.model';

export interface LotoSnapshotModel extends BaseModel {
  lotoId: number | null;
  boxNumber: string | null;
  locks: string | null;
  requestorName: string | null;
  workAuthority: string | null;
  requestTime: string | null;
  workAuthorityTime: string | null;
  status: string | null;
  workScope: string | null;
  snapshotReason: string | null;

  hungBy: string | null;                       hungAt: string | null;
  verifiedBy: string | null;                   verifiedAt: string | null;
  activatedBy: string | null;                  activatedAt: string | null;
  testStartedBy: string | null;                testStartedAt: string | null;
  reactivatedBy: string | null;                reactivatedAt: string | null;
  transferredFrom: string | null;              transferredTo: string | null;        transferredAt: string | null;
  acceptedBy: string | null;                   acceptedAt: string | null;
  requestorReleasedBy: string | null;          requestorReleasedAt: string | null;
  controlAuthorityReleasedBy: string | null;   controlAuthorityReleasedAt: string | null;
  locksRemovedBy: string | null;               locksRemovedAt: string | null;
  closedBy: string | null;                     closedAt: string | null;

  dateCreated: string | null;
}

export class LotoSnapshotDto extends BaseDto implements LotoSnapshotModel {
  lotoId: number | null;
  boxNumber: string | null;
  locks: string | null;
  requestorName: string | null;
  workAuthority: string | null;
  requestTime: string | null;
  workAuthorityTime: string | null;
  status: string | null;
  workScope: string | null;
  snapshotReason: string | null;

  hungBy: string | null;                       hungAt: string | null;
  verifiedBy: string | null;                   verifiedAt: string | null;
  activatedBy: string | null;                  activatedAt: string | null;
  testStartedBy: string | null;                testStartedAt: string | null;
  reactivatedBy: string | null;                reactivatedAt: string | null;
  transferredFrom: string | null;              transferredTo: string | null;        transferredAt: string | null;
  acceptedBy: string | null;                   acceptedAt: string | null;
  requestorReleasedBy: string | null;          requestorReleasedAt: string | null;
  controlAuthorityReleasedBy: string | null;   controlAuthorityReleasedAt: string | null;
  locksRemovedBy: string | null;               locksRemovedAt: string | null;
  closedBy: string | null;                     closedAt: string | null;

  dateCreated: string | null;

  constructor(data: Partial<LotoSnapshotModel> = {}) {
    super(data);
    this.lotoId = data.lotoId ?? null;
    this.boxNumber = data.boxNumber ?? null;
    this.locks = data.locks ?? null;
    this.requestorName = data.requestorName ?? null;
    this.workAuthority = data.workAuthority ?? null;
    this.requestTime = data.requestTime ?? null;
    this.workAuthorityTime = data.workAuthorityTime ?? null;
    this.status = data.status ?? null;
    this.workScope = data.workScope ?? null;
    this.snapshotReason = data.snapshotReason ?? null;

    this.hungBy = data.hungBy ?? null;                       this.hungAt = data.hungAt ?? null;
    this.verifiedBy = data.verifiedBy ?? null;               this.verifiedAt = data.verifiedAt ?? null;
    this.activatedBy = data.activatedBy ?? null;             this.activatedAt = data.activatedAt ?? null;
    this.testStartedBy = data.testStartedBy ?? null;         this.testStartedAt = data.testStartedAt ?? null;
    this.reactivatedBy = data.reactivatedBy ?? null;         this.reactivatedAt = data.reactivatedAt ?? null;
    this.transferredFrom = data.transferredFrom ?? null;
    this.transferredTo = data.transferredTo ?? null;
    this.transferredAt = data.transferredAt ?? null;
    this.acceptedBy = data.acceptedBy ?? null;               this.acceptedAt = data.acceptedAt ?? null;
    this.requestorReleasedBy = data.requestorReleasedBy ?? null;
    this.requestorReleasedAt = data.requestorReleasedAt ?? null;
    this.controlAuthorityReleasedBy = data.controlAuthorityReleasedBy ?? null;
    this.controlAuthorityReleasedAt = data.controlAuthorityReleasedAt ?? null;
    this.locksRemovedBy = data.locksRemovedBy ?? null;       this.locksRemovedAt = data.locksRemovedAt ?? null;
    this.closedBy = data.closedBy ?? null;                   this.closedAt = data.closedAt ?? null;

    this.dateCreated = data.dateCreated ?? null;
  }

  static override fromJson(json: any): LotoSnapshotDto {
    if (!json) return new LotoSnapshotDto();
    return new LotoSnapshotDto({
      ...super.fromJson(json),
      lotoId: json.lotoId ?? null,
      boxNumber: json.boxNumber ?? null,
      locks: json.locks ?? null,
      requestorName: json.requestorName ?? null,
      workAuthority: json.workAuthority ?? null,
      requestTime: json.requestTime ?? null,
      workAuthorityTime: json.workAuthorityTime ?? null,
      status: json.status ?? null,
      workScope: json.workScope ?? null,
      snapshotReason: json.snapshotReason ?? null,

      hungBy: json.hungBy ?? null,                       hungAt: json.hungAt ?? null,
      verifiedBy: json.verifiedBy ?? null,               verifiedAt: json.verifiedAt ?? null,
      activatedBy: json.activatedBy ?? null,             activatedAt: json.activatedAt ?? null,
      testStartedBy: json.testStartedBy ?? null,         testStartedAt: json.testStartedAt ?? null,
      reactivatedBy: json.reactivatedBy ?? null,         reactivatedAt: json.reactivatedAt ?? null,
      transferredFrom: json.transferredFrom ?? null,
      transferredTo: json.transferredTo ?? null,
      transferredAt: json.transferredAt ?? null,
      acceptedBy: json.acceptedBy ?? null,               acceptedAt: json.acceptedAt ?? null,
      requestorReleasedBy: json.requestorReleasedBy ?? null,
      requestorReleasedAt: json.requestorReleasedAt ?? null,
      controlAuthorityReleasedBy: json.controlAuthorityReleasedBy ?? null,
      controlAuthorityReleasedAt: json.controlAuthorityReleasedAt ?? null,
      locksRemovedBy: json.locksRemovedBy ?? null,       locksRemovedAt: json.locksRemovedAt ?? null,
      closedBy: json.closedBy ?? null,                   closedAt: json.closedAt ?? null,

      dateCreated: json.dateCreated ?? null,
    });
  }
}
