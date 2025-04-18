import { Component } from '@angular/core';
import { ImageZoomInteractiveComponent } from "../../shared/image/image-zoom-interactive/image-zoom-interactive.component";
import { ImageCarouselComponent } from "../../shared/image/image-carusel/image-carousel.component";

@Component({
  selector: 'app-home',
  imports: [ImageZoomInteractiveComponent, ImageCarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  imageUrls: string[] = [
    'assets/images/1.jpg',
    'assets/images/2.jpg',
    'assets/images/3.jpg',
    'assets/images/4.jpg',
    'assets/images/5.jpg',
    'assets/images/6.jpg',
    'assets/images/7.jpg',
    'assets/images/8.jpg',
    'assets/images/9.jpg',
    // ... more image URLs
  ];
  onImageClick(imageUrl: string) {
    // Handle opening the image in a larger view
    console.log('Image clicked:', imageUrl);
  }
}
