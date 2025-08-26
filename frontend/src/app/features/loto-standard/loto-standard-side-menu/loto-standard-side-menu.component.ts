import { AfterViewInit, Component, computed, effect, ElementRef, HostListener, inject, NgZone, Renderer2, signal, ViewChild } from '@angular/core';
import { LotoPointTableComponent } from "../../loto-points/loto-point-table/loto-point-table.component";
import { LotoStandardFormComponent } from "../loto-standard-form/loto-standard-form.component";
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { CurrentLotoStandardService } from '../../../services/current-items-services/current-loto-standard.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { LotoStandardTableComponent } from "../loto-standard-table/loto-standard-table.component";
import { LotoStandardIdDto } from '../../../models/loto/loto-standard-id.model';

@Component({
  selector: 'app-loto-standard-side-menu',
  standalone: true,
  imports: [LotoPointTableComponent, LotoStandardFormComponent, LotoStandardTableComponent],
  templateUrl: './loto-standard-side-menu.component.html',
  styleUrl: './loto-standard-side-menu.component.css'
})
export class LotoStandardSideMenuComponent implements AfterViewInit {
  @ViewChild('container') containerRef!: ElementRef;
  @ViewChild('topPanel') topPanelRef!: ElementRef;
  @ViewChild('bottomPanel') bottomPanelRef!: ElementRef;
  @ViewChild('resizeHandle') resizeHandleRef!: ElementRef;

  private isResizing = false;
  private startY = 0;
  private startTopHeight = 0;
  private startBottomHeight = 0;

  private currentLotoStandardService = inject(CurrentLotoStandardService);


  constructor(private el: ElementRef, private ngZone: NgZone, private renderer: Renderer2) {
    effect(() => {
      const isDisplayed = this.isStandardListDisplayed();
      if (!isDisplayed) {
        this.setupResizeHandlersIfVisible();
      }
    });
  }

  currentImageUrl: string | null = null;
  currentCarouselItems: string[] = [];
  currentLotoStandardSignal = toSignal(this.currentLotoStandardService.currentStandard$, { initialValue: new LotoStandardDto() });
  currentLotoStandard = computed(() => this.currentLotoStandardSignal() || new LotoStandardDto());
  allStandardsSignal = toSignal(this.currentLotoStandardService.allStandards$, { initialValue: [] });
  isStandardListDisplayed = signal<boolean>(true);

  ngAfterViewInit() {
    setTimeout(() => {
      // console.log('View initialized, setting up resize handlers');
      // this.setupResizeHandlers();
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
    this.currentLotoStandardService.setCurrentLotoPoint(lotoPoint);

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
    this.currentLotoStandardService.addLotoPointToStandard(lotoPoint);
  }

  /**********************************************************************************************************
   * Loto Point Form functionality.
   *********************************************************************************************************/
  onLotoPointFormSubmit(lotoPoint: LotoPointDto) {
    // Perform the required actions when the loto point form is submitted
  }

  /*************************************************************************************************************
   * Loto Standard Table functionality.
   *************************************************************************************************************/ 
  showStandardList() {
    this.isStandardListDisplayed.update(value => !value);
  }

  createnewStandard() {
    this.currentLotoStandardService.setCurrentStandard(0);
    this.isStandardListDisplayed.set(false);
  }
  
  onLotoStandardTableRowClick(lotoStandard: LotoStandardDto) {
    this.isStandardListDisplayed.set(false);
    this.currentLotoStandardService.setCurrentStandard(lotoStandard.id);
  }

  /*************************************************************************************************************
   * Loto Standard Form functionality.
   *************************************************************************************************************/ 
  onLotoStandardFormSubmit(lotoStandard: LotoStandardDto) {
    this.currentLotoStandardService.addStandard(lotoStandard)
  }

  onRemoveLotoPointFromStandard(lotoPoint: LotoPointDto) {
    this.currentLotoStandardService.removeLotoPointFromStandard(lotoPoint.id);
  }

  reorderLotoPoints(lotoPoints: LotoPointDto[]): void {
    this.currentLotoStandardService.reorderLotoPoints(lotoPoints);
  }

}
