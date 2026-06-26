
import { Component, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-pdf-display-iframe',
  standalone: true,
  imports: [CommonModule],
  template: `
    <iframe [src]="safeUrl" width="100%" height="100%" frameborder="0"></iframe>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    iframe {
      min-height: 80vh;
    }
  `]
})
export class PdfDisplayIframeComponent {
  pdfSrc = input<string | undefined>('');
  safeUrl: SafeResourceUrl | undefined;

  constructor(private sanitizer: DomSanitizer) {
    // Reactively re-sanitize whenever the input signal changes. The previous
    // ngOnInit-only read meant that switching to a different PDF while this
    // component stayed mounted left the iframe pointing at the original src,
    // so users had to toggle format to force a remount before the new file
    // would render.
    effect(() => {
      const src = this.pdfSrc();
      if (src) {
        const fullUrl = `${environment.baseApiUrl}/${src}`;
        this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
      } else {
        this.safeUrl = undefined;
      }
    });
  }

  updateUrl(url: string){
    const fullUrl = `${environment.baseApiUrl}/${url}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }
}
