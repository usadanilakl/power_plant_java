import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SpringApiResponse} from '../../models/api/spring-api-response.model';

@Injectable({providedIn: 'root'})
export class TaskApiService {
  private apiUrl = `${environment.apiUrl}/scheduler/tasks`;

  constructor(private http: HttpClient) {}

  getByFlow(flowId: number): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(`${this.apiUrl}/by-flow/${flowId}`);
  }

  getById(id: number): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  create(task: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(this.apiUrl, task);
  }

  update(id: number, task: any): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(`${this.apiUrl}/${id}`, task);
  }

  delete(id: number): Observable<SpringApiResponse<any>> {
    return this.http.delete<SpringApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  updatePrerequisites(taskId: number, prerequisiteIds: number[]): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(`${this.apiUrl}/${taskId}/prerequisites`, prerequisiteIds);
  }
}
