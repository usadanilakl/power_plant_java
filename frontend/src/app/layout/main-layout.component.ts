// import { Component } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule } from '@angular/router';

// @Component({
//   selector: 'app-main-layout',
//   standalone: true,
//   imports: [CommonModule, RouterModule],
//   templateUrl: './main-layout.component.html',
//   styleUrls: ['./main-layout.component.css']
// })
// export class MainLayoutComponent {
//   // Component logic (if any) goes here
// }
import { Component, AfterViewInit, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent implements AfterViewInit {
  @ViewChild('leftMenu') leftMenu!: ElementRef;
  @ViewChild('resizer') resizer!: ElementRef;
  @ViewChild('mainContent') mainContent!: ElementRef;

  isResizing = false;
  menuWidth = 200; // Initial width

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