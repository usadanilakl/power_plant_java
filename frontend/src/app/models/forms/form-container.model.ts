import { BaseDto, BaseModel } from "../base/base.model";
import { FormField } from "../ui/form-field.model";


export interface FormContainerModel extends BaseModel {
  content: string | FormField | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Partial<CSSStyleDeclaration>;
  groupId?: string | null;
}

export class FormContainerDto extends BaseDto implements FormContainerModel {
  content: string | FormField | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Partial<CSSStyleDeclaration>;
  groupId?: string | null;

  constructor(data: Partial<FormContainerModel> = {}) {
    super(data);
    this.content = data.content ?? null;
    this.position = data.position ?? { x: 0, y: 0 };
    this.size = data.size ?? { width: 100, height: 100 };
    this.groupId = data.groupId?? null;

    const defaultStyles = {
      borderStyle: 'solid',
      borderWidth: '1px',
      borderColor: 'black',
      borderRadius: '0px',
      padding: '5px',
      boxSizing: 'border-box',
      backgroundColor: '#f9f9f9',
      // Individual border widths for toggling
      borderTopWidth: '1px',
      borderRightWidth: '1px',
      borderBottomWidth: '1px',
      borderLeftWidth: '1px',
    };

    this.style = { ...defaultStyles, ...data.style };
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      contentJson: JSON.stringify(this.content),
      positionJson: JSON.stringify(this.position),
      sizeJson: JSON.stringify(this.size),
      styleJson: JSON.stringify(this.style),
      groupId: this.groupId,
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
    });
  }
}