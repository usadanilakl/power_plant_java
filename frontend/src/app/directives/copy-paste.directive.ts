
import { Directive, HostListener, inject } from '@angular/core';
import { ClipboardService } from '../services/util/clipboard.service';

@Directive({
  selector: '[appCopyPaste]',
  standalone: true
})
export class CopyPasteDirective {
  private clipboardService = inject(ClipboardService);

  // @HostListener('click', ['$event'])
  // onClick(event: MouseEvent): void {
  //   if (event.ctrlKey) {
  //     this.copyToClipboard(event);
  //   } else if (event.shiftKey) {
  //     this.pasteFromClipboard(event);
  //   }
  // }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (event.ctrlKey || event.shiftKey) {
      event.preventDefault(); // Prevents the default action
      event.stopPropagation(); // Stops the event from bubbling up
  
      if (event.ctrlKey) {
        this.copyToClipboard(event);
      } else if (event.shiftKey) {
        this.pasteFromClipboard(event);
      }
    }
  }

  private copyToClipboard(event: MouseEvent): void {
    const target = event.target as HTMLInputElement;
    if (target && target.value) {
      this.clipboardService.setClipboardData(target.value);
    }
  }

  private pasteFromClipboard(event: MouseEvent): void {
    const target = event.target as HTMLInputElement;
    const clipboardData = this.clipboardService.getClipboardData();
    if (target && clipboardData) {
      target.value = clipboardData;
      target.dispatchEvent(new Event('input')); // Trigger change detection
    }
  }
}