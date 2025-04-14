import { CategoryDto } from './category.model';

export interface ValueModel {
  id: number;
  name: string;
  category: CategoryDto;
}

export class ValueDto implements ValueModel {
  id: number;
  name: string;
  category: CategoryDto;

  constructor(data: Partial<ValueModel> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.category = data.category || new CategoryDto({ id: 0, name: '', alias: '' });
  }

  // Serialization method
  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      category: this.category
    };
  }

  // Deserialization method (static)
  static fromJson(json: any): ValueDto {
    return new ValueDto({
      id: json.id,
      name: json.name,
      category: json.category
    });
  }

  // You can add methods here for any value-specific operations
}