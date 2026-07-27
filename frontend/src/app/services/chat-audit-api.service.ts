import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { SpringPaginatedResponse } from '../models/api/spring-pagenated.response.model';

export interface ChatAuditConversation {
  id: number;
  supabaseId: string;
  name: string;
  description?: string;
  entityType?: string;
  entityId?: number;
  isEditable: boolean;
  createdBySupabaseUuid?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface ChatAuditMessage {
  id: number;
  supabaseId: string;
  conversationSupabaseId: string;
  senderSupabaseUuid: string;
  senderDisplayName: string;
  senderHubUserId?: number;
  senderEmail?: string;
  content: string;
  isImportant: boolean;
  requiresAck: boolean;
  sentAt: string;
  editedAt?: string;
  deletedAt?: string;
  ackCount: number;
}

export interface ChatAuditAck {
  messageSupabaseId: string;
  userSupabaseUuid: string;
  userHubUserId?: number;
  userName?: string;
  userEmail?: string;
  ackedAt: string;
}

export interface ChatAuditSearchParams {
  conversationId?: string;
  senderUuid?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class ChatAuditApiService {
  private apiUrl = `${environment.apiUrl}/chat-audit`;

  constructor(private http: HttpClient) {}

  listConversations(includeArchived = false): Observable<SpringApiResponse<ChatAuditConversation[]>> {
    const params = new HttpParams().set('includeArchived', String(includeArchived));
    return this.http.get<SpringApiResponse<ChatAuditConversation[]>>(`${this.apiUrl}/conversations`, { params });
  }

  search(p: ChatAuditSearchParams): Observable<SpringPaginatedResponse<ChatAuditMessage>> {
    let params = new HttpParams()
      .set('page', String(p.page ?? 1))
      .set('pageSize', String(p.pageSize ?? 50));
    if (p.conversationId) params = params.set('conversationId', p.conversationId);
    if (p.senderUuid)     params = params.set('senderUuid', p.senderUuid);
    if (p.from)           params = params.set('from', p.from);
    if (p.to)             params = params.set('to', p.to);
    if (p.q)              params = params.set('q', p.q);
    return this.http.get<SpringPaginatedResponse<ChatAuditMessage>>(
      `${this.apiUrl}/messages/search`, { params });
  }

  acks(supabaseId: string): Observable<SpringApiResponse<ChatAuditAck[]>> {
    return this.http.get<SpringApiResponse<ChatAuditAck[]>>(
      `${this.apiUrl}/messages/${supabaseId}/acks`);
  }

  createConversation(name: string, description?: string, isEditable?: boolean,
                     entityType?: string, entityId?: number): Observable<SpringApiResponse<{ id: string }>> {
    return this.http.post<SpringApiResponse<{ id: string }>>(
      `${this.apiUrl}/conversations`, { name, description, isEditable, entityType, entityId });
  }

  updateConversation(id: string, patch: { name?: string; description?: string; isEditable?: boolean }): Observable<SpringApiResponse<void>> {
    return this.http.patch<SpringApiResponse<void>>(`${this.apiUrl}/conversations/${id}`, patch);
  }

  archiveConversation(id: string): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(`${this.apiUrl}/conversations/${id}/archive`, {});
  }

  unarchiveConversation(id: string): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(`${this.apiUrl}/conversations/${id}/unarchive`, {});
  }
}
