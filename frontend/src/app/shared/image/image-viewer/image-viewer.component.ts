import { AfterViewInit, Component, computed, ElementRef, inject, input, signal, ViewChild } from '@angular/core';
import { FileDto } from '../../../models/file/file.model';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { RectangleShape, Shape } from '../../../models/shape.model';
import { CurrentEquipmentService } from '../../../services/current-items-services/current-equipment.service';

@Component({
  selector: 'app-image-viewer',
  imports: [],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.css'
})
export class ImageViewerComponent {

  private currentEquipmentService = inject(CurrentEquipmentService);

  file = input.required<FileDto>();

  elements = computed<EquipmentDto[]>(() => {
    return this.file().points;
  });

//Zooming and panning functionality variables
  private scale: number = 1;
  private panning: boolean = false;
  private pointX: number = 0;
  private pointY: number = 0;
  private start: { x: number, y: number } = { x: 0, y: 0 };

  private lastX: number = 0;
  private lastY: number = 0;
  cursor: string = 'default';

//Shape/Image functionality variables
  private shapes = signal<Shape[]>([]);
  pictureOriginalWidth = 0;
  pictureOriginalHeight = 0;
  pictureCurrentWidth = 0;
  pictureCurrentHeight = 0;
  imageScale: number = 1;


  @ViewChild('zoomElement') private zoomElementRef!: ElementRef<HTMLDivElement>;
  @ViewChild('zoomOuter') private zoomOuterRef!: ElementRef<HTMLDivElement>;
  @ViewChild('imageElement') private imgRef!: ElementRef<HTMLImageElement>;
  @ViewChild('canvasElement') private canvasRef!: ElementRef<HTMLCanvasElement>;

  private _zoomElement!: HTMLDivElement;
  private _zoomOuter!: HTMLDivElement;
  private _img!: HTMLImageElement;
  private _canvas!: HTMLCanvasElement;


  // Getters for the elements
  get zoomElement(): HTMLDivElement {
    return this._zoomElement;
  }

  get zoomOuter(): HTMLDivElement {
    return this._zoomOuter;
  }

  get img(): HTMLImageElement {
    return this._img;
  }

  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }

  initializeShapes(elements: any[], originalWidth: number, originalHeight: number) {
    const converted = elements.map(element => {
      const equipmentDto = new EquipmentDto(element);
      const sh = equipmentDto.toShapeObject();
      if(sh===null) return {type:'rectangle', x:0,y:0,width:0,height:0} as Shape;
      sh.currentImgWidth = originalWidth;
      sh.currentImgHeigth = originalHeight;
      sh.scaleToCurrentImage = this.img.naturalWidth / sh.originalPictureWidth;
      if(sh.scaleToCurrentImage !== 1){
        this.scaleShapeToCurrentImage(sh);
      }
      return sh;
    });
    this.shapes.set(converted);
    this.currentEquipmentService.setAllShapes(converted);
  }
  
  scaleShapeToCurrentImage(shape: RectangleShape){
    const scale = shape.scaleToCurrentImage;
    shape.width *= scale;
    shape.height *= scale;
    shape.x *= scale;
    shape.y *= scale;
  }

}
