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
  TagMatchProbe,
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
