import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import {
  CreateMaximoServiceRequest,
  MaximoAsset,
  MaximoAttachmentParent,
  MaximoDoclink,
  MaximoServiceRequest,
  MaximoWorkOrder
} from '../../models/maximo/maximo.models';

@Injectable({ providedIn: 'root' })
export class MaximoApiService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/maximo`;

  searchAssets(params: { tag?: string; siteid?: string; pageSize?: number }): Observable<MaximoAsset[]> {
    let p = new HttpParams();
    if (params.tag) p = p.set('tag', params.tag);
    if (params.siteid) p = p.set('siteid', params.siteid);
    if (params.pageSize != null) p = p.set('pageSize', String(params.pageSize));
    return this.http
      .get<SpringApiResponse<MaximoAsset[]>>(`${this.base}/assets`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  getAsset(assetnum: string): Observable<MaximoAsset | null> {
    return this.http
      .get<SpringApiResponse<MaximoAsset>>(`${this.base}/assets/${encodeURIComponent(assetnum)}`)
      .pipe(map(r => r.responseData ?? null));
  }

  listServiceRequestsForAsset(assetnum: string, pageSize = 50): Observable<MaximoServiceRequest[]> {
    const p = new HttpParams().set('pageSize', String(pageSize));
    return this.http
      .get<SpringApiResponse<MaximoServiceRequest[]>>(
        `${this.base}/assets/${encodeURIComponent(assetnum)}/service-requests`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  getServiceRequest(href: string): Observable<MaximoServiceRequest | null> {
    return this.http
      .get<SpringApiResponse<MaximoServiceRequest>>(`${this.base}/service-requests/${encodeURIComponent(href)}`)
      .pipe(map(r => r.responseData ?? null));
  }

  createServiceRequest(body: CreateMaximoServiceRequest): Observable<MaximoServiceRequest> {
    return this.http
      .post<SpringApiResponse<MaximoServiceRequest>>(`${this.base}/service-requests`, body)
      .pipe(map(r => r.responseData));
  }

  listWorkOrdersForAsset(assetnum: string, pageSize = 50): Observable<MaximoWorkOrder[]> {
    const p = new HttpParams().set('pageSize', String(pageSize));
    return this.http
      .get<SpringApiResponse<MaximoWorkOrder[]>>(
        `${this.base}/assets/${encodeURIComponent(assetnum)}/work-orders`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  getWorkOrder(href: string): Observable<MaximoWorkOrder | null> {
    return this.http
      .get<SpringApiResponse<MaximoWorkOrder>>(`${this.base}/work-orders/${encodeURIComponent(href)}`)
      .pipe(map(r => r.responseData ?? null));
  }

  listAttachments(parent: MaximoAttachmentParent, href: string): Observable<MaximoDoclink[]> {
    return this.http
      .get<SpringApiResponse<MaximoDoclink[]>>(
        `${this.base}/${parent}/${encodeURIComponent(href)}/attachments`)
      .pipe(map(r => r.responseData ?? []));
  }

  uploadAttachment(parent: MaximoAttachmentParent, href: string, file: File, doctype?: string): Observable<MaximoDoclink> {
    const fd = new FormData();
    fd.append('file', file);
    if (doctype) fd.append('doctype', doctype);
    let p = new HttpParams();
    if (doctype) p = p.set('doctype', doctype);
    return this.http
      .post<SpringApiResponse<MaximoDoclink>>(
        `${this.base}/${parent}/${encodeURIComponent(href)}/attachments`, fd, { params: p })
      .pipe(map(r => r.responseData));
  }
}
