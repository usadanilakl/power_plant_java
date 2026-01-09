import { Component, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { TourService } from '../../services/tour/tour.service';
import {
  WELCOME_TOUR,
  TABLE_TOUR,
  FILE_TOUR,
  LOTO_POINTS_TOUR,
  LOTO_STANDARD_TOUR,
  LOTO_BUILDER_TOUR,
} from '../../services/tour/tours';

@Component({
  selector: 'app-welcome-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    @if (isVisible()) {
      <div class="welcome-overlay" (click)="dismiss()">
        <div class="welcome-dialog" (click)="$event.stopPropagation()">
          <button class="close-btn" (click)="dismiss()">
            <mat-icon>close</mat-icon>
          </button>
          <div class="welcome-header">
            <mat-icon class="welcome-icon">waving_hand</mat-icon>
            <h2>Welcome to Power Plant Management</h2>
          </div>
          <div class="welcome-content">
            <p>
              This appears to be your first visit. Would you like to take a
              quick tour to learn the basics?
            </p>
            <p class="hint">
              You can always access tours later from the
              <mat-icon class="inline-icon">help_outline</mat-icon> button in
              the header.
            </p>
          </div>
          <div class="welcome-actions">
            <button mat-button (click)="dismiss()">Skip for now</button>
            <button mat-flat-button color="primary" (click)="startTour()">
              <mat-icon>play_arrow</mat-icon>
              Start Tour
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .welcome-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .welcome-dialog {
        background: var(--surface-color, #ffffff);
        border-radius: 12px;
        padding: 32px;
        max-width: 450px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        animation: slideUp 0.3s ease;
        position: relative;
      }

      .close-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        cursor: pointer;
        padding: 4px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary, #666666);
        transition: background-color 0.2s, color 0.2s;
      }

      .close-btn:hover {
        background-color: var(--surface-hover, rgba(0, 0, 0, 0.08));
        color: var(--text-primary, #333333);
      }

      .close-btn mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      @keyframes slideUp {
        from {
          transform: translateY(20px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }

      .welcome-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .welcome-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: var(--primary-color, #1976d2);
      }

      .welcome-header h2 {
        margin: 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary, #333333);
      }

      .welcome-content {
        margin-bottom: 24px;
      }

      .welcome-content p {
        margin: 0 0 12px;
        color: var(--text-secondary, #666666);
        line-height: 1.5;
      }

      .hint {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        color: var(--text-tertiary, #888888) !important;
      }

      .inline-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
        vertical-align: middle;
      }

      .welcome-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }

      .welcome-actions button {
        display: flex;
        align-items: center;
        gap: 4px;
      }
    `,
  ],
})
export class WelcomeDialogComponent implements OnInit {
  private platformId = inject(PLATFORM_ID);
  private tourService = inject(TourService);

  isVisible = signal(false);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Register all tours first
    this.registerTours();

    // Check if this is first visit (after a small delay to let the page render)
    setTimeout(() => {
      if (this.tourService.isFirstVisit()) {
        this.isVisible.set(true);
      }
    }, 500);
  }

  private registerTours(): void {
    this.tourService.registerTour(WELCOME_TOUR);
    this.tourService.registerTour(TABLE_TOUR);
    this.tourService.registerTour(FILE_TOUR);
    this.tourService.registerTour(LOTO_POINTS_TOUR);
    this.tourService.registerTour(LOTO_STANDARD_TOUR);
    this.tourService.registerTour(LOTO_BUILDER_TOUR);
  }

  startTour(): void {
    this.isVisible.set(false);
    this.tourService.startTour('welcome');
  }

  dismiss(): void {
    this.isVisible.set(false);
    // Mark welcome tour as completed so dialog doesn't show again
    this.tourService.markTourCompleted('welcome');
  }
}
