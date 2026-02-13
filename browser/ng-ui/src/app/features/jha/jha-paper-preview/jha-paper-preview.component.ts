import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Jha } from '../../../models/permits/jha.model';
import { buildJhaHtml } from '../jha-image/jha-image.util';

@Component({
  selector: 'app-jha-paper-preview',
  standalone: true,
  templateUrl: './jha-paper-preview.component.html',
  styleUrl: './jha-paper-preview.component.css'
})
export class JhaPaperPreviewComponent {
  private sanitizer = inject(DomSanitizer);

  jha = input<Jha>(new Jha());

  paperHtml = computed<SafeHtml>(() => {
    const html = buildJhaHtml(this.jha());
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });
}
