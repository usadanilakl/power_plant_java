import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LotoPointPhoto, LotoPointComment } from './loto-standard.model';

/**
 * Mobile LOTO Point actions. Sits on top of
 * {@code /api/pwa/secured/loto-points} — the Plant-gated PWA controller
 * that wraps {@code NgLotoPointService.uploadPictures / removePicture}
 * (photos) and {@code NgCommentService} (polymorphic
 * entityType="LotoPoint" comments).
 *
 * <p>Photos flow into the same {@code loto_point_picture} M2M the desktop
 * uses, so PWA-uploaded evidence is visible on the LOTO Point form's
 * Pictures tab without an extra sync step. Comments go to the same
 * generic Comment table {@code app-comment-cell} reads on the desktop.
 *
 * <p><b>Offline:</b> photo uploads are ONLINE-ONLY (matches the Maximo
 * photo pattern). Comment posts are queued via
 * {@link LotoCommentQueueService} and replayed on reconnect.
 */
@Injectable({ providedIn: 'root' })
export class LotoPointApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/loto-points`;

  // ── Photos ────────────────────────────────────────────────────────────

  getPhotos(pointId: number): Observable<LotoPointPhoto[]> {
    return this.http
      .get<{ responseData: LotoPointPhoto[] }>(`${this.base}/${pointId}/photos`)
      .pipe(timeout(20000), map(r => r.responseData ?? []));
  }

  /**
   * Batch upload one or more photos. Backend attaches each FileObject to the
   * LOTO point's {@code pictures} M2M and populates name / system metadata
   * from the point's own description / systemValue.
   *
   * <p>Do NOT set Content-Type manually — HttpClient adds the multipart
   * boundary token which we cannot reproduce.
   */
  uploadPhotos(pointId: number, files: File[]): Observable<LotoPointPhoto[]> {
    const form = new FormData();
    for (const f of files) form.append('files', f, f.name);
    return this.http
      .post<{ responseData: LotoPointPhoto[] }>(
        `${this.base}/${pointId}/photos`,
        form,
      )
      // Photo uploads can be big on a phone; 60s ceiling matches Maximo.
      .pipe(timeout(60000), map(r => r.responseData ?? []));
  }

  deletePhoto(pointId: number, fileId: number): Observable<LotoPointPhoto[]> {
    return this.http
      .delete<{ responseData: LotoPointPhoto[] }>(
        `${this.base}/${pointId}/photos/${fileId}`,
      )
      .pipe(timeout(20000), map(r => r.responseData ?? []));
  }

  // ── Comments ──────────────────────────────────────────────────────────

  getComments(pointId: number): Observable<LotoPointComment[]> {
    return this.http
      .get<{ responseData: LotoPointComment[] }>(
        `${this.base}/${pointId}/comments`,
      )
      .pipe(timeout(20000), map(r => r.responseData ?? []));
  }

  addComment(pointId: number, content: string): Observable<LotoPointComment> {
    return this.http
      .post<{ responseData: LotoPointComment }>(
        `${this.base}/${pointId}/comments`,
        { content },
      )
      .pipe(timeout(20000), map(r => r.responseData));
  }

  /** Author-only; server returns 403 if the caller isn't {@code createdBy}. */
  deleteComment(pointId: number, commentId: number): Observable<void> {
    return this.http
      .delete<{ responseData: void }>(
        `${this.base}/${pointId}/comments/${commentId}`,
      )
      .pipe(timeout(20000), map(() => undefined));
  }
}
