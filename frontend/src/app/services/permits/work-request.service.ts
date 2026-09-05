import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringPaginatedResponse } from "../../models/api/spring-pagenated.response.model";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { WorkRequestDto } from "../../models/permits/work-request.model";
import { normalizePermitPayload, normalizePermitPayloads } from '../../utils/permit-payload.util';

@Injectable({
  providedIn: 'root'
})
export class WorkRequestService {
    private apiUrl = `${environment.apiUrl}/work-requests`;

  constructor(private http: HttpClient) {}

  getWorkRequestsByStatus(status: string): Observable<SpringApiResponse<WorkRequestDto[]>> {
    return this.http.get<SpringApiResponse<WorkRequestDto[]>>(`${this.apiUrl}/get-all-by-status/${status}`);
  }
  getWorkRequestById(id: string): Observable<SpringApiResponse<WorkRequestDto>> {
      return this.http.get<SpringApiResponse<WorkRequestDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }
  save(workRequests: WorkRequestDto[]): Observable<SpringApiResponse<WorkRequestDto[]>> {
      return this.http.post<SpringApiResponse<WorkRequestDto[]>>(this.apiUrl, normalizePermitPayloads(workRequests));
  }

  /**
   * Records what the operator decided this request's areas / equipment / scope really are.
   * Every permit generated from it — now or later — uses these instead of what was submitted.
   *
   * <p>Its own endpoint rather than the general update: that one pushes to SharePoint, and this
   * is a local processing decision about a request SharePoint already holds. A blank string
   * clears one field back to the requester's value; an omitted one is left alone.
   */
  setOperatorOverride(
    id: number,
    override: {
      operatorWorkAreas?: WorkRequestDto['operatorWorkAreas'];
      operatorAffectedEquipment?: string | null;
      operatorWorkScope?: string | null;
    }
  ): Observable<SpringApiResponse<WorkRequestDto>> {
    return this.http.put<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/${id}/operator-override`, override);
  }

  /** Drops the override, so permits fall back to the submitted values. */
  clearOperatorOverride(id: number): Observable<SpringApiResponse<WorkRequestDto>> {
    return this.http.delete<SpringApiResponse<WorkRequestDto>>(
      `${this.apiUrl}/${id}/operator-override`);
  }
}