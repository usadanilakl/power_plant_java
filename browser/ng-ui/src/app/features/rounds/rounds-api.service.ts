import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AnswerHistory, GrabResult, IssueCommentDto, RoundIssueDto, RoundListItem, RoundPerform, SubmitResult, SubmitRoundRequest,
} from './rounds.model';

/**
 * Mobile Rounds API. Calls the Plant-gated PWA endpoints on the hub (`/api/pwa/secured/rounds`). JWT interceptor
 * attaches the bearer token. Grab requires online (like a Maximo PM grab); perform/submit can be queued offline (P4).
 */
@Injectable({ providedIn: 'root' })
export class RoundsApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/rounds`;

  listRounds(): Observable<RoundListItem[]> {
    return this.http.get<{ responseData: RoundListItem[] }>(this.base)
      .pipe(timeout(30000), map(r => r.responseData ?? []));
  }

  getRound(roundId: number): Observable<RoundPerform | null> {
    return this.http.get<{ responseData: RoundPerform | null }>(`${this.base}/${roundId}`)
      .pipe(timeout(30000), map(r => r.responseData ?? null));
  }

  grab(roundId: number, shift?: string): Observable<GrabResult> {
    let params = new HttpParams();
    if (shift) params = params.set('shift', shift);
    return this.http.post<{ responseData: GrabResult }>(`${this.base}/${roundId}/grab`, null, { params })
      .pipe(timeout(30000), map(r => r.responseData));
  }

  submit(instanceId: number, body: SubmitRoundRequest): Observable<SubmitResult> {
    return this.http.post<{ responseData: SubmitResult }>(`${this.base}/instances/${instanceId}/submit`, body)
      .pipe(timeout(30000), map(r => r.responseData));
  }

  questionHistory(questionId: number, limit = 10): Observable<AnswerHistory[]> {
    return this.http.get<{ responseData: AnswerHistory[] }>(`${this.base}/questions/${questionId}/history?limit=${limit}`)
      .pipe(timeout(20000), map(r => r.responseData ?? []));
  }

  // ── Active Out-of-Range dashboard ──
  listIssues(openOnly = true): Observable<RoundIssueDto[]> {
    const params = new HttpParams().set('openOnly', String(openOnly));
    return this.http.get<{ responseData: RoundIssueDto[] }>(`${this.base}/issues`, { params })
      .pipe(timeout(30000), map(r => r.responseData ?? []));
  }

  issueComments(id: number): Observable<IssueCommentDto[]> {
    return this.http.get<{ responseData: IssueCommentDto[] }>(`${this.base}/issues/${id}/comments`)
      .pipe(timeout(20000), map(r => r.responseData ?? []));
  }

  addIssueComment(id: number, text: string): Observable<IssueCommentDto> {
    return this.http.post<{ responseData: IssueCommentDto }>(`${this.base}/issues/${id}/comments`, { text })
      .pipe(timeout(20000), map(r => r.responseData));
  }

  resolveIssue(id: number, text?: string): Observable<RoundIssueDto> {
    return this.http.post<{ responseData: RoundIssueDto }>(`${this.base}/issues/${id}/resolve`, { text: text ?? null })
      .pipe(timeout(20000), map(r => r.responseData));
  }
}
