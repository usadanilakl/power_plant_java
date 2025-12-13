import { AfterViewInit, Component, ElementRef, HostListener, inject, input, NgZone, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { ThemeToggleComponent } from "../../shared/theme-toggle/theme-toggle.component";
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-main-layout',
  imports: [ThemeToggleComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements AfterViewInit, OnDestroy  {
  @ViewChild('leftMenu') leftMenu!: ElementRef;
  @ViewChild('resizer') resizer!: ElementRef;
  @ViewChild('mainContent') mainContent!: ElementRef;
  @ViewChild('footer') footer!: ElementRef;
  @ViewChild('overlay') overlay!: ElementRef;

  private router = inject(Router);
  private renderer = inject(Renderer2);

  header = input<string>();
  isSideMenuEnabled= input<boolean>(false);
  isBottomMenuEnabled= input<boolean>(false);
  bottomMenuHeader = input<string | null>(null);
  isLeftMenuEnabled= input<boolean>(false);


  initialFooterHeight = 0;
  initialMouseY = 0;
  mainContentHeight = 0;
  isMobileMenuOpen = false;

  isResizing = false;
  isFooterResizing = false;
  menuWidth = 400;
  footerHeight = 0;

  private animationFrameId: number | null = null;
  private footerAnimationFrameId: number | null = null;

  isMobileView = false;
  isMenuVisible = true;
  
  private mediaQuery: MediaQueryList;
  private resizeObserver?: ResizeObserver;
  
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(private ngZone: NgZone) {
    // Use matchMedia for more reliable mobile detection
    this.mediaQuery = window.matchMedia('(max-width: 768px)');
    this.isMobileView = this.mediaQuery.matches;
    
    // Listen for media query changes
    this.mediaQuery.addEventListener('change', this.handleMediaQueryChange);
    
    // Fix for Android viewport height issues
    this.updateViewportHeight();
    window.addEventListener('resize', this.updateViewportHeight);
    window.addEventListener('orientationchange', this.updateViewportHeight);
  }

  
  ngOnDestroy() {
    this.mediaQuery.removeEventListener('change', this.handleMediaQueryChange);
    window.removeEventListener('resize', this.updateViewportHeight);
    window.removeEventListener('orientationchange', this.updateViewportHeight);
    
    // Clean up overlay listener
    if (this.overlay?.nativeElement) {
      this.overlay.nativeElement.removeEventListener('click', this.onOverlayClick);
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private updateViewportHeight = () => {
    // Fix for Android browsers where 100vh includes the address bar
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  }

  private handleMediaQueryChange = (e: MediaQueryListEvent) => {
    const wasMobile = this.isMobileView;
    this.isMobileView = e.matches;
    
    this.ngZone.run(() => {
      // If switching from mobile to desktop
      if (wasMobile && !this.isMobileView && this.leftMenu?.nativeElement) {
        this.renderer.removeClass(this.leftMenu.nativeElement, 'active');
        if (this.overlay?.nativeElement) {
          this.renderer.removeClass(this.overlay.nativeElement, 'active');
        }
        this.leftMenu.nativeElement.style.width = `${this.menuWidth}px`;
        this.isMenuVisible = true;
        this.renderer.removeClass(document.body, 'menu-open');
      }
      
      // If switching from desktop to mobile
      if (!wasMobile && this.isMobileView && this.leftMenu?.nativeElement) {
        this.leftMenu.nativeElement.style.width = '';
        this.isMenuVisible = false;
        this.renderer.removeClass(this.leftMenu.nativeElement, 'active');
        if (this.overlay?.nativeElement) {
          this.renderer.removeClass(this.overlay.nativeElement, 'active');
        }
        this.renderer.removeClass(document.body, 'menu-open');
      }
    });
  }

  ngAfterViewInit() {
    // Double-check mobile state after view init
    setTimeout(() => {
      this.isMobileView = this.mediaQuery.matches;
      
      if (this.footer) {
        this.footerHeight = this.footer.nativeElement.offsetHeight;
      }
      
      // Only set width for desktop view
      if (!this.isMobileView && this.leftMenu?.nativeElement) {
        this.leftMenu.nativeElement.style.width = `${this.menuWidth}px`;
        this.isMenuVisible = true;
      } else {
        this.isMenuVisible = false;
      }
      
      // Update viewport height after view initialization
      this.updateViewportHeight();
    
    // Add click listener to overlay for mobile
    if (this.overlay?.nativeElement) {
      this.overlay.nativeElement.addEventListener('click', this.onOverlayClick);
    }
    }, 0);
  }

/**
 * Handle overlay click - only close menu if clicking directly on overlay
 */
onOverlayClick = (event: MouseEvent) => {
  // Only close if the click target is the overlay itself, not its children
  if (event.target === this.overlay.nativeElement) {
    this.closeMenu();
  }
}

  toggleMenu() {
    if (this.isMobileView) {
      // Mobile behavior
      this.isMenuVisible = !this.isMenuVisible;
      if (this.isMenuVisible) {
        this.renderer.addClass(this.leftMenu.nativeElement, 'active');
        this.renderer.addClass(this.overlay.nativeElement, 'active');
        // Prevent body scroll
        this.renderer.addClass(document.body, 'menu-open');
        // Force repaint on Android
        this.leftMenu.nativeElement.style.transform = 'translateZ(0)';
      } else {
        this.renderer.removeClass(this.leftMenu.nativeElement, 'active');
        this.renderer.removeClass(this.overlay.nativeElement, 'active');
        // Re-enable body scroll
        this.renderer.removeClass(document.body, 'menu-open');
      }
    } else {
      // Desktop behavior
      this.isMenuVisible = !this.isMenuVisible;
      if (this.isMenuVisible) {
        this.menuWidth = 400;
        this.leftMenu.nativeElement.style.width = `${this.menuWidth}px`;
      } else {
        this.menuWidth = 0;
        this.leftMenu.nativeElement.style.width = '0px';
      }
    }
  }

  closeMenu() {
    if (this.isMobileView && this.isMenuVisible) {
      this.toggleMenu();
    }
  }

  onResizerMouseDown(event: MouseEvent) {
    if (this.isMobileView) return; // Disable resizing on mobile
    
    event.preventDefault();
    this.isResizing = true;
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
    });
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.isResizing || this.isMobileView) return;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      const newWidth = event.clientX;
      if (newWidth > 200 && newWidth < window.innerWidth * 0.8) {
        this.menuWidth = newWidth;
        this.leftMenu.nativeElement.style.width = `${newWidth}px`;
      }
    });
  }

  onMouseUp = () => {
    if (!this.isResizing) return;
    
    this.isResizing = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  }

  onFooterResizerMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isFooterResizing = true;
    this.initialMouseY = event.clientY;
    this.initialFooterHeight = this.footer.nativeElement.offsetHeight;

    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onFooterMouseMove);
      document.addEventListener('mouseup', this.onFooterMouseUp);
    });
  }

  onFooterMouseMove = (event: MouseEvent) => {
    if (!this.isFooterResizing) return;

    if (this.footerAnimationFrameId !== null) {
      cancelAnimationFrame(this.footerAnimationFrameId);
    }

    this.footerAnimationFrameId = requestAnimationFrame(() => {
      const deltaY = this.initialMouseY - event.clientY;
      const newHeight = this.initialFooterHeight + deltaY;
      const minHeight = 100;
      const maxHeight = window.innerHeight * 0.8;

      if (newHeight >= minHeight && newHeight <= maxHeight) {
        this.footerHeight = newHeight;
        this.footer.nativeElement.style.height = `${newHeight}px`;
      }
    });
  }

  onFooterMouseUp = () => {
    if (!this.isFooterResizing) return;
    
    this.isFooterResizing = false;
    if (this.footerAnimationFrameId !== null) {
      cancelAnimationFrame(this.footerAnimationFrameId);
      this.footerAnimationFrameId = null;
    }
    document.removeEventListener('mousemove', this.onFooterMouseMove);
    document.removeEventListener('mouseup', this.onFooterMouseUp);
  }

}



