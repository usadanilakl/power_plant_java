import { CategoryDto } from './category.model';
import { Option } from './option.model';

export interface ValueModel {
  id: number;
  name: string;
  alias: string;
  category: CategoryDto;
  /** Only meaningful when this Value is in the "fileType" category. */
  convertToJpg?: boolean | null;
}

export class ValueDto implements ValueModel {
  id: number;
  name: string;
  alias: string;
  category: CategoryDto;
  convertToJpg?: boolean | null;

  constructor(data: Partial<ValueModel> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.alias = data.alias || '';
    this.category = data.category || new CategoryDto({ id: 0, name: '', alias: '' });
    this.convertToJpg = data.convertToJpg ?? null;
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
    // Form fields often hand us a raw number (the Value's id) rather than an object.
    // Treat that as the id so downstream extractId() picks it up instead of returning 0.
    if (typeof json === 'number') {
      return new ValueDto({ id: json });
    }
    if (typeof json === 'string') {
      const n = Number(json);
      if (!Number.isNaN(n)) return new ValueDto({ id: n });
    }
    return new ValueDto({
      id: json.id ?? 0, // Use nullish coalescing to provide a default value
      name: json.name || '',
      category: json.category ? CategoryDto.fromJson(json.category) : new CategoryDto(),
      convertToJpg: json.convertToJpg ?? null,
    });
  }

  // You can add methods here for any value-specific operations
}