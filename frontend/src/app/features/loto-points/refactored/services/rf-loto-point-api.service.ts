import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { LotoPointIdDto } from '../../../../models/loto/loto-point-id.model';
import { FileDto } from '../../../../models/file/file.model';
import { LotoPointSummaryDto } from '../../../../models/loto/loto-point-summary.model';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { BulkSearchResultDto } from '../../../../models/loto/bulk-search-result.model';


@Injectable({
  providedIn: 'root',
})
export class RfLotoPointApiService {
  private apiUrl = `${environment.apiUrl}/loto-points`;

  // Subject to broadcast LOTO point updates to all listening components
  private lotoPointUpdatedSubject = new Subject<LotoPointDto>();
  lotoPointUpdated$ = this.lotoPointUpdatedSubject.asObservable();

  // Subject to broadcast LOTO point deletions
  private lotoPointDeletedSubject = new Subject<number>();
  lotoPointDeleted$ = this.lotoPointDeletedSubject.asObservable();

  constructor(private http: HttpClient) {}

  getLotoPoints(
    page: number = 1,
    pageSize: number = 50
  ): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoPointDto>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }

  searchLotoPoints(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoPointDto>>(
      `${this.apiUrl}/search`,
      criteria,
      { params }
    );
  }
  searchLpByBaseTagNumber(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<LotoPointDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoPointDto>>(
      `${this.apiUrl}/search-by-base-tag-number`,
      criteria,
      { params }
    );
  }

  getLotoPointById(id: string): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.get<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  createLotoPoint(
    lotoPoint: LotoPointDto
  ): Observable<SpringApiResponse<LotoPointDto>> {
    console.log('createLotoPoint received:', lotoPoint);
    console.log('Has toIdModel?', typeof (lotoPoint as any).toIdModel === 'function');

    let lotoPointIdDto: LotoPointIdDto;

    // Check if it has the toIdModel method (duck typing)
    if (typeof (lotoPoint as any).toIdModel === 'function') {
      console.log('Converting using toIdModel');
      lotoPointIdDto = lotoPoint.toIdModel();
    } else {
      console.log('Creating new LotoPointDto and converting');
      // Create a proper LotoPointDto instance and convert it
      const dto = new LotoPointDto(lotoPoint as any);
      lotoPointIdDto = dto.toIdModel();
    }

    console.log('Sending to backend:', lotoPointIdDto);

    return this.http.post<SpringApiResponse<LotoPointDto>>(
      this.apiUrl,
      lotoPointIdDto
    );
  }

  updateLotoPoint(
    lotoPoint: Partial<LotoPointIdDto | LotoPointDto>
  ): Observable<SpringApiResponse<LotoPointDto>> {
    let lotoPointIdDto: LotoPointIdDto;

    // Check if it has the toIdModel method (duck typing)
    if (typeof (lotoPoint as any).toIdModel === 'function') {
      lotoPointIdDto = (lotoPoint as LotoPointDto).toIdModel();
    } else if (this.isLotoPointIdDto(lotoPoint)) {
      lotoPointIdDto = lotoPoint as LotoPointIdDto;
    } else {
      // Create a proper LotoPointDto instance and convert it
      // Use 'as any' to bypass type checking since we're handling the conversion
      const dto = new LotoPointDto(lotoPoint as any);
      lotoPointIdDto = dto.toIdModel();
    }

    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.put<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}`,
      lotoPointIdDto,
      { headers }
    ).pipe(
      tap(response => {
        if (response.responseData) {
          // Broadcast the updated LOTO point to all listeners
          const updatedLotoPoint = LotoPointDto.fromJson(response.responseData);
          this.lotoPointUpdatedSubject.next(updatedLotoPoint);
        }
      })
    );
  }

  /**
   * Save LOTO point - creates if new, updates if existing
   * Broadcasts the update to all listening components
   */
  saveLotoPoint(lotoPoint: LotoPointDto): Observable<SpringApiResponse<LotoPointDto>> {
    const saveObservable = lotoPoint.id
      ? this.updateLotoPoint(lotoPoint)
      : this.createLotoPoint(lotoPoint);

    return saveObservable.pipe(
      tap(response => {
        if (response.responseData) {
          // Broadcast the updated LOTO point to all listeners
          const updatedLotoPoint = LotoPointDto.fromJson(response.responseData);
          this.lotoPointUpdatedSubject.next(updatedLotoPoint);
        }
      })
    );
  }

  // Type guard function
  private isLotoPointIdDto(object: any): object is LotoPointIdDto {
    // Iterate over all fields
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const value = object[key];
        // Check if the value is an object, but not an array or null
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value)
        ) {
          return false; // Found a nested object, so it's not a LotoPointIdDto
        }
      }
    }

    return true; // No nested objects found, likely a LotoPointIdDto
  }

  /**
   * Delete a LOTO point safely.
   * - Deletes all associated equipment (and handles their file relationships)
   * - Handles counterpart relationship (delete or unlink based on deleteCounterpart param)
   * - Soft deletes the LOTO point
   *
   * @param id The LOTO point ID to delete
   * @param deleteCounterpart If true, also deletes the counterpart LOTO point (default: false)
   * @param counterpartId Optional: The counterpart ID to also broadcast deletion for (when deleteCounterpart is true)
   * @returns Observable with the deleted LOTO point DTO
   */
  deleteLotoPoint(id: string | number, deleteCounterpart: boolean = false, counterpartId?: number): Observable<SpringApiResponse<LotoPointDto>> {
    const params = new HttpParams().set('deleteCounterpart', deleteCounterpart.toString());
    return this.http.delete<SpringApiResponse<LotoPointDto>>(`${this.apiUrl}/${id}`, { params }).pipe(
      tap((response) => {
        // Broadcast the deletion to all listeners
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        this.lotoPointDeletedSubject.next(numericId);

        // If counterpart was also deleted, broadcast that deletion too
        if (deleteCounterpart) {
          // Try to get counterpartId from response or from parameter
          const deletedCounterpartId = counterpartId || response?.responseData?.counterpartId;
          if (deletedCounterpartId) {
            this.lotoPointDeletedSubject.next(deletedCounterpartId);
          }
        }
      })
    );
  }

  getLotoPointsByFileId(
    fileId: number
  ): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointDto[]>>(
      `${this.apiUrl}/file/${fileId}`
    );
  }

  getRelatedImages(id: number): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(
      `${this.apiUrl}/${id}/related-images`
    );
  }
  getRelatedFiles(
    lotoPointId: number
  ): Observable<SpringApiResponse<FileDto[]>> {
    return this.http.get<SpringApiResponse<FileDto[]>>(
      `${this.apiUrl}/${lotoPointId}/related-files`
    );
  }

  getUniqueValuesOfColumn(
    column: string
  ): Observable<SpringApiResponse<string[]>> {
    return this.http.get<SpringApiResponse<string[]>>(
      `${this.apiUrl}/unique-values/${column}`
    );
  }

  // getFilteredUniqueValuesOfColumn(
  //   column: string,
  //   filters: { [key: string]: string },
  //   page: number = 1,
  //   pageSize: number = 50,
  //   andLogicEnabled: boolean = true
  // ): Observable<SpringPaginatedResponse<LotoPointDto>> {
  //   const params = new HttpParams()
  //     .set('page', page.toString())
  //     .set('pageSize', pageSize.toString())
  //     .set('andLogicEnabled', andLogicEnabled.toString());

  //   return this.http.post<SpringPaginatedResponse<LotoPointDto>>(
  //     `${this.apiUrl}/unique-values/${column}/filtered`,
  //     filters,
  //     { params }
  //   );
  // }

  getFilteredUniqueValuesOfColumn(
    column: string,
    searchCriterica: SearchCriteria,
    page: number = 1,
    pageSize: number = 50,
    andLogicEnabled: boolean = true
  ): Observable<SpringPaginatedResponse<string>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('andLogicEnabled', andLogicEnabled.toString());

    return this.http.post<SpringPaginatedResponse<string>>(
      `${this.apiUrl}/unique-values/${column}/filtered`,
      searchCriterica,
      { params }
    );
  }

  /**
   * Get LOTO points grouped by specified criteria for left menu
   * @param groupBy The grouping criteria: equipmentType, location, file, system, unit, zeroEnergyMethod
   * @returns Map of group names to arrays of LOTO points
   */
  getGroupedLotoPoints(groupBy: string): Observable<SpringApiResponse<{ [key: string]: LotoPointDto[] }>> {
    const params = new HttpParams().set('groupBy', groupBy);

    return this.http.get<SpringApiResponse<{ [key: string]: LotoPointDto[] }>>(
      `${this.apiUrl}/grouped`,
      { params }
    );
  }

  /**
   * Get lightweight summaries of all LOTO points for caching
   * Returns only essential fields needed for grouping and display
   * Much faster and smaller payload than full DTOs
   */
  getSummaries(): Observable<SpringApiResponse<LotoPointSummaryDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointSummaryDto[]>>(
      `${this.apiUrl}/summary`
    );
  }

  /**
   * Get the unit counterpart for a LOTO point by ID.
   * Returns counterpart data including:
   * - counterpart: LotoPointDto (existing or suggested)
   * - isNew: boolean indicating if counterpart needs to be created
   * - sourceUnit: the source unit prefix (01 or 02)
   * - targetUnit: the target unit prefix (02 or 01)
   */
  getUnitCounterpart(id: number): Observable<SpringApiResponse<{
    counterpart: LotoPointDto;
    isNew: boolean;
    sourceUnit: string;
    targetUnit: string;
  }>> {
    return this.http.get<SpringApiResponse<{
      counterpart: LotoPointDto;
      isNew: boolean;
      sourceUnit: string;
      targetUnit: string;
    }>>(`${this.apiUrl}/${id}/counterpart`);
  }

  /**
   * Get the unit counterpart by tag number (for new items being created).
   * Returns counterpart data including:
   * - counterpart: LotoPointDto (existing or suggested)
   * - isNew: boolean indicating if counterpart needs to be created
   * - sourceUnit: the source unit prefix (01 or 02)
   * - targetUnit: the target unit prefix (02 or 01)
   */
  getCounterpartByTagNumber(tagNumber: string): Observable<SpringApiResponse<{
    counterpart: LotoPointDto;
    isNew: boolean;
    sourceUnit: string;
    targetUnit: string;
  }>> {
    const params = new HttpParams().set('tagNumber', tagNumber);
    return this.http.get<SpringApiResponse<{
      counterpart: LotoPointDto;
      isNew: boolean;
      sourceUnit: string;
      targetUnit: string;
    }>>(`${this.apiUrl}/counterpart-by-tag`, { params });
  }

  /**
   * Get counterpart by ID directly (when counterpartId is already known).
   */
  getCounterpartById(counterpartId: number): Observable<SpringApiResponse<LotoPointDto>> {
    return this.http.get<SpringApiResponse<LotoPointDto>>(
      `${this.apiUrl}/counterpart/${counterpartId}`
    );
  }

  /**
   * Link two LOTO points as counterparts (bidirectional).
   * Sets counterpartId on both points.
   */
  linkCounterparts(point1Id: number, point2Id: number): Observable<SpringApiResponse<string>> {
    const params = new HttpParams()
      .set('point1Id', point1Id.toString())
      .set('point2Id', point2Id.toString());
    return this.http.post<SpringApiResponse<string>>(
      `${this.apiUrl}/link-counterparts`,
      null,
      { params }
    );
  }

  /**
   * Unlink counterpart relationship (bidirectional).
   * Removes counterpartId from both points.
   */
  unlinkCounterpart(pointId: number): Observable<SpringApiResponse<string>> {
    return this.http.post<SpringApiResponse<string>>(
      `${this.apiUrl}/${pointId}/unlink-counterpart`,
      null
    );
  }

  /**
   * Get the usage count for a ZeroEnergy record (how many LotoPoints reference it).
   */
  getZeroEnergyUsageCount(zeroEnergyId: number): Observable<SpringApiResponse<number>> {
    return this.http.get<SpringApiResponse<number>>(
      `${this.apiUrl}/zero-energy/${zeroEnergyId}/usage-count`
    );
  }

  /**
   * Look up counterpart equipment for ZeroEnergy transfer.
   * For each source equipment ID, finds the counterpart equipment for the target unit.
   *
   * @param sourceEquipmentIds List of equipment IDs from the source unit
   * @param sourceUnit The source unit prefix ("01" or "02")
   * @returns Observable with list of counterpart EquipmentDto objects
   */
  lookupCounterpartEquipment(
    sourceEquipmentIds: number[],
    sourceUnit: string
  ): Observable<SpringApiResponse<EquipmentDto[]>> {
    return this.http.post<SpringApiResponse<EquipmentDto[]>>(
      `${this.apiUrl}/lookup-counterpart-equipment`,
      {
        sourceEquipmentIds,
        sourceUnit
      }
    );
  }

  /**
   * Look up counterpart LOTO points for ZeroEnergy transfer.
   * For each source LOTO point ID, finds the counterpart LOTO point for the target unit.
   *
   * @param sourceLotoPointIds List of LOTO point IDs from the source unit
   * @param sourceUnit The source unit prefix ("01" or "02")
   * @returns Observable with list of counterpart LotoPointDto objects
   */
  lookupCounterpartLotoPoints(
    sourceLotoPointIds: number[],
    sourceUnit: string
  ): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.post<SpringApiResponse<LotoPointDto[]>>(
      `${this.apiUrl}/lookup-counterpart-loto-points`,
      {
        sourceLotoPointIds,
        sourceUnit
      }
    );
  }

  bulkSearchByText(text: string): Observable<SpringApiResponse<BulkSearchResultDto>> {
    return this.http.post<SpringApiResponse<BulkSearchResultDto>>(
      `${this.apiUrl}/bulk-search`,
      { text }
    );
  }

  /** LOTO points linked to a given 3D model file (FileObject ID). */
  getByModelFile(fileId: number): Observable<SpringApiResponse<LotoPointDto[]>> {
    return this.http.get<SpringApiResponse<LotoPointDto[]>>(
      `${this.apiUrl}/by-model-file/${fileId}`
    );
  }

  /** Find-or-create a Value by category and name. Used for reference data setup. */
  createValue(category: string, value: string): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(
      `${environment.apiUrl}/values/${encodeURIComponent(category)}/${encodeURIComponent(value)}`, {}
    );
  }
}