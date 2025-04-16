import { CategoryDto } from './category.model';
import { Option } from './option.model';

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

  toOption(): Option {
    return { value: this.id, label: this.name };
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