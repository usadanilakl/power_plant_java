import { Component } from '@angular/core';
import { InteractiveImageComponent } from "./interactive-image/interactive-image.component";

@Component({
  selector: 'app-image',
  imports: [InteractiveImageComponent],
  templateUrl: './image.component.html',
  styleUrl: './image.component.css'
})
export class ImageComponent {

}
