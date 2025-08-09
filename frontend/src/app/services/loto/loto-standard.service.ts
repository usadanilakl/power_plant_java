import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { LotoStandardDto } from "../../models/loto/loto-standard.model";
import { LotoStandardIdDto } from "../../models/loto/loto-standard-id.model";

@Injectable({
  providedIn: 'root'
})
export class LotoStandardService {
    private apiUrl = `${environment.apiUrl}/loto-standard`;

    constructor(private http: HttpClient) {}

    createLotoStandard(standard: LotoStandardDto): Observable<SpringApiResponse<LotoStandardDto>> {
        return this.http.post<SpringApiResponse<LotoStandardDto>>(`${this.apiUrl}/create-standard`, {...standard.toIdDto()});
    }

    getAllLotoStandards(): Observable<SpringApiResponse<LotoStandardDto[]>> {
        return this.http.get<SpringApiResponse<LotoStandardDto[]>>(`${this.apiUrl}/get-all`);
    }

    getLotoStandardById(lotoStandardId: number) {
        return this.http.get<SpringApiResponse<LotoStandardDto>>(`${this.apiUrl}/${lotoStandardId}`);
    }
}