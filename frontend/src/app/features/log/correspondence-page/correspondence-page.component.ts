import {
  Component,
  OnInit,
  DestroyRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EmailCorrespondenceService } from '../../../services/email-correspondence.service';
import { CorrespondenceDialogService } from '../../../shared/correspondence-dialog/correspondence-dialog.service';
import { CorrespondenceDialogComponent } from '../../../shared/correspondence-dialog/correspondence-dialog.component';
import { EmailCorrespondenceDto } from '../../../models/base/email-correspondence.model';
import { SearchCriteria } from '../../../models/api/search-criteria.model';

@Component({
  selector: 'app-correspondence-page',
  standalone: true,
  imports: [CommonModule, FormsModule, CorrespondenceDialogComponent],
  templateUrl: './correspondence-page.component.html',
  styleUrl: './correspondence-page.component.css',
})
export class CorrespondencePageComponent implements OnInit {
  private correspondenceService = inject(EmailCorrespondenceService);
  protected dialogService = inject(CorrespondenceDialogService);
  private destroyRef = inject(DestroyRef);

  items = signal<EmailCorrespondenceDto[]>([]);
  isLoading = signal(false);
  isPolling = signal(false);

  // Filter state
  filterDirection = '';
  filterEntityType = '';
  searchQuery = '';

  // Sort state
  sortColumn: keyof EmailCorrespondenceDto = 'sentDateTime';
  sortAscending = false;

  filteredItems = computed(() => {
    let result = this.items();

    if (this.filterDirection) {
      result = result.filter(i => i.direction === this.filterDirection);
    }
    if (this.filterEntityType) {
      result = result.filter(i => i.entityType === this.filterEntityType);
    }
    const query = this.searchQuery?.trim().toLowerCase();
    if (query) {
      result = result.filter(i =>
        i.subject?.toLowerCase().includes(query) ||
        i.sender?.toLowerCase().includes(query) ||
        i.recipient?.toLowerCase().includes(query) ||
        i.entityType?.toLowerCase().includes(query)
      );
    }

    return [...result].sort((a, b) => {
      const aVal = (a as any)[this.sortColumn] || '';
      const bVal = (b as any)[this.sortColumn] || '';
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return this.sortAscending ? cmp : -cmp;
    });
  });

  uniqueEntityTypes = computed(() => {
    return [...new Set(this.items().map(i => i.entityType).filter(Boolean))];
  });

  unreadCount = computed(() =>
    this.items().filter(i => i.direction === 'INBOUND' && !i.isRead).length
  );

  ngOnInit(): void {
    this.load();

    // Subscribe to SSE for real-time updates
    this.dialogService.correspondenceChanged$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load());
  }

  load(): void {
    this.isLoading.set(true);
    this.correspondenceService.search({} as SearchCriteria, 1, 200).subscribe({
      next: (response) => {
        const content = response.responseData?.content || response.responseData || [];
        this.items.set(
          (Array.isArray(content) ? content : []).map((c: any) => EmailCorrespondenceDto.fromJson(c))
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  sort(column: keyof EmailCorrespondenceDto): void {
    if (this.sortColumn === column) {
      this.sortAscending = !this.sortAscending;
    } else {
      this.sortColumn = column;
      this.sortAscending = false;
    }
  }

  openDialog(item: EmailCorrespondenceDto): void {
    if (item.entityType && item.entityId) {
      this.dialogService.open(item.entityType, item.entityId);
    }
  }

  triggerPoll(): void {
    this.isPolling.set(true);
    this.correspondenceService.triggerPoll().subscribe({
      next: () => {
        setTimeout(() => {
          this.isPolling.set(false);
          this.load();
        }, 2000);
      },
      error: () => {
        this.isPolling.set(false);
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  stripHtml(html: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '⇅';
    return this.sortAscending ? '↑' : '↓';
  }
}
