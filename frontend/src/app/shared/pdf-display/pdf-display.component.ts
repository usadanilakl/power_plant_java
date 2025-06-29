import { Component, input, Input, PLATFORM_ID, Inject, OnInit } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { PDFProgressData } from 'ng2-pdf-viewer';

@Component({
  selector: 'app-pdf-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="pdfViewerComponent">
      <ng-container *ngComponentOutlet="pdfViewerComponent; inputs: pdfViewerInputs"></ng-container>
    </ng-container>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    ::ng-deep .ng2-pdf-viewer-container {
      width: 100%;
      height: 100%;
      min-height: 80vh;
    }
    ::ng-deep pdf-viewer {
      display: block;
      width: 100%;
      height: 80vh;
    }
  `]
})
export class PdfDisplayComponent implements OnInit {
  pdfSrc = input<string | Uint8Array | undefined>('');
  pdfViewerComponent: any;
  pdfViewerInputs: any;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  async ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      const { PdfViewerComponent } = await import('ng2-pdf-viewer');
      this.pdfViewerComponent = PdfViewerComponent;
      this.pdfViewerInputs = {
        src: 'http://localhost:8082/' + this.pdfSrc(),
        render_text: true,
        original_size: false,
        show_all: true,
        fit_to_page: true,
        zoom: 1,
        zoom_scale: 'page-width',
        stick_to_page: false,
        rotation: 0,
        autoresize: true,
        show_borders: false,
        external_link_target: '_blank',
        page: 1,
        [Symbol.for('progress')]: (progressData: PDFProgressData) => {
          console.log(progressData);
        },
      };
    }
  }
}
