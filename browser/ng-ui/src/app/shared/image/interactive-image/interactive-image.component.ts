import { Component, input } from "@angular/core";
import { Observable } from "rxjs";

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
  imageUrl = input<string>();
  imageName = input<string>();
  elements = input.required<Observable<Shape[]>>();
  selectedShapeIds = input<number[]>([]);
  singleSelectedShapeId = input<number | null>();
  isEditEnabled = input<boolean>(false);

}
