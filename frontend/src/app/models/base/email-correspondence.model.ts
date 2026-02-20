import { BaseDto, BaseModel } from './base.model';
import { ValueDto } from '../value.model';

export interface EmailCorrespondenceModel extends BaseModel {
  entityId: number;
  entityType: string;
  correspondenceType: ValueDto;
  direction: 'OUTBOUND' | 'INBOUND';
  subject: string;
  bodyContent: string;
  sender: string;
  recipient: string;
  sentDateTime: string;
  internetMessageId?: string;
  conversationId?: string;
  graphMessageId?: string;
  linkedSharepointId?: string;
  isRead: boolean;
  needsAttention: boolean;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
}

export class EmailCorrespondenceDto extends BaseDto implements EmailCorrespondenceModel {
  entityId: number;
  entityType: string;
  correspondenceType: ValueDto;
  direction: 'OUTBOUND' | 'INBOUND';
  subject: string;
  bodyContent: string;
  sender: string;
  recipient: string;
  sentDateTime: string;
  internetMessageId?: string;
  conversationId?: string;
  graphMessageId?: string;
  linkedSharepointId?: string;
  isRead: boolean;
  needsAttention: boolean;
  createdBy: string;
  dateCreated: string;
  dateModified: string;

  constructor(data: Partial<EmailCorrespondenceModel> = {}) {
    super(data);
    this.entityId = data.entityId || 0;
    this.entityType = data.entityType || '';
    this.correspondenceType = data.correspondenceType ?? new ValueDto();
    this.direction = data.direction || 'OUTBOUND';
    this.subject = data.subject || '';
    this.bodyContent = data.bodyContent || '';
    this.sender = data.sender || '';
    this.recipient = data.recipient || '';
    this.sentDateTime = data.sentDateTime || '';
    this.internetMessageId = data.internetMessageId;
    this.conversationId = data.conversationId;
    this.graphMessageId = data.graphMessageId;
    this.linkedSharepointId = data.linkedSharepointId;
    this.isRead = data.isRead ?? false;
    this.needsAttention = data.needsAttention ?? false;
    this.createdBy = data.createdBy || '';
    this.dateCreated = data.dateCreated || '';
    this.dateModified = data.dateModified || '';
  }

  override toJson(): any {
    const json: any = {
      id: this.id || null,
      entityId: this.entityId,
      entityType: this.entityType,
      direction: this.direction,
      subject: this.subject,
      bodyContent: this.bodyContent,
      sender: this.sender,
      recipient: this.recipient,
      sentDateTime: this.sentDateTime,
      internetMessageId: this.internetMessageId,
      conversationId: this.conversationId,
      graphMessageId: this.graphMessageId,
      linkedSharepointId: this.linkedSharepointId,
      isRead: this.isRead,
      needsAttention: this.needsAttention,
    };

    // Only include correspondenceType if it has a valid id
    if (this.correspondenceType?.id) {
      json.correspondenceType = this.correspondenceType.toJson();
    }

    return json;
  }

  static override fromJson(json: any): EmailCorrespondenceDto {
    if (!json) {
      console.warn('Received null or undefined json in EmailCorrespondenceDto.fromJson');
      return new EmailCorrespondenceDto();
    }

    return new EmailCorrespondenceDto({
      ...super.fromJson(json),
      entityId: json.entityId || 0,
      entityType: json.entityType || '',
      correspondenceType: ValueDto.fromJson(json.correspondenceType),
      direction: json.direction || 'OUTBOUND',
      subject: json.subject || '',
      bodyContent: json.bodyContent || '',
      sender: json.sender || '',
      recipient: json.recipient || '',
      sentDateTime: json.sentDateTime || '',
      internetMessageId: json.internetMessageId,
      conversationId: json.conversationId,
      graphMessageId: json.graphMessageId,
      linkedSharepointId: json.linkedSharepointId,
      isRead: json.isRead ?? false,
      needsAttention: json.needsAttention ?? false,
      createdBy: json.createdBy || '',
      dateCreated: json.dateCreated || '',
      dateModified: json.dateModified || '',
    });
  }
}
