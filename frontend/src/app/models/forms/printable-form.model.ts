import { BaseDto, BaseModel } from "../base/base.model";
import { FormContainerDto, FormContainerModel } from "./form-container.model";

export interface PrintableFormModel extends BaseModel {
  formContainers: FormContainerModel[];
  size: { width: number; height: number };
}

export class PrintableFormDto extends BaseDto implements PrintableFormModel {
  formContainers: FormContainerDto[];
  size: { width: number; height: number };

  constructor(data: Partial<PrintableFormModel> = {}) {
    super(data);
    this.formContainers = data.formContainers?.map(fc => new FormContainerDto(fc)) ?? [];
    this.size = data.size?? { width: 100, height: 100 };
  }

  override toJson(): any {
    return {
      ...super.toJson(),
      formContainers: this.formContainers.map(fc => fc.toJson()),
      size: this.size ?? { width: 8.5, height: 11 }
    };
  }

  static override fromJson(json: any): PrintableFormDto {
    return new PrintableFormDto({
      ...super.fromJson(json),
      formContainers: Array.isArray(json.formContainers)
        ? json.formContainers.map((fc: any) => FormContainerDto.fromJson(fc))
        : [],
        size: json.size?? { width: 8.5, height: 11 }
    });
  }

  addFormContainer(formContainer: FormContainerDto) {
    this.formContainers.push(formContainer);
  }

  removeFormContainer(formContainer: FormContainerDto) {
    this.formContainers = this.formContainers.filter(fc => fc.id !== formContainer.id);
  }
}