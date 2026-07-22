import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  Input,
  signal,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { LotoPointApiService } from './loto-point-api.service';
import { LotoCommentQueueService } from './loto-comment-queue.service';
import { LotoPointComment, LotoPointPhoto } from './loto-standard.model';
import { ServerStatusService } from '../../services/server-status.service';

/**
 * Per-LOTO-point action strip: 📸 Photos + 💬 Comments buttons that expand
 * inline panels. Meant to hang inside a LOTO point card in either the
 * simple detail view or the walkdown/verification view — the component
 * doesn't know or care which; it just needs a {@code pointId}.
 * <p>
 * <b>Photos</b> — upload is online-only for this pass (matches Maximo).
 * The native file input includes {@code capture="environment"} so
 * on-device it opens the rear camera directly; the browser falls back to
 * a gallery picker on desktop. Multi-select is enabled. Tapping a
 * thumbnail opens the file's URL in a new tab (browser handles the
 * viewer / zoom).
 * <p>
 * <b>Comments</b> — queued for offline via {@link LotoCommentQueueService}.
 * Pending drafts render inline with a "sending…" badge so the operator
 * can see them even while offline; they get replaced by the real
 * server comment once the queue drains on reconnect. Delete is
 * author-only (server enforces).
 */
@Component({
  selector: 'app-loto-point-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loto-point-actions.component.html',
  styleUrl: './loto-point-actions.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotoPointActionsComponent {
  private api = inject(LotoPointApiService);
  private queue = inject(LotoCommentQueueService);
  private serverStatus = inject(ServerStatusService);

  @Input({ required: true }) pointId!: number;
  /** Optional tag label for the "sending on reconnect" toast. */
  @Input() pointLabel: string | null = null;

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  readonly isOnline = this.serverStatus.isOnline;

  photosOpen = signal(false);
  commentsOpen = signal(false);

  photos = signal<LotoPointPhoto[]>([]);
  photoLoading = signal(false);
  photoUploading = signal(false);
  photoError = signal<string | null>(null);

  comments = signal<LotoPointComment[]>([]);
  commentLoading = signal(false);
  commentPosting = signal(false);
  commentError = signal<string | null>(null);
  draftComment = signal('');

  /**
   * Refetch comments whenever the queue's pendingCount drops for this
   * point's items — this catches the "just posted" moment reliably instead
   * of guessing with a 400ms setTimeout (which raced the POST on slow
   * cellular). Effect fires after every signal change; we only reload
   * when the count for THIS point specifically decreased.
   */
  private lastPendingForPoint = 0;
  private reloadOnDrain = effect(() => {
    // Access queue signal so the effect re-runs on every drain.
    // Read pendingFor via queue.queue() to trigger reactive tracking.
    void this.queue.queue();
    const nowPending = this.queue.pendingFor(this.pointId).length;
    if (nowPending < this.lastPendingForPoint && this.commentsOpen()) {
      this.loadComments();
    }
    this.lastPendingForPoint = nowPending;
  });

  /** Server + pending union, oldest at top so the newest comment appears at the bottom
   *  (matches chat UX — reading top-to-bottom feels chronological). */
  visibleComments = computed(() => {
    const server = [...this.comments()].sort((a, b) =>
      (a.dateCreated ?? '').localeCompare(b.dateCreated ?? ''),
    );
    const pending = this.queue
      .pendingFor(this.pointId)
      .sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
    return { server, pending };
  });

  photoUrl(photo: LotoPointPhoto): string {
    if (!photo?.fileLink) return '';
    return `${environment.serverUrl}/${photo.fileLink}`;
  }

  // ── Photos panel ─────────────────────────────────────────────────────

  openPhotos(): void {
    this.photosOpen.set(!this.photosOpen());
    // Always refetch on open — a peer edit from desktop or another PWA
    // user could have added / removed photos while this panel was closed.
    if (this.photosOpen()) this.loadPhotos();
  }

  private loadPhotos(): void {
    // Skip the network round-trip while offline. Otherwise the user gets
    // the friendly "You're offline" hint AND a red "Failed to load photos"
    // banner side-by-side; the request would just fail anyway. When they
    // reconnect they can close and reopen the panel to trigger a fresh
    // fetch — or an isOnline$ subscription upstream can call loadPhotos
    // if we want auto-reload (deferred).
    if (!this.isOnline()) return;
    this.photoLoading.set(true);
    this.photoError.set(null);
    this.api.getPhotos(this.pointId).subscribe({
      next: (list) => {
        this.photos.set(list ?? []);
        this.photoLoading.set(false);
      },
      error: (err) => {
        console.error('LotoPointActions: getPhotos failed', err);
        this.photoError.set(
          err?.error?.message || err?.message || 'Failed to load photos',
        );
        this.photoLoading.set(false);
      },
    });
  }

  triggerPhotoPick(): void {
    if (this.photoUploading()) return;
    this.photoInput?.nativeElement.click();
  }

  onPhotoInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = ''; // allow re-selecting the same file
    if (files.length === 0) return;
    if (!this.isOnline()) {
      this.photoError.set(
        'You are offline — reconnect to upload photos. (Photos will not be queued in this pass.)',
      );
      return;
    }
    this.photoUploading.set(true);
    this.photoError.set(null);
    this.api.uploadPhotos(this.pointId, files).subscribe({
      next: (list) => {
        this.photos.set(list ?? []);
        this.photoUploading.set(false);
      },
      error: (err) => {
        console.error('LotoPointActions: uploadPhotos failed', err);
        this.photoError.set(
          err?.error?.message || err?.message || 'Photo upload failed',
        );
        this.photoUploading.set(false);
      },
    });
  }

  onDeletePhoto(photo: LotoPointPhoto): void {
    if (!photo?.id) return;
    const confirmed = confirm(`Remove "${photo.name ?? 'this photo'}" from the point?`);
    if (!confirmed) return;
    this.api.deletePhoto(this.pointId, photo.id).subscribe({
      next: (list) => this.photos.set(list ?? []),
      error: (err) => {
        console.error('LotoPointActions: deletePhoto failed', err);
        this.photoError.set(
          err?.error?.message || err?.message || 'Failed to remove photo',
        );
      },
    });
  }

  openPhotoFullscreen(photo: LotoPointPhoto): void {
    const url = this.photoUrl(photo);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }

  // ── Comments panel ───────────────────────────────────────────────────

  openComments(): void {
    this.commentsOpen.set(!this.commentsOpen());
    // Refetch every open — see openPhotos rationale.
    if (this.commentsOpen()) this.loadComments();
  }

  private loadComments(): void {
    // Offline: skip the fetch. Any queued pending comments still render
    // via visibleComments's queue.pendingFor path, so the panel isn't
    // empty — just doesn't try to fetch server rows it can't reach.
    if (!this.isOnline()) return;
    this.commentLoading.set(true);
    this.commentError.set(null);
    this.api.getComments(this.pointId).subscribe({
      next: (list) => {
        this.comments.set(list ?? []);
        this.commentLoading.set(false);
      },
      error: (err) => {
        console.error('LotoPointActions: getComments failed', err);
        this.commentError.set(
          err?.error?.message || err?.message || 'Failed to load comments',
        );
        this.commentLoading.set(false);
      },
    });
  }

  onDraftInput(value: string): void {
    this.draftComment.set(value);
  }

  onSendComment(): void {
    const content = this.draftComment().trim();
    if (!content) return;
    this.queue.enqueue(this.pointId, content);
    this.draftComment.set('');
    // No setTimeout(400ms) here — that raced the POST on slow cellular:
    // if the GET returned before the POST completed, the just-posted
    // comment vanished from the UI. The reloadOnDrain effect above now
    // triggers loadComments() the instant the queue's pendingCount for
    // this point drops (i.e. the POST resolved), which is the actually
    // correct completion signal.
  }

  onDeleteComment(comment: LotoPointComment): void {
    if (!comment?.id || comment.id < 0) return;
    const confirmed = confirm('Delete this comment?');
    if (!confirmed) return;
    this.api.deleteComment(this.pointId, comment.id).subscribe({
      next: () =>
        this.comments.set(this.comments().filter((c) => c.id !== comment.id)),
      error: (err) => {
        console.error('LotoPointActions: deleteComment failed', err);
        this.commentError.set(
          err?.error?.message || err?.message || 'Failed to delete comment',
        );
      },
    });
  }

  onDiscardPending(localId: string): void {
    this.queue.discard(localId);
  }
}
