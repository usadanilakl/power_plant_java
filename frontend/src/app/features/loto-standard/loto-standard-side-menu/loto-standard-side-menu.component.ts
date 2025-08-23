import { AfterViewInit, Component, computed, ElementRef, HostListener, inject, signal } from '@angular/core';
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
  imports: [LotoPointTableComponent, LotoStandardFormComponent, LotoStandardTableComponent],
  templateUrl: './loto-standard-side-menu.component.html',
  styleUrl: './loto-standard-side-menu.component.css'
})
export class LotoStandardSideMenuComponent implements AfterViewInit {

  private currentLotoStandardService = inject(CurrentLotoStandardService);

  private isResizing = false;
  private container: HTMLElement | null = null;
  private topPanel: HTMLElement | null = null;
  private bottomPanel: HTMLElement | null = null;
  private startY = 0;
  private startTopHeight = 0;
  private startBottomHeight = 0;

  constructor(private el: ElementRef) {}

  currentImageUrl: string | null = null;
  currentCarouselItems: string[] = [];
  currentLotoStandardSignal = toSignal(this.currentLotoStandardService.currentStandard$, { initialValue: new LotoStandardDto() });
  currentLotoStandard = computed(() => this.currentLotoStandardSignal() || new LotoStandardDto());
  allStandardsSignal = toSignal(this.currentLotoStandardService.allStandards$, { initialValue: [] });
  isStandardListDisplayed = signal<boolean>(false);

  ngAfterViewInit() {
    setTimeout(() => {
      this.setupResizeHandlers();
    });
  }

  /*************************************************************************************************************
   * Resize functionality using drag and drop on the resize handle.
   *************************************************************************************************************/

  
  private setupResizeHandlers() {
    this.container = this.el.nativeElement.querySelector('.container');
    if (!this.container) {
      console.error('Container element not found');
      return;
    }
    this.topPanel = this.container.querySelector('.top-panel');
    this.bottomPanel = this.container.querySelector('.bottom-panel');
    const handle = this.container.querySelector('.resize-handle');
  
    if (this.topPanel && this.bottomPanel && handle) {
      handle.addEventListener('mousedown', this.startResize.bind(this));
    } else {
      console.error('Required elements not found');
    }
  }

  checkAndSetupResizeHandlers() {
    if (!this.container) {
      this.setupResizeHandlers();
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
  showStandardList(){
    this.isStandardListDisplayed.set(!this.isStandardListDisplayed());
  }

  createnewStandard(){
    this.currentLotoStandardService.setCurrentStandard(0);
  }
  
  onLotoStandardTableRowClick(lotoStandard: LotoStandardDto) {
    // Perform the required actions when a loto standard row is clicked
    this.isStandardListDisplayed.set(false);
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

}
