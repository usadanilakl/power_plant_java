export interface CategoryModel {
  id: number;
  name: string;
  alias: string;
}

export class CategoryDto implements CategoryModel {
  id: number;
  name: string;
  alias: string;

  constructor(data: Partial<CategoryModel> = {}) {
    this.id = data.id || 0;
    this.name = data.name || '';
    this.alias = data.alias || '';
  }

  // Serialization method
  toJson(): any {
    return {
      id: this.id,
      name: this.name,
      alias: this.alias
    };
  }

  // Deserialization method (static)
  static fromJson(json: any): CategoryDto {
    return new CategoryDto({
      id: json.id,
      name: json.name,
      alias: json.alias
    });
  }

  // You can add methods here for any category-specific operations
}