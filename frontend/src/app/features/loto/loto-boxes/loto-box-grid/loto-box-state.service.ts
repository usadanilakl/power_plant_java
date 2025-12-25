import { Injectable, inject, signal } from "@angular/core";
import { LotoBoxDto } from "../../../../models/loto/loto-box.model";
import { BehaviorSubject } from "rxjs";
import { LotoBoxService } from "./loto-box.service";

export type LotoBoxStatus = 'building' | 'test' | 'active' | 'closed';

export interface LotoBoxColor {
  r: number;
  g: number;
  b: number;
}

@Injectable({
  providedIn: 'root'
})
export class LotoBoxStateService {
  private lotoBoxService = inject(LotoBoxService);

  // State management
  private allBoxesSubject = new BehaviorSubject<LotoBoxDto[]>([]);
  allBoxes$ = this.allBoxesSubject.asObservable();

  selectedBox = signal<LotoBoxDto | null>(null);
  isLoading = signal<boolean>(false);
  statusMessage = signal<string>('');

  // Status color mapping
  private readonly statusColors: Record<LotoBoxStatus, LotoBoxColor> = {
    'building': { r: 0, g: 255, b: 0 },
    'test': { r: 255, g: 255, b: 0 },
    'active': { r: 255, g: 0, b: 0 },
    'closed': { r: 0, g: 0, b: 32 }
  };

  constructor() {}

  /**
   * Load boxes from database (not from ESP)
   */
  loadBoxesFromLedStatus(): void {
    this.isLoading.set(true);
    this.lotoBoxService.getAllBoxes().subscribe({
      next: (response) => {
        const boxes = response.responseData.map(box => LotoBoxDto.fromJson(box));
        this.allBoxesSubject.next(boxes);
        this.isLoading.set(false);
        this.statusMessage.set(`Loaded ${boxes.length} boxes from database`);
      },
      error: (error) => {
        console.error('Error loading boxes:', error);
        this.isLoading.set(false);
        this.statusMessage.set(`Error loading boxes: ${error.message}`);
      }
    });
  }

  getStatusFromColor(r: number, g: number, b: number): LotoBoxStatus {
    for (const [status, color] of Object.entries(this.statusColors)) {
      if (color.r === r && color.g === g && color.b === b) {
        return status as LotoBoxStatus;
      }
    }
    return 'closed';
  }

  getColorFromStatus(status: LotoBoxStatus): LotoBoxColor {
    return this.statusColors[status];
  }

  /**
   * Set box status - saves to database and updates ESP device
   */
  setBoxStatus(box: LotoBoxDto, status: LotoBoxStatus, updateLed: boolean = true, enableManualOverride: boolean = true): void {
    const color = this.getColorFromStatus(status);

    if (updateLed) {
      this.lotoBoxService.updateBoxLedColor(box.number, color.r, color.g, color.b, 255).subscribe({
        next: (response) => {
          this.statusMessage.set(response.message);
          // Update local state with database response
          const updatedBox = LotoBoxDto.fromJson(response.responseData);
          this.updateLocalBoxState(updatedBox);
        },
        error: (error) => {
          console.error(`Error setting color for box ${box.number}:`, error);
          this.statusMessage.set(`Error: ${error.error?.message || error.message}`);
        }
      });
    } else {
      this.updateBoxColor(box, color, enableManualOverride);
    }
  }

  /**
   * Update local state with updated box from database
   */
  private updateLocalBoxState(updatedBox: LotoBoxDto): void {
    const boxes = this.allBoxesSubject.value;
    const updatedBoxes = boxes.map(b => {
      if (b.number === updatedBox.number) {
        return updatedBox;
      }
      return b;
    });
    this.allBoxesSubject.next(updatedBoxes);
  }

  private updateBoxColor(box: LotoBoxDto, color: LotoBoxColor, enableManualOverride: boolean = true): void {
    const boxes = this.allBoxesSubject.value;
    const updatedBoxes = boxes.map(b => {
      if (b.number === box.number) {
        return new LotoBoxDto({
          ...b,
          r: color.r,
          g: color.g,
          b: color.b,
          manualOverride: enableManualOverride
        });
      }
      return b;
    });
    this.allBoxesSubject.next(updatedBoxes);
  }

  toggleManualOverride(box: LotoBoxDto): void {
    const boxes = this.allBoxesSubject.value;
    const updatedBoxes = boxes.map(b => {
      if (b.number === box.number) {
        return new LotoBoxDto({
          ...b,
          manualOverride: !b.manualOverride
        });
      }
      return b;
    });
    this.allBoxesSubject.next(updatedBoxes);
  }

  /**
   * Sync all boxes to ESP device using current database state
   */
  updateAllBoxes(): void {
    this.isLoading.set(true);
    this.lotoBoxService.syncAllBoxesToEsp().subscribe({
      next: (response) => {
        this.statusMessage.set(response.message);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to sync boxes:', error);
        this.statusMessage.set(`Error: ${error.error?.message || error.message}`);
        this.isLoading.set(false);
      }
    });
  }

  setSelectedBox(box: LotoBoxDto | null): void {
    this.selectedBox.set(box);
  }

  getBoxes(): LotoBoxDto[] {
    return this.allBoxesSubject.value;
  }
}
