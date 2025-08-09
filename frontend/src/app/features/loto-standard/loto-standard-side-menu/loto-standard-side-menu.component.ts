import { AfterViewInit, Component, ElementRef, HostListener } from '@angular/core';
import { LotoPointTableComponent } from "../../loto-points/loto-point-table/loto-point-table.component";
import { LotoStandardFormComponent } from "../loto-standard-form/loto-standard-form.component";

@Component({
  selector: 'app-loto-standard-side-menu',
  imports: [LotoPointTableComponent, LotoStandardFormComponent],
  templateUrl: './loto-standard-side-menu.component.html',
  styleUrl: './loto-standard-side-menu.component.css'
})
export class LotoStandardSideMenuComponent implements AfterViewInit {
  private isResizing = false;
  private container: HTMLElement | null = null;
  private topPanel: HTMLElement | null = null;
  private bottomPanel: HTMLElement | null = null;
  private startY = 0;
  private startTopHeight = 0;
  private startBottomHeight = 0;

  constructor(private el: ElementRef) {}

  ngAfterViewInit() {
    this.container = this.el.nativeElement.querySelector('.container');
    if (!this.container) {
      console.error('Container element not found');
      return;
    }
    this.topPanel = this.container.querySelector('.top-panel');
    this.bottomPanel = this.container.querySelector('.bottom-panel');
    const handle = this.container.querySelector('.resize-handle');
  
    if (this.topPanel && this.bottomPanel && handle) {
      handle.addEventListener('mousedown', this.startResize.bind(this) as EventListener);
    } else {
      console.error('Required elements not found');
    }
  }

  private startResize(e: Event) {
    if (!this.topPanel || !this.bottomPanel) return;
    
    const mouseEvent = e as MouseEvent;
    this.isResizing = true;
    this.startY = mouseEvent.clientY;
    this.startTopHeight = this.topPanel.offsetHeight;
    this.startBottomHeight = this.bottomPanel.offsetHeight;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: MouseEvent) {
  if (!this.isResizing || !this.topPanel || !this.bottomPanel) return;

    const deltaY = e.clientY - this.startY;
    const newTopHeight = this.startTopHeight + deltaY;
    const newBottomHeight = this.startBottomHeight - deltaY;

    if (newTopHeight > 50 && newBottomHeight > 50) {
      this.topPanel.style.flexBasis = `${newTopHeight}px`;
      this.bottomPanel.style.flexBasis = `${newBottomHeight}px`;
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isResizing = false;
  }
}
