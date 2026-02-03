import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { CommentService } from '../../services/comment.service';
import { CommentDto } from '../../models/base/comment.model';
import { CommentsDialogService } from './comments-dialog.service';

@Component({
  selector: 'app-comments-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, RfPopupProjectionComponent],
  template: `
    @if (dialogService.isVisible()) {
      <app-rf-popup-projection
        [isOpen]="true"
        [title]="'Comments - ' + dialogService.entityType() + ' #' + dialogService.entityId()"
        [zIndex]="10001"
        (close)="close()"
      >
        <div class="comments-dialog-content">
          <!-- Add new comment -->
          <div class="new-comment-section">
            <textarea
              [(ngModel)]="newCommentContent"
              placeholder="Write a comment..."
              class="comment-textarea"
              rows="3"
            ></textarea>
            <div class="new-comment-actions">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="newNeedsAttention" />
                Needs Attention
              </label>
              <button
                class="btn btn-primary"
                (click)="addComment()"
                [disabled]="!newCommentContent.trim() || isSubmitting()"
              >
                {{ isSubmitting() ? 'Saving...' : 'Add Comment' }}
              </button>
            </div>
          </div>

          <!-- Comments list -->
          <div class="comments-list">
            @if (isLoading()) {
              <div class="loading">Loading comments...</div>
            } @else if (comments().length === 0) {
              <div class="empty-state">No comments yet</div>
            } @else {
              @for (comment of comments(); track comment.id) {
                <div class="comment-item" [class.needs-attention]="comment.needsAttention" [class.resolved]="comment.isResolved">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.createdBy }}</span>
                    <span class="comment-date">{{ formatDate(comment.dateCreated) }}</span>
                    @if (comment.commentType?.name) {
                      <span class="comment-type-badge">{{ comment.commentType.name }}</span>
                    }
                    @if (comment.needsAttention && !comment.isResolved) {
                      <span class="attention-badge">⚠ Attention</span>
                    }
                    @if (comment.isResolved) {
                      <span class="resolved-badge">✓ Resolved</span>
                    }
                  </div>

                  @if (editingCommentId() === comment.id) {
                    <div class="comment-edit">
                      <textarea
                        [(ngModel)]="editContent"
                        class="comment-textarea"
                        rows="2"
                      ></textarea>
                      <div class="edit-actions">
                        <button class="btn btn-sm btn-primary" (click)="saveEdit(comment)">Save</button>
                        <button class="btn btn-sm btn-secondary" (click)="cancelEdit()">Cancel</button>
                      </div>
                    </div>
                  } @else {
                    <div class="comment-body">{{ comment.content }}</div>
                    <div class="comment-actions">
                      <button class="btn-link" (click)="startEdit(comment)">Edit</button>
                      @if (!comment.isResolved) {
                        <button class="btn-link" (click)="resolveComment(comment)">Resolve</button>
                      }
                      <button class="btn-link btn-danger" (click)="deleteComment(comment)">Delete</button>
                    </div>
                  }
                </div>
              }
            }
          </div>
        </div>
      </app-rf-popup-projection>
    }
  `,
  styles: [`
    .comments-dialog-content {
      padding: 16px;
      min-width: 400px;
      max-width: 600px;
    }

    .new-comment-section {
      margin-bottom: 16px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border-color, #ddd);
    }

    .comment-textarea {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      resize: vertical;
      font-family: inherit;
      font-size: 14px;
      box-sizing: border-box;
    }

    .new-comment-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      cursor: pointer;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 400px;
      overflow-y: auto;
    }

    .comment-item {
      padding: 12px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 6px;
      background: var(--bg-color, #fff);
    }

    .comment-item.needs-attention {
      border-left: 3px solid var(--warning-color, #ff9800);
    }

    .comment-item.resolved {
      opacity: 0.7;
      border-left: 3px solid var(--success-color, #4caf50);
    }

    .comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
      flex-wrap: wrap;
    }

    .comment-author {
      font-weight: 600;
      font-size: 13px;
    }

    .comment-date {
      font-size: 12px;
      color: var(--text-secondary, #888);
    }

    .comment-type-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: var(--primary-light, #e3f2fd);
      color: var(--primary-color, #1976d2);
      border-radius: 4px;
    }

    .attention-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: #fff3e0;
      color: #e65100;
      border-radius: 4px;
    }

    .resolved-badge {
      font-size: 11px;
      padding: 2px 6px;
      background: #e8f5e9;
      color: #2e7d32;
      border-radius: 4px;
    }

    .comment-body {
      font-size: 14px;
      line-height: 1.4;
      white-space: pre-wrap;
      margin-bottom: 6px;
    }

    .comment-actions {
      display: flex;
      gap: 12px;
    }

    .comment-edit {
      margin-top: 4px;
    }

    .edit-actions {
      display: flex;
      gap: 8px;
      margin-top: 6px;
    }

    .btn-link {
      background: none;
      border: none;
      color: var(--primary-color, #1976d2);
      cursor: pointer;
      font-size: 12px;
      padding: 0;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .btn-link.btn-danger {
      color: var(--error-color, #c62828);
    }

    .btn {
      padding: 6px 14px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    }

    .btn-sm {
      padding: 4px 10px;
      font-size: 12px;
    }

    .btn-primary {
      background-color: var(--primary-color, #1976d2);
      color: white;
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: var(--secondary-bg, #e0e0e0);
      color: var(--text-primary, #333);
    }

    .loading, .empty-state {
      text-align: center;
      padding: 20px;
      color: var(--text-secondary, #888);
    }
  `]
})
export class CommentsDialogComponent {
  dialogService = inject(CommentsDialogService);
  private commentService = inject(CommentService);

