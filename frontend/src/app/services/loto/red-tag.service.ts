import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { LotoPointDto } from "../../models/loto/loto-point.model";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";

@Injectable({
  providedIn: 'root'
})
export class RedTagService{
    private apiUrl = `${environment.apiUrl}/red-tag`;
    constructor(private http: HttpClient) {}

    simpleBuild(lotoPoints: LotoPointDto[]): Observable<SpringApiResponse<string>> {
        return this.http.post<SpringApiResponse<string>>(`${this.apiUrl}/simple-build`, lotoPoints);
    }
}