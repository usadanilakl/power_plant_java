import { Component, effect, ElementRef, inject, NgZone, Renderer2, signal, ViewChild } from '@angular/core';
import { LotoTableComponent } from "../loto-table/loto-table.component";
import { LotoDetailFormComponent } from "../loto-detail-form/loto-detail-form.component";
import { LotoPointTableComponent } from "../../loto-points/loto-point-table/loto-point-table.component";
import { LotoPointDto } from '../../../models/loto/loto-point.model';

@Component({
  selector: 'app-loto-side-menu',
  imports: [LotoTableComponent, LotoDetailFormComponent, LotoPointTableComponent],
  templateUrl: './loto-side-menu.component.html',
  styleUrl: './loto-side-menu.component.css'
})
export class LotoSideMenuComponent {
  @ViewChild('container') containerRef!: ElementRef;
  @ViewChild('topPanel') topPanelRef!: ElementRef;
  @ViewChild('bottomPanel') bottomPanelRef!: ElementRef;
  @ViewChild('resizeHandle') resizeHandleRef!: ElementRef;

  private isResizing = false;
  private startY = 0;
  private startTopHeight = 0;
  private startBottomHeight = 0;

  private el = inject(ElementRef);
  private ngZone = inject(NgZone);
  private renderer = inject(Renderer2);

  currentImageUrl: string | null = null;
  // currentCarouselItems: string[] = [];
  // currentLotoStandardSignal = toSignal(this.currentLotoStandardService.currentStandard$, { initialValue: new LotoStandardDto() });
  // currentLotoStandard = computed(() => this.currentLotoStandardSignal() || new LotoStandardDto());
  // allStandardsSignal = toSignal(this.currentLotoStandardService.allStandards$, { initialValue: [] });
  isStandardListDisplayed = signal<boolean>(true);

  constructor() {
    effect(() => {
      const isDisplayed = this.isStandardListDisplayed();
      if (!isDisplayed) {
        // this.setupResizeHandlersIfVisible();
      }
    });
  }
  /*************************************************************************************************************
   * Resize functionality using drag and drop on the resize handle.
   *************************************************************************************************************/

  private setupResizeHandlersIfVisible(retryCount = 0) {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const container = this.containerRef?.nativeElement;
        const topPanel = this.topPanelRef?.nativeElement;
        const bottomPanel = this.bottomPanelRef?.nativeElement;
        const handle = this.resizeHandleRef?.nativeElement;
    
        if (container && topPanel && bottomPanel && handle) {
          // console.log('Setting up resize handlers');
          handle.addEventListener('mousedown', this.startResize.bind(this));
        } else {
          // console.log('Resizable panels not visible yet, retry count:', retryCount);
          if (retryCount < 5) {  // Try up to 5 times
            this.setupResizeHandlersIfVisible(retryCount + 1);
          } else {
            console.error('Failed to set up resize handlers after multiple attempts');
          }
        }
      }, 100);  // Wait for 100ms before checking
    });
  }
  
  private startResize(e: MouseEvent) {
    // console.log('Start resizing', e);
    const topPanel = this.topPanelRef?.nativeElement;
    const bottomPanel = this.bottomPanelRef?.nativeElement;
    if (!topPanel || !bottomPanel) {
      console.error('Panels not found in startResize');
      return;
    }
    
    this.isResizing = true;
    this.startY = e.clientY;
    this.startTopHeight = topPanel.offsetHeight;
    this.startBottomHeight = bottomPanel.offsetHeight;
    // console.log('Resize initialized', { startY: this.startY, startTopHeight: this.startTopHeight, startBottomHeight: this.startBottomHeight });

    // Add mousemove and mouseup listeners
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
    });
  }
  
  private onMouseMove = (e: MouseEvent) => {
    if (!this.isResizing) return;
  
    const topPanel = this.topPanelRef?.nativeElement;
    const bottomPanel = this.bottomPanelRef?.nativeElement;
    const container = this.containerRef?.nativeElement;
    if (!topPanel || !bottomPanel || !container) {
      console.error('Panels or container not found in onMouseMove');
      return;
    }
  
    const containerRect = container.getBoundingClientRect();
    const deltaY = e.clientY - this.startY;
    const newTopHeight = Math.max(50, Math.min(this.startTopHeight + deltaY, containerRect.height - 60)); // 60 = min bottom height + handle height
    
    topPanel.style.flex = `1 1 ${newTopHeight}px`;
    bottomPanel.style.flex = `1 1 ${containerRect.height - newTopHeight - 10}px`; // 10px for resize handle
  
    // console.log('Resizing', {
    //   containerHeight: containerRect.height,
    //   deltaY,
    //   newTopHeight,
    //   newBottomHeight: containerRect.height - newTopHeight - 10,
    //   currentTopHeight: topPanel.offsetHeight,
    //   currentBottomHeight: bottomPanel.offsetHeight
    // });
  }

  private onMouseUp = () => {
    // console.log('Stop resizing');
    this.isResizing = false;
    
    // Remove mousemove and mouseup listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    
    // Ensure any final changes are detected
    this.ngZone.run(() => {});
  }
  
    /*************************************************************************************************************
     * Loto Point Table functionality.
     *************************************************************************************************************/
    onLotoPointTableRowLeftClick(lotoPoint: LotoPointDto) {
      console.log('Loto point row left clicked', lotoPoint);
      // this.currentLotoStandardService.setCurrentLotoPoint(lotoPoint);
  
    }
  
    onLotoPointTableRowRightClick(lotoPoint: LotoPointDto) {
      // Perform the required actions when a loto point row is right-clicked
    }
  
    onLotoPointTableRowDoubleClick(lotoPoint: LotoPointDto) {
      this.addLotoPointToStandard(lotoPoint);
    }
  
    private setCaruselItems(lotoPoint: LotoPointDto) {
  
    }
  
    private addLotoPointToStandard(lotoPoint: LotoPointDto) {
      console.log('Adding loto point to standard', lotoPoint);
      // this.currentLotoStandardService.addLotoPointToStandard(lotoPoint);
    }



    
showLotoList() {
    this.isStandardListDisplayed.update(value => !value);
}


}
