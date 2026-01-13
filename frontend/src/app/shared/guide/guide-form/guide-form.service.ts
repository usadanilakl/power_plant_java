import { Injectable, signal, computed } from '@angular/core';
import {
  GuideAction,
  GuideFlow,
  GuideFormState,
  GuideFormStep,
} from './guide-form.types';
import { UPLOAD_FILE_FLOW } from './flows/upload-file.flow';
import { ADD_LOTO_POINT_FLOW } from './flows/add-loto-point.flow';

const STORAGE_KEY = 'guide-form-state';

@Injectable({
  providedIn: 'root',
})
export class GuideFormService {
  // Available flows
  private flows: Map<GuideAction, GuideFlow> = new Map([
    ['upload-file', UPLOAD_FILE_FLOW],
    ['add-loto-point', ADD_LOTO_POINT_FLOW],
  ]);

  // Core state
  private _isActive = signal<boolean>(false);
  private _currentFlow = signal<GuideFlow | null>(null);
  private _state = signal<GuideFormState | null>(null);
  private _isMinimized = signal<boolean>(false);

  // Public signals
  isActive = this._isActive.asReadonly();
  currentFlow = this._currentFlow.asReadonly();
  state = this._state.asReadonly();
  isMinimized = this._isMinimized.asReadonly();

  // Computed values
  currentStep = computed<GuideFormStep | null>(() => {
    const flow = this._currentFlow();
    const state = this._state();
    if (!flow || !state) return null;
    return flow.steps[state.currentStepIndex] ?? null;
  });

  currentStepIndex = computed(() => this._state()?.currentStepIndex ?? 0);

  totalSteps = computed(() => this._currentFlow()?.steps.length ?? 0);

  progress = computed(() => {
    const total = this.totalSteps();
    const current = this.currentStepIndex();
    if (total === 0) return 0;
    return Math.round((current / (total - 1)) * 100);
  });

  canGoBack = computed(() => {
    const state = this._state();
    return state ? state.currentStepIndex > 0 : false;
  });

  canGoNext = computed(() => {
    const flow = this._currentFlow();
    const state = this._state();
    if (!flow || !state) return false;
    return state.currentStepIndex < flow.steps.length - 1;
  });

  isFirstStep = computed(() => this.currentStepIndex() === 0);

  isLastStep = computed(() => {
    const flow = this._currentFlow();
    const state = this._state();
    if (!flow || !state) return false;
    return state.currentStepIndex === flow.steps.length - 1;
  });

  /**
   * Start a new guide flow
   */
  start(action: GuideAction): boolean {
    const flow = this.flows.get(action);
    if (!flow) {
      console.error(`No flow found for action: ${action}`);
      return false;
    }

    const initialState: GuideFormState = {
      action,
      currentStepIndex: 0,
      stepHistory: [],
      collectedData: {},
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
    };

    this._currentFlow.set(flow);
    this._state.set(initialState);
    this._isActive.set(true);
    this._isMinimized.set(false);

    this.saveToStorage();
    return true;
  }

