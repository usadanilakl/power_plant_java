import { BaseDto, BaseModel } from './base.model';
import { ValueDto } from '../value.model';

export interface CommentModel extends BaseModel {
  content: string;
  entityId: number;
  entityType: string;
  commentType: ValueDto;
  needsAttention: boolean;
  isResolved: boolean;
  createdBy: string;
  dateCreated: string;
  dateModified: string;
}

export class CommentDto extends BaseDto implements CommentModel {
  content: string;
  entityId: number;
  entityType: string;
  commentType: ValueDto;
  needsAttention: boolean;
  isResolved: boolean;
  createdBy: string;
  dateCreated: string;
  dateModified: string;

  constructor(data: Partial<CommentModel> = {}) {
    super(data);
    this.content = data.content || '';
    this.entityId = data.entityId || 0;
    this.entityType = data.entityType || '';
    this.commentType = data.commentType ?? new ValueDto();
    this.needsAttention = data.needsAttention ?? false;
    this.isResolved = data.isResolved ?? false;
    this.createdBy = data.createdBy || '';
    this.dateCreated = data.dateCreated || '';
    this.dateModified = data.dateModified || '';
  }

  override toJson(): any {
    const json: any = {
      id: this.id || null,
      content: this.content,
      entityId: this.entityId,
      entityType: this.entityType,
      needsAttention: this.needsAttention,
      isResolved: this.isResolved,
    };
    // Only include commentType if it has a valid id to avoid Jackson ObjectId conflicts
    if (this.commentType?.id) {
      json.commentType = this.commentType.toJson();
    }
    return json;
  }

  static override fromJson(json: any): CommentDto {
    if (!json) {
      console.warn('Received null or undefined json in CommentDto.fromJson');
      return new CommentDto();
    }

    return new CommentDto({
      ...super.fromJson(json),
      content: json.content || '',
      entityId: json.entityId || 0,
      entityType: json.entityType || '',
      commentType: ValueDto.fromJson(json.commentType),
      needsAttention: json.needsAttention ?? false,
      isResolved: json.isResolved ?? false,
      createdBy: json.createdBy || '',
      dateCreated: json.dateCreated || '',
      dateModified: json.dateModified || '',
    });
  }
}
