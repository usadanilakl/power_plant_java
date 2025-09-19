import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringPaginatedResponse } from "../../models/api/spring-pagenated.response.model";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { WorkRequestDto } from "../../models/permits/work-request.model";

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
      return this.http.post<SpringApiResponse<WorkRequestDto[]>>(this.apiUrl, workRequests);
  }
}