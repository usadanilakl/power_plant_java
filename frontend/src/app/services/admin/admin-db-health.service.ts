import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export interface DbTableStat {
  name: string;
  bytes: number;
}

export interface DbAttachmentStat {
  rowCount: number;
  distinctHashes: number;
  nullHashCount: number;
  totalBytes: number;
}

export interface DbDayCount {
  day: string;
  count: number;
}

export interface DbHealth {
  dialect: string;
  dbFilePath: string;
  fileSizeBytes: number;
  traceSizeBytes: number;
  logicalBytes: number;
  deadSpaceBytes: number;
  deadSpacePercent: number;
  compactRecommended: boolean;
  fieldChangeTotal: number;
  note?: string;
  tables: DbTableStat[];
  auditTables: DbTableStat[];
  attachments?: DbAttachmentStat;
  fieldChangeByDay: DbDayCount[];
}

@Injectable({ providedIn: 'root' })
export class AdminDbHealthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/db-health`;

  getStats(): Observable<SpringApiResponse<DbHealth>> {
    return this.http.get<SpringApiResponse<DbHealth>>(`${this.apiUrl}/stats`);
  }
}