  comments = signal<CommentDto[]>([]);
  isLoading = signal(false);
  isSubmitting = signal(false);
  editingCommentId = signal<number | null>(null);
  editContent = '';
  newCommentContent = '';
  newNeedsAttention = false;

  private loadEffect = this.dialogService.onOpen$.subscribe(() => {
    this.loadComments();
  });

  loadComments(): void {
    const entityType = this.dialogService.entityType();
    const entityId = this.dialogService.entityId();
    if (!entityType || !entityId) return;

    this.isLoading.set(true);
    this.commentService.getCommentsForEntity(entityType, entityId).subscribe({
      next: (response) => {
        this.comments.set(
          (response.responseData || []).map(c => CommentDto.fromJson(c))
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  addComment(): void {
    const content = this.newCommentContent.trim();
    if (!content) return;

    this.isSubmitting.set(true);
    const comment = new CommentDto({
      content,
      entityType: this.dialogService.entityType(),
      entityId: this.dialogService.entityId(),
      needsAttention: this.newNeedsAttention,
    });

    this.commentService.createComment(comment).subscribe({
      next: (response) => {
        if (response.responseData) {
          this.comments.update(list => [CommentDto.fromJson(response.responseData), ...list]);
        }
        this.newCommentContent = '';
        this.newNeedsAttention = false;
        this.isSubmitting.set(false);
      },
      error: () => {
        this.isSubmitting.set(false);
      }
    });
  }

  startEdit(comment: CommentDto): void {
    this.editingCommentId.set(comment.id);
    this.editContent = comment.content;
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editContent = '';
  }

  saveEdit(comment: CommentDto): void {
    const updated = new CommentDto({ ...comment, content: this.editContent });
    this.commentService.updateComment(comment.id, updated).subscribe({
      next: (response) => {
        if (response.responseData) {
          this.comments.update(list =>
            list.map(c => c.id === comment.id ? CommentDto.fromJson(response.responseData) : c)
          );
        }
        this.cancelEdit();
      }
    });
  }

  resolveComment(comment: CommentDto): void {
    const updated = new CommentDto({ ...comment, isResolved: true });
    this.commentService.updateComment(comment.id, updated).subscribe({
      next: (response) => {
        if (response.responseData) {
          this.comments.update(list =>
            list.map(c => c.id === comment.id ? CommentDto.fromJson(response.responseData) : c)
          );
        }
      }
    });
  }

  deleteComment(comment: CommentDto): void {
    this.commentService.deleteComment(comment.id).subscribe({
      next: () => {
        this.comments.update(list => list.filter(c => c.id !== comment.id));
      }
    });
  }

  close(): void {
    this.dialogService.close();
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
