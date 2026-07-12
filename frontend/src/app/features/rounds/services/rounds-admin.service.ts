import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SpringApiResponse } from '../../../models/api/spring-api-response.model';
import {
  CreateRoundRequest,
  GenerateQuestionRequest,
  ImportResult,
  ImportedRoundQuestion,
  Round,
  RoundIssue,
  RoundIssueComment,
  RoundQuestion,
  StagingStatus,
} from '../models/rounds.model';

/**
 * Authoring/admin API for Rounds (hub-served desktop workbench): import WebView headers into staging, generate
 * editable questions bound to a PhysicalObject, and manage Round definitions. Hits {@code /ng/rounds-admin/*}.
 */
@Injectable({ providedIn: 'root' })
export class RoundsAdminService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/rounds-admin`;
  private perform = `${environment.baseApiUrl}/ng/rounds-perform`;

  // ── Import / staging ──
  /** Primary import: a manually-exported rounds Excel (multipart). */
  importExcel(file: File): Observable<ImportResult & { round?: string }> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http
      .post<SpringApiResponse<ImportResult & { round?: string }>>(`${this.base}/import-excel`, fd)
      .pipe(map(r => r.responseData));
  }

  /** Legacy import from the scraped WebView report (kept for backfill; no longer the primary path). */
  importLatest(): Observable<ImportResult> {
    return this.http
      .post<SpringApiResponse<ImportResult>>(`${this.base}/import`, null)
      .pipe(map(r => r.responseData));
  }

  listStaging(status?: StagingStatus): Observable<ImportedRoundQuestion[]> {
    let p = new HttpParams();
    if (status) p = p.set('status', status);
    return this.http
      .get<SpringApiResponse<ImportedRoundQuestion[]>>(`${this.base}/staging`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  ignoreStaging(id: number): Observable<ImportedRoundQuestion> {
    return this.http
      .post<SpringApiResponse<ImportedRoundQuestion>>(`${this.base}/staging/${id}/ignore`, null)
      .pipe(map(r => r.responseData));
  }

  generateFromStaging(id: number, body: GenerateQuestionRequest): Observable<RoundQuestion> {
    return this.http
      .post<SpringApiResponse<RoundQuestion>>(`${this.base}/staging/${id}/generate`, body)
      .pipe(map(r => r.responseData));
  }

  generateAdHoc(body: GenerateQuestionRequest): Observable<RoundQuestion> {
    return this.http
      .post<SpringApiResponse<RoundQuestion>>(`${this.base}/questions`, body)
      .pipe(map(r => r.responseData));
  }

  generateBulk(body: { roundId: number; physicalObjectId: number | null; stagingIds: number[] }): Observable<RoundQuestion[]> {
    return this.http
      .post<SpringApiResponse<RoundQuestion[]>>(`${this.base}/staging/generate-bulk`, body)
      .pipe(map(r => r.responseData ?? []));
  }

  ignoreBulk(ids: number[]): Observable<number> {
    return this.http
      .post<SpringApiResponse<number>>(`${this.base}/staging/ignore-bulk`, ids)
      .pipe(map(r => r.responseData ?? 0));
  }

  /** Purge staging rows (default: all unprocessed) — clears stale scraper-imported items. */
  purgeStaging(status?: string): Observable<number> {
    const q = status ? `?status=${status}` : '';
    return this.http
      .delete<SpringApiResponse<number>>(`${this.base}/staging${q}`)
      .pipe(map(r => r.responseData ?? 0));
  }

  // ── Round + question editing (CRUD) ──
  updateRound(id: number, body: Partial<{ name: string; description: string; area: string; cadence: string; shift: string; intervalHours: number | null; active: boolean }>): Observable<Round> {
    return this.http
      .put<SpringApiResponse<Round>>(`${this.base}/rounds/${id}`, body)
      .pipe(map(r => r.responseData));
  }

  deleteRound(id: number): Observable<void> {
    return this.http
      .delete<SpringApiResponse<void>>(`${this.base}/rounds/${id}`)
      .pipe(map(() => undefined));
  }

  updateQuestion(id: number, body: Partial<{
    prompt: string; answerType: string; unit: string | null; category: string | null; expectedValue: string | null;
    choicesJson: string | null; lowLimit: number | null; highLimit: number | null; trackIssues: boolean;
    physicalObjectId: number | null; orderIndex: number;
    predecessorQuestionId: number | null; showWhenOp: string | null; showWhenValue: string | null;
  }>): Observable<RoundQuestion> {
    return this.http
      .put<SpringApiResponse<RoundQuestion>>(`${this.base}/questions/${id}`, body)
      .pipe(map(r => r.responseData));
  }

  reorderQuestions(roundId: number, orderedIds: number[]): Observable<Round> {
    return this.http
      .post<SpringApiResponse<Round>>(`${this.base}/rounds/${roundId}/reorder`, orderedIds)
      .pipe(map(r => r.responseData));
  }

  // ── group operations ──
  renameGroup(roundId: number, fromCategory: string | null, toCategory: string | null): Observable<Round> {
    return this.http
      .post<SpringApiResponse<Round>>(`${this.base}/rounds/${roundId}/group/rename`, { fromCategory, toCategory })
      .pipe(map(r => r.responseData));
  }

  assignGroupObject(roundId: number, category: string | null, physicalObjectId: number | null): Observable<Round> {
    return this.http
      .post<SpringApiResponse<Round>>(`${this.base}/rounds/${roundId}/group/assign-object`, { category, physicalObjectId })
      .pipe(map(r => r.responseData));
  }

  deleteGroup(roundId: number, category: string): Observable<Round> {
    return this.http
      .delete<SpringApiResponse<Round>>(`${this.base}/rounds/${roundId}/group?category=${encodeURIComponent(category)}`)
      .pipe(map(r => r.responseData));
  }

  deleteQuestion(id: number): Observable<void> {
    return this.http
      .delete<SpringApiResponse<void>>(`${this.base}/questions/${id}`)
      .pipe(map(() => undefined));
  }

  // ── Rounds ──
  createRound(body: CreateRoundRequest): Observable<Round> {
    return this.http
      .post<SpringApiResponse<Round>>(`${this.base}/rounds`, body)
      .pipe(map(r => r.responseData));
  }

  listRounds(): Observable<Round[]> {
    return this.http
      .get<SpringApiResponse<Round[]>>(`${this.base}/rounds`)
      .pipe(map(r => r.responseData ?? []));
  }

  getRound(id: number): Observable<Round> {
    return this.http
      .get<SpringApiResponse<Round>>(`${this.base}/rounds/${id}`)
      .pipe(map(r => r.responseData));
  }

  // ── Active Out-of-Range dashboard (/ng/rounds-perform) ──
  listIssues(openOnly = true): Observable<RoundIssue[]> {
    return this.http
      .get<SpringApiResponse<RoundIssue[]>>(`${this.perform}/issues?openOnly=${openOnly}`)
      .pipe(map(r => r.responseData ?? []));
  }

  issueComments(id: number): Observable<RoundIssueComment[]> {
    return this.http
      .get<SpringApiResponse<RoundIssueComment[]>>(`${this.perform}/issues/${id}/comments`)
      .pipe(map(r => r.responseData ?? []));
  }

  addIssueComment(id: number, text: string): Observable<RoundIssueComment> {
    return this.http
      .post<SpringApiResponse<RoundIssueComment>>(`${this.perform}/issues/${id}/comments`, { text })
      .pipe(map(r => r.responseData));
  }

  resolveIssue(id: number, text?: string): Observable<RoundIssue> {
    return this.http
      .post<SpringApiResponse<RoundIssue>>(`${this.perform}/issues/${id}/resolve`, { text: text ?? null })
      .pipe(map(r => r.responseData));
  }
}
