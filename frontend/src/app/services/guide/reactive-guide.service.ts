import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  PLATFORM_ID,
  DestroyRef,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter, debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { merge, Subject } from 'rxjs';
import { LocalStorageService } from '../refactored/local-storage.service';
import {
  ReactiveGuide,
  ReactiveGuideId,
  ReactiveGuideState,
  ReactiveGuideStep,
  GuideBranch,
} from './reactive-guide.model';

const REACTIVE_GUIDE_STORAGE_KEY = 'app_reactive_guide_state';

@Injectable({
  providedIn: 'root',
})
export class ReactiveGuideService {
  private platformId = inject(PLATFORM_ID);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  /** All registered reactive guides */
  private registeredGuides = new Map<ReactiveGuideId, ReactiveGuide>();

  /** Current guide state */
  private _guideState = signal<ReactiveGuideState | null>(null);

  /** Whether guide is paused */
  private _isPaused = signal(false);

  /** Current route */
  private _currentRoute = signal<string>('');

  /** Manual state check trigger */
  private stateCheckTrigger = new Subject<void>();

  /** Auto-advance timer handle */
  private autoAdvanceTimer: any = null;

  // ========== Public Signals ==========

  /** Current guide state (read-only) */
  guideState = computed(() => this._guideState());

  /** Active guide ID */
  activeGuideId = computed(() => this._guideState()?.guideId ?? null);

  /** Whether any guide is active */
  isGuideActive = computed(() => this._guideState() !== null);

  /** Whether guide is paused */
  isPaused = computed(() => this._isPaused());

  /** Current route */
  currentRoute = computed(() => this._currentRoute());

  /** Current step object */
  currentStep = computed<ReactiveGuideStep | null>(() => {
    const state = this._guideState();
    if (!state) return null;

    const guide = this.registeredGuides.get(state.guideId);
    if (!guide) return null;

    return guide.steps.get(state.currentStepId) ?? null;
  });

  /** Current guide object */
  currentGuide = computed<ReactiveGuide | null>(() => {
    const state = this._guideState();
    if (!state) return null;
    return this.registeredGuides.get(state.guideId) ?? null;
  });

  /** Elements that should be highlighted for current step */
  currentHighlightTargets = computed<string[]>(() => {
    if (this._isPaused()) return [];

    const step = this.currentStep();
    if (!step) return [];

    // Check if step is visible
    if (step.isVisible && !step.isVisible()) return [];

    // Check route match
    if (step.routes && step.routes.length > 0) {
      const currentRoute = this._currentRoute();
      const routeMatches = step.routes.some(route => {
        if (route === '/') return currentRoute === '/' || currentRoute === '';
        return currentRoute.startsWith(route);
      });
      if (!routeMatches) return [];
    }

    return step.highlightTargets ?? [];
  });

  /** Whether current step is completed */
  isCurrentStepComplete = computed<boolean>(() => {
    const step = this.currentStep();
    if (!step) return false;
    if (!step.isComplete) return false;
    return step.isComplete();
  });

  /** Progress percentage */
  progressPercentage = computed<number>(() => {
    const state = this._guideState();
    if (!state) return 0;

    const guide = this.registeredGuides.get(state.guideId);
    if (!guide) return 0;

    const totalSteps = guide.steps.size;
    const completedSteps = state.completedSteps.length;

    return Math.round((completedSteps / totalSteps) * 100);
  });

  /** All available reactive guides */
  availableGuides = computed(() => Array.from(this.registeredGuides.values()));

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Track route changes
      this.router.events
        .pipe(
          filter((event) => event instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe((event) => {
          this._currentRoute.set((event as NavigationEnd).urlAfterRedirects);
          // Trigger state check on route change
          this.stateCheckTrigger.next();
        });

      // Set initial route
      this._currentRoute.set(this.router.url);

      // Restore active guide from storage
      this.restoreGuideState();

      // Setup auto-advance effect
      this.setupAutoAdvance();
    }
  }

  /**
   * Register a reactive guide
   */
  registerGuide(guide: ReactiveGuide): void {
    this.registeredGuides.set(guide.id, guide);
  }

