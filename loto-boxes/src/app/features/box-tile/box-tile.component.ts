import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { LotoBox, LotoBoxStatus } from '../../models/loto-box.model';

@Component({
  selector: 'app-box-tile',
  imports: [],
  templateUrl: './box-tile.component.html',
  styleUrl: './box-tile.component.css',
})
export class BoxTile {
  @Input() box!: LotoBox;
  @Input() showDropdown = false;
  @Output() boxClick = new EventEmitter<LotoBox>();
  @Output() statusChange = new EventEmitter<LotoBoxStatus>();

  elementRef = inject(ElementRef)

  statuses = Object.values(LotoBoxStatus);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  }

  getColor(): string {
    return `rgb(${this.box.r}, ${this.box.g}, ${this.box.b})`;
  }

  onBoxClick(): void {
    this.boxClick.emit(this.box);
  }

  selectStatus(status: LotoBoxStatus): void {
    this.statusChange.emit(status);
  }

  getStatusLabel(status: LotoBoxStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

}
