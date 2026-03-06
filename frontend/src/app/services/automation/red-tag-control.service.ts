import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AutomationSessionState } from './red-tag-progress.service';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

@Injectable({
  providedIn: 'root'
})
export class RedTagControlService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/daily-permit-packages/automation`;

  startBuild(packageId: number): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/start/${packageId}`, {});
  }

  pauseBuild(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/pause`, {});
  }

  resumeBuild(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/resume`, {});
  }

  stopBuild(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/stop`, {});
  }

  retryStep(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/retry-step`, {});
  }

  skipStep(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/skip-step`, {});
  }

  getStatus(): Observable<SpringApiResponse<AutomationSessionState>> {
    return this.http.get<SpringApiResponse<AutomationSessionState>>(`${this.baseUrl}/status`);
  }

  toggleManualConfirmation(enabled: boolean): Observable<SpringApiResponse<boolean>> {
    return this.http.post<SpringApiResponse<boolean>>(`${this.baseUrl}/manual-confirmation?enabled=${enabled}`, {});
  }

  getManualConfirmation(): Observable<SpringApiResponse<boolean>> {
    return this.http.get<SpringApiResponse<boolean>>(`${this.baseUrl}/manual-confirmation`);
  }
}
