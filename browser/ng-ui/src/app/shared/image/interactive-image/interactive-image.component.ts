import { Component, DestroyRef, ElementRef, inject, input, ViewChild } from "@angular/core";
import { fromEvent, Observable } from "rxjs";
import { MouseEventsService } from "../../../services/mouse-events.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

export interface Shape {
  id: number;
  name: string;
  color: string;
  shapeType: 'circle' | 'rectangle' | 'triangle';
  coordinates: { x: number, y: number }[];
  size: { width: number, height: number  };
}


@Component({
  selector: 'app-interactive-image',
  standalone: true,
  imports: [],
  templateUrl: './interactive-image.component.html',
  styleUrl: './interactive-image.component.css'
})
export class InteractiveImageComponent  {

  @ViewChild('imageContainer') imageContainer!: ElementRef<HTMLDivElement>;

  mouseEventService = inject(MouseEventsService);
  destroyRef = inject(DestroyRef);

  imageUrl = input<string>();
  imageName = input<string>();
  elements = input<Shape[]>();
  selectedShapeIds = input<number[]>([]);
  singleSelectedShapeId = input<number | null>();
  isEditEnabled = input<boolean>(false);
  
  
  //Click functionality variables
  private clickTimeout: any;
  private isDoubleClick: boolean = false;
  private lastClickTime: number = 0;
  private readonly DOUBLE_CLICK_DELAY = 200; // milliseconds

  ngAfterViewInit() {
    const mousedown$ = fromEvent<MouseEvent>(this.imageContainer.nativeElement, 'mousedown');

    this.mouseEventService.classifyClicks(mousedown$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(classifiedEvent => {
        classifiedEvent.event.preventDefault();
        switch (classifiedEvent.type) {
          case 'single':
            this.onLeftClick(classifiedEvent.event);
            break;
          case 'double':
            this.onDoubleClick(classifiedEvent.event);
            break;
          case 'middle':
            this.onMiddleClick(classifiedEvent.event);
            break;
          case 'right':
            this.onRightClick(classifiedEvent.event);
            break;
        }
      });
    
    // Prevent context menu on right-click
    fromEvent<MouseEvent>(this.imageContainer.nativeElement, 'contextmenu')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => event.preventDefault());
  }


    //Event handlers
  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    return false;
  }

  onMouseLeave(event: MouseEvent) {
    
  }

  onMouseMove(event: MouseEvent) {
    
  }

  onMousedown(event: MouseEvent) {

    if (event.button === 2) {
      this.onRightClick(event);
      return;
    }

    const currentTime = new Date().getTime();
    const timeSinceLastClick = currentTime - this.lastClickTime;


    if (timeSinceLastClick < this.DOUBLE_CLICK_DELAY) {
      this.isDoubleClick = true;
      clearTimeout(this.clickTimeout);
      this.onDoubleClick(event);
    } else {
      this.isDoubleClick = false;
      this.clickTimeout = setTimeout(() => {
        if (!this.isDoubleClick && event.button === 0) { // Left click
          this.onLeftClick(event);
        }else if (event.button === 1) { // Middle click
          this.onMiddleClick(event);
        } else if (event.button === 2) { // Right click
          this.onRightClick(event);
        }
      }, this.DOUBLE_CLICK_DELAY);
    }

    this.lastClickTime = currentTime;
    event.preventDefault();
  }

  onLeftClick(event: MouseEvent) {
    console.log('left click');
  }

  onMiddleClick(event: MouseEvent) {
    console.log('middleclick');
  }

  onRightClick(event: MouseEvent) {
    console.log('right click');
  }

  onDoubleClick(event: MouseEvent) {
    console.log('double click');
  }

  onMouseUp(event: MouseEvent) {
    console.log('mouse up');
  }

  onWheel(event: WheelEvent) {
    console.log('wheel');
  }

}
