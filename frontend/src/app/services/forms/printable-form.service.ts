import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import { HttpClient } from "@angular/common/http";
import { PrintableFormDto } from "../../models/forms/printable-form.model";
import { Observable } from "rxjs";
import { SpringApiResponse } from "../../models/api/spring-api-response.model";
import { FormContainerDto } from "../../models/forms/form-container.model";

@Injectable({
  providedIn: 'root'
})
export class PrintableFormService {
  private apiUrl = `${environment.apiUrl}/forms`;

  constructor(private http: HttpClient) {}
  
    getAll(): Observable<SpringApiResponse<PrintableFormDto[]>> {
      return this.http.get<SpringApiResponse<PrintableFormDto[]>>(`${this.apiUrl}/get-all`);
    }
  
    getById(id: number): Observable<SpringApiResponse<PrintableFormDto>> {
      return this.http.get<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/get-by-id/${id}`);
    }
    save(form: PrintableFormDto): Observable<SpringApiResponse<PrintableFormDto>> {
      return this.http.post<SpringApiResponse<PrintableFormDto>>(this.apiUrl+"/save", form);
    }
    addContainerToForm(formId: number, containerId: number): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/add/${containerId}/to/${formId}`,{});
    }
    addAllContainers(id: number, containers: FormContainerDto[]): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/add-all/${id}`, containers);
    }
    copyForm(formId: number): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/copy/${formId}`, {});
    }
    getPrimaryFormByType(permitType: 'SafeWork' | 'HotWork' | 'ConfinedSpace' | 'Loto' | 'Jha'): Observable<SpringApiResponse<PrintableFormDto>> {
        return this.http.get<SpringApiResponse<PrintableFormDto>>(`${this.apiUrl}/get-primary-form-by-type/${permitType}`);
    }
}