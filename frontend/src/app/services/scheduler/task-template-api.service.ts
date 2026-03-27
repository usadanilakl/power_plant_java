import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SpringApiResponse} from '../../models/api/spring-api-response.model';

@Injectable({providedIn: 'root'})
export class TaskTemplateApiService {
  private apiUrl = `${environment.apiUrl}/scheduler/task-templates`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(this.apiUrl);
  }

  getById(id: number): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  create(template: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(this.apiUrl, template);
  }

  update(id: number, template: any): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(`${this.apiUrl}/${id}`, template);
  }

  delete(id: number): Observable<SpringApiResponse<any>> {
    return this.http.delete<SpringApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  instantiate(templateId: number, flowId: number): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(`${this.apiUrl}/${templateId}/instantiate`, {flowId});
  }
}
