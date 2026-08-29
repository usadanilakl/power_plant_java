import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';

/** A/B are route endpoints; T:<stable id> is a branch point on the pipe body. */
export type TopologyPipeEnd = 'A' | 'B' | `T:${string}`;
export type PlantMapConnectionKind = 'EQUIPMENT_PORT' | 'PIPE_JUNCTION' | 'CONTINUATION';

export interface PlantMapTopologyTerminal {
  pipeNodeId: number;
  end: TopologyPipeEnd;
  sectionId: number;
}

export interface PlantMapTopologyConnection {
  id?: number;
  connectionKey: string;
  kind: PlantMapConnectionKind;
  equipmentObjectId?: number;
  equipmentPortId?: string;
  terminals: PlantMapTopologyTerminal[];
}

export interface PlantMapTopologyAttachRequest {
  terminal: PlantMapTopologyTerminal;
  targetTerminal?: PlantMapTopologyTerminal;
  equipmentPort?: { objectId: number; portId: string };
  connectionKey?: string;
  kind?: PlantMapConnectionKind;
  /** Explicit body-junction joins merge every participant instead of moving one terminal out of its old junction. */
  mergeJunctions?: boolean;
}

export interface PlantMapTopologyAudit {
  scannedConnections: number;
  removedTerminals: number;
  deletedConnections: number;
  deletedOrphanPipePlacements: number;
}

@Injectable({ providedIn: 'root' })
export class PlantMapTopologyApiService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/plant-map-topology`;

  getAll(): Observable<SpringApiResponse<PlantMapTopologyConnection[]>> {
    return this.http.get<SpringApiResponse<PlantMapTopologyConnection[]>>(this.baseUrl);
  }

  attach(request: PlantMapTopologyAttachRequest): Observable<SpringApiResponse<PlantMapTopologyConnection>> {
    return this.http.post<SpringApiResponse<PlantMapTopologyConnection>>(`${this.baseUrl}/attach`, request);
  }

  detach(terminal: PlantMapTopologyTerminal): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(`${this.baseUrl}/detach`, terminal);
  }

  disconnect(connectionKey: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(
      `${this.baseUrl}/connection/${encodeURIComponent(connectionKey)}`,
    );
  }

  deleteEquipmentPort(objectId: number, portId: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(
      `${this.baseUrl}/equipment/${objectId}/${encodeURIComponent(portId)}`,
    );
  }

  deletePipe(pipeNodeId: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.baseUrl}/pipe/${pipeNodeId}`);
  }

  auditOrphans(): Observable<SpringApiResponse<PlantMapTopologyAudit>> {
    return this.http.post<SpringApiResponse<PlantMapTopologyAudit>>(`${this.baseUrl}/audit-orphans`, {});
  }
}
