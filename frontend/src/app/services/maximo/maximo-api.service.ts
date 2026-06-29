import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import {
  CompleteWorkOrderRequest,
  CreateMaximoServiceRequest,
  MaximoAsset,
  MaximoAttachmentParent,
  MaximoDoclink,
  MaximoInventoryItem,
  MaximoLocation,
  MaximoMaterialTxn,
  MaximoServiceRequest,
  MaximoServiceRequestCriteria,
  MaximoTicketParent,
  MaximoWorkOrder,
  MaximoWorkOrderCriteria,
  MaximoWorkType,
  MaximoWorklog,
  IssueMaterialRequest,
  PartsCheckoutRequest,
  PartsCheckoutResult,
  ReturnMaterialRequest
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

  listServiceRequestsByStatus(status: string, pageSize = 50): Observable<MaximoServiceRequest[]> {
    return this.listServiceRequestsByCriteria({ status }, pageSize);
  }

  listServiceRequestsByCriteria(c: MaximoServiceRequestCriteria, pageSize = 50): Observable<MaximoServiceRequest[]> {
    let p = new HttpParams().set('pageSize', String(pageSize));
    if (c.status)               p = p.set('status', c.status);
    if (c.assetnum)             p = p.set('assetnum', c.assetnum);
    if (c.location)             p = p.set('location', c.location);
    if (c.priority)             p = p.set('priority', c.priority);
    if (c.reportedby)           p = p.set('reportedby', c.reportedby);
    if (c.affectedperson)       p = p.set('affectedperson', c.affectedperson);
    if (c.classstructureid)     p = p.set('classstructureid', c.classstructureid);
    if (c.reportdateFrom)       p = p.set('reportdateFrom', c.reportdateFrom);
    if (c.reportdateTo)         p = p.set('reportdateTo', c.reportdateTo);
    if (c.descriptionContains)      p = p.set('descriptionContains', c.descriptionContains);
    if (c.longDescriptionContains)  p = p.set('longDescriptionContains', c.longDescriptionContains);
    if (c.siteid)                   p = p.set('siteid', c.siteid);
    return this.http
      .get<SpringApiResponse<MaximoServiceRequest[]>>(`${this.base}/service-requests`, { params: p })
      .pipe(map(r => r.responseData ?? []));
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

  /**
   * WOs Maximo has assigned to any local Lead Operator (`spi:lead in [...]`).
   * Pass a `status` (e.g. APPR) to narrow — without it the bundle returns ALL statuses, which is
   * dominated by historical CLOSE WOs and truncates badly at the page cap.
   */
  listLeadOperatorWorkOrders(pageSize = 100, status?: string): Observable<MaximoWorkOrder[]> {
    let p = new HttpParams().set('pageSize', String(pageSize));
    if (status) p = p.set('status', status);
    return this.http
      .get<SpringApiResponse<MaximoWorkOrder[]>>(`${this.base}/bundle/lead-operators/work-orders`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  listWorkOrdersByCriteria(c: MaximoWorkOrderCriteria, pageSize = 50): Observable<MaximoWorkOrder[]> {
    let p = new HttpParams().set('pageSize', String(pageSize));
    if (c.status)   p = p.set('status', c.status);
    if (c.worktype) p = p.set('worktype', c.worktype);
    if (c.assetnum) p = p.set('assetnum', c.assetnum);
    if (c.location) p = p.set('location', c.location);
    if (c.priority) p = p.set('priority', c.priority);
    if (c.leadCraft) p = p.set('leadCraft', c.leadCraft);
    if (c.supervisor) p = p.set('supervisor', c.supervisor);
    if (c.schedstartFrom) p = p.set('schedstartFrom', c.schedstartFrom);
    if (c.schedfinishTo)  p = p.set('schedfinishTo', c.schedfinishTo);
    if (c.reportdateFrom) p = p.set('reportdateFrom', c.reportdateFrom);
    if (c.reportdateTo)   p = p.set('reportdateTo', c.reportdateTo);
    if (c.descriptionContains)     p = p.set('descriptionContains', c.descriptionContains);
    if (c.longDescriptionContains) p = p.set('longDescriptionContains', c.longDescriptionContains);
    if (c.wonumContains)           p = p.set('wonumContains', c.wonumContains);
    if (c.siteid)                  p = p.set('siteid', c.siteid);
    return this.http
      .get<SpringApiResponse<MaximoWorkOrder[]>>(`${this.base}/work-orders`, { params: p })
      .pipe(map(r => r.responseData ?? []));
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

  /** Report labor + worklog and (by default) change status to COMP. Returns the refreshed WO. */
  completeWorkOrder(href: string, body: CompleteWorkOrderRequest): Observable<MaximoWorkOrder | null> {
    return this.http
      .post<SpringApiResponse<MaximoWorkOrder>>(
        `${this.base}/work-orders/${encodeURIComponent(href)}/complete`, body)
      .pipe(map(r => r.responseData ?? null));
  }

  /** Actual material rows (issues + returns) on a WO. */
  listWoMaterials(href: string): Observable<MaximoMaterialTxn[]> {
    return this.http
      .get<SpringApiResponse<MaximoMaterialTxn[]>>(
        `${this.base}/work-orders/${encodeURIComponent(href)}/materials`)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Return material to inventory (issuetype RETURN). Returns the refreshed material rows. */
  returnMaterial(href: string, body: ReturnMaterialRequest): Observable<MaximoMaterialTxn[]> {
    return this.http
      .post<SpringApiResponse<MaximoMaterialTxn[]>>(
        `${this.base}/work-orders/${encodeURIComponent(href)}/return-material`, body)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Issue additional material on an existing WO (issuetype ISSUE). Returns the refreshed material rows. */
  issueMaterial(href: string, body: IssueMaterialRequest): Observable<MaximoMaterialTxn[]> {
    return this.http
      .post<SpringApiResponse<MaximoMaterialTxn[]>>(
        `${this.base}/work-orders/${encodeURIComponent(href)}/issue-material`, body)
      .pipe(map(r => r.responseData ?? []));
  }

  // ── Parts checkout ────────────────────────────────────────────────────────

  searchLocations(q: string, pageSize = 25): Observable<MaximoLocation[]> {
    let p = new HttpParams().set('pageSize', String(pageSize));
    if (q) p = p.set('q', q);
    return this.http
      .get<SpringApiResponse<MaximoLocation[]>>(`${this.base}/locations`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  getWorkTypes(): Observable<MaximoWorkType[]> {
    return this.http
      .get<SpringApiResponse<MaximoWorkType[]>>(`${this.base}/work-types`)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Active plant people with a Maximo personid — for the labor dropdown. */
  getLaborPeople(): Observable<{ name: string; personid: string }[]> {
    return this.http
      .get<SpringApiResponse<{ name: string; personid: string }[]>>(`${this.base}/labor-people`)
      .pipe(map(r => r.responseData ?? []));
  }

  searchInventory(q: string, pageSize = 25): Observable<MaximoInventoryItem[]> {
    let p = new HttpParams().set('pageSize', String(pageSize));
    if (q) p = p.set('q', q);
    return this.http
      .get<SpringApiResponse<MaximoInventoryItem[]>>(`${this.base}/inventory`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  /** Create WO → approve → issue materials → complete, in one server call. */
  checkoutParts(body: PartsCheckoutRequest): Observable<PartsCheckoutResult | null> {
    return this.http
      .post<SpringApiResponse<PartsCheckoutResult>>(`${this.base}/parts-checkout`, body)
      .pipe(map(r => r.responseData ?? null));
  }

  listWorklog(parent: MaximoTicketParent, href: string): Observable<MaximoWorklog[]> {
    return this.http
      .get<SpringApiResponse<MaximoWorklog[]>>(
        `${this.base}/${parent}/${encodeURIComponent(href)}/worklog`)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Add a worklog note to a WO (works on a completed WO). Returns the refreshed worklog list. */
  addWoWorklog(href: string, body: { summary: string; details?: string; logtype?: string }): Observable<MaximoWorklog[]> {
    return this.http
      .post<SpringApiResponse<MaximoWorklog[]>>(
        `${this.base}/work-orders/${encodeURIComponent(href)}/worklog`, body)
      .pipe(map(r => r.responseData ?? []));
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
    // Don't ALSO set doctype as a query param — Spring's @RequestParam binding then sees both
    // (form field + query string), joins them as "Attachments,Attachments", and Maximo errors
    // on the 16-char DOCTYPE limit. Form field alone is sufficient.
    return this.http
      .post<SpringApiResponse<MaximoDoclink>>(
        `${this.base}/${parent}/${encodeURIComponent(href)}/attachments`, fd)
      .pipe(map(r => r.responseData));
  }
}
