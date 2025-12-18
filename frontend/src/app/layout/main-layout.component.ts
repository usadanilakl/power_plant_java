import { Component, AfterViewInit, ElementRef, ViewChild, NgZone, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MAIN_MENU_ITEMS, RouterMenuItems } from '../models/ui/router-menu.model';
import { RouterMenuComponent } from "../shared/menu/router-menu/router-menu.component";
import { ClipboardComponent } from "../shared/clipboard/clipboard.component";

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    RouterMenuComponent,
    ClipboardComponent,
  ],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css'],
})
export class MainLayoutComponent implements AfterViewInit {
  @ViewChild('leftMenu') leftMenu!: ElementRef;
  @ViewChild('resizer') resizer!: ElementRef;
  @ViewChild('mainContent') mainContent!: ElementRef;
  @ViewChild('footer') footer!: ElementRef;

  withButtomMenu = input<boolean>(false);

  isResizing = false;
  isFooterResizing = false;
  menuWidth = 400; // Initial width
  footerHeight = 100; // Initial height

  header = input<string>();
  bottomMenu = input<string | null>(null);
  initialFooterHeight = 0;
  initialMouseY = 0;
  mainContentHeight: number = 0;
  isMenuVisible: boolean = true; // Assuming the menu is visible by default

  // menuItems = input<RouterMenuItems>(MAIN_MENU_ITEMS);

  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    // this.menuWidth = this.leftMenu.nativeElement.offsetWidth;
    if (this.footer) {
      this.footerHeight = this.footer.nativeElement.offsetHeight;
    }
    this.initClipbordDragAndDrop();
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
  };

  onMouseUp = () => {
    this.isResizing = false;
    this.ngZone.runOutsideAngular(() => {
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
    });
  };

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
  };

  onFooterMouseUp = () => {
    this.isFooterResizing = false;
    this.ngZone.runOutsideAngular(() => {
      window.removeEventListener('mousemove', this.onFooterMouseMove);
      window.removeEventListener('mouseup', this.onFooterMouseUp);
    });
  };

  //Clipboard drag and drop feature

  @ViewChild('clipboardContainer') clipboardContainer!: ElementRef;
  private isDragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  private initClipbordDragAndDrop(): void {
    if (this.clipboardContainer) {
      this.clipboardContainer.nativeElement.addEventListener(
        'mousedown',
        (e: MouseEvent) => {
          this.startDrag(e);
        }
      );
      document.addEventListener('mousemove', (e: MouseEvent) => {
        this.drag(e);
      });
      document.addEventListener('mouseup', () => {
        this.stopDrag();
      });
    }
  }
  private startDrag(event: MouseEvent): void {
    this.isDragging = true;
    const rect = this.clipboardContainer.nativeElement.getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
  }

  private drag(event: MouseEvent): void {
    if (!this.isDragging) return;

    const element = this.clipboardContainer.nativeElement;
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    element.style.left = event.clientX - this.dragOffsetX + 'px';
    element.style.top = event.clientY - this.dragOffsetY + 'px';
  }

  private stopDrag(): void {
    this.isDragging = false;
  }
}
