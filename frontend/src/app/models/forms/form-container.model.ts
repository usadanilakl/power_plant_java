import { BaseDto, BaseModel } from "../base/base.model";
import { FormField } from "../ui/form-field.model";


export interface FormContainerModel extends BaseModel {
  content: string | FormField | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Partial<CSSStyleDeclaration>;
}

export class FormContainerDto extends BaseDto implements FormContainerModel {
  content: string | FormField | null;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Partial<CSSStyleDeclaration>;

  constructor(data: Partial<FormContainerModel> = {}) {
    super(data);
    this.content = data.content ?? null;
    this.position = data.position ?? { x: 0, y: 0 };
    this.size = data.size ?? { width: 100, height: 100 };
    this.style = data.style ?? {};
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      contentJson: JSON.stringify(this.content),
      positionJson: JSON.stringify(this.position),
      sizeJson: JSON.stringify(this.size),
      styleJson: JSON.stringify(this.style),
    };
  }

  static override fromJson(json: any): FormContainerDto {
    return new FormContainerDto({
      ...super.fromJson(json),
      content: json.contentJson ? JSON.parse(json.contentJson) : null,
      position: json.positionJson ? JSON.parse(json.positionJson) : { x: 0, y: 0 },
      size: json.sizeJson ? JSON.parse(json.sizeJson) : { width: 100, height: 100 },
      style: json.styleJson ? JSON.parse(json.styleJson) : {},
    });
  }
}