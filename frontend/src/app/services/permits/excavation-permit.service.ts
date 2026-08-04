
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { ExcavationPermitDto } from "../../models/permits/excavation-permit.model";
import { normalizePermitPayload, normalizePermitPayloads } from '../../utils/permit-payload.util';

@Injectable({
  providedIn: 'root'
})
export class ExcavationPermitService {
  private apiUrl = `${environment.apiUrl}/excavation-permits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<ExcavationPermitDto[]>> {
    return this.http.get<SpringApiResponse<ExcavationPermitDto[]>>(`${this.apiUrl}/get-all`);
  }

  getById(id: string): Observable<SpringApiResponse<ExcavationPermitDto>> {
    return this.http.get<SpringApiResponse<ExcavationPermitDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }

  create(dto: ExcavationPermitDto): Observable<SpringApiResponse<ExcavationPermitDto>> {
    return this.http.post<SpringApiResponse<ExcavationPermitDto>>(this.apiUrl, normalizePermitPayload(dto));
  }

  save(permits: ExcavationPermitDto[]): Observable<SpringApiResponse<ExcavationPermitDto[]>> {
    return this.http.post<SpringApiResponse<ExcavationPermitDto[]>>(this.apiUrl + "/save-all", normalizePermitPayloads(permits));
  }
}
