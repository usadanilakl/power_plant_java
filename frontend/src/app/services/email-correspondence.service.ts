import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmailCorrespondenceDto } from '../models/base/email-correspondence.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';
import { SearchCriteria } from '../models/api/search-criteria.model';

/** A raw mailbox message (Inbox/Sent folder) for the Correspondence Inbox/Outbox tabs. */
export interface MailboxMessage {
  id: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  isRead: boolean;
  direction: 'INBOUND' | 'OUTBOUND';
  snippet: string;
  conversationId: string;
}

/**
 * Service for Email Correspondence operations.
 * Provides methods to fetch, search, and manage email correspondence.
 */
@Injectable({
  providedIn: 'root'
})
export class EmailCorrespondenceService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/email-correspondence`;

  /**
   * Get correspondence for a specific entity (polymorphic query)
   * @param entityType The entity type (e.g., 'WorkRequest', 'LotoPoint')
   * @param entityId The entity ID
   * @returns Observable of correspondence list
   */
  getForEntity(entityType: string, entityId: number): Observable<SpringApiResponse<EmailCorrespondenceDto[]>> {
    return this.http.get<SpringApiResponse<EmailCorrespondenceDto[]>>(
      `${this.apiUrl}/${entityType}/${entityId}`
    );
  }

  /**
   * Search correspondence with criteria
   * @param criteria Search criteria
   * @param page Page number (1-indexed)
   * @param pageSize Items per page
   * @returns Observable of paginated results
   */
  search(criteria: SearchCriteria, page: number = 1, pageSize: number = 50): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/search?page=${page}&pageSize=${pageSize}`,
      criteria
    );
  }

  /**
   * Mark correspondence as read
   * @param id Correspondence ID
   * @returns Observable of response
   */
  markAsRead(id: number): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(`${this.apiUrl}/${id}/mark-read`, {});
  }

  /**
   * Get unread count for an entity
   * @param entityType The entity type
   * @param entityId The entity ID
   * @returns Observable of unread count
   */
  getUnreadCount(entityType: string, entityId: number): Observable<SpringApiResponse<number>> {
    return this.http.get<SpringApiResponse<number>>(
      `${this.apiUrl}/${entityType}/${entityId}/unread-count`
    );
  }

  /**
   * Trigger manual email polling
   * @returns Observable of response
   */
  triggerPoll(): Observable<SpringApiResponse<void>> {
    return this.http.post<SpringApiResponse<void>>(`${this.apiUrl}/poll`, {});
  }

  /** List recent messages from the shared mailbox's Inbox or Sent folder. */
  listMailbox(folder: 'inbox' | 'sent', top: number = 50): Observable<MailboxMessage[]> {
    return this.http
      .get<SpringApiResponse<MailboxMessage[]>>(`${this.apiUrl}/mailbox?folder=${folder}&top=${top}`)
      .pipe(map(r => r.responseData ?? []));
  }
}
