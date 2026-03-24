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

export interface MessageModel extends BaseModel {
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
}

export class MessageDto extends BaseDto implements MessageModel {
  conversationId: number;
  senderId: number;
  senderName: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  createdBy: string;
  dateCreated: string;
  dateModified: string;

  constructor(data: Partial<MessageModel> = {}) {
    super(data);
    this.conversationId = data.conversationId || 0;
    this.senderId = data.senderId || 0;
    this.senderName = data.senderName || '';
    this.content = data.content || '';
    this.sentAt = data.sentAt || '';
    this.isRead = data.isRead ?? false;
    this.createdBy = data.createdBy || '';
    this.dateCreated = data.dateCreated || '';
    this.dateModified = data.dateModified || '';
  }

  override toJson(): any {
    return {
      id: this.id || null,
      conversationId: this.conversationId,
      content: this.content,
    };
  }

  static override fromJson(json: any): MessageDto {
    if (!json) return new MessageDto();
    return new MessageDto({
      ...super.fromJson(json),
      conversationId: json.conversationId || 0,
      senderId: json.senderId || 0,
      senderName: json.senderName || '',
      content: json.content || '',
      sentAt: normalizeDateTime(json.sentAt),
      isRead: json.isRead ?? false,
      createdBy: json.createdBy || '',
      dateCreated: normalizeDateTime(json.dateCreated),
      dateModified: normalizeDateTime(json.dateModified),
    });
  }
}
