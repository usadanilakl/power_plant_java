import { AfterViewInit, Component, ElementRef, HostListener, inject, input, NgZone, Renderer2, ViewChild } from '@angular/core';

import { ThemeToggleComponent } from "../../shared/theme-toggle/theme-toggle.component";
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-main-layout',
  imports: [ThemeToggleComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent implements AfterViewInit  {
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
  
  constructor(private ngZone: NgZone) {
    this.checkIfMobile();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkIfMobile();
  }

  private checkIfMobile() {
    this.isMobileView = window.innerWidth <= 768;
    if (!this.isMobileView && this.leftMenu?.nativeElement.classList.contains('active')) {
      this.renderer.removeClass(this.leftMenu.nativeElement, 'active');
      this.renderer.removeClass(this.overlay.nativeElement, 'active');
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.footer) {
        this.footerHeight = this.footer.nativeElement.offsetHeight;
      }
      if (!this.isMobileView) {
        this.leftMenu.nativeElement.style.width = `${this.menuWidth}px`;
      }
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  logout(): void {
    this.authService.logout();
  }

  toggleMenu() {
    if (this.isMobileView) {
      this.toggleMobileMenu();
    } else {
      this.isMenuVisible = !this.isMenuVisible;
      this.menuWidth = this.isMenuVisible ? 400 : 0;
      this.leftMenu.nativeElement.style.width = `${this.menuWidth}px`;
      this.leftMenu.nativeElement.classList.toggle('collapsed', !this.isMenuVisible);
      this.resizer.nativeElement.classList.toggle('collapsed', !this.isMenuVisible);
    }
  }

  toggleMobileMenu() {
    if (this.leftMenu.nativeElement.classList.contains('active')) {
      this.renderer.removeClass(this.leftMenu.nativeElement, 'active');
      this.renderer.removeClass(this.overlay.nativeElement, 'active');
    } else {
      this.renderer.addClass(this.leftMenu.nativeElement, 'active');
      this.renderer.addClass(this.overlay.nativeElement, 'active');
    }
  }

  onResizerMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;
    
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
    });
  }

  onMouseMove = (event: MouseEvent) => {
    if (!this.isResizing) return;
  
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  
    this.animationFrameId = requestAnimationFrame(() => {
      this.ngZone.run(() => {
        this.menuWidth = event.clientX;
      });
    });
  }

  onMouseUp = () => {
    this.isResizing = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.ngZone.runOutsideAngular(() => {
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
    });
  }

  onFooterResizerMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isFooterResizing = true;
    this.initialFooterHeight = this.footerHeight;
    this.initialMouseY = event.clientY;
    
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('mousemove', this.onFooterMouseMove);
      window.addEventListener('mouseup', this.onFooterMouseUp);
    });
  }


  onFooterMouseMove = (event: MouseEvent) => {
    if (!this.isFooterResizing) return;
  
    if (this.footerAnimationFrameId) {
      cancelAnimationFrame(this.footerAnimationFrameId);
    }
  
    this.footerAnimationFrameId = requestAnimationFrame(() => {
      const deltaY = this.initialMouseY - event.clientY;
      const newHeight = this.initialFooterHeight + deltaY;
      const maxHeight = this.mainContent.nativeElement.offsetHeight - 50; // Minimum 50px for main content
      
      this.ngZone.run(() => {
        this.footerHeight = Math.max(50, Math.min(newHeight, maxHeight));
      });
    });
  }

  onFooterMouseUp = () => {
    this.isFooterResizing = false;
    if (this.footerAnimationFrameId) {
      cancelAnimationFrame(this.footerAnimationFrameId);
      this.footerAnimationFrameId = null;
    }
    this.ngZone.runOutsideAngular(() => {
      window.removeEventListener('mousemove', this.onFooterMouseMove);
      window.removeEventListener('mouseup', this.onFooterMouseUp);
    });
  }
}


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
