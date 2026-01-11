import { NgClass, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnDestroy, OnChanges, SimpleChanges, ElementRef, AfterViewInit, Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-rf-popup-projection',
  standalone: true,
  imports: [NgClass],
  templateUrl: './rf-popup-projection.component.html',
  styleUrl: './rf-popup-projection.component.css'
})
export class RfPopupProjectionComponent implements OnChanges, OnDestroy, AfterViewInit {

  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() size: 'small' | 'medium' | 'large' | 'auto' = 'auto';
  @Input() zIndex: number = 10000;  // Default z-index, can be overridden for nested popups
  @Output() close = new EventEmitter<void>();

  private overlayElement: HTMLElement | null = null;
  private isViewInitialized = false;
  private isBrowser: boolean;

  constructor(
    private elementRef: ElementRef,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    if (this.isOpen) {
      this.moveToBody();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isViewInitialized) {
      if (this.isOpen) {
        // Use setTimeout to ensure the DOM is ready
        setTimeout(() => this.moveToBody(), 0);
      } else {
        this.removeFromBody();
      }
    }
  }

  ngOnDestroy(): void {
    this.removeFromBody();
  }

  private moveToBody(): void {
    if (!this.isBrowser) return;

    // Find the popup-overlay element within this component
    const overlay = this.elementRef.nativeElement.querySelector('.popup-overlay');
    if (overlay && !this.overlayElement) {
      this.overlayElement = overlay;
      // Move the overlay to the document body
      this.document.body.appendChild(overlay);
    }
  }

  private removeFromBody(): void {
    if (!this.isBrowser) return;

    if (this.overlayElement) {
      // Check if element is still in body before trying to remove
      if (this.overlayElement.parentNode === this.document.body) {
        this.document.body.removeChild(this.overlayElement);
      }
      this.overlayElement = null;
    }
  }

  onClose() {
    this.close.emit();
  }
}
