import { Injectable } from "@angular/core";
import { SearchCriteria } from "../../../../models/api/search-criteria.model";

@Injectable({
  providedIn: 'root',
})
export class TableUtilService {
  buildSearchCriteria(
    globalQuery: string,
    columnFilters: { [key: string]: string }
  ): SearchCriteria {
    const filters = Object.entries(columnFilters)
      .filter(([_, value]) => value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return {
      type: globalQuery ? 'global' : 'column',
      query: globalQuery,
      filters: filters,
      page: 1,
    };
  }
}