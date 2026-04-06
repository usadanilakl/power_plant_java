import { Component, inject, output, signal, computed, effect, TemplateRef, viewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { TableComponent } from '../../../../shared/table/refactored/table.component';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { RfFieldListStateService } from '../services/rf-field-list-state.service';
import { RfFieldListApiService } from '../services/rf-field-list-api.service';
import { RfFieldListContextMenuService } from '../services/rf-field-list-context-menu.service';
import { RfFieldListTableClickService } from '../services/rf-field-list-table-click.service';
import { FieldListItemDto } from '../../../../models/field-list/field-list-item.model';
import { Column } from '../../../../models/column.model';

interface Attachment {
  id: number;
  fileName: string;
  contentType: string;
  base64Content: string;
}

@Component({
  selector: 'app-rf-field-list-table',
  standalone: true,
  imports: [TableComponent, CommonModule],
  providers: [
    TableSearchService,
    TableStateService,
    TableSelectionService,
    TableSortService,
    TableDragService,
    TableResizeService,
    TableSyncService,
    { provide: TableClickService, useClass: RfFieldListTableClickService },
    TableControlsService,
    TableDataService,
  ],
  template: `
    <div class="table-wrapper">
      <app-table
        [tableId]="'field-list-items'"
        [items]="items()"
        [columns]="columns()"
        (selectedItemsEvent)="selectedItemsEvent.emit($event)"
        (rowDoubleClicked)="onRowDoubleClick($event)">
      </app-table>
    </div>

    <!-- Custom template for image thumbnail column -->
    <ng-template #imageTpl let-item let-column="column">
      @if (item.attachmentCount > 0) {
        @if (getFirstImage(item.id)) {
          <img [src]="getFirstImage(item.id)!"
               class="cell-thumbnail"
               (click)="onThumbnailClick($event, item)"
               alt="Attachment">
        } @else if (isLoadingImages(item.id)) {
          <span class="cell-loading">...</span>
        } @else {
          <span class="cell-file-icon" (click)="onThumbnailClick($event, item)">&#x1F4CE; {{ item.attachmentCount }}</span>
        }
      }
    </ng-template>

    <!-- Custom template for actions column -->
    <ng-template #actionsTpl let-item let-column="column">
      <button class="cell-btn" (click)="onViewDetails($event, item)" title="View details">&#x1F50D;</button>
    </ng-template>

    <!-- Lightbox overlay -->
    @if (lightboxSrc()) {
      <div class="lightbox" (click)="lightboxSrc.set(null)">
        <img [src]="lightboxSrc()!" alt="Full size" class="lightbox-img" (click)="$event.stopPropagation()">
        <button class="lightbox-close" (click)="lightboxSrc.set(null)">&times;</button>
        @if (lightboxImages().length > 1) {
          <button class="lightbox-nav lightbox-prev" (click)="onLightboxNav($event, -1)">&#x276E;</button>
          <button class="lightbox-nav lightbox-next" (click)="onLightboxNav($event, 1)">&#x276F;</button>
          <div class="lightbox-counter">{{ lightboxIndex() + 1 }} / {{ lightboxImages().length }}</div>
        }
      </div>
    }
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
    .table-wrapper {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      overflow: hidden;
    }
    .cell-thumbnail {
      width: 36px;
      height: 36px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      border: 1px solid var(--border-color);
      transition: transform 0.15s;
    }
    .cell-thumbnail:hover { transform: scale(1.5); z-index: 10; position: relative; }
    .cell-loading { color: var(--secondary-text); font-size: 11px; }
    .cell-file-icon { cursor: pointer; font-size: 13px; }
    .cell-file-icon:hover { opacity: 0.7; }
    .cell-btn {
      background: none; border: none; cursor: pointer; font-size: 16px;
      padding: 2px 6px; border-radius: 4px; line-height: 1;
    }
    .cell-btn:hover { background: var(--hover-background); }

    /* Lightbox */
    .lightbox {
      position: fixed; inset: 0; background: rgba(0,0,0,0.9);
      display: flex; align-items: center; justify-content: center;
      z-index: 10000; cursor: pointer;
    }
    .lightbox-img { max-width: 90vw; max-height: 90vh; object-fit: contain; cursor: default; border-radius: 4px; }
    .lightbox-close {
      position: fixed; top: 16px; right: 16px; background: none; border: none;
      color: white; font-size: 36px; cursor: pointer; z-index: 10001;
    }
    .lightbox-nav {
      position: fixed; top: 50%; background: rgba(255,255,255,0.15); border: none;
      color: white; font-size: 28px; cursor: pointer; padding: 12px 16px;
      border-radius: 4px; transform: translateY(-50%);
    }
    .lightbox-nav:hover { background: rgba(255,255,255,0.3); }
    .lightbox-prev { left: 16px; }
    .lightbox-next { right: 16px; }
    .lightbox-counter {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      color: rgba(255,255,255,0.8); font-size: 14px;
    }
  `]
})
export class RfFieldListTableComponent implements AfterViewInit {
  private stateService = inject(RfFieldListStateService);
  private apiService = inject(RfFieldListApiService);

