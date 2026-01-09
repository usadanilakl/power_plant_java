import { inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { driver, Driver, DriveStep, Config } from 'driver.js';
import { LocalStorageService } from '../refactored/local-storage.service';
import { Tour, TourId, TourProgress, TourStep } from './tour.model';

const TOUR_STORAGE_KEY = 'app_tour_progress';

@Injectable({
  providedIn: 'root',
})
export class TourService {
  private platformId = inject(PLATFORM_ID);
  private localStorageService = inject(LocalStorageService);

  private driverInstance: Driver | null = null;
  private registeredTours = new Map<TourId, Tour>();

  // Signals for reactive state
  isRunning = signal(false);
  currentTourId = signal<TourId | null>(null);
  currentStepIndex = signal(0);

  /**
   * Register a tour configuration
   */
  registerTour(tour: Tour): void {
    this.registeredTours.set(tour.id as TourId, tour);
  }

  /**
   * Start a tour by ID
   */
  startTour(tourId: TourId, startFromStep = 0): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const tour = this.registeredTours.get(tourId);
    if (!tour) {
      console.warn(`Tour "${tourId}" not found`);
      return;
    }

    // Convert TourStep[] to DriveStep[]
    const steps: DriveStep[] = tour.steps.map((step) => ({
      element: step.element,
      popover: {
        title: step.popover.title,
        description: step.popover.description,
        side: step.popover.side,
        align: step.popover.align,
      },
    }));

    const config: Config = {
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      allowClose: true,
      steps,
      onHighlightStarted: (element, step, options) => {
        this.currentStepIndex.set(options.state.activeIndex ?? 0);
      },
      onDestroyStarted: () => {
        this.saveProgress(tourId, this.currentStepIndex(), false);
      },
      onDestroyed: () => {
        this.isRunning.set(false);
        this.currentTourId.set(null);
      },
      onCloseClick: () => {
        this.driverInstance?.destroy();
      },
      onNextClick: (element, step, options) => {
        if (options.state.activeIndex === steps.length - 1) {
          // Last step - mark as completed
          this.markTourCompleted(tourId);
          this.driverInstance?.destroy();
        } else {
          this.driverInstance?.moveNext();
        }
      },
    };

    this.driverInstance = driver(config);
    this.isRunning.set(true);
    this.currentTourId.set(tourId);
    this.currentStepIndex.set(startFromStep);

    // Start from specific step if resuming
    if (startFromStep > 0 && startFromStep < steps.length) {
      this.driverInstance.drive(startFromStep);
    } else {
      this.driverInstance.drive();
    }
  }

  /**
   * Stop the current tour
   */
  stopTour(): void {
    if (this.driverInstance) {
      this.driverInstance.destroy();
      this.driverInstance = null;
    }
    this.isRunning.set(false);
    this.currentTourId.set(null);
  }

  /**
   * Move to next step
   */
  nextStep(): void {
    this.driverInstance?.moveNext();
  }

  /**
   * Move to previous step
   */
  previousStep(): void {
    this.driverInstance?.movePrevious();
  }

  /**
   * Check if a tour has been completed
   */
  isTourCompleted(tourId: TourId): boolean {
    const progress = this.getTourProgress(tourId);
    return progress?.completed ?? false;
  }

  /**
   * Check if this is the user's first visit (no tours completed)
   */
  isFirstVisit(): boolean {
    const allProgress = this.getAllProgress();
    return Object.keys(allProgress).length === 0;
  }

  /**
   * Get progress for a specific tour
   */
  getTourProgress(tourId: TourId): TourProgress | null {
    const allProgress = this.getAllProgress();
    return allProgress[tourId] ?? null;
  }

  /**
   * Resume a tour from where it was left off
   */
  resumeTour(tourId: TourId): void {
    const progress = this.getTourProgress(tourId);
    if (progress && !progress.completed) {
      this.startTour(tourId, progress.lastStepIndex);
    } else {
      this.startTour(tourId);
    }
  }

  /**
   * Mark a tour as completed
   */
  markTourCompleted(tourId: TourId): void {
    this.saveProgress(tourId, 0, true);
  }

  /**
   * Reset all tour progress
   */
  resetAllProgress(): void {
    this.localStorageService.removeItem(TOUR_STORAGE_KEY);
  }

  /**
   * Reset progress for a specific tour
   */
  resetTourProgress(tourId: TourId): void {
    const allProgress = this.getAllProgress();
    delete allProgress[tourId];
    this.localStorageService.setItem(TOUR_STORAGE_KEY, allProgress);
  }

  /**
   * Get all registered tours
   */
  getAvailableTours(): Tour[] {
    return Array.from(this.registeredTours.values());
  }

  /**
   * Get a tour by ID
   */
  getTour(tourId: TourId): Tour | undefined {
    return this.registeredTours.get(tourId);
  }

  /**
   * Highlight a specific element without running a full tour
   */
  highlightElement(selector: string, title: string, description: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const instance = driver({
      showButtons: ['close'],
      steps: [
        {
          element: selector,
          popover: { title, description },
        },
      ],
    });
    instance.drive();
  }

  private saveProgress(
    tourId: TourId,
    stepIndex: number,
    completed: boolean
  ): void {
    const allProgress = this.getAllProgress();
    allProgress[tourId] = {
      tourId,
      completed,
      lastStepIndex: stepIndex,
      completedAt: completed ? new Date() : undefined,
    };
    this.localStorageService.setItem(TOUR_STORAGE_KEY, allProgress);
  }

  private getAllProgress(): Record<string, TourProgress> {
    return this.localStorageService.getItem<Record<string, TourProgress>>(
      TOUR_STORAGE_KEY
    ) ?? {};
  }
}
