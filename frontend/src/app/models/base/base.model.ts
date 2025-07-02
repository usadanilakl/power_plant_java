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

  
  static removeDefaultValues<T extends BaseDto>(dto: T): Partial<T> {
    const result: Partial<T> = {};
  
    for (const [key, value] of Object.entries(dto)) {
      if (Array.isArray(value)) {
        const nonDefaultArray = value.map(item => 
          typeof item === 'object' && item !== null
            ? BaseDto.removeDefaultValues(item as any)
            : item
        ).filter(item => !BaseDto.isDefaultValue(item));
  
        if (nonDefaultArray.length > 0) {
          result[key as keyof T] = nonDefaultArray as any;
        }
      } else if (!BaseDto.isDefaultValue(value)) {
        result[key as keyof T] = value;
      }
    }
  
    return result;
  }
  
  private static isDefaultValue(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'number' && value === 0) return true;
    if (typeof value === 'boolean' && value === false) return true;
    if (typeof value === 'object') {
      if ('id' in value) {
        return value.id === 0;
      }
      return Object.keys(value).length === 0;
    }
  
    return false;
  }


}