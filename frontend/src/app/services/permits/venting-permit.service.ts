
import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { VentingPermitDto } from "../../models/permits/venting-permit.model";
import { normalizePermitPayload, normalizePermitPayloads } from '../../utils/permit-payload.util';

@Injectable({
  providedIn: 'root'
})
export class VentingPermitService {
  private apiUrl = `${environment.apiUrl}/venting-permits`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<VentingPermitDto[]>> {
    return this.http.get<SpringApiResponse<VentingPermitDto[]>>(`${this.apiUrl}/get-all`);
  }

  getById(id: string): Observable<SpringApiResponse<VentingPermitDto>> {
    return this.http.get<SpringApiResponse<VentingPermitDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }

  create(dto: VentingPermitDto): Observable<SpringApiResponse<VentingPermitDto>> {
    return this.http.post<SpringApiResponse<VentingPermitDto>>(this.apiUrl, normalizePermitPayload(dto));
  }

  save(permits: VentingPermitDto[]): Observable<SpringApiResponse<VentingPermitDto[]>> {
    return this.http.post<SpringApiResponse<VentingPermitDto[]>>(this.apiUrl + "/save-all", normalizePermitPayloads(permits));
  }
}
