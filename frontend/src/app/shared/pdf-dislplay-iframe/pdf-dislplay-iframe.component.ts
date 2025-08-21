
import { Component, input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

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
export class PdfDisplayIframeComponent implements OnInit {
  pdfSrc = input<string | undefined>('');
  safeUrl: SafeResourceUrl | undefined;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnInit() {
    if (this.pdfSrc()) {
      const fullUrl = `http://localhost:8082/${this.pdfSrc()}`;
      this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
    }
  }

  updateUrl(url: string){
    const fullUrl = `http://localhost:8082/${url}`;
    this.safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }
}
