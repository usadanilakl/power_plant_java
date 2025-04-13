import { Component } from '@angular/core';
import { ImageZoomComponent } from "../../shared/image/image-zoom/image-zoom.component";

@Component({
  selector: 'app-home',
  imports: [ImageZoomComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
