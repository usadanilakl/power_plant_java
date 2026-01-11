/**
 * Guide System Models
 *
 * A guide is a user-controlled, persistent walkthrough that highlights
 * relevant elements as the user navigates through the application.
 * Unlike tours (which are sequential), guides are contextual and passive.
 */

export type GuideId =
  | 'create-loto-point'
  | 'create-loto-point-bulk'
  | 'create-loto-standard'
  | 'manage-files'
  | 'equipment-management';

export interface GuideStep {
  /** Unique identifier for this step within the guide */
  id: string;
  /** CSS selector to find the element (fallback if directive not used) */
  selector?: string;
  /** Message shown on hover */
  message: string;
  /** Optional title for the tooltip */
  title?: string;
  /** Order of this step (lower = earlier in flow) */
  order: number;
  /** Route where this step applies (optional, applies to all if not set) */
  route?: string;
}

export interface Guide {
  /** Unique identifier */
  id: GuideId;
  /** Display name */
  name: string;
  /** Description of what this guide helps with */
  description: string;
  /** Icon name (Material Icons) */
  icon: string;
  /** Category for grouping */
  category: GuideCategory;
  /** Steps in this guide */
  steps: GuideStep[];
}

export type GuideCategory = 'loto' | 'files' | 'equipment' | 'general';

export interface GuideProgress {
  guideId: GuideId;
  startedAt: Date;
  completedSteps: string[];
  isActive: boolean;
}

export interface RegisteredElement {
  /** The guide and step this element belongs to */
  guideId: GuideId;
  stepId: string;
  /** Reference to the DOM element */
  element: HTMLElement;
  /** Message to show on hover */
  message: string;
  /** Optional title */
  title?: string;
}
