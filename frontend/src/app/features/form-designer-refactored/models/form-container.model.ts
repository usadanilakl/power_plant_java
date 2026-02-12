import { BaseDto, BaseModel } from '../../../models/base/base.model';
import { FormField } from '../../../models/ui/form-field.model';
import { PrintableFormDto } from './printable-form.model';

export type ContentType = 'text' | 'formField' | 'image' | 'variable' | 'repeatingSection';

export interface FormContainerModel extends BaseModel {
  content: string | FormField | PrintableFormDto | null;
  formControlKey: string | null;
  contentType: ContentType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Partial<CSSStyleDeclaration>;
  contentStyle: Partial<CSSStyleDeclaration>;
  groupId?: string | null;
  pageNumber?: number;
  locked?: boolean;
}

export class FormContainerDto extends BaseDto implements FormContainerModel {
  content: string | FormField | PrintableFormDto | null;
  formControlKey: string | null;
  contentType: ContentType;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Partial<CSSStyleDeclaration>;
  contentStyle: Partial<CSSStyleDeclaration>;
  groupId?: string | null;
  pageNumber?: number;
  locked?: boolean;

  constructor(data: Partial<FormContainerModel> = {}) {
    super(data);
    this.content = data.content ?? null;
    this.formControlKey = data.formControlKey ?? null;
    this.contentType = data.contentType ?? 'text';
    this.position = data.position ?? { x: 0, y: 0 };
    this.size = data.size ?? { width: 100, height: 100 };
    this.groupId = data.groupId ?? null;
    this.pageNumber = data.pageNumber ?? 1;
    this.locked = data.locked ?? false;

    const defaultStyles = {
      position: 'absolute',
      display: 'flex',
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: 'black',
      borderRadius: '0px',
      padding: '0px',
      boxSizing: 'border-box',
      backgroundColor: '#f9f9f9',
      borderTopWidth: '1px',
      borderRightWidth: '1px',
      borderBottomWidth: '1px',
      borderLeftWidth: '1px',
    };

    this.style = { ...defaultStyles, ...data.style };
    this.contentStyle = data.contentStyle ?? {};
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      content: JSON.stringify(this.content),
      position: JSON.stringify(this.position),
      size: JSON.stringify(this.size),
      style: JSON.stringify(this.style),
      groupId: this.groupId,
      contentType: this.contentType,
      pageNumber: this.pageNumber,
      locked: this.locked,
      contentStyle: JSON.stringify(this.contentStyle),
    };
  }

  static override fromJson(json: any): FormContainerDto {
    return new FormContainerDto({
      ...super.fromJson(json),
      content: json.contentJson ? JSON.parse(json.contentJson) : null,
      position: json.positionJson ? JSON.parse(json.positionJson) : { x: 0, y: 0 },
      size: json.sizeJson ? JSON.parse(json.sizeJson) : { width: 100, height: 100 },
      style: json.styleJson ? JSON.parse(json.styleJson) : {},
      groupId: json.groupId,
      contentType: json.contentType ?? 'text',
      pageNumber: json.pageNumber ?? 1,
      locked: json.locked ?? false,
      contentStyle: json.contentStyleJson ? JSON.parse(json.contentStyleJson) : {},
    });
  }
}
