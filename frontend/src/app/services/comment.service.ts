import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CommentDto } from '../models/base/comment.model';
import { SpringApiResponse } from '../models/api/spring-api-response.model';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = `${environment.apiUrl}/comments`;

  constructor(private http: HttpClient) {}

  getCommentsForEntity(entityType: string, entityId: number): Observable<SpringApiResponse<CommentDto[]>> {
    return this.http.get<SpringApiResponse<CommentDto[]>>(`${this.apiUrl}/${entityType}/${entityId}`);
  }

  createComment(comment: CommentDto): Observable<SpringApiResponse<CommentDto>> {
    return this.http.post<SpringApiResponse<CommentDto>>(this.apiUrl, comment.toJson());
  }

  updateComment(id: number, comment: CommentDto): Observable<SpringApiResponse<CommentDto>> {
    return this.http.put<SpringApiResponse<CommentDto>>(`${this.apiUrl}/${id}`, comment.toJson());
  }

  deleteComment(id: number): Observable<SpringApiResponse<CommentDto>> {
    return this.http.delete<SpringApiResponse<CommentDto>>(`${this.apiUrl}/${id}`);
  }
}
