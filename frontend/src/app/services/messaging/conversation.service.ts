import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConversationDto } from '../../models/messaging/conversation.model';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { SearchCriteria, SearchCriteriaDto } from '../../models/api/search-criteria.model';

@Injectable({
  providedIn: 'root'
})
export class ConversationService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/conversations`;

  getForEntity(entityType: string, entityId: number): Observable<SpringApiResponse<ConversationDto[]>> {
    return this.http.get<SpringApiResponse<ConversationDto[]>>(
      `${this.apiUrl}/${entityType}/${entityId}`
    );
  }

  getMyConversations(): Observable<SpringApiResponse<ConversationDto[]>> {
    return this.http.get<SpringApiResponse<ConversationDto[]>>(`${this.apiUrl}/my`);
  }

  startConversation(dto: ConversationDto): Observable<SpringApiResponse<ConversationDto>> {
    return this.http.post<SpringApiResponse<ConversationDto>>(this.apiUrl, dto.toJson());
  }

  markRead(conversationId: number): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(`${this.apiUrl}/${conversationId}/mark-read`, {});
  }

  closeConversation(conversationId: number): Observable<SpringApiResponse<ConversationDto>> {
    return this.http.post<SpringApiResponse<ConversationDto>>(`${this.apiUrl}/${conversationId}/close`, {});
  }

  deleteConversation(conversationId: number): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${conversationId}`);
  }

  getUnreadCount(entityType: string, entityId: number): Observable<SpringApiResponse<number>> {
    return this.http.get<SpringApiResponse<number>>(
      `${this.apiUrl}/${entityType}/${entityId}/unread-count`
    );
  }

  search(criteria: SearchCriteria, page: number = 1, pageSize: number = 50): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/search?page=${page}&pageSize=${pageSize}`,
      criteria
    );
  }
}
