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

          @if (content.images?.length) {
            <div class="qa-images">
              @for (img of content.images; track img) {
                <img [src]="img" alt="Help illustration" class="qa-image" />
              }
            </div>
          }

          @if (content.videoUrl) {
            <div class="qa-video">
              <video controls [src]="content.videoUrl" class="qa-video-player">
                Your browser does not support the video tag.
              </video>
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

    .qa-images {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .qa-image {
      max-width: 100%;
      border-radius: 4px;
      border: 1px solid var(--border-color, #e0e0e0);
    }

    .qa-video {
      background: var(--secondary-background, #f0f2f5);
      border-radius: 4px;
      padding: 8px;
    }

    .qa-video-player {
      width: 100%;
      border-radius: 4px;
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
