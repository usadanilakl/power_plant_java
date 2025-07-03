import { Injectable } from "@angular/core";
import { environment } from "../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../models/api/spring-api-response.model";

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  private apiUrl = `${environment.apiUrl}/excel`;

  constructor(private http: HttpClient) {}

  exportAll(): Observable<SpringApiResponse<string>> {
    return this.http.get<SpringApiResponse<string>>(`${this.apiUrl}/export-all`);
  }
}