  /**
   * Register multiple guides
   */
  registerGuides(guides: ReactiveGuide[]): void {
    guides.forEach((guide) => this.registerGuide(guide));
  }

  /**
   * Start a guide
   */
  startGuide(guideId: ReactiveGuideId): void {
    const guide = this.registeredGuides.get(guideId);
    if (!guide) {
      console.warn(`Reactive guide "${guideId}" not found`);
      return;
    }

    // Check if guide is available
    if (guide.isAvailable && !guide.isAvailable()) {
      console.warn(`Guide "${guideId}" is not available in current context`);
      return;
    }

    const state: ReactiveGuideState = {
      guideId,
      currentStepId: guide.initialStepId,
      stepHistory: [],
      branchChoices: {},
      startedAt: new Date(),
      isPaused: false,
      completedSteps: [],
    };

    this._guideState.set(state);
    this._isPaused.set(false);
    this.saveGuideState();

    // Call onActivate for initial step
    const initialStep = guide.steps.get(guide.initialStepId);
    if (initialStep?.onActivate) {
      initialStep.onActivate();
    }

    // Trigger state check
    this.stateCheckTrigger.next();
  }

  /**
   * Stop the current guide
   */
  stopGuide(): void {
    this.clearAutoAdvanceTimer();
    this._guideState.set(null);
    this._isPaused.set(false);
    this.clearGuideState();
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    this._isPaused.update((v) => !v);
    if (this._guideState()) {
      this._guideState.update((state) => {
        if (!state) return state;
        return { ...state, isPaused: this._isPaused() };
      });
      this.saveGuideState();
    }
  }

  /**
   * Pause the guide
   */
  pauseGuide(): void {
    this._isPaused.set(true);
    this.clearAutoAdvanceTimer();
  }

  /**
   * Resume the guide
   */
  resumeGuide(): void {
    this._isPaused.set(false);
    this.stateCheckTrigger.next();
  }

  /**
   * Select a branch option
   */
  selectBranch(branch: GuideBranch): void {
    const state = this._guideState();
    if (!state) return;

    const currentStep = this.currentStep();
    if (!currentStep) return;

    // Record the choice
    this._guideState.update((s) => {
      if (!s) return s;
      return {
        ...s,
        branchChoices: {
          ...s.branchChoices,
          [s.currentStepId]: branch.id,
        },
      };
    });

    // Mark current step as completed
    this.markCurrentStepCompleted();

    // Navigate to the branch's next step
    this.goToStep(branch.nextStepId);
  }

  /**
   * Go to a specific step
   */
  goToStep(stepId: string): void {
    const state = this._guideState();
    if (!state) return;

    const guide = this.registeredGuides.get(state.guideId);
    if (!guide) return;

    const targetStep = guide.steps.get(stepId);
    if (!targetStep) {
      console.warn(`Step "${stepId}" not found in guide "${state.guideId}"`);
      return;
    }

    // Add current step to history
    const updatedHistory = [...state.stepHistory, state.currentStepId];

    this._guideState.update((s) => {
      if (!s) return s;
      return {
        ...s,
        currentStepId: stepId,
        stepHistory: updatedHistory,
      };
    });

    this.saveGuideState();

    // Call onActivate for new step
    if (targetStep.onActivate) {
      targetStep.onActivate();
    }

    // Trigger state check for auto-advance
    this.stateCheckTrigger.next();
  }

  /**
   * Go back to previous step
   */
  goBack(): void {
    const state = this._guideState();
    if (!state || state.stepHistory.length === 0) return;

    const previousStepId = state.stepHistory[state.stepHistory.length - 1];
    const updatedHistory = state.stepHistory.slice(0, -1);

    this._guideState.update((s) => {
      if (!s) return s;
      return {
        ...s,
        currentStepId: previousStepId,
        stepHistory: updatedHistory,
      };
    });

    this.saveGuideState();
    this.stateCheckTrigger.next();
  }

