import {
  Injectable,
  inject,
  PLATFORM_ID,
  signal,
  computed,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LocalStorageService } from '../refactored/local-storage.service';
import {
  Guide,
  GuideId,
  GuideProgress,
  GuideStep,
  RegisteredElement,
} from './guide.model';
import { AVAILABLE_GUIDES } from './guides';

const GUIDE_STORAGE_KEY = 'app_guide_progress';

@Injectable({
  providedIn: 'root',
})
export class GuideService {
  private platformId = inject(PLATFORM_ID);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);

  /** All registered guides */
  private registeredGuides = new Map<GuideId, Guide>();

  /** Elements registered via directive */
  private registeredElements = new Map<string, RegisteredElement>();

  /** Currently active guide */
  activeGuide = signal<GuideId | null>(null);

  /** Whether the guide is paused (highlights disabled) */
  private _isPaused = signal(false);

  /** Current route for filtering steps */
  currentRoute = signal<string>('');

  /** All available guides */
  availableGuides = computed(() => Array.from(this.registeredGuides.values()));

  /** Public getter for paused state */
  isPaused = computed(() => this._isPaused());

  /** Steps for the active guide that apply to current route */
  activeSteps = computed(() => {
    const guideId = this.activeGuide();
    if (!guideId) return [];

    const guide = this.registeredGuides.get(guideId);
    if (!guide) return [];

    const currentRoute = this.currentRoute();
    return guide.steps
      .filter((step) => {
        if (!step.route) return true;
        if (step.route === '/') {
          return currentRoute === '/' || currentRoute === '';
        }
        return currentRoute.startsWith(step.route);
      })
      .sort((a, b) => a.order - b.order);
  });

  /** Check if a specific guide is active */
  isGuideActive = computed(() => this.activeGuide() !== null);

  constructor() {
    // Register all available guides immediately
    this.registerGuides(AVAILABLE_GUIDES);

    if (isPlatformBrowser(this.platformId)) {
      // Track route changes
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe((event) => {
          this.currentRoute.set((event as NavigationEnd).urlAfterRedirects);
        });

      // Set initial route
      this.currentRoute.set(this.router.url);

      // Restore active guide from storage
      this.restoreActiveGuide();
    }
  }

  /**
   * Register a guide configuration
   */
  registerGuide(guide: Guide): void {
    this.registeredGuides.set(guide.id, guide);
  }

  /**
   * Register multiple guides at once
   */
  registerGuides(guides: Guide[]): void {
    guides.forEach((guide) => this.registerGuide(guide));
  }

  /**
   * Start a guide - makes it active and persistent
   */
  startGuide(guideId: GuideId): void {
    if (!this.registeredGuides.has(guideId)) {
      console.warn(`Guide "${guideId}" not found`);
      return;
    }

    this._isPaused.set(false); // Reset pause state when starting
    this.activeGuide.set(guideId);
    this.saveProgress(guideId);
  }

  /**
   * Stop the current guide
   */
  stopGuide(): void {
    const currentGuide = this.activeGuide();
    if (currentGuide) {
      this.clearProgress(currentGuide);
    }
    this._isPaused.set(false); // Reset pause state when stopping
    this.activeGuide.set(null);
  }

  /**
   * Toggle a guide on/off
   */
  toggleGuide(guideId: GuideId): void {
    if (this.activeGuide() === guideId) {
      this.stopGuide();
    } else {
      this.startGuide(guideId);
    }
  }

  /**
   * Toggle pause state for the active guide
   */
  togglePause(): void {
    this._isPaused.update((v) => !v);
  }

  /**
   * Resume a paused guide
   */
  resumeGuide(): void {
    this._isPaused.set(false);
  }

  /**
   * Pause the active guide (hide highlights but keep it selected)
   */
  pauseGuide(): void {
    this._isPaused.set(true);
  }

  /**
   * Register an element (called by directive)
   */
  registerElement(
    guideId: GuideId,
    stepId: string,
    element: HTMLElement,
    message: string,
    title?: string
  ): void {
    const key = `${guideId}:${stepId}`;
    this.registeredElements.set(key, {
      guideId,
      stepId,
      element,
      message,
      title,
    });
  }

  /**
   * Unregister an element (called when directive is destroyed)
   */
  unregisterElement(guideId: GuideId, stepId: string): void {
    const key = `${guideId}:${stepId}`;
    this.registeredElements.delete(key);
  }

  /**
   * Get registered element info
   */
  getRegisteredElement(
    guideId: GuideId,
    stepId: string
  ): RegisteredElement | undefined {
    const key = `${guideId}:${stepId}`;
    return this.registeredElements.get(key);
  }

  /**
   * Check if an element should be highlighted
   */
  shouldHighlight(guideId: GuideId, stepId?: string): boolean {
    // Don't highlight if paused
    if (this._isPaused()) {
      return false;
    }

    const active = this.activeGuide();
    if (!active || active !== guideId) {
      return false;
    }

    // If no stepId provided, just check if guide matches
    if (!stepId) {
      return true;
    }

    // Check if step applies to current route
    const guide = this.registeredGuides.get(guideId);
    if (!guide) {
      return false;
    }

    const step = guide.steps.find((s) => s.id === stepId);
    if (!step) {
      // If step not found in config, still highlight (custom step from directive)
      return true;
    }

    // If step has a route restriction, check it
    // The current route should match or start with the step's route
    if (step.route) {
      const currentRoute = this.currentRoute();
      // Exact match for root, or starts with for other routes
      if (step.route === '/') {
        if (currentRoute !== '/' && currentRoute !== '') {
          return false;
        }
      } else if (!currentRoute.startsWith(step.route)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get step info for tooltip
   */
  getStepInfo(
    guideId: GuideId,
    stepId: string
  ): { message: string; title?: string } | null {
    // First check registered elements (from directive)
    const registered = this.getRegisteredElement(guideId, stepId);
    if (registered) {
      return { message: registered.message, title: registered.title };
    }

    // Fall back to guide definition
    const guide = this.registeredGuides.get(guideId);
    if (!guide) return null;

    const step = guide.steps.find((s) => s.id === stepId);
    if (!step) return null;

    return { message: step.message, title: step.title };
  }

  /**
   * Get a guide by ID
   */
  getGuide(guideId: GuideId): Guide | undefined {
    return this.registeredGuides.get(guideId);
  }

  /**
   * Mark a step as completed
   */
  markStepCompleted(guideId: GuideId, stepId: string): void {
    const progress = this.getProgress(guideId);
    if (progress && !progress.completedSteps.includes(stepId)) {
      progress.completedSteps.push(stepId);
      this.saveProgress(guideId, progress.completedSteps);
    }
  }

  /**
   * Check if all steps in a guide are completed
   */
  isGuideCompleted(guideId: GuideId): boolean {
    const guide = this.registeredGuides.get(guideId);
    if (!guide) return false;

    const progress = this.getProgress(guideId);
    if (!progress) return false;

    return guide.steps.every((step) =>
      progress.completedSteps.includes(step.id)
    );
  }

  /**
   * Get progress for a guide
   */
  getProgress(guideId: GuideId): GuideProgress | null {
    const allProgress = this.getAllProgress();
    return allProgress[guideId] ?? null;
  }

  /**
   * Reset all guide progress
   */
  resetAllProgress(): void {
    this.localStorageService.removeItem(GUIDE_STORAGE_KEY);
    this.activeGuide.set(null);
  }

  private saveProgress(guideId: GuideId, completedSteps: string[] = []): void {
    const allProgress = this.getAllProgress();
    allProgress[guideId] = {
      guideId,
      startedAt: allProgress[guideId]?.startedAt ?? new Date(),
      completedSteps,
      isActive: true,
    };
    this.localStorageService.setItem(GUIDE_STORAGE_KEY, allProgress);
  }

  private clearProgress(guideId: GuideId): void {
    const allProgress = this.getAllProgress();
    if (allProgress[guideId]) {
      allProgress[guideId].isActive = false;
    }
    this.localStorageService.setItem(GUIDE_STORAGE_KEY, allProgress);
  }

  private getAllProgress(): Record<string, GuideProgress> {
    return (
      this.localStorageService.getItem<Record<string, GuideProgress>>(
        GUIDE_STORAGE_KEY
      ) ?? {}
    );
  }

  private restoreActiveGuide(): void {
    const allProgress = this.getAllProgress();
    const activeEntry = Object.values(allProgress).find((p) => p.isActive);
    if (activeEntry) {
      this.activeGuide.set(activeEntry.guideId as GuideId);
    }
  }
}
