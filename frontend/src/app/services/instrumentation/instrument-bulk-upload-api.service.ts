import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { InstrumentDto } from '../../models/instrumentation/instrument.model';

export interface BulkUploadResult {
  created: number;
  updated: number;
  failed: number;
  total: number;
  errors: string[];
}

export interface CounterpartCheckReport {
  totalInstruments: number;
  totalUnitTagged: number;
  pairedBaseCount: number;
  missing01Count: number;
  missing02Count: number;
  missing01Tags: string[];
  missing02Tags: string[];
}

export interface CounterpartCreateResult {
  attempted: number;
  created: number;
  skipped: number;
  failed: number;
  errors: string[];
  reportBefore: CounterpartCheckReport;
  reportAfter: CounterpartCheckReport;
}

export interface DuplicateTagGroup {
  tagNumber: string;
  count: number;
  sharepointIds: string[];
}

export interface DuplicateCheckReport {
  totalInstruments: number;
  duplicateGroupCount: number;
  duplicateItemCount: number;
  groups: DuplicateTagGroup[];
}

export interface DuplicateMergeResult {
  groupsResolved: number;
  duplicatesDeleted: number;
  failed: number;
  errors: string[];
  reportBefore: DuplicateCheckReport;
  reportAfter: DuplicateCheckReport;
}

export type InstrumentBulkTagMode =
  | 'as_is'
  | 'base_to_u1_u2'
  | 'copy_u1_to_u2'
  | 'copy_u2_to_u1';

@Injectable({
  providedIn: 'root'
})
export class InstrumentBulkUploadApiService {
  private apiUrl = `${environment.apiUrl}/instruments/bulk`;

  constructor(private http: HttpClient) {}

  preview(file: File, tagMode: InstrumentBulkTagMode = 'as_is'): Observable<SpringApiResponse<InstrumentDto[]>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tagMode', tagMode);
    return this.http.post<SpringApiResponse<InstrumentDto[]>>(`${this.apiUrl}/preview`, formData);
  }

  upload(file: File, tagMode: InstrumentBulkTagMode = 'as_is'): Observable<SpringApiResponse<BulkUploadResult>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tagMode', tagMode);
    return this.http.post<SpringApiResponse<BulkUploadResult>>(`${this.apiUrl}/upload`, formData);
  }

  checkCounterparts(): Observable<SpringApiResponse<CounterpartCheckReport>> {
    return this.http.get<SpringApiResponse<CounterpartCheckReport>>(`${this.apiUrl}/counterpart-check`);
  }

  createMissingCounterparts(): Observable<SpringApiResponse<CounterpartCreateResult>> {
    return this.http.post<SpringApiResponse<CounterpartCreateResult>>(`${this.apiUrl}/counterpart-create-missing`, {});
  }

  checkDuplicates(): Observable<SpringApiResponse<DuplicateCheckReport>> {
    return this.http.get<SpringApiResponse<DuplicateCheckReport>>(`${this.apiUrl}/duplicates-check`);
  }

  mergeDuplicates(): Observable<SpringApiResponse<DuplicateMergeResult>> {
    return this.http.post<SpringApiResponse<DuplicateMergeResult>>(`${this.apiUrl}/duplicates-merge`, {});
  }

  getAllInstruments(): Observable<SpringApiResponse<InstrumentDto[]>> {
    return this.http.get<SpringApiResponse<InstrumentDto[]>>(`${environment.apiUrl}/instruments/get-all`);
  }
}
