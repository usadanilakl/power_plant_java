import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export interface MaximoFieldListDriftRow {
  id: number;
  title: string;
  listTypeName: string | null;
  localStatus: string | null;
  maximoRecordType: 'SR' | 'WO' | null;
  maximoRecordId: string | null;
  maximoStatus: string | null;
  maximoSyncPending: boolean | null;
  maximoCancelPending: boolean | null;
  dateModified: string | null;
  submitterName: string | null;
  deleted: boolean | null;
}

export interface MaximoFieldListDriftBucket {
  count: number;
  oldestAgeDays: number | null;
  samples: MaximoFieldListDriftRow[];
}

export interface MaximoFieldListDrift {
  createPending: MaximoFieldListDriftBucket;
  cancelPending: MaximoFieldListDriftBucket;
  maximoClosedLocalOpen: MaximoFieldListDriftBucket;
  localClosedMaximoOpen: MaximoFieldListDriftBucket;
  totalRoutedToMaximo: number;
  computedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminMaximoFieldListDriftService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/maximo-field-list-drift`;

  snapshot(limit = 25): Observable<SpringApiResponse<MaximoFieldListDrift>> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<SpringApiResponse<MaximoFieldListDrift>>(`${this.apiUrl}/snapshot`, { params });
  }
}
