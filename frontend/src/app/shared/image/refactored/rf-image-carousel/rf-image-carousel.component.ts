import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileModel } from '../../../../models/file/file.model';

export interface CarouselImage {
  file: FileModel;
  equipmentTagNumber?: string;
}

@Component({
  selector: 'app-rf-image-carousel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rf-image-carousel.component.html',
  styleUrls: ['./rf-image-carousel.component.css'],
})
export class RfImageCarouselComponent {
  @Input() set images(value: CarouselImage[]) {
    this.imageList.set(value);
    if (value && value.length > 0 && this.selectedIndex() >= value.length) {
      this.selectedIndex.set(0);
    }
  }

  @Output() imageSelected = new EventEmitter<CarouselImage>();

  imageList = signal<CarouselImage[]>([]);
  selectedIndex = signal<number>(0);

  selectedImage = computed(() => {
    const list = this.imageList();
    const index = this.selectedIndex();
    return list && list.length > 0 ? list[index] : null;
  });

  hasMultipleImages = computed(() => {
    const list = this.imageList();
    return list && list.length > 1;
  });

  selectImage(index: number) {
    if (index >= 0 && index < this.imageList().length) {
      this.selectedIndex.set(index);
      const selected = this.imageList()[index];
      this.imageSelected.emit(selected);
    }
  }

  previousImage() {
    const currentIndex = this.selectedIndex();
    const listLength = this.imageList().length;
    if (listLength > 0) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : listLength - 1;
      this.selectImage(newIndex);
    }
  }

  nextImage() {
    const currentIndex = this.selectedIndex();
    const listLength = this.imageList().length;
    if (listLength > 0) {
      const newIndex = currentIndex < listLength - 1 ? currentIndex + 1 : 0;
      this.selectImage(newIndex);
    }
  }

  getImageUrl(image: CarouselImage): string {
    return image.file.fileLink || '';
  }

  getImageTitle(image: CarouselImage): string {
    const parts: string[] = [];
    if (image.equipmentTagNumber) {
      parts.push(image.equipmentTagNumber);
    }
    if (image.file.name) {
      parts.push(image.file.name);
    }
    return parts.join(' - ') || 'Image';
  }
}
