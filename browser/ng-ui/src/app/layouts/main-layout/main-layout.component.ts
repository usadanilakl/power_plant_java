import { AfterViewInit, Component, ElementRef, HostListener, inject, input, NgZone, OnDestroy, Renderer2, ViewChild } from '@angular/core';
import { ThemeToggleComponent } from "../../shared/theme-toggle/theme-toggle.component";
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserIconComponent } from "../../auth/user/user-icon/user-icon.component";

@Component({
  selector: 'app-main-layout',
  imports: [ThemeToggleComponent, UserIconComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements AfterViewInit, OnDestroy  {
  @ViewChild('leftMenu') leftMenu!: ElementRef;
  @ViewChild('resizer') resizer!: ElementRef;
  @ViewChild('mainContent') mainContent!: ElementRef;
  @ViewChild('footer') footer!: ElementRef;
  @ViewChild('overlay') overlay!: ElementRef;

  authService = inject(AuthService);
  private router = inject(Router);
  private renderer = inject(Renderer2);

  header = input<string>();
  isSideMenuEnabled= input<boolean>(false);
  isBottomMenuEnabled= input<boolean>(false);
  bottomMenuHeader = input<string | null>(null);
  isLeftMenuEnabled= input<boolean>(false);


  initialFooterHeight = 0;
  initialMouseY = 0;
  mainContentHeight: number = 0;
  isMobileMenuOpen = false;

  isResizing = false;
  isFooterResizing = false;
  menuWidth = 400;
  footerHeight = 0;

  private animationFrameId: number | null = null;
  private footerAnimationFrameId: number | null = null;

  isMobileView = false;
  isMenuVisible: boolean = true;
  
  private mediaQuery: MediaQueryList;
  private resizeObserver?: ResizeObserver;
  
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

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
  login(): void {
    this.router.navigate(['/login']);
  }
}





// import { AfterViewInit, Component, ElementRef, HostListener, inject, input, NgZone, Renderer2, ViewChild } from '@angular/core';

// import { ThemeToggleComponent } from "../../shared/theme-toggle/theme-toggle.component";
// import { Router } from '@angular/router';
// import { AuthService } from '../../auth/auth.service';

// @Component({
//   selector: 'app-main-layout',
//   imports: [ThemeToggleComponent],
//   templateUrl: './main-layout.component.html',
//   styleUrl: './main-layout.component.css'
// })
// export class MainLayoutComponent implements AfterViewInit  {
//   @ViewChild('leftMenu') leftMenu!: ElementRef;
//   @ViewChild('resizer') resizer!: ElementRef;
//   @ViewChild('mainContent') mainContent!: ElementRef;
//   @ViewChild('footer') footer!: ElementRef;
//   @ViewChild('overlay') overlay!: ElementRef;

//   authService = inject(AuthService);
//   private router = inject(Router);
//   private renderer = inject(Renderer2);

//   header = input<string>();
//   isSideMenuEnabled= input<boolean>(false);
//   isBottomMenuEnabled= input<boolean>(false);
//   bottomMenuHeader = input<string | null>(null);
//   isLeftMenuEnabled= input<boolean>(false);


//   initialFooterHeight = 0;
//   initialMouseY = 0;
//   mainContentHeight: number = 0;
//   isMobileMenuOpen = false;

//   isResizing = false;
//   isFooterResizing = false;
//   menuWidth = 400;
//   footerHeight = 0;

//   private animationFrameId: number | null = null;
//   private footerAnimationFrameId: number | null = null;

//   isMobileView = false;
//   isMenuVisible: boolean = true;
  
//   constructor(private ngZone: NgZone) {
//     this.checkIfMobile();
//   }

//   @HostListener('window:resize', ['$event'])
//   onResize(event: any) {
//     this.checkIfMobile();
//   }

//   private checkIfMobile() {
//     this.isMobileView = window.innerWidth <= 768;
//     if (!this.isMobileView && this.leftMenu?.nativeElement.classList.contains('active')) {
//       this.renderer.removeClass(this.leftMenu.nativeElement, 'active');
//       this.renderer.removeClass(this.overlay.nativeElement, 'active');
//     }
//   }

//   ngAfterViewInit() {
//     setTimeout(() => {
//       if (this.footer) {
//         this.footerHeight = this.footer.nativeElement.offsetHeight;
//       }
//       if (!this.isMobileView) {
//         this.leftMenu.nativeElement.style.width = `${this.menuWidth}px`;
//       }
//     });
//   }

//   login(): void {
//     this.router.navigate(['/login']);
//   }

//   logout(): void {
//     this.authService.logout();
//   }

//   toggleMenu() {
//     this.isMenuVisible = !this.isMenuVisible;
//     if (this.isMobileView) {
//       if (this.isMenuVisible) {
//         this.leftMenu.nativeElement.classList.add('active');
//         this.overlay.nativeElement.classList.add('active');
//       } else {
//         this.leftMenu.nativeElement.classList.remove('active');
//         this.overlay.nativeElement.classList.remove('active');
//       }
//     } else {
//       // Desktop behavior
//       this.menuWidth = this.isMenuVisible ? 400 : 0;
//     }
//   }

//   toggleMobileMenu() {
//     if (this.leftMenu.nativeElement.classList.contains('active')) {
//       this.renderer.removeClass(this.leftMenu.nativeElement, 'active');
//       this.renderer.removeClass(this.overlay.nativeElement, 'active');
//     } else {
//       this.renderer.addClass(this.leftMenu.nativeElement, 'active');
//       this.renderer.addClass(this.overlay.nativeElement, 'active');
//     }
//   }

//   onResizerMouseDown(event: MouseEvent) {
//     event.preventDefault();
//     this.isResizing = true;
    
//     this.ngZone.runOutsideAngular(() => {
//       window.addEventListener('mousemove', this.onMouseMove);
//       window.addEventListener('mouseup', this.onMouseUp);
//     });
//   }

//   onMouseMove = (event: MouseEvent) => {
//     if (!this.isResizing) return;
  
//     if (this.animationFrameId) {
//       cancelAnimationFrame(this.animationFrameId);
//     }
  
//     this.animationFrameId = requestAnimationFrame(() => {
//       this.ngZone.run(() => {
//         this.menuWidth = event.clientX;
//       });
//     });
//   }

//   onMouseUp = () => {
//     this.isResizing = false;
//     if (this.animationFrameId) {
//       cancelAnimationFrame(this.animationFrameId);
//       this.animationFrameId = null;
//     }
//     this.ngZone.runOutsideAngular(() => {
//       window.removeEventListener('mousemove', this.onMouseMove);
//       window.removeEventListener('mouseup', this.onMouseUp);
//     });
//   }

//   onFooterResizerMouseDown(event: MouseEvent) {
//     event.preventDefault();
//     this.isFooterResizing = true;
//     this.initialFooterHeight = this.footerHeight;
//     this.initialMouseY = event.clientY;
    
//     this.ngZone.runOutsideAngular(() => {
//       window.addEventListener('mousemove', this.onFooterMouseMove);
//       window.addEventListener('mouseup', this.onFooterMouseUp);
//     });
//   }


//   onFooterMouseMove = (event: MouseEvent) => {
//     if (!this.isFooterResizing) return;
  
//     if (this.footerAnimationFrameId) {
//       cancelAnimationFrame(this.footerAnimationFrameId);
//     }
  
//     this.footerAnimationFrameId = requestAnimationFrame(() => {
//       const deltaY = this.initialMouseY - event.clientY;
//       const newHeight = this.initialFooterHeight + deltaY;
//       const maxHeight = this.mainContent.nativeElement.offsetHeight - 50; // Minimum 50px for main content
      
//       this.ngZone.run(() => {
//         this.footerHeight = Math.max(50, Math.min(newHeight, maxHeight));
//       });
//     });
//   }

//   onFooterMouseUp = () => {
//     this.isFooterResizing = false;
//     if (this.footerAnimationFrameId) {
//       cancelAnimationFrame(this.footerAnimationFrameId);
//       this.footerAnimationFrameId = null;
//     }
//     this.ngZone.runOutsideAngular(() => {
//       window.removeEventListener('mousemove', this.onFooterMouseMove);
//       window.removeEventListener('mouseup', this.onFooterMouseUp);
//     });
//   }
// }





// import { AfterViewInit, Component, ElementRef, inject, input, NgZone, ViewChild } from '@angular/core';

// import { ThemeToggleComponent } from "../../shared/theme-toggle/theme-toggle.component";
// import { Router } from '@angular/router';
// import { AuthService } from '../../auth/auth.service';

// @Component({
//   selector: 'app-main-layout',
//   imports: [ThemeToggleComponent],
//   templateUrl: './main-layout.component.html',
//   styleUrl: './main-layout.component.css'
// })
// export class MainLayoutComponent implements AfterViewInit  {
//   @ViewChild('leftMenu') leftMenu!: ElementRef;
//   @ViewChild('resizer') resizer!: ElementRef;
//   @ViewChild('mainContent') mainContent!: ElementRef;
//   @ViewChild('footer') footer!: ElementRef;

//   authService = inject(AuthService);
//   private router = inject(Router);

//   header = input<string>();
//   isSideMenuEnabled= input<boolean>(false);
//   isBottomMenuEnabled= input<boolean>(false);
//   bottomMenuHeader = input<string | null>(null);
//   isLeftMenuEnabled= input<boolean>(false);


//   initialFooterHeight = 0;
//   initialMouseY = 0;
//   mainContentHeight: number = 0;
//   isMenuVisible: boolean = true;

//   isResizing = false;
//   isFooterResizing = false;
//   menuWidth = 400;
//   footerHeight = 0;

//   // menuItems = input<RouterMenuItems>(MAIN_MENU_ITEMS);
  
//   constructor(private ngZone: NgZone) {}

//   ngAfterViewInit() {
//     // this.menuWidth = this.leftMenu.nativeElement.offsetWidth;
//     if (this.footer) {
//       this.footerHeight = this.footer.nativeElement.offsetHeight;
//     }
//   }

//   login(): void {
//     this.router.navigate(['/login']);
//   }

//   logout(): void {
//     this.authService.logout();
//   }

//   toggleMenu() {
//     this.isMenuVisible = !this.isMenuVisible;
//     this.leftMenu.nativeElement.classList.toggle('collapsed');
//     if (this.leftMenu.nativeElement.classList.contains('collapsed')) {
//       this.menuWidth = 0;
//     } else {
//       this.menuWidth = 200; // or whatever default width you want
//     }
//   }

//   onResizerMouseDown(event: MouseEvent) {
//     event.preventDefault();
//     this.isResizing = true;
    
//     this.ngZone.runOutsideAngular(() => {
//       window.addEventListener('mousemove', this.onMouseMove);
//       window.addEventListener('mouseup', this.onMouseUp);
//     });
//   }

//   onMouseMove = (event: MouseEvent) => {
//     if (!this.isResizing) return;
    
//     this.ngZone.run(() => {
//       this.menuWidth = event.clientX;
//     });
//   }

//   onMouseUp = () => {
//     this.isResizing = false;
//     this.ngZone.runOutsideAngular(() => {
//       window.removeEventListener('mousemove', this.onMouseMove);
//       window.removeEventListener('mouseup', this.onMouseUp);
//     });
//   }

//   onFooterResizerMouseDown(event: MouseEvent) {
//     event.preventDefault();
//     this.isFooterResizing = true;
//     this.initialFooterHeight = this.footerHeight;
//     this.initialMouseY = event.clientY;
    
//     this.ngZone.runOutsideAngular(() => {
//       window.addEventListener('mousemove', this.onFooterMouseMove);
//       window.addEventListener('mouseup', this.onFooterMouseUp);
//     });
//   }


//   onFooterMouseMove = (event: MouseEvent) => {
//     if (!this.isFooterResizing) return;
    
//     this.ngZone.run(() => {
//       const deltaY = this.initialMouseY - event.clientY;
//       const newHeight = this.initialFooterHeight + deltaY;
//       const maxHeight = this.mainContent.nativeElement.offsetHeight - 50; // Minimum 50px for main content
//       this.footerHeight = Math.max(50, Math.min(newHeight, maxHeight));
//     });
//   }

//   onFooterMouseUp = () => {
//     this.isFooterResizing = false;
//     this.ngZone.runOutsideAngular(() => {
//       window.removeEventListener('mousemove', this.onFooterMouseMove);
//       window.removeEventListener('mouseup', this.onFooterMouseUp);
//     });
//   }
// }
