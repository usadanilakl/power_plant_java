import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

/** Lightweight LOTO for the WO↔LOTO link pickers (mirrors backend LotoLinkDto). */
export interface LotoLink {
  id: number;
  permitNumber: string;
  status: string;
  equipmentSystem?: string;
  lotoRequestor?: string;
  linkedWonums: string[];
}

/** WO↔LOTO linking calls the LOTO endpoints (`/ng/lotos/...`), separate from the Maximo (`/ng/maximo`) base. */
@Injectable({ providedIn: 'root' })
export class MaximoWoLotoLinkService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/lotos`;

  activeLotos(): Observable<LotoLink[]> {
    return this.http.get<SpringApiResponse<LotoLink[]>>(`${this.base}/active-light`).pipe(map(r => r.responseData ?? []));
  }
  lotoLinks(id: number): Observable<LotoLink | null> {
    return this.http.get<SpringApiResponse<LotoLink>>(`${this.base}/${id}/links`).pipe(map(r => r.responseData ?? null));
  }
  lotosForWonum(wonum: string): Observable<LotoLink[]> {
    const p = new HttpParams().set('wonum', wonum);
    return this.http.get<SpringApiResponse<LotoLink[]>>(`${this.base}/for-wonum`, { params: p }).pipe(map(r => r.responseData ?? []));
  }
  linkWo(id: number, wonum: string): Observable<LotoLink | null> {
    const p = new HttpParams().set('wonum', wonum);
    return this.http.post<SpringApiResponse<LotoLink>>(`${this.base}/${id}/link-wo`, {}, { params: p }).pipe(map(r => r.responseData ?? null));
  }
  unlinkWo(id: number, wonum: string): Observable<LotoLink | null> {
    const p = new HttpParams().set('wonum', wonum);
    return this.http.post<SpringApiResponse<LotoLink>>(`${this.base}/${id}/unlink-wo`, {}, { params: p }).pipe(map(r => r.responseData ?? null));
  }
}
