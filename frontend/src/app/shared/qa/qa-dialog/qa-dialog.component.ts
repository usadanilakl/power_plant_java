import { Component, inject } from '@angular/core';
import { PopupProjectionComponent } from '../../popup-projection/popup-projection.component';
import { QaService } from '../../../services/qa/qa.service';

@Component({
  selector: 'app-qa-dialog',
  standalone: true,
  imports: [PopupProjectionComponent],
  template: `
    <app-popup-projection
      [isOpen]="qaService.isDialogVisible()"
      [title]="'Help Information'"
      size="medium"
      (close)="qaService.closeDialog()"
    >
      @if (qaService.activeContent(); as content) {
        <div class="qa-dialog-content">
          @if (content.text) {
            <div class="qa-text" [innerHTML]="content.text"></div>
          }

          @if (content.media?.length) {
            <div class="qa-media-list">
              @for (item of content.media; track $index) {
                <div class="qa-media-item">
                  @if (item.type === 'image') {
                    <img [src]="item.url" alt="Help illustration" class="qa-image" />
                  } @else if (item.type === 'video') {
                    <video controls [src]="item.url" class="qa-video-player">
                      Your browser does not support the video tag.
                    </video>
                  }
                  @if (item.caption) {
                    <div class="qa-media-caption" [innerHTML]="item.caption"></div>
                  }
                </div>
              }
            </div>
          }

          @if (content.files?.length) {
            <div class="qa-files">
              <h3>Related Resources</h3>
              <ul>
                @for (file of content.files; track file) {
                  <li>
                    <a href="#" (click)="handleFileClick($event, file)">
                      {{ getFileName(file) }}
                    </a>
                  </li>
                }
              </ul>
            </div>
          }
        </div>
      }
    </app-popup-projection>
  `,
  styles: [`
    .qa-dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .qa-text {
      line-height: 1.6;
      color: var(--primary-text, #333);
    }

    .qa-media-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .qa-media-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px;
      background: var(--secondary-background, #f8f9fa);
      border-radius: 6px;
      border: 1px solid var(--border-color, #e0e0e0);
    }

    .qa-image {
      max-width: 100%;
      border-radius: 4px;
    }

    .qa-video-player {
      width: 100%;
      border-radius: 4px;
    }

    .qa-media-caption {
      font-size: 0.9em;
      color: var(--secondary-text, #666);
      line-height: 1.5;
      padding: 8px 0 0 0;
      border-top: 1px solid var(--border-color, #e0e0e0);
    }

    .qa-files h3 {
      margin: 0 0 8px 0;
      font-size: 0.95em;
      color: var(--secondary-text, #666);
    }

    .qa-files ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .qa-files li {
      padding: 4px 0;
    }

    .qa-files a {
      color: var(--accent-color, #007bff);
      text-decoration: none;
      cursor: pointer;
    }

    .qa-files a:hover {
      text-decoration: underline;
      color: var(--accent-color-hover, #0056b3);
    }
  `]
})
export class QaDialogComponent {
  qaService = inject(QaService);

  handleFileClick(event: Event, link: string): void {
    event.preventDefault();
    const ext = link.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'xlsx':
      case 'xls': {
        const a = document.createElement('a');
        a.href = link;
        a.download = link.split('/').pop() || 'document.xlsx';
        a.click();
        break;
      }
      default:
        window.open(link, '_blank');
    }
  }

  getFileName(url: string): string {
    return url.split('/').pop() || url;
  }
}
