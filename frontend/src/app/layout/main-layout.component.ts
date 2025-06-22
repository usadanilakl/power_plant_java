import { Component, AfterViewInit, ElementRef, ViewChild, NgZone, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MAIN_MENU_ITEMS, RouterMenuItems } from '../models/ui/router-menu.model';
import { RouterMenuComponent } from "../shared/menu/router-menu/router-menu.component";

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterMenuComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements AfterViewInit {
  @ViewChild('leftMenu') leftMenu!: ElementRef;
  @ViewChild('resizer') resizer!: ElementRef;
  @ViewChild('mainContent') mainContent!: ElementRef;

  isResizing = false;
  menuWidth = 200; // Initial width

  header = input<string>();

  // menuItems = input<RouterMenuItems>(MAIN_MENU_ITEMS);
  
  constructor(private ngZone: NgZone) {}

  ngAfterViewInit() {
    this.menuWidth = this.leftMenu.nativeElement.offsetWidth;
  }

  toggleMenu() {
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
}
