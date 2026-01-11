/**
 * Reactive Guide System Models
 *
 * A state-aware guide system that:
 * - Detects step completion based on app state
 * - Supports branching flows based on user choices
 * - Auto-progresses when conditions are met
 * - Shows step dialogs with instructions
 */

import { Signal } from '@angular/core';

export type ReactiveGuideId =
  | 'loto-builder-full'
  | 'create-loto-point'
  | 'create-loto-standard'
  | 'manage-files';

export type ReactiveGuideCategory = 'loto' | 'files' | 'equipment' | 'general';

/**
 * Condition function type - returns true if condition is met
 */
export type GuideCondition = () => boolean;

/**
 * A branch option that user can choose
 */
export interface GuideBranch {
  /** Unique ID for this branch */
  id: string;
  /** Display label for the button */
  label: string;
  /** Description shown below the label */
  description?: string;
  /** Icon name (Material Icons) */
  icon?: string;
  /** Step ID to go to if this branch is selected */
  nextStepId: string;
}

/**
 * Hint shown after step is completed or during step
 */
export interface GuideHint {
  /** Hint message */
  message: string;
  /** Icon name */
  icon?: string;
  /** When to show: 'during' = while on step, 'after' = after completion */
  showWhen?: 'during' | 'after';
}

/**
 * A reactive guide step with conditions and branching
 */
export interface ReactiveGuideStep {
  /** Unique identifier for this step */
  id: string;

  /** Order in the flow (used for linear progression) */
  order: number;

  /** Step type determines UI behavior */
  type: 'action' | 'choice' | 'info';

  /** Title shown in step dialog */
  title: string;

  /** Message/instruction shown in step dialog */
  message: string;

  /** Icon for the step */
  icon?: string;

  /** Route(s) where this step applies */
  routes?: string[];

  /** Element targets to highlight (guideId:stepId format) */
  highlightTargets?: string[];

  /**
   * Condition to check if step is visible/applicable.
   * If not provided, step is always visible when route matches.
   */
  isVisible?: GuideCondition;

  /**
   * Condition to check if step is completed.
   * When this returns true, guide auto-advances to next step.
   * For 'choice' type, this is typically always false (requires user selection).
   */
  isComplete?: GuideCondition;

  /**
   * Branch options for 'choice' type steps.
   * User must select one to proceed.
   */
  branches?: GuideBranch[];

  /**
   * Next step ID for linear progression.
   * Ignored if branches are provided (use branch.nextStepId instead).
   */
  nextStepId?: string;

  /**
   * Previous step ID for back navigation.
   */
  previousStepId?: string;

  /**
   * Hints/tips to show with this step
   */
  hints?: GuideHint[];

  /**
   * Whether this is a terminal/final step
   */
  isFinal?: boolean;

  /**
   * Delay in ms before auto-advancing after completion (default: 500ms)
   */
  autoAdvanceDelay?: number;

  /**
   * Optional callback when step becomes active
   */
  onActivate?: () => void;

  /**
   * Optional callback when step is completed
   */
  onComplete?: () => void;
}

/**
 * A reactive guide definition
 */
export interface ReactiveGuide {
  /** Unique identifier */
  id: ReactiveGuideId;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Icon name (Material Icons) */
  icon: string;

  /** Category for grouping */
  category: ReactiveGuideCategory;

  /** Initial step ID */
  initialStepId: string;

  /** All steps in this guide (keyed by step ID for easy lookup) */
  steps: Map<string, ReactiveGuideStep>;

  /** Optional global condition for the entire guide */
  isAvailable?: GuideCondition;
}

/**
 * Current state of a running guide
 */
export interface ReactiveGuideState {
  /** Active guide ID */
  guideId: ReactiveGuideId;

  /** Current step ID */
  currentStepId: string;

  /** History of visited step IDs (for back navigation) */
  stepHistory: string[];

  /** User's branch choices (stepId -> branchId) */
  branchChoices: Record<string, string>;

  /** Started timestamp */
  startedAt: Date;

  /** Whether guide is paused */
  isPaused: boolean;

  /** Completed step IDs */
  completedSteps: string[];
}

/**
 * Factory function signature for creating guides with injected dependencies
 */
export type ReactiveGuideFactory = () => ReactiveGuide;

/**
 * Helper to create a Map from step array
 */
export function createStepsMap(steps: ReactiveGuideStep[]): Map<string, ReactiveGuideStep> {
  const map = new Map<string, ReactiveGuideStep>();
  steps.forEach(step => map.set(step.id, step));
  return map;
}
