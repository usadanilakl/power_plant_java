import { BaseDto, BaseModel } from '../base/base.model';

function normalizeDateTime(value: any): string {
  if (!value) return '';
  if (typeof value === 'string') return value;

  if (Array.isArray(value)) {
    const [year, month, day, hour = 0, minute = 0, second = 0, nano = 0] = value;
    if (!year || !month || !day) return '';

    const millis = Math.floor(Number(nano || 0) / 1_000_000);
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      millis
    ).toISOString();
  }

  return '';
}

export interface ConversationModel extends BaseModel {
  entityType: string;
  entityId: number;
  initiatorId: number;
  responderId: number;
  initiatorName: string;
  responderName: string;
  subject: string;
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string;
  initiatorUnreadCount: number;
  responderUnreadCount: number;
  currentUserUnreadCount: number;
  initialMessageContent?: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
}

export class ConversationDto extends BaseDto implements ConversationModel {
  entityType: string;
  entityId: number;
  initiatorId: number;
  responderId: number;
  initiatorName: string;
  responderName: string;
  subject: string;
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string;
  initiatorUnreadCount: number;
  responderUnreadCount: number;
  currentUserUnreadCount: number;
  initialMessageContent?: string;
  createdBy: string;
  dateCreated: string;
  dateModified: string;

  constructor(data: Partial<ConversationModel> = {}) {
    super(data);
    this.entityType = data.entityType || '';
    this.entityId = data.entityId || 0;
    this.initiatorId = data.initiatorId || 0;
    this.responderId = data.responderId || 0;
    this.initiatorName = data.initiatorName || '';
    this.responderName = data.responderName || '';
    this.subject = data.subject || '';
    this.status = data.status || 'OPEN';
    this.lastMessageAt = data.lastMessageAt || '';
    this.initiatorUnreadCount = data.initiatorUnreadCount ?? 0;
    this.responderUnreadCount = data.responderUnreadCount ?? 0;
    this.currentUserUnreadCount = data.currentUserUnreadCount ?? 0;
    this.initialMessageContent = data.initialMessageContent;
    this.createdBy = data.createdBy || '';
    this.dateCreated = data.dateCreated || '';
    this.dateModified = data.dateModified || '';
  }

  override toJson(): any {
    return {
      id: this.id || null,
      entityType: this.entityType,
      entityId: this.entityId,
      initiatorId: this.initiatorId,
      responderId: this.responderId,
      subject: this.subject,
      status: this.status,
      initialMessageContent: this.initialMessageContent,
    };
  }

  static override fromJson(json: any): ConversationDto {
    if (!json) return new ConversationDto();
    return new ConversationDto({
      ...super.fromJson(json),
      entityType: json.entityType || '',
      entityId: json.entityId || 0,
      initiatorId: json.initiatorId || 0,
      responderId: json.responderId || 0,
      initiatorName: json.initiatorName || '',
      responderName: json.responderName || '',
      subject: json.subject || '',
      status: json.status || 'OPEN',
      lastMessageAt: normalizeDateTime(json.lastMessageAt),
      initiatorUnreadCount: json.initiatorUnreadCount ?? 0,
      responderUnreadCount: json.responderUnreadCount ?? 0,
      currentUserUnreadCount: json.currentUserUnreadCount ?? 0,
      initialMessageContent: json.initialMessageContent,
      createdBy: json.createdBy || '',
      dateCreated: normalizeDateTime(json.dateCreated),
      dateModified: normalizeDateTime(json.dateModified),
    });
  }
}
