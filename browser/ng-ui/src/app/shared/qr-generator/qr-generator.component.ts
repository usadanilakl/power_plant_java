import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserQRCodeSvgWriter, QRCodeWriter } from '@zxing/library';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  private writer = new BrowserQRCodeSvgWriter();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['size']) {
      this.generateQrCode();
    }
  }

  private generateQrCode(): void {
    if (!this.data) {
      this.qrCodeHtml = null;
      return;
    }

    try {
      const svgElement = this.writer.write(this.data, this.size, this.size);
      // The writer returns a full SVG element. We need its inner HTML to bind it safely.
      const svgHTML = svgElement.outerHTML;
      this.qrCodeHtml = this.sanitizer.bypassSecurityTrustHtml(svgHTML);
    } catch (e) {
      console.error('Could not generate QR code', e);
      this.qrCodeHtml = null;
    }
  }
}