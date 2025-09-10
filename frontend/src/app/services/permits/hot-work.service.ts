
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { HotWorkDto } from "../../models/permits/hot-work.model";

@Injectable({
  providedIn: 'root'
})
export class HotWorkService {
  private apiUrl = `${environment.apiUrl}/hot-works`;

  constructor(private http: HttpClient) {}

  getHotWorkRequests(): Observable<SpringApiResponse<HotWorkDto[]>> {
    return this.http.get<SpringApiResponse<HotWorkDto[]>>(`${this.apiUrl}/get-all-hot-work`);
  }

  getHotWorkRequestById(id: string): Observable<SpringApiResponse<HotWorkDto>> {
    return this.http.get<SpringApiResponse<HotWorkDto>>(`${this.apiUrl}/get-hot-work-by-id/${id}`);
  }

  createHotWorkRequest(hotWork: HotWorkDto): Observable<SpringApiResponse<HotWorkDto>> {
    return this.http.post<SpringApiResponse<HotWorkDto>>(this.apiUrl, hotWork);
  }

  updateHotWorkRequest(id: string, hotWork: HotWorkDto): Observable<SpringApiResponse<HotWorkDto>> {
    return this.http.put<SpringApiResponse<HotWorkDto>>(`${this.apiUrl}/${id}`, hotWork);
  }

  deleteHotWorkRequest(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}