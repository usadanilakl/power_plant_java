import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  WizardContext,
  WizardContextFrame,
  WizardFlow,
  WizardFlowType,
  WizardStep,
  WizardBranchRequest,
  WizardEntityData,
  SerializableWizardContext,
  SerializableContextFrame,
  StepDataPayload,
} from '../wizard-stack.types';
import { WizardFlowRegistryService } from './wizard-flow-registry.service';

const STORAGE_KEY = 'wizard-stack-context';

@Injectable({ providedIn: 'root' })
export class WizardStackService {
  private flowRegistry = inject(WizardFlowRegistryService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // ========== Core State ==========
  private _context = signal<WizardContext>({
    stack: [],
    isActive: false,
    isMinimized: false,
  });

  // ========== Public Readonly Signals ==========
  context = this._context.asReadonly();

  isActive = computed(() => this._context().isActive);
  isMinimized = computed(() => this._context().isMinimized);
  stackDepth = computed(() => this._context().stack.length);

  // Current frame (top of stack)
  currentFrame = computed<WizardContextFrame | null>(() => {
    const stack = this._context().stack;
    return stack.length > 0 ? stack[stack.length - 1] : null;
  });

  // Current flow
  currentFlow = computed<WizardFlow | null>(() => {
    return this.currentFrame()?.flow ?? null;
  });

  // Current step
  currentStep = computed<WizardStep | null>(() => {
    const frame = this.currentFrame();
    if (!frame) return null;
    return frame.flow.steps[frame.currentStepIndex] ?? null;
  });

  // Current step index
  currentStepIndex = computed(() => this.currentFrame()?.currentStepIndex ?? 0);

  // Total steps in current flow
  totalSteps = computed(() => this.currentFlow()?.steps.length ?? 0);

  // Progress percentage within current frame
  progress = computed(() => {
    const total = this.totalSteps();
    const current = this.currentStepIndex();
    if (total <= 1) return 100;
    return Math.round((current / (total - 1)) * 100);
  });

  // Navigation state
  canGoBack = computed(() => {
    const frame = this.currentFrame();
    if (!frame) return false;
    // Can go back if not at first step, OR if there's a parent frame
    return frame.currentStepIndex > 0 || this.stackDepth() > 1;
  });

  canGoNext = computed(() => {
    const frame = this.currentFrame();
    if (!frame) return false;
    return frame.currentStepIndex < frame.flow.steps.length - 1;
  });

  isFirstStep = computed(() => this.currentStepIndex() === 0);

  isLastStep = computed(() => {
    const frame = this.currentFrame();
    if (!frame) return false;
    return frame.currentStepIndex === frame.flow.steps.length - 1;
  });

  // Whether current frame is a branch (has parent)
  isBranch = computed(() => this.stackDepth() > 1);

  // Parent frame info for breadcrumb
  parentFlowName = computed(() => {
    const stack = this._context().stack;
    if (stack.length > 1) {
      return stack[stack.length - 2].flow.name;
    }
    return null;
  });

  // Full breadcrumb trail
  breadcrumbTrail = computed(() => {
    const stack = this._context().stack;
    return stack.map((frame, index) => ({
      name: frame.flow.name,
      stepIndex: frame.currentStepIndex,
      isActive: index === stack.length - 1,
    }));
  });

  // Current entity data (convenience accessor)
  entityData = computed<WizardEntityData>(() => {
    return this.currentFrame()?.entityData ?? {};
  });

  // ========== Primary Methods ==========

  /**
   * Start a new wizard flow
   */
  start(flowType: WizardFlowType, initialData?: Record<string, any>): boolean {
    const flow = this.flowRegistry.getFlow(flowType);
    if (!flow) {
      console.error(`[WizardStack] No flow found for type: ${flowType}`);
      return false;
    }

    const frame = this.createFrame(flow, initialData);

    this._context.set({
      stack: [frame],
      isActive: true,
      isMinimized: false,
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Branch to a sub-flow (push onto stack)
   * Used when user needs to create a nested object
   */
  branch(request: WizardBranchRequest): boolean {
    const flow = this.flowRegistry.getFlow(request.flowType);
    if (!flow) {
      console.error(`[WizardStack] No flow found for type: ${request.flowType}`);
      return false;
    }

    const frame = this.createFrame(flow, request.initialData, request.returnCallback);

    this._context.update(ctx => ({
      ...ctx,
      stack: [...ctx.stack, frame],
    }));

    this.saveToStorage();
    return true;
  }

  /**
   * Complete current branch and return to parent
   * Passes the result back via the returnCallback
   */
  completeBranch(result?: any): boolean {
    const frame = this.currentFrame();
    if (!frame) return false;

    // If this is the root frame, complete the entire wizard
    if (this.stackDepth() <= 1) {
      return this.complete(result);
    }

    const callback = frame.returnCallback;

    this._context.update(ctx => {
      const newStack = ctx.stack.slice(0, -1);

      // Apply callback to parent frame if exists
      if (callback && newStack.length > 0) {
        const parentFrame = { ...newStack[newStack.length - 1] };
        const transformedResult = callback.transform
          ? callback.transform(result)
          : result;

        // Update parent's entity data
        parentFrame.entityData = this.setNestedValue(
          parentFrame.entityData,
          callback.field,
          transformedResult,
          callback.mode
        );
        parentFrame.lastUpdatedAt = new Date();

        newStack[newStack.length - 1] = parentFrame;
      }

      return { ...ctx, stack: newStack };
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Cancel current branch without passing data back
   */
  cancelBranch(): boolean {
    if (this.stackDepth() <= 1) {
      return false;
    }

    this._context.update(ctx => ({
      ...ctx,
      stack: ctx.stack.slice(0, -1),
    }));

    this.saveToStorage();
    return true;
  }

  /**
   * Move to next step within current frame
   */
  next(stepData?: Record<string, any>): boolean {
    const frame = this.currentFrame();
    if (!frame) return false;

    const currentStep = frame.flow.steps[frame.currentStepIndex];

    // Validate current step if needed
    if (currentStep.validation && stepData) {
      const result = currentStep.validation(stepData, frame);
      if (!result.valid) {
        console.warn('[WizardStack] Validation failed:', result.errors);
        return false;
      }
    }

    // Merge step data into entity data
    const updatedEntityData = stepData
      ? this.mergeStepData(frame.entityData, stepData)
      : frame.entityData;

    // Determine next step
    let nextIndex = frame.currentStepIndex + 1;

    // Handle custom next step (from confirm steps, etc.)
    if (currentStep.nextStepId) {
      const targetIndex = frame.flow.steps.findIndex(s => s.id === currentStep.nextStepId);
      if (targetIndex !== -1) {
        nextIndex = targetIndex;
      }
    }

    // Skip steps that have skipCondition returning true
    while (nextIndex < frame.flow.steps.length) {
      const stepToCheck: WizardStep = frame.flow.steps[nextIndex];
      if (stepToCheck.skipCondition && stepToCheck.skipCondition(frame)) {
        nextIndex++;
      } else {
        break;
      }
    }

    // Check if we've reached the end
    if (nextIndex >= frame.flow.steps.length) {
      // At end of flow - if branch, complete it
      if (this.isBranch()) {
        return this.completeBranch(this.getEntityResult(frame.flow.type, updatedEntityData));
      }
      return false;
    }

    this._context.update(ctx => {
      const newStack = [...ctx.stack];
      const updatedFrame: WizardContextFrame = {
        ...frame,
        currentStepIndex: nextIndex,
        stepHistory: [...frame.stepHistory, frame.currentStepIndex],
        entityData: updatedEntityData,
        lastUpdatedAt: new Date(),
      };
      newStack[newStack.length - 1] = updatedFrame;
      return { ...ctx, stack: newStack };
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Go back to previous step within current frame
   * If at first step of a branch, cancel the branch
   */
  back(): boolean {
    const frame = this.currentFrame();
    if (!frame) return false;

    // If at first step of a branch, offer to cancel
    if (frame.currentStepIndex === 0 && this.isBranch()) {
      return this.cancelBranch();
    }

    // Normal back within frame
    if (frame.stepHistory.length === 0) {
      return false;
    }

    const previousIndex = frame.stepHistory[frame.stepHistory.length - 1];

    this._context.update(ctx => {
      const newStack = [...ctx.stack];
      const updatedFrame: WizardContextFrame = {
        ...frame,
        currentStepIndex: previousIndex,
        stepHistory: frame.stepHistory.slice(0, -1),
        lastUpdatedAt: new Date(),
      };
      newStack[newStack.length - 1] = updatedFrame;
      return { ...ctx, stack: newStack };
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Jump to a specific step by ID
   */
  goToStep(stepId: string): boolean {
    const frame = this.currentFrame();
    if (!frame) return false;

    const targetIndex = frame.flow.steps.findIndex(s => s.id === stepId);
    if (targetIndex === -1) return false;

    this._context.update(ctx => {
      const newStack = [...ctx.stack];
      const updatedFrame: WizardContextFrame = {
        ...frame,
        currentStepIndex: targetIndex,
        stepHistory: [...frame.stepHistory, frame.currentStepIndex],
        lastUpdatedAt: new Date(),
      };
      newStack[newStack.length - 1] = updatedFrame;
      return { ...ctx, stack: newStack };
    });

    this.saveToStorage();
    return true;
  }

  /**
   * Update entity data without advancing step
   */
  updateEntityData(payload: StepDataPayload): void {
    const frame = this.currentFrame();
    if (!frame) return;

    this._context.update(ctx => {
      const newStack = [...ctx.stack];
      const updatedEntityData = { ...frame.entityData };

      if (payload.entityType) {
        // Update specific entity type
        const entityObj = updatedEntityData[payload.entityType] ?? {};
        updatedEntityData[payload.entityType] = {
          ...entityObj,
          [payload.field]: payload.value,
        } as any;
      } else {
        // Try to infer entity type from current flow
        const inferredType = this.inferEntityType(frame.flow.type);
        if (inferredType) {
          const entityObj = updatedEntityData[inferredType] ?? {};
          updatedEntityData[inferredType] = {
            ...entityObj,
            [payload.field]: payload.value,
          } as any;
        } else {
          // Store in collected
          updatedEntityData.collected = {
            ...updatedEntityData.collected,
            [payload.field]: payload.value,
          };
        }
      }

      const updatedFrame: WizardContextFrame = {
        ...frame,
        entityData: updatedEntityData,
        lastUpdatedAt: new Date(),
      };
      newStack[newStack.length - 1] = updatedFrame;
      return { ...ctx, stack: newStack };
    });

    this.saveToStorage();
  }

  /**
   * Batch update entity data
   */
  updateEntityDataBatch(updates: Record<string, any>, entityType?: keyof WizardEntityData): void {
    const frame = this.currentFrame();
    if (!frame) return;

    this._context.update(ctx => {
      const newStack = [...ctx.stack];
      const updatedEntityData = { ...frame.entityData };

      const targetType = entityType ?? this.inferEntityType(frame.flow.type);

      if (targetType) {
        updatedEntityData[targetType] = {
          ...updatedEntityData[targetType],
          ...updates,
        } as any;
      } else {
        updatedEntityData.collected = {
          ...updatedEntityData.collected,
          ...updates,
        };
      }

      const updatedFrame: WizardContextFrame = {
        ...frame,
        entityData: updatedEntityData,
        lastUpdatedAt: new Date(),
      };
      newStack[newStack.length - 1] = updatedFrame;
      return { ...ctx, stack: newStack };
    });

    this.saveToStorage();
  }

  /**
   * Complete the entire wizard
   */
  complete(result?: any): boolean {
    // Clear state
    this._context.set({
      stack: [],
      isActive: false,
      isMinimized: false,
    });

    this.clearStorage();
    return true;
  }

  /**
   * Cancel and close the wizard entirely
   */
  cancel(): void {
    this._context.set({
      stack: [],
      isActive: false,
      isMinimized: false,
    });
    this.clearStorage();
  }

  /**
   * Toggle minimized state
   */
  toggleMinimize(): void {
    this._context.update(ctx => ({
      ...ctx,
      isMinimized: !ctx.isMinimized,
    }));
  }

  minimize(): void {
    this._context.update(ctx => ({ ...ctx, isMinimized: true }));
  }

  expand(): void {
    this._context.update(ctx => ({ ...ctx, isMinimized: false }));
  }

  // ========== Persistence Methods ==========

  /**
   * Check if there's a saved session to resume
   */
  hasSavedSession(): boolean {
    if (!this.isBrowser) return false;
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Resume from saved session
   */
  resume(): boolean {
    if (!this.isBrowser) return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    try {
      const parsed: SerializableWizardContext = JSON.parse(saved);

      // Reconstruct frames with flows from registry
      const stack: WizardContextFrame[] = parsed.stack.map(serialized => {
        const flow = this.flowRegistry.getFlow(serialized.flowType);
        if (!flow) {
          throw new Error(`Flow not found: ${serialized.flowType}`);
        }
        return {
          ...serialized,
          flow,
          startedAt: new Date(serialized.startedAt),
          lastUpdatedAt: new Date(serialized.lastUpdatedAt),
        };
      });

      this._context.set({
        stack,
        isActive: parsed.isActive,
        isMinimized: parsed.isMinimized,
        parallelBuild: parsed.parallelBuild,
      });

      return true;
    } catch (e) {
      console.error('[WizardStack] Failed to resume session:', e);
      this.clearStorage();
      return false;
    }
  }

  /**
   * Get saved session info without resuming
   */
  getSavedSessionInfo(): { flowType: WizardFlowType; flowName: string; lastUpdated: Date } | null {
    if (!this.isBrowser) return null;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    try {
      const parsed: SerializableWizardContext = JSON.parse(saved);
      if (parsed.stack.length === 0) return null;

      const firstFrame = parsed.stack[0];
      const flow = this.flowRegistry.getFlow(firstFrame.flowType);

      return {
        flowType: firstFrame.flowType,
        flowName: flow?.name ?? firstFrame.flowType,
        lastUpdated: new Date(firstFrame.lastUpdatedAt),
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

  // ========== Helper Methods for Steps ==========

  /**
   * Get value from entity data by path
   */
  getValue<T = any>(path: string): T | undefined {
    const frame = this.currentFrame();
    if (!frame) return undefined;

    return this.getNestedValue(frame.entityData, path) as T;
  }

  /**
   * Get the primary entity based on current flow type
   */
  getPrimaryEntity<T = any>(): T | undefined {
    const frame = this.currentFrame();
    if (!frame) return undefined;

    const entityType = this.inferEntityType(frame.flow.type);
    if (!entityType) return undefined;

    return frame.entityData[entityType] as T;
  }

  // ========== Private Helpers ==========

  private createFrame(
    flow: WizardFlow,
    initialData?: Record<string, any>,
    returnCallback?: WizardBranchRequest['returnCallback']
  ): WizardContextFrame {
    return {
      id: `${flow.type}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      flow,
      currentStepIndex: 0,
      stepHistory: [],
      entityData: this.initializeEntityData(flow.type, initialData),
      returnCallback,
      startedAt: new Date(),
      lastUpdatedAt: new Date(),
    };
  }

  private initializeEntityData(
    flowType: WizardFlowType,
    initialData?: Record<string, any>
  ): WizardEntityData {
    switch (flowType) {
      case 'build-standard':
      case 'modify-standard':
        return {
          lotoStandard: {
            lotoPoints: [],
            ...initialData,
          },
        };
      case 'add-loto-point':
      case 'edit-loto-point':
        return {
          lotoPoint: initialData ?? {},
        };
      case 'upload-file':
      case 'select-file':
        return {
          file: initialData ?? {},
        };
      case 'create-value':
        return {
          value: initialData ?? {},
        };
      case 'create-zero-energy':
        return {
          zeroEnergy: initialData ?? {},
        };
      default:
        return {
          collected: initialData ?? {},
        };
    }
  }

  private inferEntityType(flowType: WizardFlowType): keyof WizardEntityData | null {
    switch (flowType) {
      case 'build-standard':
      case 'modify-standard':
        return 'lotoStandard';
      case 'add-loto-point':
      case 'edit-loto-point':
        return 'lotoPoint';
      case 'upload-file':
      case 'select-file':
        return 'file';
      case 'create-value':
        return 'value';
      case 'create-zero-energy':
        return 'zeroEnergy';
      default:
        return null;
    }
  }

  private mergeStepData(
    entityData: WizardEntityData,
    stepData: Record<string, any>
  ): WizardEntityData {
    const result = { ...entityData };

    // Merge into appropriate entity type based on keys
    for (const [key, value] of Object.entries(stepData)) {
      if (key.startsWith('lotoStandard.')) {
        const field = key.replace('lotoStandard.', '');
        result.lotoStandard = { ...result.lotoStandard, [field]: value };
      } else if (key.startsWith('lotoPoint.')) {
        const field = key.replace('lotoPoint.', '');
        result.lotoPoint = { ...result.lotoPoint, [field]: value };
      } else if (key.startsWith('file.')) {
        const field = key.replace('file.', '');
        result.file = { ...result.file, [field]: value };
      } else if (key.startsWith('value.')) {
        const field = key.replace('value.', '');
        result.value = { ...result.value, [field]: value };
      } else if (key.startsWith('zeroEnergy.')) {
        const field = key.replace('zeroEnergy.', '');
        result.zeroEnergy = { ...result.zeroEnergy, [field]: value };
      } else {
        // Store in collected
        result.collected = { ...result.collected, [key]: value };
      }
    }

    return result;
  }

  private setNestedValue(
    obj: any,
    path: string,
    value: any,
    mode: 'replace' | 'append' = 'replace'
  ): any {
    const keys = path.split('.');
    const result = JSON.parse(JSON.stringify(obj)); // Deep clone
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (mode === 'append' && Array.isArray(current[lastKey])) {
      current[lastKey] = [...current[lastKey], value];
    } else {
      current[lastKey] = value;
    }

    return result;
  }

  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }

    return current;
  }

  private getEntityResult(flowType: WizardFlowType, entityData: WizardEntityData): any {
    switch (flowType) {
      case 'build-standard':
      case 'modify-standard':
        return entityData.lotoStandard;
      case 'add-loto-point':
      case 'edit-loto-point':
        return entityData.lotoPoint;
      case 'upload-file':
      case 'select-file':
        return entityData.file;
      case 'create-value':
        return entityData.value;
      case 'create-zero-energy':
        return entityData.zeroEnergy;
      default:
        return entityData.collected;
    }
  }

  private saveToStorage(): void {
    const ctx = this._context();

    const serializable: SerializableWizardContext = {
      stack: ctx.stack.map(frame => ({
        id: frame.id,
        flowType: frame.flow.type,
        currentStepIndex: frame.currentStepIndex,
        stepHistory: frame.stepHistory,
        entityData: this.sanitizeEntityData(frame.entityData),
        returnCallback: frame.returnCallback,
        startedAt: frame.startedAt.toISOString(),
        lastUpdatedAt: frame.lastUpdatedAt.toISOString(),
      })),
      isActive: ctx.isActive,
      isMinimized: ctx.isMinimized,
      parallelBuild: ctx.parallelBuild ? { enabled: ctx.parallelBuild.enabled } : undefined,
    };

    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
    }
  }

  private sanitizeEntityData(entityData: WizardEntityData): WizardEntityData {
    // Remove non-serializable objects (like File)
    const sanitized = JSON.parse(JSON.stringify(entityData));

    // Remove File object from file entity
    if (sanitized.file?.uploadedFile) {
      delete sanitized.file.uploadedFile;
    }

    return sanitized;
  }

  private clearStorage(): void {
    if (this.isBrowser) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
}
