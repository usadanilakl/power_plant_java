import { CategoryDto } from './category.model';
import { Option } from './option.model';

export interface ValueModel {
  id: number;
  name: string;
  alias: string;
  category: CategoryDto;
}

export class ValueDto implements ValueModel {
  id: number;
  name: string;
  alias: string;
  category: CategoryDto;

  constructor(data: Partial<ValueModel> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.alias = data.alias || '';
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
    if (!json) return new ValueDto(); // Return a default ValueDto if json is null or undefined
    return new ValueDto({
      id: json.id ?? 0, // Use nullish coalescing to provide a default value
      name: json.name || '',
      category: json.category ? CategoryDto.fromJson(json.category) : new CategoryDto()
    });
  }

  // You can add methods here for any value-specific operations
}