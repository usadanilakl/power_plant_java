import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TourService } from '../../services/tour/tour.service';
import { Tour, TourId } from '../../services/tour/tour.model';
import {
  WELCOME_TOUR,
  TABLE_TOUR,
  FILE_TOUR,
  LOTO_POINTS_TOUR,
  LOTO_STANDARD_TOUR,
  LOTO_BUILDER_TOUR,
} from '../../services/tour/tours';

@Component({
  selector: 'app-tour-trigger',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatMenuModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  template: `
    <button
      mat-icon-button
      [matMenuTriggerFor]="tourMenu"
      matTooltip="Help & Tours"
      class="tour-trigger-btn"
    >
      <mat-icon>help_outline</mat-icon>
    </button>

    <mat-menu #tourMenu="matMenu" class="tour-menu">
      <div class="tour-menu-header">
        <mat-icon>school</mat-icon>
        <span>Interactive Tours</span>
      </div>

      @for (tour of availableTours(); track tour.id) {
        <button
          mat-menu-item
          (click)="startTour(tour.id)"
          [class.completed]="isTourCompleted(tour.id)"
        >
          <mat-icon>{{ getTourIcon(tour.id) }}</mat-icon>
          <span>{{ tour.name }}</span>
          @if (isTourCompleted(tour.id)) {
            <mat-icon class="check-icon">check_circle</mat-icon>
          }
        </button>
      }

      <div class="tour-menu-divider"></div>

      <button mat-menu-item (click)="resetAllTours()">
        <mat-icon>refresh</mat-icon>
        <span>Reset All Tours</span>
      </button>
    </mat-menu>
  `,
  styles: [
    `
      .tour-trigger-btn {
        color: inherit;
      }

      .tour-menu-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        font-weight: 500;
        border-bottom: 1px solid var(--border-color, #e0e0e0);
        color: var(--text-primary, #333);
      }

      .tour-menu-header mat-icon {
        color: var(--primary-color, #1976d2);
      }

      .tour-menu-divider {
        height: 1px;
        background: var(--border-color, #e0e0e0);
        margin: 4px 0;
      }

      button.completed {
        background-color: var(--success-bg, rgba(76, 175, 80, 0.1));
      }

      .check-icon {
        margin-left: auto;
        color: var(--success-color, #4caf50);
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class TourTriggerComponent implements OnInit {
  private tourService = inject(TourService);

  /** Optional: Filter to show only specific tours */
  filterTours = input<TourId[]>([]);

  availableTours = signal<Tour[]>([]);

  ngOnInit(): void {
    // Register all tours
    this.registerAllTours();

    // Get available tours, optionally filtered
    this.updateAvailableTours();
  }

  private registerAllTours(): void {
    this.tourService.registerTour(WELCOME_TOUR);
    this.tourService.registerTour(TABLE_TOUR);
    this.tourService.registerTour(FILE_TOUR);
    this.tourService.registerTour(LOTO_POINTS_TOUR);
    this.tourService.registerTour(LOTO_STANDARD_TOUR);
    this.tourService.registerTour(LOTO_BUILDER_TOUR);
  }

  private updateAvailableTours(): void {
    const allTours = this.tourService.getAvailableTours();
    const filter = this.filterTours();

    if (filter.length > 0) {
      this.availableTours.set(
        allTours.filter((tour) => filter.includes(tour.id as TourId))
      );
    } else {
      this.availableTours.set(allTours);
    }
  }

  startTour(tourId: string): void {
    this.tourService.startTour(tourId as TourId);
  }

  isTourCompleted(tourId: string): boolean {
    return this.tourService.isTourCompleted(tourId as TourId);
  }

  resetAllTours(): void {
    this.tourService.resetAllProgress();
  }

  getTourIcon(tourId: string): string {
    const iconMap: Record<string, string> = {
      welcome: 'home',
      table: 'table_chart',
      file: 'folder',
      'loto-points': 'location_on',
      'loto-standard': 'description',
      'loto-builder': 'build',
    };
    return iconMap[tourId] || 'help';
  }
}
