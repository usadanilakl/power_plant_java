import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {SpringApiResponse} from '../../models/api/spring-api-response.model';

@Injectable({providedIn: 'root'})
export class FlowApiService {
  private apiUrl = `${environment.apiUrl}/scheduler/flows`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<SpringApiResponse<any[]>> {
    return this.http.get<SpringApiResponse<any[]>>(this.apiUrl);
  }

  getById(id: number): Observable<SpringApiResponse<any>> {
    return this.http.get<SpringApiResponse<any>>(`${this.apiUrl}/${id}`);
  }

  create(flow: any): Observable<SpringApiResponse<any>> {
    return this.http.post<SpringApiResponse<any>>(this.apiUrl, flow);
  }

  update(id: number, flow: any): Observable<SpringApiResponse<any>> {
    return this.http.put<SpringApiResponse<any>>(`${this.apiUrl}/${id}`, flow);
  }

  delete(id: number): Observable<SpringApiResponse<any>> {
    return this.http.delete<SpringApiResponse<any>>(`${this.apiUrl}/${id}`);
  }
}
