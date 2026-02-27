
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { EnergizedWorkPermitDto } from "../../models/permits/energized-work-permit.model";

@Injectable({
  providedIn: 'root'
})
export class EnergizedWorkPermitService {
  private apiUrl = `${environment.apiUrl}/energized-work-permits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<EnergizedWorkPermitDto[]>> {
    return this.http.get<SpringApiResponse<EnergizedWorkPermitDto[]>>(`${this.apiUrl}/get-all`);
  }

  getById(id: string): Observable<SpringApiResponse<EnergizedWorkPermitDto>> {
    return this.http.get<SpringApiResponse<EnergizedWorkPermitDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }

  create(dto: EnergizedWorkPermitDto): Observable<SpringApiResponse<EnergizedWorkPermitDto>> {
    return this.http.post<SpringApiResponse<EnergizedWorkPermitDto>>(this.apiUrl, dto);
  }

  save(permits: EnergizedWorkPermitDto[]): Observable<SpringApiResponse<EnergizedWorkPermitDto[]>> {
    return this.http.post<SpringApiResponse<EnergizedWorkPermitDto[]>>(this.apiUrl + "/save-all", permits);
  }
}
