export interface BaseModel {
  id: number;
  name: string;
  objectType: string;
  isVerified: boolean;
}

export class BaseDto implements BaseModel {
  id: number;
  name: string;
  objectType: string;
  isVerified: boolean;

  constructor(data: Partial<BaseModel> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.objectType = data.objectType || '';
    this.isVerified = this.toBooleanSafe(data.isVerified);
  }

  // Serialization method
  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      objectType: this.objectType,
      isVerified: this.isVerified
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
      objectType: json.objectType || '',
      isVerified: json.isVerified
    });
  }

  private toBooleanSafe(value: any): boolean {
    // console.log('Received non-boolean value for isVerified in BaseDto.toBooleanSafe:', value);
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }
    return Boolean(value);
  }
}