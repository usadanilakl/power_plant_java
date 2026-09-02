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
  OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LotoPointApiService } from './loto-point-api.service';
import { LotoCommentQueueService } from './loto-comment-queue.service';
import { LotoPointComment, LotoPointPhoto } from './loto-standard.model';
import { ServerStatusService } from '../../services/server-status.service';
import { GlobalMessageService } from '../../services/global-message.service';

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
export class LotoPointActionsComponent implements OnDestroy {
  private api = inject(LotoPointApiService);
  private globalMessage = inject(GlobalMessageService);
  private queue = inject(LotoCommentQueueService);
  private serverStatus = inject(ServerStatusService);

  @Input({ required: true }) pointId!: number;
  /** Optional tag label for the "sending on reconnect" toast. */
  @Input() pointLabel: string | null = null;

  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;
  @ViewChild('libraryInput') libraryInput?: ElementRef<HTMLInputElement>;

  readonly isOnline = this.serverStatus.isOnline;

  photosOpen = signal(false);
  commentsOpen = signal(false);

  photos = signal<LotoPointPhoto[]>([]);
  photoLoading = signal(false);
  photoUploading = signal(false);
  photoError = signal<string | null>(null);
  /**
   * {photoId → object-URL} for photo bytes fetched via the JWT-authed content endpoint. We can't
   * point {@code <img src>} at the raw {@code /uploads/**} URL — that's behind IIS auth and 401s
   * into a native credential prompt. Populated by {@link loadPhotos}, revoked in
   * {@link ngOnDestroy} + on refetch so we don't leak blob memory.
   */
  private photoBlobUrls = signal<Record<number, string>>({});

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

  /**
   * PWA-safe photo URL. Returns the blob object URL populated by {@link loadPhotos} — the raw
   * {@code environment.serverUrl}/${photo.fileLink} points at the IIS-guarded {@code /uploads/**}
   * static path, which throws a native 401 credential prompt in the PWA context. Empty string
   * while the bytes are still loading (image simply doesn't render yet).
   */
  photoUrl(photo: LotoPointPhoto): string {
    if (!photo?.id) return '';
    return this.photoBlobUrls()[photo.id] ?? '';
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
        const photos = list ?? [];
        this.photos.set(photos);
        this.photoLoading.set(false);
        this.hydratePhotoBlobs(photos);
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

  /**
   * Fetch each photo's bytes as a Blob and build an object URL so {@code <img [src]>} can render
   * it. Skips ids we already have a URL for (thumbnails don't refetch on every panel open),
   * revokes URLs for ids no longer in the list (deletes free memory promptly). Errors on a
   * single photo don't block the rest — the tile just stays blank + surfaces a soft warning.
   */
  private hydratePhotoBlobs(photos: LotoPointPhoto[]): void {
    const stillPresent = new Set(photos.map(p => p.id));
    const current = this.photoBlobUrls();
    // Revoke + drop URLs for photos that were removed since last load.
    const next: Record<number, string> = {};
    for (const [idStr, url] of Object.entries(current)) {
      const id = Number(idStr);
      if (stillPresent.has(id)) {
        next[id] = url;
      } else {
        URL.revokeObjectURL(url);
      }
    }
    this.photoBlobUrls.set(next);

    for (const p of photos) {
      if (!p?.id || next[p.id]) continue;   // already hydrated
      this.api.fetchPhotoContent(this.pointId, p.id).subscribe({
        next: (blob) => {
          const url = URL.createObjectURL(blob);
          this.photoBlobUrls.update(map => ({ ...map, [p.id]: url }));
        },
        error: (err) => {
          console.error(`LotoPointActions: fetchPhotoContent(${this.pointId},${p.id}) failed`, err);
          // Don't surface as a top-level error — one broken thumbnail shouldn't hide the rest.
        },
      });
    }
  }

  ngOnDestroy(): void {
    for (const url of Object.values(this.photoBlobUrls())) URL.revokeObjectURL(url);
    this.photoBlobUrls.set({});
  }

  triggerPhotoPick(): void {
    if (this.photoUploading()) return;
    this.photoInput?.nativeElement.click();
  }

  /** Rear-camera path — `capture="environment"` on the input jumps straight past the picker. */
  triggerCameraPick(): void {
    if (this.photoUploading()) return;
    this.photoInput?.nativeElement.click();
  }

  /**
   * Library / files path — no capture attribute, wider accept list. On iOS this shows Photo
   * Library + Files + Camera; on Android the OS picker + gallery apps. The user requested that
   * we allow attaching videos and PDFs (and other doc types) alongside photos, not just images.
   */
  triggerLibraryPick(): void {
    if (this.photoUploading()) return;
    this.libraryInput?.nativeElement.click();
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
        const photos = list ?? [];
        this.photos.set(photos);
        this.photoUploading.set(false);
        this.hydratePhotoBlobs(photos);
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

  async onDeletePhoto(photo: LotoPointPhoto): Promise<void> {
    if (!photo?.id) return;
    const confirmed = await this.globalMessage.confirm(
      `Remove "${photo.name ?? 'this photo'}" from the point?`,
      { confirmLabel: 'Remove', color: 'red' },
    );
    if (!confirmed) return;
    this.api.deletePhoto(this.pointId, photo.id).subscribe({
      next: (list) => {
        const photos = list ?? [];
        this.photos.set(photos);
        this.hydratePhotoBlobs(photos);   // revoke the deleted photo's blob + keep the survivors
      },
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

  async onDeleteComment(comment: LotoPointComment): Promise<void> {
    if (!comment?.id || comment.id < 0) return;
    const confirmed = await this.globalMessage.confirm('Delete this comment?', {
      confirmLabel: 'Delete', color: 'red',
    });
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