  /**
   * Move to next step, saving current step data
   */
  next(stepData?: Record<string, any>): boolean {
    const flow = this._currentFlow();
    const state = this._state();
    if (!flow || !state) return false;

    // Validate current step if needed
    const currentStep = flow.steps[state.currentStepIndex];
    if (currentStep.validation && stepData) {
      if (!currentStep.validation(stepData, state)) {
        return false;
      }
    }

    // Can't go past last step
    if (state.currentStepIndex >= flow.steps.length - 1) {
      return false;
    }

    // Merge step data
    const newCollectedData = stepData
      ? { ...state.collectedData, ...stepData }
      : state.collectedData;

    // Update state
    this._state.set({
      ...state,
      currentStepIndex: state.currentStepIndex + 1,
      stepHistory: [...state.stepHistory, state.currentStepIndex],
      collectedData: newCollectedData,
      lastUpdatedAt: new Date(),
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Go back to previous step
   */
  back(): boolean {
    const state = this._state();
    if (!state || state.currentStepIndex === 0) return false;

    const newHistory = [...state.stepHistory];
    const previousIndex = newHistory.pop() ?? state.currentStepIndex - 1;

    this._state.set({
      ...state,
      currentStepIndex: previousIndex,
      stepHistory: newHistory,
      lastUpdatedAt: new Date(),
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Update collected data without advancing step
   */
  updateData(data: Record<string, any>): void {
    const state = this._state();
    if (!state) return;

    this._state.set({
      ...state,
      collectedData: { ...state.collectedData, ...data },
      lastUpdatedAt: new Date(),
    });

    this.saveToStorage();
  }

  /**
   * Set selected file (for file upload flow)
   */
  setSelectedFile(file: File): void {
    const state = this._state();
    if (!state) return;

    this._state.set({
      ...state,
      selectedFile: file,
      lastUpdatedAt: new Date(),
    });
  }

  /**
   * Set selected file DTO (for flows that use existing files)
   */
  setSelectedFileDto(fileDto: { id: number; name: string; fileType?: string }): void {
    const state = this._state();
    if (!state) return;

    this._state.set({
      ...state,
      selectedFileDto: fileDto,
      lastUpdatedAt: new Date(),
    });

    this.saveToStorage();
  }

  /**
   * Set created LOTO point ID
   */
  setCreatedLotoPointId(id: number): void {
    const state = this._state();
    if (!state) return;

    this._state.set({
      ...state,
      createdLotoPointId: id,
      lastUpdatedAt: new Date(),
    });

    this.saveToStorage();
  }

  /**
   * Update LOTO point data (for tutorial flow)
   */
  updateLotoPointData(field: string, value: any): void {
    const state = this._state();
    if (!state) return;

    const currentLotoData = state.lotoPointData || {};

    this._state.set({
      ...state,
      lotoPointData: {
        ...currentLotoData,
        [field]: value,
      },
      lastUpdatedAt: new Date(),
    });

    this.saveToStorage();
  }

  /**
   * Toggle minimized state
   */
  toggleMinimize(): void {
    this._isMinimized.update((v) => !v);
  }

  /**
   * Minimize the guide
   */
  minimize(): void {
    this._isMinimized.set(true);
  }

  /**
   * Expand the guide
   */
  expand(): void {
    this._isMinimized.set(false);
  }

  /**
   * Cancel and close the guide
   */
  cancel(): void {
    this._isActive.set(false);
    this._currentFlow.set(null);
    this._state.set(null);
    this._isMinimized.set(false);
    this.clearStorage();
  }

  /**
   * Complete the guide successfully
   */
  complete(): void {
    // The actual submission should be handled by the component
    // This just cleans up the guide state
    this._isActive.set(false);
    this._currentFlow.set(null);
    this._state.set(null);
    this._isMinimized.set(false);
    this.clearStorage();
  }

  /**
   * Check if there's a saved session to resume
   */
  hasSavedSession(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null;
  }

  /**
   * Resume a previously saved session
   */
  resume(): boolean {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    try {
      const state = JSON.parse(saved) as GuideFormState;
      const flow = this.flows.get(state.action);

      if (!flow) {
        this.clearStorage();
        return false;
      }

      // Restore dates
      state.startedAt = new Date(state.startedAt);
      state.lastUpdatedAt = new Date(state.lastUpdatedAt);

      this._currentFlow.set(flow);
      this._state.set(state);
      this._isActive.set(true);
      this._isMinimized.set(false);

      return true;
    } catch (e) {
      console.error('Failed to resume guide session:', e);
      this.clearStorage();
      return false;
    }
  }

  /**
   * Get saved session info without resuming
   */
  getSavedSessionInfo(): { action: GuideAction; lastUpdated: Date } | null {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    try {
      const state = JSON.parse(saved) as GuideFormState;
      return {
        action: state.action,
        lastUpdated: new Date(state.lastUpdatedAt),
      };
    } catch {
      return null;
    }
  }

  /**
   * Discard saved session
   */
  discardSavedSession(): void {
    this.clearStorage();
  }

  private saveToStorage(): void {
    const state = this._state();
    if (!state) return;

    // Don't save File objects - they can't be serialized
    const stateToSave = { ...state };
    delete stateToSave.selectedFile;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }

  private clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}
