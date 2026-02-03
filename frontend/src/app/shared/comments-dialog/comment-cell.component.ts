import { Component, inject, Input, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommentService } from '../../services/comment.service';
import { CommentDto } from '../../models/base/comment.model';
import { CommentsDialogService } from './comments-dialog.service';

@Component({
  selector: 'app-comment-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="comment-cell" (click)="openDialog($event)">
      @if (latestComment()) {
        <span class="comment-preview-text">{{ latestComment()!.content }}</span>
      }
      @if (commentCount() > 0) {
        <span class="comment-badge">{{ commentCount() }}</span>
      }
    </div>
  `,
  styles: [`
    .comment-cell {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      width: 100%;
      overflow: hidden;
    }

    .comment-cell:hover {
      color: var(--primary-color, #1976d2);
    }

    .comment-preview-text {
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 13px;
    }

    .comment-badge {
      background: var(--primary-color, #1976d2);
      color: white;
      border-radius: 50%;
      min-width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }
  `]
})
export class CommentCellComponent implements OnChanges {
  @Input() entityType = '';
  @Input() entityId = 0;

  private commentService = inject(CommentService);
  private dialogService = inject(CommentsDialogService);

  latestComment = signal<CommentDto | null>(null);
  commentCount = signal(0);

  ngOnChanges(): void {
    if (this.entityType && this.entityId) {
      this.loadPreview();
    }
  }

  loadPreview(): void {
    this.commentService.getCommentsForEntity(this.entityType, this.entityId).subscribe({
      next: (response) => {
        const comments = (response.responseData || []).map(c => CommentDto.fromJson(c));
        this.commentCount.set(comments.length);
        this.latestComment.set(comments.length > 0 ? comments[0] : null);
      }
    });
  }

  openDialog(event: Event): void {
    event.stopPropagation();
    if (!this.entityType || !this.entityId) return;
    this.dialogService.open(this.entityType, this.entityId);
  }
}