  selectedItemsEvent = output<FieldListItemDto[]>();

  // Template refs for custom columns
  imageTpl = viewChild.required<TemplateRef<any>>('imageTpl');
  actionsTpl = viewChild.required<TemplateRef<any>>('actionsTpl');

  private items$ = toSignal(this.stateService.allItems$, { initialValue: [] as FieldListItemDto[] });
  items = computed(() => this.items$());

  columns = signal<Column[]>([]);

  // Attachment image cache: itemId -> first image src (data URI)
  private imageCache = new Map<number, string | null>();
  private loadingSet = new Set<number>();

  // Lightbox state
  lightboxSrc = signal<string | null>(null);
  lightboxImages = signal<string[]>([]);
  lightboxIndex = signal(0);

  // All attachments cache for lightbox navigation
  private attachmentsCache = new Map<number, Attachment[]>();

  constructor() {
    // Load images when items change
    effect(() => {
      const items = this.items();
      for (const item of items) {
        if (item.attachmentCount > 0 && item.id && !this.imageCache.has(item.id) && !this.loadingSet.has(item.id)) {
          this.loadAttachments(item.id);
        }
      }
    });
  }

  onRowDoubleClick(item: any): void {
    console.log('[FieldList Table] onRowDoubleClick fired:', item?.id, item?.title);
    this.stateService.openDetail(item);
  }

  ngAfterViewInit(): void {
    // Build columns with custom templates now that ViewChild refs are available
    const baseColumns = FieldListItemDto.toTableColumns();

    // Insert image column at position 0, actions column at the end
    const imageCol: Column = {
      id: 'image',
      header: '',
      width: 50,
      sortable: false,
      filterable: false,
      template: this.imageTpl(),
      accessorFn: () => '',
    };
    const actionsCol: Column = {
      id: 'actions',
      header: '',
      width: 44,
      sortable: false,
      filterable: false,
      template: this.actionsTpl(),
      accessorFn: () => '',
    };

    // Remove the old attachmentCount column — replaced by image thumbnail
    const filtered = baseColumns.filter(c => c.id !== 'attachmentCount');
    this.columns.set([imageCol, ...filtered, actionsCol]);
  }

  getFirstImage(itemId: number): string | null {
    return this.imageCache.get(itemId) ?? null;
  }

  isLoadingImages(itemId: number): boolean {
    return this.loadingSet.has(itemId);
  }

  private loadAttachments(itemId: number): void {
    this.loadingSet.add(itemId);
    this.apiService.getAttachments(itemId).subscribe({
      next: res => {
        const attachments: Attachment[] = res.responseData || [];
        this.attachmentsCache.set(itemId, attachments);

        const firstImage = attachments.find(a => a.contentType?.startsWith('image/'));
        if (firstImage?.base64Content) {
          const src = firstImage.base64Content.startsWith('data:')
            ? firstImage.base64Content
            : `data:${firstImage.contentType};base64,${firstImage.base64Content}`;
          this.imageCache.set(itemId, src);
        } else {
          this.imageCache.set(itemId, null);
        }
        this.loadingSet.delete(itemId);
      },
      error: () => {
        this.imageCache.set(itemId, null);
        this.loadingSet.delete(itemId);
      }
    });
  }

  onThumbnailClick(event: MouseEvent, item: FieldListItemDto): void {
    event.stopPropagation();
    const attachments = this.attachmentsCache.get(item.id!) || [];
    const images = attachments
      .filter(a => a.contentType?.startsWith('image/'))
      .map(a => a.base64Content?.startsWith('data:')
        ? a.base64Content
        : `data:${a.contentType};base64,${a.base64Content}`);

    if (images.length > 0) {
      this.lightboxImages.set(images);
      this.lightboxIndex.set(0);
      this.lightboxSrc.set(images[0]);
    } else {
      // No images loaded yet — open detail dialog instead
      this.stateService.openDetail(item);
    }
  }

  onLightboxNav(event: MouseEvent, direction: number): void {
    event.stopPropagation();
    const images = this.lightboxImages();
    let idx = this.lightboxIndex() + direction;
    if (idx < 0) idx = images.length - 1;
    if (idx >= images.length) idx = 0;
    this.lightboxIndex.set(idx);
    this.lightboxSrc.set(images[idx]);
  }

  onViewDetails(event: MouseEvent, item: FieldListItemDto): void {
    event.stopPropagation();
    this.stateService.openDetail(item);
  }
}
