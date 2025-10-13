import { AfterViewInit, Component, ElementRef, input, NgZone, ViewChild } from '@angular/core';

import { ThemeToggleComponent } from "../../shared/theme-toggle/theme-toggle.component";

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

  header = input<string>();
  isBottomMenuEnabled= input<boolean>(false);
  bottomMenuHeader = input<string | null>(null);
  isLeftMenuEnabled= input<boolean>(false);


  initialFooterHeight = 0;
  initialMouseY = 0;
  mainContentHeight: number = 0;
  isMenuVisible: boolean = true;

  isResizing = false;
  isFooterResizing = false;
  menuWidth = 400;
  footerHeight = 0;

  // menuItems = input<RouterMenuItems>(MAIN_MENU_ITEMS);
  
  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    // this.menuWidth = this.leftMenu.nativeElement.offsetWidth;
    if (this.footer) {
      this.footerHeight = this.footer.nativeElement.offsetHeight;
    }
  }

  toggleMenu() {
    this.isMenuVisible = !this.isMenuVisible;
    this.leftMenu.nativeElement.classList.toggle('collapsed');
    if (this.leftMenu.nativeElement.classList.contains('collapsed')) {
      this.menuWidth = 0;
    } else {
      this.menuWidth = 200; // or whatever default width you want
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
    
    this.ngZone.run(() => {
      this.menuWidth = event.clientX;
    });
  }

  onMouseUp = () => {
    this.isResizing = false;
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
    
    this.ngZone.run(() => {
      const deltaY = this.initialMouseY - event.clientY;
      const newHeight = this.initialFooterHeight + deltaY;
      const maxHeight = this.mainContent.nativeElement.offsetHeight - 50; // Minimum 50px for main content
      this.footerHeight = Math.max(50, Math.min(newHeight, maxHeight));
    });
  }

  onFooterMouseUp = () => {
    this.isFooterResizing = false;
    this.ngZone.runOutsideAngular(() => {
      window.removeEventListener('mousemove', this.onFooterMouseMove);
      window.removeEventListener('mouseup', this.onFooterMouseUp);
    });
  }
}