  /**
   * Skip current step and go to next
   */
  skipStep(): void {
    const step = this.currentStep();
    if (!step) return;

    if (step.nextStepId) {
      this.goToStep(step.nextStepId);
    } else if (step.isFinal) {
      this.completeGuide();
    }
  }

  /**
   * Manually advance to next step (used when isComplete is not reliable)
   */
  advanceToNextStep(): void {
    const step = this.currentStep();
    if (!step) return;

    this.markCurrentStepCompleted();

    if (step.nextStepId) {
      this.goToStep(step.nextStepId);
    } else if (step.isFinal) {
      this.completeGuide();
    }
  }

  /**
   * Complete the guide
   */
  completeGuide(): void {
    const state = this._guideState();
    if (!state) return;

    const currentStep = this.currentStep();
    if (currentStep?.onComplete) {
      currentStep.onComplete();
    }

    // Could show completion message here
    console.log(`Guide "${state.guideId}" completed!`);

    this.stopGuide();
  }

  /**
   * Check if a specific element should be highlighted
   */
  shouldHighlight(guideStepTarget: string): boolean {
    if (this._isPaused()) return false;

    const targets = this.currentHighlightTargets();
    return targets.includes(guideStepTarget);
  }

  /**
   * Trigger a manual state check (call this when app state changes)
   */
  triggerStateCheck(): void {
    this.stateCheckTrigger.next();
  }

  /**
   * Get guide by ID
   */
  getGuide(guideId: ReactiveGuideId): ReactiveGuide | undefined {
    return this.registeredGuides.get(guideId);
  }

  // ========== Private Methods ==========

  private setupAutoAdvance(): void {
    // Create observable from computed to watch step completion
    const stepComplete$ = toObservable(this.isCurrentStepComplete, { injector: this.injector });

    // Merge route changes and manual triggers
    merge(
      stepComplete$,
      this.stateCheckTrigger.asObservable()
    )
      .pipe(
        debounceTime(100), // Debounce rapid state changes
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.checkAndAutoAdvance();
      });
  }

  private checkAndAutoAdvance(): void {
    if (this._isPaused()) return;

    const step = this.currentStep();
    if (!step) return;

    // Don't auto-advance choice steps
    if (step.type === 'choice') return;

    // Check if step is complete
    if (step.isComplete && step.isComplete()) {
      const delay = step.autoAdvanceDelay ?? 500;

      // Clear any existing timer
      this.clearAutoAdvanceTimer();

      // Set up delayed auto-advance
      this.autoAdvanceTimer = setTimeout(() => {
        // Re-check completion (state may have changed)
        if (step.isComplete && step.isComplete()) {
          this.markCurrentStepCompleted();

          // Call onComplete callback
          if (step.onComplete) {
            step.onComplete();
          }

          if (step.nextStepId) {
            this.goToStep(step.nextStepId);
          } else if (step.isFinal) {
            this.completeGuide();
          }
        }
      }, delay);
    }
  }

  private clearAutoAdvanceTimer(): void {
    if (this.autoAdvanceTimer) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
  }

  private markCurrentStepCompleted(): void {
    const state = this._guideState();
    if (!state) return;

    if (!state.completedSteps.includes(state.currentStepId)) {
      this._guideState.update((s) => {
        if (!s) return s;
        return {
          ...s,
          completedSteps: [...s.completedSteps, s.currentStepId],
        };
      });
    }
  }

  private saveGuideState(): void {
    const state = this._guideState();
    if (state) {
      this.localStorageService.setItem(REACTIVE_GUIDE_STORAGE_KEY, state);
    }
  }

  private clearGuideState(): void {
    this.localStorageService.removeItem(REACTIVE_GUIDE_STORAGE_KEY);
  }

  private restoreGuideState(): void {
    const saved = this.localStorageService.getItem<ReactiveGuideState>(
      REACTIVE_GUIDE_STORAGE_KEY
    );

    if (saved && saved.guideId) {
      // Check if guide is still registered
      if (this.registeredGuides.has(saved.guideId)) {
        this._guideState.set(saved);
        this._isPaused.set(saved.isPaused);
      } else {
        // Guide no longer available, clear state
        this.clearGuideState();
      }
    }
  }
}
