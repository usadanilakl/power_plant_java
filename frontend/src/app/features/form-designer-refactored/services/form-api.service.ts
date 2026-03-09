import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import { PrintableFormDto } from '../models/printable-form.model';
import { FormContainerDto } from '../models/form-container.model';

@Injectable({ providedIn: 'root' })
export class FormApiService {
  private formsUrl = `${environment.apiUrl}/forms`;
  private containersUrl = `${environment.apiUrl}/form-containers`;

  constructor(private http: HttpClient) {}

  // --- Form endpoints ---

  getAllForms(): Observable<SpringApiResponse<PrintableFormDto[]>> {
    return this.http.get<SpringApiResponse<PrintableFormDto[]>>(`${this.formsUrl}/get-all`);
  }

  getFormById(id: number): Observable<SpringApiResponse<PrintableFormDto>> {
    return this.http.get<SpringApiResponse<PrintableFormDto>>(`${this.formsUrl}/get-by-id/${id}`);
  }

  saveForm(form: PrintableFormDto): Observable<SpringApiResponse<PrintableFormDto>> {
    return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.formsUrl}/save`, form);
  }

  addContainerToForm(formId: number, containerId: number): Observable<SpringApiResponse<PrintableFormDto>> {
    return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.formsUrl}/add/${containerId}/to/${formId}`, {});
  }

  addAllContainers(formId: number, containers: FormContainerDto[]): Observable<SpringApiResponse<PrintableFormDto>> {
    return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.formsUrl}/add-all/${formId}`, containers);
  }

  copyForm(formId: number): Observable<SpringApiResponse<PrintableFormDto>> {
    return this.http.post<SpringApiResponse<PrintableFormDto>>(`${this.formsUrl}/copy/${formId}`, {});
  }

  deleteForm(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.formsUrl}/${id}`);
  }

  getPrimaryFormByType(
    permitType: 'SafeWork' | 'HotWork' | 'ConfinedSpace' | 'Loto' | 'Jha' | 'JobStep' | 'WorkRequest'
  ): Observable<SpringApiResponse<PrintableFormDto>> {
    return this.http.get<SpringApiResponse<PrintableFormDto>>(`${this.formsUrl}/get-primary-form-by-type/${permitType}`);
  }

  // --- Container endpoints ---

  getAllContainers(): Observable<SpringApiResponse<FormContainerDto[]>> {
    return this.http.get<SpringApiResponse<FormContainerDto[]>>(`${this.containersUrl}/get-all`);
  }

  getContainerById(id: number): Observable<SpringApiResponse<FormContainerDto>> {
    return this.http.get<SpringApiResponse<FormContainerDto>>(`${this.containersUrl}/get-by-id/${id}`);
  }

  saveContainer(container: FormContainerDto): Observable<SpringApiResponse<FormContainerDto>> {
    return this.http.post<SpringApiResponse<FormContainerDto>>(`${this.containersUrl}/save`, container);
  }

  saveAllContainers(containers: FormContainerDto[]): Observable<SpringApiResponse<FormContainerDto[]>> {
    return this.http.post<SpringApiResponse<FormContainerDto[]>>(`${this.containersUrl}/save-all`, containers);
  }

  deleteContainer(id: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.containersUrl}/${id}`);
  }

  deleteAllContainers(ids: number[]): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(`${this.containersUrl}/delete-all`, ids);
  }
}
