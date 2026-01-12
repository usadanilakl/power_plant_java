import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { LotoBox, LotoBoxStatus } from '../../models/loto-box.model';
import { LotoBoxService, LOCKED_BOX_NUMBER } from '../../services/loto-box.service';

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

  elementRef = inject(ElementRef);
  private lotoBoxService = inject(LotoBoxService);

  statuses = Object.values(LotoBoxStatus);

  get isReadOnly(): boolean {
    return this.lotoBoxService.isReadOnly();
  }

  get isLocked(): boolean {
    return this.box.number === LOCKED_BOX_NUMBER;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.showDropdown = false;
    }
  }

  getColor(): string {
    // Box 61 is always magenta
    if (this.isLocked) {
      return 'rgb(159, 0, 255)';
    }
    return `rgb(${this.box.r}, ${this.box.g}, ${this.box.b})`;
  }

  onBoxClick(): void {
    // Don't show dropdown for locked box or in read-only mode
    if (this.isReadOnly || this.isLocked) {
      return;
    }
    this.boxClick.emit(this.box);
  }

  selectStatus(status: LotoBoxStatus): void {
    this.statusChange.emit(status);
  }

  getStatusLabel(status: LotoBoxStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

}
