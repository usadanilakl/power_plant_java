import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import {
  LinkedFile,
  NodeWriteRequest,
  PhysicalObjectMaximoTab,
  PhysicalObjectNode,
  PhysicalObjectSeedResult,
  SystemRef,
  TagMatchProbe,
  WorkAreaOption,
  WorkAreaRef,
} from '../../models/physical/physical-object.models';
import { DiagramDto } from '../../features/diagram-builder/models/diagram.model';

/**
 * Read/seed API for the PhysicalObject hierarchy. Tree/node browsing hits the ungated
 * {@code /ng/physical-object/*}; the Maximo-dependent reseed + per-node WO/SR tab hit the gated
 * {@code /ng/maximo/physical-object/*}.
 */
@Injectable({ providedIn: 'root' })
export class PhysicalObjectApiService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/physical-object`;
  private maximoBase = `${environment.baseApiUrl}/ng/maximo/physical-object`;

  /** Whole hierarchy as a flat list (id + parentId + hasChildren); assemble the tree client-side. */
  getTree(): Observable<PhysicalObjectNode[]> {
    return this.http
      .get<SpringApiResponse<PhysicalObjectNode[]>>(`${this.base}/tree`)
      .pipe(map(r => r.responseData ?? []));
  }

  getNode(id: number): Observable<PhysicalObjectNode | null> {
    return this.http
      .get<SpringApiResponse<PhysicalObjectNode>>(`${this.base}/${id}`)
      .pipe(map(r => r.responseData ?? null));
  }

  getChildren(id: number): Observable<PhysicalObjectNode[]> {
    return this.http
      .get<SpringApiResponse<PhysicalObjectNode[]>>(`${this.base}/${id}/children`)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Ancestor chain root→node for the breadcrumb. */
  getBreadcrumb(id: number): Observable<PhysicalObjectNode[]> {
    return this.http
      .get<SpringApiResponse<PhysicalObjectNode[]>>(`${this.base}/${id}/breadcrumb`)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Children ordered by floorIndex — the level/floor selector. */
  getLevels(id: number): Observable<PhysicalObjectNode[]> {
    return this.http
      .get<SpringApiResponse<PhysicalObjectNode[]>>(`${this.base}/${id}/levels`)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Get-or-create the node's blank schematic Diagram (its canvas). Idempotent. */
  getOrCreateDiagram(id: number): Observable<DiagramDto | null> {
    return this.http
      .get<SpringApiResponse<DiagramDto>>(`${this.base}/${id}/diagram`)
      .pipe(map(r => r.responseData ?? null));
  }

  // ── builder writes (local-owned nodes) ──
  createNode(body: NodeWriteRequest): Observable<PhysicalObjectNode | null> {
    return this.http
      .post<SpringApiResponse<PhysicalObjectNode>>(`${this.base}`, body)
      .pipe(map(r => r.responseData ?? null));
  }

  updateNode(id: number, body: NodeWriteRequest): Observable<PhysicalObjectNode | null> {
    return this.http
      .put<SpringApiResponse<PhysicalObjectNode>>(`${this.base}/${id}`, body)
      .pipe(map(r => r.responseData ?? null));
  }

  deleteNode(id: number): Observable<void> {
    return this.http
      .delete<SpringApiResponse<void>>(`${this.base}/${id}`)
      .pipe(map(() => undefined));
  }

  // ── binder: linked files (Documents) ──
  getNodeFiles(id: number): Observable<LinkedFile[]> {
    return this.http
      .get<SpringApiResponse<LinkedFile[]>>(`${this.base}/${id}/files`)
      .pipe(map(r => r.responseData ?? []));
  }

  linkFile(id: number, fileId: number): Observable<void> {
    return this.http
      .post<SpringApiResponse<void>>(`${this.base}/${id}/files/${fileId}`, null)
      .pipe(map(() => undefined));
  }

  unlinkFile(id: number, fileId: number): Observable<void> {
    return this.http
      .delete<SpringApiResponse<void>>(`${this.base}/${id}/files/${fileId}`)
      .pipe(map(() => undefined));
  }

  // ── binder: system membership (the map's cross-cutting layers) ──
  /** System-membership map for a node's children: childId → [systemValueId,…] (for the layer overlay).
   *  JSON object keys are strings — the state service Number()-coerces them into a Map<number,…>. */
  getChildSystems(id: number): Observable<Record<string, number[]>> {
    return this.http
      .get<SpringApiResponse<Record<string, number[]>>>(`${this.base}/${id}/child-systems`)
      .pipe(map(r => r.responseData ?? {}));
  }

  /** One object's OWN System membership (Value ids) — seeds the toggle base for pipes/fittings, which as
   *  grandchildren aren't covered by the canvas node's child-systems map. */
  getObjectSystems(id: number): Observable<SystemRef[]> {
    return this.http
      .get<SpringApiResponse<SystemRef[]>>(`${this.base}/${id}/systems`)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Replace an object's System membership (by Value id). Returns the resulting systems. */
  setObjectSystems(id: number, systemIds: number[]): Observable<SystemRef[]> {
    return this.http
      .put<SpringApiResponse<SystemRef[]>>(`${this.base}/${id}/systems`, { systemIds })
      .pipe(map(r => r.responseData ?? []));
  }

  // ── binder: work areas (permit safety profiles anchored to a node) ──
  /** Work areas bound to this node (safety-profile summaries). */
  getNodeWorkAreas(id: number): Observable<WorkAreaRef[]> {
    return this.http
      .get<SpringApiResponse<WorkAreaRef[]>>(`${this.base}/${id}/work-areas`)
      .pipe(map(r => r.responseData ?? []));
  }

  /** childId → work-area count for a node's children (the map's safety badge). */
  getChildWorkAreas(id: number): Observable<Record<string, number>> {
    return this.http
      .get<SpringApiResponse<Record<string, number>>>(`${this.base}/${id}/child-work-areas`)
      .pipe(map(r => r.responseData ?? {}));
  }

  linkWorkArea(id: number, workAreaId: number): Observable<void> {
    return this.http
      .post<SpringApiResponse<void>>(`${this.base}/${id}/work-areas/${workAreaId}`, null)
      .pipe(map(() => undefined));
  }

  unlinkWorkArea(id: number, workAreaId: number): Observable<void> {
    return this.http
      .delete<SpringApiResponse<void>>(`${this.base}/${id}/work-areas/${workAreaId}`)
      .pipe(map(() => undefined));
  }

  /** All work areas (for the link picker). */
  getAllWorkAreas(): Observable<WorkAreaOption[]> {
    return this.http
      .get<SpringApiResponse<WorkAreaOption[]>>(`${environment.baseApiUrl}/ng/work-areas/get-all`)
      .pipe(map(r => r.responseData ?? []));
  }

  // ── Maximo link (tie a local node into a Maximo asset/location) ──
  linkMaximo(id: number, req: { assetnum?: string; location?: string; siteid?: string; maximoType?: string }): Observable<PhysicalObjectNode | null> {
    return this.http
      .put<SpringApiResponse<PhysicalObjectNode>>(`${this.base}/${id}/maximo-link`, req)
      .pipe(map(r => r.responseData ?? null));
  }

  unlinkMaximo(id: number): Observable<PhysicalObjectNode | null> {
    return this.http
      .delete<SpringApiResponse<PhysicalObjectNode>>(`${this.base}/${id}/maximo-link`)
      .pipe(map(r => r.responseData ?? null));
  }

  /** The node's Maximo tab: work orders + service requests for its asset/location link. */
  getMaximoTab(id: number): Observable<PhysicalObjectMaximoTab | null> {
    return this.http
      .get<SpringApiResponse<PhysicalObjectMaximoTab>>(`${this.maximoBase}/${id}`)
      .pipe(map(r => r.responseData ?? null));
  }

  /** How well local LotoPoint/Equipment tags line up with seeded Maximo assets (local-only, run after a reseed). */
  tagMatchProbe(): Observable<TagMatchProbe | null> {
    return this.http
      .get<SpringApiResponse<TagMatchProbe>>(`${this.base}/probe/tag-match`)
      .pipe(map(r => r.responseData ?? null));
  }

  /** Seed/refresh the tree from Maximo (idempotent). Returns per-run counts. */
  reseed(siteid?: string): Observable<PhysicalObjectSeedResult | null> {
    let p = new HttpParams();
    if (siteid) p = p.set('siteid', siteid);
    return this.http
      .post<SpringApiResponse<PhysicalObjectSeedResult>>(`${this.maximoBase}/reseed`, null, { params: p })
      .pipe(map(r => r.responseData ?? null));
  }
}
