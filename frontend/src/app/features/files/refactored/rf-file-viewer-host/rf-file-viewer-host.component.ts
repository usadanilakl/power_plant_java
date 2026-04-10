import { Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfDisplayIframeComponent } from '../../../../shared/pdf-dislplay-iframe/pdf-dislplay-iframe.component';
import { InteractiveImageComponent } from '../../../../shared/image/refactored/interactive-image/interactive-image.component';
import { RfShape } from '../../../../shared/image/refactored/models/fr-shape.model';
import { environment } from '../../../../../environments/environment';

type ViewerKind = 'pdf' | 'raster' | 'other';

/**
 * Generic file viewer host — picks the right viewer component based on the file
 * extension. Use this when you just need to render a file and don't need the
 * richer LOTO/equipment integration that {@code RfUnifiedImageViewerComponent}
 * provides for raster P&IDs.
 *
 * Registry (keyed by extension, lowercase):
 *   - pdf                           → PdfDisplayIframeComponent
 *   - png/jpg/jpeg/tif/tiff/gif/bmp → InteractiveImageComponent (supports shape markup)
 *   - anything else                 → "unsupported preview — download" fallback card
 *
 * Raster viewing is done via InteractiveImageComponent so callers that pass
 * {@code shapes} still get shape rendering (e.g. equipment markup on a P&ID).
 * Callers that don't pass shapes get a plain image viewer.
 */
@Component({
  selector: 'app-rf-file-viewer-host',
  standalone: true,
  imports: [CommonModule, PdfDisplayIframeComponent, InteractiveImageComponent],
  template: `
    @switch (viewerKind()) {
      @case ('pdf') {
        <app-pdf-display-iframe [pdfSrc]="fileLink()"></app-pdf-display-iframe>
      }
      @case ('raster') {
        <app-interactive-image
          [imageUrl]="fileLink()"
          [shapesInput]="shapes() ?? []"
        ></app-interactive-image>
      }
      @default {
        <div class="unsupported-preview">
          <div class="unsupported-icon">📄</div>
          <p class="unsupported-title">Preview not supported</p>
          <p class="unsupported-hint">
            No built-in viewer for <code>.{{ extension() }}</code> files.
          </p>
          <a class="download-link" [href]="downloadUrl()" target="_blank" rel="noopener">
            Open / download file
          </a>
        </div>
      }
    }
  `,
  styles: [`
    :host { display: block; width: 100%; height: 100%; }
    .unsupported-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      gap: 0.5rem;
      color: var(--color-text-secondary, #888);
      text-align: center;
    }
    .unsupported-icon { font-size: 3rem; }
    .unsupported-title { margin: 0; font-size: 1rem; font-weight: 500; }
    .unsupported-hint { margin: 0; font-size: 0.875rem; }
    .unsupported-hint code {
      background: rgba(255,255,255,0.08);
      padding: 0 0.25rem;
      border-radius: 3px;
    }
    .download-link {
      margin-top: 0.75rem;
      padding: 0.5rem 1rem;
      border: 1px solid var(--color-border, #444);
      border-radius: 4px;
      text-decoration: none;
      color: inherit;
    }
    .download-link:hover { background: rgba(255,255,255,0.05); }
  `]
})
export class RfFileViewerHostComponent {
  /** Path to the file, typically the FileObject.fileLink (relative, e.g. "uploads/pdf/PID/..."). */
  fileLink = input.required<string>();
  /** File extension without the leading dot (e.g. "pdf", "png"). */
  extension = input.required<string>();
  /** Optional shapes for raster viewing — ignored by non-raster viewers. */
  shapes = input<RfShape[] | null>(null);

  viewerKind = computed<ViewerKind>(() => {
    const ext = (this.extension() ?? '').toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['png', 'jpg', 'jpeg', 'tif', 'tiff', 'gif', 'bmp', 'webp'].includes(ext)) return 'raster';
    return 'other';
  });

  downloadUrl = computed(() => {
    const base = environment.baseApiUrl || '';
    const link = this.fileLink() ?? '';
    return base ? `${base}/${link}` : link;
  });
}
