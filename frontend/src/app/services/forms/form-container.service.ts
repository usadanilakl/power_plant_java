import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { FormContainerDto } from "../../models/forms/form-container.model";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class FormContainerService {
  private apiUrl = `${environment.apiUrl}/form-containers`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<FormContainerDto[]>> {
    return this.http.get<SpringApiResponse<FormContainerDto[]>>(`${this.apiUrl}/get-all`);
  }

  getById(id: number): Observable<SpringApiResponse<FormContainerDto>> {
    return this.http.get<SpringApiResponse<FormContainerDto>>(`${this.apiUrl}/get-by-id/${id}`);
  }
  save(formContainer: FormContainerDto): Observable<SpringApiResponse<FormContainerDto>> {
    return this.http.post<SpringApiResponse<FormContainerDto>>(this.apiUrl+"/save", formContainer);
  }
  saveAll(containers: FormContainerDto[]): Observable<SpringApiResponse<FormContainerDto[]>> {
      return this.http.post<SpringApiResponse<FormContainerDto[]>>(this.apiUrl+"/save-all", containers);
  }
  delete(id: number): Observable<SpringApiResponse<void>> {
      return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}