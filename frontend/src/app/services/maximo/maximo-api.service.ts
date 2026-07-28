import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import {
  CompleteWorkOrderRequest,
  CreateMaximoServiceRequest,
  MaximoAsset,
  MaximoAttachmentParent,
  MaximoDoclink,
  MaximoInventoryCatalogStatus,
  MaximoInventoryItem,
  MaximoInventoryStock,
  MaximoInventoryUsage,
  MaximoLocation,
  MaximoMaterialTxn,
  MaximoServiceRequest,
  MaximoServiceRequestCriteria,
  MaximoOverview,
  MaximoTicketAsset,
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

  searchAssets(params: { tag?: string; siteid?: string; status?: string; location?: string; pageSize?: number }): Observable<MaximoAsset[]> {
    let p = new HttpParams();
    if (params.tag) p = p.set('tag', params.tag);
    if (params.siteid) p = p.set('siteid', params.siteid);
    if (params.status) p = p.set('status', params.status);
    if (params.location) p = p.set('location', params.location);
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
    if (c.textContains)             p = p.set('textContains', c.textContains);
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

  /** Edit an editable SR's fields (blank = leave unchanged). Returns the refreshed SR. */
  updateServiceRequest(href: string, body: {
    description?: string; longDescription?: string; priority?: string; reportedby?: string;
    assetnum?: string; location?: string; classstructureid?: string; affectedperson?: string;
  }): Observable<MaximoServiceRequest> {
    return this.http
      .patch<SpringApiResponse<MaximoServiceRequest>>(`${this.base}/service-requests/${encodeURIComponent(href)}`, body)
      .pipe(map(r => r.responseData));
  }

  /** Add a note (worklog) to an editable SR. Returns the refreshed note list. */
  addSrWorklog(href: string, body: { summary: string; details?: string; logtype?: string }): Observable<MaximoWorklog[]> {
    return this.http
      .post<SpringApiResponse<MaximoWorklog[]>>(
        `${this.base}/service-requests/${encodeURIComponent(href)}/worklog`, body)
      .pipe(map(r => r.responseData ?? []));
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

  /**
   * Overview for a tracked people set — WOs bucketed by due status this ISO week (overdue / due this week /
   * completed this + last week / upcoming). {@code mode='leads'} tracks the Lead Operators; {@code mode='people'}
   * tracks the given personids. The status-filterable "All" list is served separately by {@link getPeopleWorkOrders}.
   */
  getOverview(mode: 'leads' | 'people' = 'leads', personids: string[] = []): Observable<MaximoOverview> {
    let p = new HttpParams().set('mode', mode).set('pageSize', '500');
    if (mode === 'people' && personids.length) p = p.set('personids', personids.join(','));
    return this.http
      .get<SpringApiResponse<MaximoOverview>>(`${this.base}/bundle/overview`, { params: p })
      .pipe(map(r => r.responseData));
  }

  /**
   * WOs for a tracked people set, optionally filtered to one status (blank = all statuses). Backs the
   * "All" tab, whose status filter defaults to APPR but can be changed or cleared.
   */
  getPeopleWorkOrders(mode: 'leads' | 'people' = 'leads', personids: string[] = [], status?: string): Observable<MaximoWorkOrder[]> {
    let p = new HttpParams().set('mode', mode).set('pageSize', '500');
    if (mode === 'people' && personids.length) p = p.set('personids', personids.join(','));
    if (status) p = p.set('status', status);
    return this.http
      .get<SpringApiResponse<MaximoWorkOrder[]>>(`${this.base}/bundle/people-work-orders`, { params: p })
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
    if (c.textContains)            p = p.set('textContains', c.textContains);
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

  // ── Ticket→asset index (find WOs/SRs by equipment tag) ─────────────────────
  /** Search the SR/WO index by (partial) equipment tag number. */
  searchTicketIndex(tag: string, limit = 50): Observable<MaximoTicketAsset[]> {
    const p = new HttpParams().set('tag', tag).set('limit', String(limit));
    return this.http
      .get<SpringApiResponse<MaximoTicketAsset[]>>(`${this.base}/ticket-index/search`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  /** One-time backfill of the index (hub-only; hits Maximo + syncs). Returns a summary map. */
  backfillTicketIndex(years = 5, dryRun = false): Observable<Record<string, any>> {
    const p = new HttpParams().set('years', String(years)).set('dryRun', String(dryRun));
    return this.http
      .post<SpringApiResponse<Record<string, any>>>(`${this.base}/ticket-index/backfill`, {}, { params: p })
      .pipe(map(r => r.responseData ?? {}));
  }

  /** Run the incremental index update now (tickets changed since the last run). */
  incrementalTicketIndex(dryRun = false): Observable<Record<string, any>> {
    const p = new HttpParams().set('dryRun', String(dryRun));
    return this.http
      .post<SpringApiResponse<Record<string, any>>>(`${this.base}/ticket-index/incremental`, {}, { params: p })
      .pipe(map(r => r.responseData ?? {}));
  }

  /**
   * The internal tasks of a work order (child WO rows with istask=true). Each is itself a work order,
   * so complete it with {@link completeWorkOrder} using the task's own href. Keyed by the PARENT wonum.
   */
  listWoTasks(parentWonum: string): Observable<MaximoWorkOrder[]> {
    return this.http
      .get<SpringApiResponse<MaximoWorkOrder[]>>(
        `${this.base}/work-orders/${encodeURIComponent(parentWonum)}/tasks`)
      .pipe(map(r => r.responseData ?? []));
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

  /**
   * The operating-location chain above a location, leaf first (site rung excluded). Assets carry no parent in
   * this Maximo, so this is the only way to reach "the thing one level up" from a too-specific asset.
   */
  getLocationAncestors(location: string, siteid?: string): Observable<MaximoLocation[]> {
    let p = new HttpParams().set('location', location);
    if (siteid) p = p.set('siteid', siteid);
    return this.http
      .get<SpringApiResponse<MaximoLocation[]>>(`${this.base}/location-ancestors`, { params: p })
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

  private laborPeople$?: Observable<{ name: string; personid: string }[]>;
  /** Cached labor-people (shared across all person pickers; one fetch per session). */
  getLaborPeopleCached(): Observable<{ name: string; personid: string }[]> {
    if (!this.laborPeople$) this.laborPeople$ = this.getLaborPeople().pipe(shareReplay(1));
    return this.laborPeople$;
  }

  searchInventory(q: string, pageSize = 25, storeroom?: string): Observable<MaximoInventoryItem[]> {
    let p = new HttpParams().set('pageSize', String(pageSize));
    if (q) p = p.set('q', q);
    if (storeroom) p = p.set('storeroom', storeroom);
    return this.http
      .get<SpringApiResponse<MaximoInventoryItem[]>>(`${this.base}/inventory`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  /** Warehouses (storerooms) that hold stock, for the inventory filter. */
  getStorerooms(): Observable<string[]> {
    return this.http
      .get<SpringApiResponse<string[]>>(`${this.base}/inventory/storerooms`)
      .pipe(map(r => r.responseData ?? []));
  }

  /**
   * Is the server's inventory catalog loaded? Until it is, an empty search means "still building", not
   * "no match". Calling this also asks the server to start building it.
   */
  getInventoryCatalogStatus(): Observable<MaximoInventoryCatalogStatus> {
    return this.http
      .get<SpringApiResponse<MaximoInventoryCatalogStatus>>(`${this.base}/inventory-catalog/status`)
      .pipe(map(r => r.responseData ?? { ready: false, building: false, rows: 0 }));
  }

  /** Full stock detail for one item at a warehouse (on-hand, reserved, reorder levels, cost, usage stats). */
  getInventoryItem(itemnum: string, storeroom?: string): Observable<MaximoInventoryStock | null> {
    let p = new HttpParams();
    if (storeroom) p = p.set('storeroom', storeroom);
    return this.http
      .get<SpringApiResponse<MaximoInventoryStock>>(`${this.base}/inventory/${encodeURIComponent(itemnum)}`, { params: p })
      .pipe(map(r => r.responseData ?? null));
  }

  /** Material-use history for one item at a warehouse (which WOs consumed it), newest first. */
  getInventoryUsage(itemnum: string, pageSize = 50, storeroom?: string): Observable<MaximoInventoryUsage[]> {
    let p = new HttpParams().set('pageSize', String(pageSize));
    if (storeroom) p = p.set('storeroom', storeroom);
    return this.http
      .get<SpringApiResponse<MaximoInventoryUsage[]>>(`${this.base}/inventory/${encodeURIComponent(itemnum)}/usage`, { params: p })
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

  /**
   * Transfer a WO's lead to another person — writes spi:lead (any personid) and adds an audit worklog note.
   * Does NOT change the WO status. Returns the refreshed WO.
   */
  transferLead(href: string, personid: string, memo?: string): Observable<MaximoWorkOrder | null> {
    return this.http
      .post<SpringApiResponse<MaximoWorkOrder>>(
        `${this.base}/work-orders/${encodeURIComponent(href)}/lead`, { personid, memo })
      .pipe(map(r => r.responseData ?? null));
  }

  /** Add a worklog note to a WO (works on a completed WO). Returns the refreshed worklog list. */
  addWoWorklog(href: string, body: { summary: string; details?: string; logtype?: string }): Observable<MaximoWorklog[]> {
    return this.http
      .post<SpringApiResponse<MaximoWorklog[]>>(
        `${this.base}/work-orders/${encodeURIComponent(href)}/worklog`, body)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Raw attachment bytes (cookie-auth via interceptor), for inline preview / client-side conversion. */
  getAttachmentContent(parent: MaximoAttachmentParent, href: string, doclinkHref: string): Observable<ArrayBuffer> {
    return this.http.get(
      `${this.base}/${parent}/${encodeURIComponent(href)}/attachments/${encodeURIComponent(doclinkHref)}/content`,
      { responseType: 'arraybuffer' });
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
