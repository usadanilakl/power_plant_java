import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBoxDto } from '../../../../models/loto/loto-box.model';
import { LotoBoxStateService, LotoBoxStatus } from './loto-box-state.service';

@Component({
  selector: 'app-loto-box-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loto-box-grid.component.html',
  styleUrl: './loto-box-grid.component.css'
})
export class LotoBoxGridComponent implements OnInit {
  private stateService = inject(LotoBoxStateService);

  // Fixed grid layout: 12 columns x 6 rows = 72 boxes
  readonly GRID_COLUMNS = 12;
  readonly GRID_ROWS = 6;
  readonly TOTAL_BOXES = 72;

  boxes = signal<LotoBoxDto[]>([]);
  isLoading = this.stateService.isLoading;
  statusMessage = this.stateService.statusMessage;
  activeDropdown = signal<number | null>(null);

  statuses: LotoBoxStatus[] = ['building', 'test', 'active', 'closed'];

  ngOnInit() {
    this.loadBoxes();

    // Subscribe to state changes
    this.stateService.allBoxes$.subscribe(boxes => {
      // Ensure we always have exactly 72 boxes in the correct order
      const orderedBoxes = this.ensureBoxOrder(boxes);
      this.boxes.set(orderedBoxes);
    });

    // Close dropdown when clicking outside
    if (typeof window !== 'undefined') {
      window.addEventListener('click', (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.box')) {
          this.activeDropdown.set(null);
        }
      });
    }
  }

  /**
   * Ensures boxes are in order 1-72, creating placeholder boxes if needed
   */
  private ensureBoxOrder(boxes: LotoBoxDto[]): LotoBoxDto[] {
    const orderedBoxes: LotoBoxDto[] = [];

    for (let i = 1; i <= this.TOTAL_BOXES; i++) {
      const existingBox = boxes.find(b => b.number === i);
      if (existingBox) {
        orderedBoxes.push(existingBox);
      } else {
        // Create placeholder box with default closed color
        orderedBoxes.push(new LotoBoxDto({
          number: i,
          r: 0,
          g: 0,
          b: 32,
          brightness: 255
        }));
      }
    }

    return orderedBoxes;
  }

  async loadBoxes() {
    this.stateService.loadBoxesFromLedStatus();
  }

  toggleDropdown(boxNumber: number, event: Event) {
    event.stopPropagation();
    this.activeDropdown.set(this.activeDropdown() === boxNumber ? null : boxNumber);
  }

  setBoxStatus(box: LotoBoxDto, status: LotoBoxStatus, event: Event) {
    event.stopPropagation();
    this.stateService.setBoxStatus(box, status, true, true);
    this.activeDropdown.set(null);
  }

  toggleManualOverride(box: LotoBoxDto, event: Event) {
    event.stopPropagation();
    this.stateService.toggleManualOverride(box);
  }

  updateAllBoxes() {
    this.stateService.updateAllBoxes();
  }

  getBoxColor(box: LotoBoxDto): string {
    if (box.r !== undefined && box.g !== undefined && box.b !== undefined) {
      return `rgb(${box.r}, ${box.g}, ${box.b})`;
    }
    return 'rgb(0, 0, 0)';
  }

  getStatusLabel(status: LotoBoxStatus): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  isManualOverride(box: LotoBoxDto): boolean {
    return box.manualOverride ?? false;
  }
}
