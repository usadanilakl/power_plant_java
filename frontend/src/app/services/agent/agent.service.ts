import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export interface AgentChatRequest {
  sessionId: string | null;
  message: string | null;
  confirmationId: string | null;
  confirmed: boolean;
}

export interface PendingAction {
  actionName: string;
  description: string;
  parameters: Record<string, any>;
}

export interface AgentChatResponse {
  sessionId: string;
  message: string;
  type: 'text' | 'search_results' | 'confirmation_required' | 'action_completed' | 'error';
  data: Record<string, any> | null;
  confirmationId: string | null;
  pendingAction: PendingAction | null;
}

@Injectable({ providedIn: 'root' })
export class AgentService {
  private apiUrl = `${environment.apiUrl}/agent`;

  constructor(private http: HttpClient) {}

  chat(request: AgentChatRequest): Observable<SpringApiResponse<AgentChatResponse>> {
    return this.http.post<SpringApiResponse<AgentChatResponse>>(`${this.apiUrl}/chat`, request);
  }

  checkStatus(): Observable<SpringApiResponse<boolean>> {
    return this.http.get<SpringApiResponse<boolean>>(`${this.apiUrl}/status`);
  }

  clearSession(sessionId: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/session/${sessionId}`);
  }
}
