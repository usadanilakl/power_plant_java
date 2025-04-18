import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.css']
})
export class ImageCarouselComponent implements AfterViewInit {
  @Input() images: string[] | Observable<string[]> = [];
  @Output() imageClick = new EventEmitter<string>();
  @ViewChild('carousel') carouselRef!: ElementRef;

  displayImages: string[] = [];

  private startX: number = 0;
  private scrollLeftPosition: number = 0;

  ngOnInit() {
    if (this.images instanceof Observable) {
      this.images.subscribe(imageArray => {
        this.displayImages = imageArray;
      });
    } else {
      this.displayImages = this.images;
    }
  }

  ngAfterViewInit() {
    this.setupTouchEvents();
  }

  onImageClick(image: string) {
    this.imageClick.emit(image);
  }

  scrollToLeft() {
    this.carouselRef.nativeElement.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollToRight() {
    this.carouselRef.nativeElement.scrollBy({ left: 300, behavior: 'smooth' });
  }

  private setupTouchEvents() {
    const carousel = this.carouselRef.nativeElement;

    carousel.addEventListener('touchstart', (e: TouchEvent) => {
      this.startX = e.touches[0].pageX - carousel.offsetLeft;
      this.scrollLeftPosition = carousel.scrollLeft;
    });

    carousel.addEventListener('touchmove', (e: TouchEvent) => {
      if (!this.startX) return;
      const x = e.touches[0].pageX - carousel.offsetLeft;
      const walk = (x - this.startX) * 2;
      carousel.scrollLeft = this.scrollLeftPosition - walk;
    });

    carousel.addEventListener('touchend', () => {
      this.startX = 0;
    });
  }
}