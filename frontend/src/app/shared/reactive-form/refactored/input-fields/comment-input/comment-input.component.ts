import { Component, forwardRef, inject, Input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CommentsDialogService } from '../../../../comments-dialog/comments-dialog.service';
import { CommentService } from '../../../../../services/comment.service';
import { CommentDto } from '../../../../../models/base/comment.model';

@Component({
  selector: 'app-comment-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="comment-input-wrapper">
      @if (label) {
        <div class="label-container">
          <label>{{ label }}</label>
        </div>
      }
      <div class="comment-preview" [class.disabled]="!canOpenDialog()" (click)="openDialog()">
        @if (!canOpenDialog()) {
          <span class="no-comments">Save first to enable comments</span>
        } @else if (latestComment()) {
          <div class="latest-comment">
            <span class="comment-author">{{ latestComment()!.createdBy }}</span>
            <span class="comment-text">{{ latestComment()!.content }}</span>
          </div>
        } @else {
          <span class="no-comments">No comments</span>
        }
        <button type="button" class="open-dialog-btn" [disabled]="!canOpenDialog()" (click)="openDialog(); $event.stopPropagation()">
          {{ commentCount() > 0 ? commentCount() + ' comment' + (commentCount() > 1 ? 's' : '') : 'Add comment' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .comment-input-wrapper {
      width: 100%;
    }

    .label-container {
      margin-bottom: 4px;
    }

    .label-container label {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-secondary, #666);
    }

    .comment-preview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 10px;
      border: 1px solid var(--border-color, #ddd);
      border-radius: 4px;
      cursor: pointer;
      min-height: 36px;
      background: var(--bg-color, #fff);
    }

    .comment-preview:hover {
      border-color: var(--primary-color, #1976d2);
    }

    .latest-comment {
      flex: 1;
      overflow: hidden;
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .comment-author {
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      color: var(--text-secondary, #888);
    }

    .comment-text {
      font-size: 13px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .no-comments {
      color: var(--text-secondary, #aaa);
      font-size: 13px;
    }

    .open-dialog-btn {
      background: var(--primary-light, #e3f2fd);
      color: var(--primary-color, #1976d2);
      border: none;
      padding: 4px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      white-space: nowrap;
    }

    .open-dialog-btn:hover:not(:disabled) {
      background: var(--primary-color, #1976d2);
      color: white;
    }

    .open-dialog-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .comment-preview.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      border-style: dashed;
    }
  `],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CommentInputComponent),
      multi: true
    }
  ]
})
export class CommentInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() entityType = '';
  @Input() entityId = 0;

  private dialogService = inject(CommentsDialogService);
  private commentService = inject(CommentService);

  latestComment = signal<CommentDto | null>(null);
  commentCount = signal(0);

  private onChange: any = () => {};
  private onTouched: any = () => {};

  writeValue(value: any): void {}
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

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

  canOpenDialog(): boolean {
    return !!(this.entityType && this.entityId);
  }

  openDialog(): void {
    if (!this.entityType || !this.entityId) {
      console.warn('[CommentInput] Cannot open dialog - entityType:', this.entityType, 'entityId:', this.entityId);
      return;
    }
    this.dialogService.open(this.entityType, this.entityId);
    this.onTouched();
  }
}
