/**
 * Guide Form Types
 * Type definitions for the guided form wizard system
 */

// Available guide actions
export type GuideAction =
  | 'upload-file'
  | 'add-loto-point'
  | 'edit-loto-point'
  | 'create-standard';

// Step component types
export type GuideStepType =
  | 'welcome'
  | 'form'
  | 'file-select'      // Simple file upload (Phase 1)
  | 'file-selector'    // Search/select existing file or upload (Phase 2+)
  | 'file-viewer'      // View file and mark location
  | 'loto-form'        // LOTO point dual form (legacy - opens full form)
  | 'tutorial'         // Educational step with explanation + action button
  | 'confirm'
  | 'review'
  | 'complete';

// Tutorial step topics for LOTO point creation
export type GuideTutorialTopic =
  | 'tag-number'       // Tag number generation
  | 'description'      // Description with naming convention
  | 'positions'        // isoPos and normPos selection
  | 'zero-energy'      // Zero energy phrase builder
  | 'file-connection'  // Connect LOTO point to file/equipment
  | 'counterpart';     // Counterpart (unit 01/02) linking

// Hint configuration
export interface GuideHint {
  message: string;
  icon?: string;
  type?: 'info' | 'tip' | 'warning';
}

// Individual step in a flow
export interface GuideFormStep {
  id: string;
  type: GuideStepType;
  title: string;
  description: string;
  hints?: GuideHint[];

  // For 'form' type steps
  formFields?: string[];
  formEntityType?: 'file' | 'loto-point' | 'loto-standard';

  // For 'tutorial' type steps
  tutorialTopic?: GuideTutorialTopic;
  tutorialConfig?: GuideTutorialConfig;

  // For 'confirm' type steps
  confirmOptions?: {
    yesLabel: string;
    noLabel: string;
    yesDescription?: string;
    noDescription?: string;
  };

  // For 'welcome' and 'complete' type steps
  icon?: string;
  actionLabel?: string;

  // Validation
  isOptional?: boolean;
  validation?: (data: any, state: GuideFormState) => boolean;
}

// Configuration for tutorial steps
export interface GuideTutorialConfig {
  // Explanatory content
  explanation: string;
  examples?: string[];
  conventions?: string[];

  // Action configuration
  actionLabel: string;
  actionIcon?: string;

  // Field being edited (for state tracking)
  fieldName?: string;

  // Whether the step can be skipped
  canSkip?: boolean;
  skipLabel?: string;
}

// Complete flow definition
export interface GuideFlow {
  action: GuideAction;
  name: string;
  description: string;
  icon: string;
  steps: GuideFormStep[];
}

// Runtime state of a guide session
export interface GuideFormState {
  action: GuideAction;
  currentStepIndex: number;
  stepHistory: number[];
  collectedData: Record<string, any>;

  // File upload state (for upload-file flow)
  selectedFile?: File;
  uploadedFileId?: number;

  // File selection state (for flows that use existing files)
  selectedFileDto?: { id: number; name: string; fileType?: string };

  // LOTO point-specific state
  selectedLotoPointIds?: number[];
  createdLotoPointId?: number;

  // LOTO point being created/edited (for tutorial flow)
  lotoPointData?: {
    tagNumber?: string;
    description?: string;
    unit?: string;
    specificLocation?: string;
    isoPos?: { id: number; name: string };
    normPos?: { id: number; name: string };
    location?: { id: number; name: string };
    eqType?: { id: number; name: string };
    zeroEnergy?: any;
    counterpartId?: number;
    equipmentIds?: number[];
  };

  // Timestamps
  startedAt: Date;
  lastUpdatedAt: Date;
}

// Action card for action selection
export interface GuideActionCard {
  action: GuideAction;
  title: string;
  description: string;
  icon: string;
  disabled?: boolean;
  disabledReason?: string;
}

// Available actions for the guide menu
export const GUIDE_ACTIONS: GuideActionCard[] = [
  {
    action: 'upload-file',
    title: 'Upload File',
    description: 'Upload a new P&ID, drawing, or document',
    icon: 'upload_file',
  },
  {
    action: 'add-loto-point',
    title: 'Add LOTO Point',
    description: 'Create a new LOTO point on a file',
    icon: 'add_location',
  },
  {
    action: 'edit-loto-point',
    title: 'Edit LOTO Point',
    description: 'Modify an existing LOTO point',
    icon: 'edit_location',
  },
  {
    action: 'create-standard',
    title: 'Create LOTO Standard',
    description: 'Build a new LOTO standard with points',
    icon: 'playlist_add',
  },
];
