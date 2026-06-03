import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment.prod';
import { SpringApiResponse, RfCategoryDto, RfValueDto } from '../models/rf-value.model';
import {
  CategoryWithCountDto,
  DuplicateCategoryDto,
  DuplicateValueDto,
  ValueWithDependenciesDto,
  MergeRequest,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  ValueCreateRequest,
  ValueUpdateRequest,
  ValueMoveRequest,
  OrphanValueDto,
  DedupOrphansResultDto
} from '../models/cv-manager.model';

@Injectable({
  providedIn: 'root'
})
export class CvManagerApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/cv-manager`;

  // ==================== CATEGORY ENDPOINTS ====================

  getAllCategories(): Observable<CategoryWithCountDto[]> {
    return this.http.get<SpringApiResponse<CategoryWithCountDto[]>>(
      `${this.baseUrl}/categories`
    ).pipe(map(response => response.responseData));
  }

  createCategory(request: CategoryCreateRequest): Observable<RfCategoryDto> {
    return this.http.post<SpringApiResponse<RfCategoryDto>>(
      `${this.baseUrl}/categories`,
      request
    ).pipe(map(response => response.responseData));
  }

  updateCategory(id: number, request: CategoryUpdateRequest): Observable<RfCategoryDto> {
    return this.http.put<SpringApiResponse<RfCategoryDto>>(
      `${this.baseUrl}/categories/${id}`,
      request
    ).pipe(map(response => response.responseData));
  }

  deleteCategory(id: number, transferToCategoryId?: number): Observable<void> {
    const url = transferToCategoryId
      ? `${this.baseUrl}/categories/${id}?transferToCategoryId=${transferToCategoryId}`
      : `${this.baseUrl}/categories/${id}`;
    return this.http.delete<SpringApiResponse<void>>(url).pipe(map(() => undefined));
  }

  canDeleteCategory(id: number): Observable<{ canDelete: boolean; valueCount: number; requiresTransfer: boolean }> {
    return this.http.get<SpringApiResponse<{ canDelete: boolean; valueCount: number; requiresTransfer: boolean }>>(
      `${this.baseUrl}/categories/${id}/can-delete`
    ).pipe(map(response => response.responseData));
  }

  findDuplicateCategories(): Observable<DuplicateCategoryDto[]> {
    return this.http.get<SpringApiResponse<DuplicateCategoryDto[]>>(
      `${this.baseUrl}/categories/duplicates`
    ).pipe(map(response => response.responseData));
  }

  mergeCategories(request: MergeRequest): Observable<RfCategoryDto> {
    return this.http.post<SpringApiResponse<RfCategoryDto>>(
      `${this.baseUrl}/categories/merge`,
      request
    ).pipe(map(response => response.responseData));
  }

  // ==================== VALUE ENDPOINTS ====================

  getAllValues(categoryId?: number): Observable<RfValueDto[]> {
    const url = categoryId
      ? `${this.baseUrl}/values?categoryId=${categoryId}`
      : `${this.baseUrl}/values`;
    return this.http.get<SpringApiResponse<RfValueDto[]>>(url)
      .pipe(map(response => response.responseData));
  }

  createValue(request: ValueCreateRequest): Observable<RfValueDto> {
    return this.http.post<SpringApiResponse<RfValueDto>>(
      `${this.baseUrl}/values`,
      request
    ).pipe(map(response => response.responseData));
  }

  updateValue(id: number, request: ValueUpdateRequest): Observable<RfValueDto> {
    return this.http.put<SpringApiResponse<RfValueDto>>(
      `${this.baseUrl}/values/${id}`,
      request
    ).pipe(map(response => response.responseData));
  }

  deleteValue(id: number, transferToValueId?: number): Observable<void> {
    const url = transferToValueId
      ? `${this.baseUrl}/values/${id}?transferToValueId=${transferToValueId}`
      : `${this.baseUrl}/values/${id}`;
    return this.http.delete<SpringApiResponse<void>>(url).pipe(map(() => undefined));
  }

  getValueDependencies(id: number): Observable<ValueWithDependenciesDto> {
    return this.http.get<SpringApiResponse<ValueWithDependenciesDto>>(
      `${this.baseUrl}/values/${id}/dependencies`
    ).pipe(map(response => response.responseData));
  }

  findDuplicateValues(categoryId?: number): Observable<DuplicateValueDto[]> {
    const url = categoryId
      ? `${this.baseUrl}/values/duplicates?categoryId=${categoryId}`
      : `${this.baseUrl}/values/duplicates`;
    return this.http.get<SpringApiResponse<DuplicateValueDto[]>>(url)
      .pipe(map(response => response.responseData));
  }

  mergeValues(request: MergeRequest): Observable<RfValueDto> {
    return this.http.post<SpringApiResponse<RfValueDto>>(
      `${this.baseUrl}/values/merge`,
      request
    ).pipe(map(response => response.responseData));
  }

  moveValueToCategory(request: ValueMoveRequest): Observable<RfValueDto> {
    return this.http.post<SpringApiResponse<RfValueDto>>(
      `${this.baseUrl}/values/move`,
      request
    ).pipe(map(response => response.responseData));
  }

  // ==================== ORPHAN DEDUP ENDPOINTS ====================

  /**
   * Discovery only — find Values that share a name with a canonical Value in
   * the given Category but live outside it. No DB mutation; sorted by
   * referenceCount desc.
   */
  findOrphanValues(categoryAlias: string): Observable<OrphanValueDto[]> {
    return this.http.get<SpringApiResponse<OrphanValueDto[]>>(
      `${this.baseUrl}/values/orphans?categoryAlias=${encodeURIComponent(categoryAlias)}`
    ).pipe(map(r => r.responseData));
  }

  /**
   * Run the dedup. `dryRun=true` returns the plan without mutating; `dryRun=false`
   * invokes `mergeValues` for each orphan→canonical pair (re-points FKs across
   * every registered entity type, soft-deletes the orphan).
   */
  dedupOrphans(categoryAlias: string, dryRun: boolean): Observable<DedupOrphansResultDto> {
    return this.http.post<SpringApiResponse<DedupOrphansResultDto>>(
      `${this.baseUrl}/values/dedup-orphans?categoryAlias=${encodeURIComponent(categoryAlias)}&dryRun=${dryRun}`,
      {}
    ).pipe(map(r => r.responseData));
  }

  /**
   * RECOVERY: resurrect (set deleted=false) any Value still referenced by an
   * entity FK. Use this to undo damage from a previous unsafe merge that
   * soft-deleted values without re-pointing the entities first.
   */
  recoverDanglingReferences(): Observable<{ referencedIds: number; resurrected: number; scannedTables: number }> {
    return this.http.post<SpringApiResponse<{ referencedIds: number; resurrected: number; scannedTables: number }>>(
      `${this.baseUrl}/values/recover-dangling`, {}
    ).pipe(map(r => r.responseData));
  }
}
