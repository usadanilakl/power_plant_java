
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { ConfinedSpaceDto } from "../../models/permits/confined-space.model";
import { normalizePermitPayload, normalizePermitPayloads } from '../../utils/permit-payload.util';

@Injectable({
  providedIn: 'root'
})
export class ConfinedSpaceService {
  private apiUrl = `${environment.apiUrl}/confined-spaces`;

  constructor(private http: HttpClient) {}

  getConfinedSpaceRequests(): Observable<SpringApiResponse<ConfinedSpaceDto[]>> {
    return this.http.get<SpringApiResponse<ConfinedSpaceDto[]>>(`${this.apiUrl}/get-all-confined-space`);
  }

  getConfinedSpaceRequestById(id: string): Observable<SpringApiResponse<ConfinedSpaceDto>> {
    return this.http.get<SpringApiResponse<ConfinedSpaceDto>>(`${this.apiUrl}/get-confined-space-by-id/${id}`);
  }

  createConfinedSpaceRequest(confinedSpace: ConfinedSpaceDto): Observable<SpringApiResponse<ConfinedSpaceDto>> {
    return this.http.post<SpringApiResponse<ConfinedSpaceDto>>(this.apiUrl, normalizePermitPayload(confinedSpace));
  }

  updateConfinedSpaceRequest(id: string, confinedSpace: ConfinedSpaceDto): Observable<SpringApiResponse<ConfinedSpaceDto>> {
    return this.http.put<SpringApiResponse<ConfinedSpaceDto>>(`${this.apiUrl}/${id}`, normalizePermitPayload(confinedSpace));
  }

  deleteConfinedSpaceRequest(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
  save(requests: ConfinedSpaceDto[]) {
    return this.http.post<SpringApiResponse<ConfinedSpaceDto[]>>(`${this.apiUrl}/save-all`, normalizePermitPayloads(requests));
  }
}