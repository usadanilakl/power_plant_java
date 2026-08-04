import { BaseDto, BaseModel } from '../../../models/base/base.model';
import { FormField } from '../../../models/ui/form-field.model';
import { parseContainerValue } from '../../../models/forms/form-container.model';
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
    // The backend's FormContainer setters take Object/Map and serialize server-side, and the save
    // path posts the DTO instance directly. Emit plain values so both paths agree — stringifying
    // here would double-encode.
    return {
      ...super.toJson(),
      content: this.content,
      position: this.position,
      size: this.size,
      style: this.style,
      groupId: this.groupId,
      contentType: this.contentType,
      pageNumber: this.pageNumber,
      locked: this.locked,
      contentStyle: this.contentStyle,
    };
  }

  static override fromJson(json: any): FormContainerDto {
    return new FormContainerDto({
      ...super.fromJson(json),
      content: parseContainerValue(json.content, null),
      position: parseContainerValue(json.position, { x: 0, y: 0 }),
      size: parseContainerValue(json.size, { width: 100, height: 100 }),
      style: parseContainerValue(json.style, {}),
      groupId: json.groupId,
      contentType: json.contentType ?? 'text',
      pageNumber: json.pageNumber ?? 1,
      locked: json.locked ?? false,
      contentStyle: parseContainerValue(json.contentStyle, {}),
    });
  }
}
