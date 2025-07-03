export interface BaseModel {
  id: number;
  name: string;
  objectType: string;
}

export class BaseDto implements BaseModel {
  id: number;
  name: string;
  objectType: string;

  constructor(data: Partial<BaseModel> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.objectType = data.objectType || '';
  }

  // Serialization method
  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      objectType: this.objectType
    };
  }

  // Deserialization method (static)
  static fromJson(json: any): BaseDto {
    if (!json) {
      console.warn('Received null or undefined json in BaseDto.fromJson');
      return new BaseDto();
    }

    return new BaseDto({
      id: json.id || 0,
      name: json.name || '',
      objectType: json.objectType || ''
    });
  }
}