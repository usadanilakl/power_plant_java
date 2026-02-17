import { Component, inject, Input, OnChanges, DestroyRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmailCorrespondenceService } from '../../services/email-correspondence.service';
import { EmailCorrespondenceDto } from '../../models/base/email-correspondence.model';
import { CorrespondenceDialogService } from './correspondence-dialog.service';

@Component({
  selector: 'app-correspondence-cell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="correspondence-cell" (click)="openDialog($event)">
      @if (unreadCount() > 0) {
        <span class="unread-badge">{{ unreadCount() }} new</span>
      } @else if (totalCount() > 0) {
        <span class="total-badge">{{ totalCount() }}</span>
      } @else {
        <span class="muted-text">—</span>
      }
    </div>
  `,
  styles: [`
    .correspondence-cell {
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      width: 100%;
    }

    .correspondence-cell:hover {
      opacity: 0.8;
    }

    .unread-badge {
      background: var(--success-color, #388e3c);
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
    }

    .total-badge {
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
    }

    .muted-text {
      color: var(--text-muted, #aaa);
      font-size: 12px;
    }
  `]
})
export class CorrespondenceCellComponent implements OnChanges {
  @Input() entityType = '';
  @Input() entityId = 0;

  private correspondenceService = inject(EmailCorrespondenceService);
  private dialogService = inject(CorrespondenceDialogService);
  private destroyRef = inject(DestroyRef);

  unreadCount = signal(0);
  totalCount = signal(0);

  constructor() {
    // Reload on correspondence changes (SSE from other clients or local mutations)
    this.dialogService.correspondenceChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (!event || (event.entityType === this.entityType && event.entityId === this.entityId)) {
          if (this.entityType && this.entityId) {
            this.loadCounts();
          }
        }
      });
  }

  ngOnChanges(): void {
    if (this.entityType && this.entityId) {
      this.loadCounts();
    }
  }

  loadCounts(): void {
    this.correspondenceService.getForEntity(this.entityType, this.entityId).subscribe({
      next: (response) => {
        const items = (response.responseData || []).map(c => EmailCorrespondenceDto.fromJson(c));
        this.totalCount.set(items.length);
        this.unreadCount.set(items.filter(c => c.direction === 'INBOUND' && !c.isRead).length);
      }
    });
  }

  openDialog(event: Event): void {
    event.stopPropagation();
    if (!this.entityType || !this.entityId) return;
    this.dialogService.open(this.entityType, this.entityId);
  }
}
