import { NgClass, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Component, EventEmitter, Input, Output, OnDestroy, OnChanges, SimpleChanges, ElementRef, AfterViewInit, AfterViewChecked, Inject, PLATFORM_ID } from '@angular/core';

@Component({
  selector: 'app-rf-popup-projection',
  standalone: true,
  imports: [NgClass],
  templateUrl: './rf-popup-projection.component.html',
  styleUrl: './rf-popup-projection.component.css'
})
export class RfPopupProjectionComponent implements OnChanges, OnDestroy, AfterViewInit, AfterViewChecked {

  @Input() isOpen: boolean = false;
  @Input() title: string = '';
  @Input() size: 'small' | 'medium' | 'large' | 'xlarge' | 'auto' = 'auto';
  @Input() fullHeight: boolean = false;
  @Input() zIndex: number = 10000;
  @Output() close = new EventEmitter<void>();

  private overlayElement: HTMLElement | null = null;
  private isViewInitialized = false;
  private needsMove = false;
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
        this.needsMove = true;
      } else {
        this.removeFromBody();
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.needsMove) {
      this.moveToBody();
      this.needsMove = false;
    }
  }

  ngOnDestroy(): void {
    this.removeFromBody();
  }

  private moveToBody(): void {
    if (!this.isBrowser) return;

    const overlay = this.elementRef.nativeElement.querySelector('.popup-overlay');
    console.log('[PopupProjection] moveToBody called, title:', this.title, 'overlay found:', !!overlay, 'already moved:', !!this.overlayElement);
    if (overlay && !this.overlayElement) {
      this.overlayElement = overlay;
      this.document.body.appendChild(overlay);
      overlay.style.visibility = 'visible';
    }
  }

  private removeFromBody(): void {
    if (!this.isBrowser) return;

    if (this.overlayElement) {
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
