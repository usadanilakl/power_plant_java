import { filterLogic } from "../../shared/table/refactored/services/table-search.service";

export interface SearchCriteria {
  type?: 'global' | 'column' | 'sort';
  query?: string;
  filters?: { [key: string]: string };
  columnFilterLogic?: { [key: string]: filterLogic };
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';
  page?: number;
  pageSize?: number;
}

export class SearchCriteriaDto implements SearchCriteria {
  type?: 'global' | 'column' | 'sort';
  query?: string;
  filters?: { [key: string]: string };
  page?: number;
  pageSize?: number;
  sortColumn?: string;
  sortDirection?: 'ASC' | 'DESC';

  constructor(data: Partial<SearchCriteria> = {}) {
    this.type = data.type;
    this.query = data.query;
    this.filters = data.filters;
    this.page = data.page?? 1;
    this.pageSize = data.pageSize?? 10;
    this.sortColumn = data.sortColumn;
    this.sortDirection = data.sortDirection;
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