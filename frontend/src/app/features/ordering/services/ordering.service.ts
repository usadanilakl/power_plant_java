import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import {
  OrderCatalogItem,
  OrderRecord,
  PlaceOrderRequest,
  ReorderSuggestion,
} from '../models/ordering.model';

/** Client for the hub-independent Ordering ledger (`/ng/ordering`, served by the local backend). */
@Injectable({ providedIn: 'root' })
export class OrderingService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/ordering`;

  /** Whether the SharePoint ledger is reachable right now. */
  status(): Observable<boolean> {
    return this.http
      .get<SpringApiResponse<boolean>>(`${this.base}/status`)
      .pipe(map(r => r.responseData ?? false));
  }

  listCatalog(): Observable<OrderCatalogItem[]> {
    return this.http
      .get<SpringApiResponse<OrderCatalogItem[]>>(`${this.base}/catalog`)
      .pipe(map(r => r.responseData ?? []));
  }

  seedCatalog(): Observable<OrderCatalogItem[]> {
    return this.http
      .post<SpringApiResponse<OrderCatalogItem[]>>(`${this.base}/catalog/seed`, {})
      .pipe(map(r => r.responseData ?? []));
  }

  saveCatalogItem(item: OrderCatalogItem): Observable<OrderCatalogItem> {
    return this.http
      .post<SpringApiResponse<OrderCatalogItem>>(`${this.base}/catalog`, item)
      .pipe(map(r => r.responseData));
  }

  deleteCatalogItem(itemKey: string): Observable<void> {
    return this.http
      .delete<SpringApiResponse<void>>(`${this.base}/catalog/${encodeURIComponent(itemKey)}`)
      .pipe(map(() => undefined));
  }

  listOrders(): Observable<OrderRecord[]> {
    return this.http
      .get<SpringApiResponse<OrderRecord[]>>(`${this.base}/orders`)
      .pipe(map(r => r.responseData ?? []));
  }

  placeOrder(req: PlaceOrderRequest): Observable<OrderRecord> {
    return this.http
      .post<SpringApiResponse<OrderRecord>>(`${this.base}/place-order`, req)
      .pipe(map(r => r.responseData));
  }

  listSuggestions(openOnly = true): Observable<ReorderSuggestion[]> {
    const params = new HttpParams().set('openOnly', String(openOnly));
    return this.http
      .get<SpringApiResponse<ReorderSuggestion[]>>(`${this.base}/suggestions`, { params })
      .pipe(map(r => r.responseData ?? []));
  }

  updateSuggestionStatus(id: string, status: string): Observable<ReorderSuggestion> {
    const params = new HttpParams().set('status', status);
    return this.http
      .post<SpringApiResponse<ReorderSuggestion>>(
        `${this.base}/suggestions/${encodeURIComponent(id)}/status`, {}, { params })
      .pipe(map(r => r.responseData));
  }
}
