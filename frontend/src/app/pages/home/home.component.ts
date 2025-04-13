import { Component } from '@angular/core';
import { ImageZoomInteractiveComponent } from "../../shared/image/image-zoom-interactive/image-zoom-interactive.component";

@Component({
  selector: 'app-home',
  imports: [ImageZoomInteractiveComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}
