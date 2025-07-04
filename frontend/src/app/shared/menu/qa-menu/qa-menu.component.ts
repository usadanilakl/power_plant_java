import { Component, Input, Output, EventEmitter, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Question } from '../../../models/ui/question.model';

interface Link {
  title: string;
  url: string;
}

@Component({
  selector: 'app-qa-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qa-menu.component.html',
  styleUrls: ['./qa-menu.component.css']
})
export class QaMenuComponent {
  question = input<Question | null>(null);
  closePopupEvent = output<void>();

  files = computed(() => {return this.question()?.files || []});


  constructor(private sanitizer: DomSanitizer) {}

  closePopup() {
    this.closePopupEvent.emit();
  }

  handleLinkClick(event: Event, link: string) {
    event.preventDefault();
    const fileExtension = this.getFileExtension(link);

    switch (fileExtension) {
      case 'pdf':
        this.openPdf(link);
        break;
      case 'xlsx':
      case 'xls':
        this.downloadExcel(link);
        break;
      case 'mp4':
      case 'avi':
      case 'mov':
        this.openVideo(link);
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        this.openImage(link);
        break;
      default:
        window.open(link, '_blank');
    }
  }

  private getFileExtension(url: string): string {
    return url.split('.').pop()?.toLowerCase() || '';
  }

  private openPdf(url: string) {
    window.open(url, '_blank');
  }

  private downloadExcel(url: string) {
    const link = document.createElement('a');
    link.href = url;
    link.download = 'document.xlsx';
    link.click();
  }

  private openVideo(url: string) {
    // You might want to use a video player component or library here
    window.open(url, '_blank');
  }

  private openImage(url: string) {
    const safeUrl: SafeUrl = this.sanitizer.bypassSecurityTrustUrl(url);
    // You might want to use an image viewer component or library here
    window.open(safeUrl.toString(), '_blank');
  }
}
