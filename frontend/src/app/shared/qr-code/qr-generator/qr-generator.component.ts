import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { QrCodeService } from '../qr-code.service';

@Component({
  selector: 'app-qr-generator',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-generator.component.html',
  styleUrls: ['./qr-generator.component.css']
})
export class QrGeneratorComponent implements OnChanges {
  @Input({ required: true }) data!: string;
  @Input() size = 200;
  @Input() label: string | null = null;

  qrCodeHtml: SafeHtml | null = null;

  private sanitizer = inject(DomSanitizer);
  private qrCodeService = inject(QrCodeService);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['size']) {
      this.generateQrCode();
    }
  }

  private async generateQrCode(): Promise<void> {
    if (!this.data) {
      this.qrCodeHtml = null;
      return;
    }

    try {
      const svgString = await this.qrCodeService.toSvgString(this.data, { width: this.size });
      this.qrCodeHtml = this.sanitizer.bypassSecurityTrustHtml(svgString);
    } catch (e) {
      console.error('Could not generate QR code', e);
      this.qrCodeHtml = null;
    }
  }
}