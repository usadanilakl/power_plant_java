import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MessageDto } from '../../models/messaging/message.model';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/messages`;

  getForConversation(conversationId: number): Observable<SpringApiResponse<MessageDto[]>> {
    return this.http.get<SpringApiResponse<MessageDto[]>>(
      `${this.apiUrl}/conversation/${conversationId}`
    );
  }

  sendMessage(dto: MessageDto): Observable<SpringApiResponse<MessageDto>> {
    return this.http.post<SpringApiResponse<MessageDto>>(this.apiUrl, dto.toJson());
  }
}
