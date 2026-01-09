import { Injectable, signal } from '@angular/core';
import { SearchCriteria } from '../../models/api/search-criteria.model';
import { Observable } from 'rxjs';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export type ExportOption = 'all' | 'queried' | 'selected';

export type EntityType = 'lotoPoint' | 'file' | 'lotoStandard';

export interface ExportConfig {
  entityType: EntityType;
  entityLabel: string;
  searchCriteria: SearchCriteria | null;
  selectedIds: number[];
  exportAllFn: () => Observable<SpringApiResponse<string>>;
  exportByQueryFn: (criteria: SearchCriteria) => Observable<SpringApiResponse<string>>;
  exportByIdsFn: (ids: number[]) => Observable<SpringApiResponse<string>>;
}

@Injectable({
  providedIn: 'root'
})
export class ExportDialogService {
  isVisible = signal(false);
  isExporting = signal(false);
  exportError = signal<string | null>(null);

  private config = signal<ExportConfig | null>(null);

  open(config: ExportConfig): void {
    this.config.set(config);
    this.exportError.set(null);
    this.isVisible.set(true);
  }

  close(): void {
    this.isVisible.set(false);
    this.isExporting.set(false);
    this.exportError.set(null);
  }

  getConfig(): ExportConfig | null {
    return this.config();
  }

  getSearchCriteria(): SearchCriteria | null {
    return this.config()?.searchCriteria ?? null;
  }

  getSelectedIds(): number[] {
    return this.config()?.selectedIds ?? [];
  }

  getEntityLabel(): string {
    return this.config()?.entityLabel ?? 'Items';
  }

  hasSelectedItems(): boolean {
    return this.getSelectedIds().length > 0;
  }

  hasSearchCriteria(): boolean {
    const criteria = this.getSearchCriteria();
    if (!criteria) return false;

    const hasFilters = !!(criteria.filters && Object.keys(criteria.filters).length > 0);
    const hasQuery = !!(criteria.query && criteria.query.trim().length > 0);

    return hasFilters || hasQuery;
  }

  exportAll(): Observable<SpringApiResponse<string>> | null {
    return this.config()?.exportAllFn() ?? null;
  }

  exportByQuery(criteria: SearchCriteria): Observable<SpringApiResponse<string>> | null {
    return this.config()?.exportByQueryFn(criteria) ?? null;
  }

  exportByIds(ids: number[]): Observable<SpringApiResponse<string>> | null {
    return this.config()?.exportByIdsFn(ids) ?? null;
  }
}
