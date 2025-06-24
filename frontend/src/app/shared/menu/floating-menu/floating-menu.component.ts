import { Component, ElementRef, ViewChild, AfterViewInit, output, input, signal, SimpleChanges } from '@angular/core';
import { DragDropModule } from '@angular/cdk/drag-drop';

export enum MenuPosition {
  TopLeft,
  TopRight,
  BottomLeft,
  BottomRight,
  Center
}

@Component({
  selector: 'app-floating-menu',
  templateUrl: './floating-menu.component.html',
  styleUrls: ['./floating-menu.component.css'],
  standalone: true,
  imports: [DragDropModule]
})
export class FloatingMenuComponent implements AfterViewInit {
  @ViewChild('menuContainer') menuContainer!: ElementRef;

  title = input<string>("");
  height = input<number>(50);
  width = input<number>(25);
  position = input<MenuPosition>(MenuPosition.Center);
  open = input<boolean>(false);

  close = output<void>();

  private isDragging = false;
  private isResizing = false;
  private dragOffset = { x: 0, y: 0 };
  private resizeStartPos = { x: 0, y: 0 };
  private initialSize = { width: 0, height: 0 };
  private resizingHandle: string | null = null;

  ngAfterViewInit() {
    // this.setupDragging();
    // this.setupResizing();
    // this.applyInitialDimensions();
    // this.applyPosition();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['open'] && !changes['open'].firstChange && changes['open'].currentValue) {
      setTimeout(() => {
        this.setupDragging();
        this.setupResizing();
        this.applyInitialDimensions();
        this.applyPosition();
      });
    }
  }

  private applyInitialDimensions() {
    if (this.menuContainer && this.menuContainer.nativeElement) {
      this.menuContainer.nativeElement.style.height = `${this.height()}vh`;
      this.menuContainer.nativeElement.style.width = `${this.width()}vw`;
    }
  }

  private applyPosition() {
    const element = this.menuContainer.nativeElement;
    const rect = element.getBoundingClientRect();

    switch (this.position()) {
      case MenuPosition.TopLeft:
        element.style.top = '0';
        element.style.left = '0';
        break;
      case MenuPosition.TopRight:
        element.style.top = '0';
        element.style.right = '0';
        element.style.left = 'auto';
        break;
      case MenuPosition.BottomLeft:
        element.style.bottom = '0';
        element.style.left = '0';
        element.style.top = 'auto';
        break;
      case MenuPosition.BottomRight:
        element.style.bottom = '0';
        element.style.right = '0';
        element.style.top = 'auto';
        element.style.left = 'auto';
        break;
      case MenuPosition.Center:
        element.style.top = `${(window.innerHeight - rect.height) / 2}px`;
        element.style.left = `${(window.innerWidth - rect.width) / 2}px`;
        break;
    }
  }

  closeMenu() {
    this.close.emit();
  }

  private setupDragging() {
    const header = this.menuContainer.nativeElement.querySelector('.menu-header');
    header.addEventListener('mousedown', this.startDragging.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDragging.bind(this));
  }

  private startDragging(e: MouseEvent) {
    this.isDragging = true;
    const rect = this.menuContainer.nativeElement.getBoundingClientRect();
    this.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private drag(e: MouseEvent) {
    if (!this.isDragging) return;
    const x = e.clientX - this.dragOffset.x;
    const y = e.clientY - this.dragOffset.y;
    this.menuContainer.nativeElement.style.left = `${x}px`;
    this.menuContainer.nativeElement.style.top = `${y}px`;
  }

  private stopDragging() {
    this.isDragging = false;
  }




  private setupResizing() {
    const resizeHandle = this.menuContainer.nativeElement.querySelector('.resize-handle');
    resizeHandle.addEventListener('mousedown', this.startResizing.bind(this));
    document.addEventListener('mousemove', this.resize.bind(this));
    document.addEventListener('mouseup', this.stopResizing.bind(this));
  }

  private startResizing(e: MouseEvent) {
    this.isResizing = true;
    this.resizeStartPos = { x: e.clientX, y: e.clientY };
    const rect = this.menuContainer.nativeElement.getBoundingClientRect();
    this.initialSize = { width: rect.width, height: rect.height };
  }

  private resize(e: MouseEvent) {
    if (!this.isResizing) return;
    const dx = e.clientX - this.resizeStartPos.x;
    const dy = e.clientY - this.resizeStartPos.y;
    const newWidth = Math.max(200, this.initialSize.width + dx);
    const newHeight = Math.max(100, this.initialSize.height + dy);
    this.menuContainer.nativeElement.style.width = `${newWidth}px`;
    this.menuContainer.nativeElement.style.height = `${newHeight}px`;
  }

  private stopResizing() {
    this.isResizing = false;
  }
}