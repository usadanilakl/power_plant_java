import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { SafeWorkDto } from "../../models/permits/safe-work.model";

@Injectable({
  providedIn: 'root'
})
export class SafeWorkService {
    private apiUrl = `${environment.apiUrl}/safe-works`;

  constructor(private http: HttpClient) {}

  getSafeWorkRequests(): Observable<SpringApiResponse<SafeWorkDto[]>> {
    return this.http.get<SpringApiResponse<SafeWorkDto[]>>(`${this.apiUrl}/get-all-safe-work`);
  }

  getSafeWorkRequestById(id: string): Observable<SpringApiResponse<SafeWorkDto>> {
    return this.http.get<SpringApiResponse<SafeWorkDto>>(`${this.apiUrl}/get-safe-work-by-id/${id}`);
  }

  createSafeWork(safeWork: SafeWorkDto): Observable<SpringApiResponse<SafeWorkDto>> {
    return this.http.post<SpringApiResponse<SafeWorkDto>>(this.apiUrl, safeWork);
  }
}