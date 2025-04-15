export interface SearchCriteria {
  type?: 'global' | 'column';
  query?: string;
  filters?: { [key: string]: string };
}

export class SearchCriteriaDto implements SearchCriteria {
  type?: 'global' | 'column';
  query?: string;
  filters?: { [key: string]: string };

  constructor(data: Partial<SearchCriteria> = {}) {
    this.type = data.type;
    this.query = data.query;
    this.filters = data.filters;
  }

  // You can add methods here if needed, for example:
  isGlobalSearch(): boolean {
    return this.type === 'global';
  }

  isColumnSearch(): boolean {
    return this.type === 'column';
  }

  // Serialization method
  toJson(): any {
    return {
      type: this.type,
      query: this.query,
      filters: this.filters
    };
  }

  // Deserialization method (static)
  static fromJson(json: any): SearchCriteriaDto {
    return new SearchCriteriaDto({
      type: json.type,
      query: json.query,
      filters: json.filters
    });
  }
}