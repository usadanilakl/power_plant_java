/**
 * Wizard Stack Types
 * Type definitions for the stack-based guided wizard system
 */

import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { LotoStandardDto } from '../../../models/loto/loto-standard.model';
import { ValueDto } from '../../../models/value.model';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { FileDto } from '../../../models/file/file.model';

// ============================================================================
// Flow Types - Available wizard flows
// ============================================================================

export type WizardFlowType =
  | 'build-standard'        // Create new LOTO standard with all steps
  | 'modify-standard'       // Edit existing LOTO standard
  | 'add-loto-point'        // Create new LOTO point (standalone or branch)
  | 'edit-loto-point'       // Edit existing LOTO point
  | 'create-value'          // Create ValueDto (eqType, isoPos, normPos, location)
  | 'create-zero-energy'    // Create zero energy configuration
  | 'upload-file'           // Upload new file
  | 'select-file';          // Select existing file

// ============================================================================
// Step Types - UI component types for steps
// ============================================================================

export type WizardStepType =
  | 'welcome'               // Introduction/welcome screen
  | 'text-input'            // Single text input with hints
  | 'textarea-input'        // Multi-line text input
  | 'select-input'          // Dropdown/searchable select with optional "Create New"
  | 'value-select'          // ValueDto select using RfValueSelectComponent (CRUD built-in)
  | 'multi-select'          // Multi-select from table/list with "Add" capability
  | 'form-section'          // Group of form fields rendered together
  | 'tag-number'            // Tag number with manual input + generator tabs
  | 'description-builder'   // Description with naming convention keywords
  | 'zero-energy'           // Zero energy phrase selection + equipment mapping
  | 'equipment-picker'      // P&ID viewer with browse, select, and draw capabilities
  | 'file-upload'           // Drag-drop file upload
  | 'file-browser'          // Browse/select existing files
  | 'file-viewer'           // View file with interactive image
  | 'equipment-browser'     // P&ID viewer with shape drawing (legacy - use equipment-picker)
  | 'table-selector'        // Select item(s) from a table
  | 'confirm'               // Yes/No decision point
  | 'review'                // Review all collected data before submit
  | 'complete';             // Success/completion screen

// ============================================================================
// Value Category Types - for creating ValueDto
// ============================================================================

export type ValueCategory =
  | 'eqType'
  | 'isoPos'
  | 'normPos'
  | 'location'
  | 'zeroEnergyTemplate';

// ============================================================================
// Hint Configuration
// ============================================================================

export interface WizardHint {
  message: string;
  icon?: string;
  type?: 'info' | 'tip' | 'warning' | 'example';
}

// ============================================================================
// Step Definition
// ============================================================================

export interface WizardStep {
  id: string;
  type: WizardStepType;
  title: string;
  description: string;
  hints?: WizardHint[];

  // For text-input and textarea-input steps
  inputConfig?: {
    fieldName: string;
    placeholder?: string;
    maxLength?: number;
    required?: boolean;
    pattern?: string;
    patternMessage?: string;
  };

  // For select-input steps
  selectConfig?: {
    fieldName: string;
    optionsSource: 'api' | 'static' | 'computed';
    apiEndpoint?: string;           // e.g., 'values/eqType'
    staticOptions?: { value: any; label: string }[];
    allowCreate?: boolean;
    createFlowType?: WizardFlowType;
    createInitialData?: Record<string, any>;
    multiple?: boolean;
    searchable?: boolean;
    required?: boolean;
  };

  // For value-select steps (uses RfValueSelectComponent)
  valueSelectConfig?: {
    fieldName: string;              // Field to store selected value ID
    categoryAlias: ValueCategory;   // e.g., 'eqType', 'location', 'isoPos', 'normPos'
    label?: string;                 // Display label
    required?: boolean;
    canManageValues?: boolean;      // Allow add/edit/delete (default: true)
  };

  // For tag-number steps
  tagNumberConfig?: {
    fieldName: string;              // Default: 'tagNumber'
    showGenerator?: boolean;        // Show generator tab (default: true)
    showManualInput?: boolean;      // Show manual input tab (default: true)
    required?: boolean;
  };

  // For description-builder steps
  descriptionConfig?: {
    fieldName: string;              // Default: 'description'
    showNamingConvention?: boolean; // Show naming convention panel (default: true)
    maxLength?: number;
    required?: boolean;
  };

  // For zero-energy steps
  zeroEnergyConfig?: {
    showPhraseBuilder?: boolean;    // Show phrase selection (default: true)
    showEquipmentMapping?: boolean; // Show equipment selection for placeholders (default: true)
    allowCreateLotoPoint?: boolean; // Allow creating new LOTO point for equipment (default: true)
  };

  // For equipment-picker steps
  equipmentPickerConfig?: {
    fieldName: string;              // Where to store selected equipment
    allowBrowse?: boolean;          // Allow selecting existing equipment (default: true)
    allowDraw?: boolean;            // Allow drawing new equipment (default: true)
    fileFieldName?: string;         // Field to store selected file reference
    multiSelect?: boolean;          // Allow multiple equipment selection (default: false)
  };

  // For multi-select / table-selector steps
  tableConfig?: {
    fieldName: string;              // Where to store selected items
    entityType: 'loto-point' | 'file' | 'equipment' | 'loto-standard';
    columns?: string[];             // Column keys to display
    allowCreate?: boolean;
    createFlowType?: WizardFlowType;
    preFilter?: Record<string, any>;
    minSelection?: number;
    maxSelection?: number;
  };

  // For form-section steps - render multiple fields
  formConfig?: {
    entityType: 'loto-point' | 'loto-standard' | 'file' | 'equipment' | 'value' | 'zero-energy';
    fields: string[];               // Field names to render
    layout?: 'vertical' | 'horizontal' | 'grid';
  };

  // For file-upload steps
  uploadConfig?: {
    accept?: string;                // e.g., '.pdf,.png,.jpg'
    maxSize?: number;               // in bytes
    fieldName?: string;             // Where to store file reference
  };

  // For file-browser steps
  fileBrowserConfig?: {
    fieldName: string;
    fileTypes?: string[];           // Filter by file type
    allowUpload?: boolean;
  };

  // For equipment-browser steps
  equipmentConfig?: {
    fieldName: string;
    allowDraw?: boolean;
    allowSelect?: boolean;
  };

  // For confirm steps
  confirmConfig?: {
    yesLabel: string;
    noLabel: string;
    yesDescription?: string;
    noDescription?: string;
    resultField?: string;           // Store true/false result
    yesNextStep?: string;           // Step ID to go to on yes
    noNextStep?: string;            // Step ID to go to on no
  };

  // Navigation
  nextStepId?: string;              // Override default next step
  skipCondition?: (frame: WizardContextFrame) => boolean;
  isOptional?: boolean;
  validation?: (data: any, frame: WizardContextFrame) => ValidationResult;
}

// ============================================================================
// Validation
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  errors?: { field: string; message: string }[];
}

// ============================================================================
// Flow Definition
// ============================================================================

export interface WizardFlow {
  type: WizardFlowType;
  name: string;
  description: string;
  icon: string;
  steps: WizardStep[];

  // Flow configuration
  canBranch?: boolean;              // Can this flow be used as a sub-flow?
  requiresInitialData?: string[];   // Required fields in initialData

  // Category for create-value flows
  valueCategory?: ValueCategory;
}

// ============================================================================
// Branch Request - for pushing new context onto stack
// ============================================================================

export interface WizardBranchRequest {
  flowType: WizardFlowType;
  initialData?: Record<string, any>;
  returnCallback: {
    field: string;                  // Path to field in parent entityData
    transform?: (result: any) => any;
    mode?: 'replace' | 'append';    // For arrays, append vs replace
  };
}

// ============================================================================
// Entity Data - typed data collected during wizard
// ============================================================================

export interface WizardEntityData {
  // LOTO Standard data
  lotoStandard?: Partial<LotoStandardDto> & {
    counterpartName?: string;
    buildCounterpart?: boolean;
  };

  // LOTO Point data
  lotoPoint?: Partial<LotoPointDto>;

  // File data
  file?: Partial<FileDto> & {
    uploadedFile?: File;
  };

  // Equipment data
  equipment?: Partial<EquipmentDto>;

  // Value data (for creating eqType, isoPos, etc.)
  value?: Partial<ValueDto> & {
    categoryName?: ValueCategory;
    categoryAlias?: string;  // Alias used by RfValueApiService
  };

  // Zero Energy data
  zeroEnergy?: {
    method?: string;
    zeroEnergyTemplate?: ValueDto | null;
    templateEquipment?: EquipmentDto[];
    templateEquipmentIds?: number[];
    referenceLotoPoint?: LotoPointDto | null;
  };

  // Generic collected data (for steps that don't fit above)
  collected?: Record<string, any>;
}

// ============================================================================
// Context Frame - single frame in the navigation stack
// ============================================================================

export interface WizardContextFrame {
  id: string;                       // Unique frame ID
  flow: WizardFlow;                 // The flow being executed
  currentStepIndex: number;
  stepHistory: number[];            // For back navigation within frame

  // Collected data
  entityData: WizardEntityData;

  // Return callback when this frame completes (if it's a branch)
  returnCallback?: WizardBranchRequest['returnCallback'];

  // Timestamps
  startedAt: Date;
  lastUpdatedAt: Date;
}

// ============================================================================
// Wizard Context - complete wizard state
// ============================================================================

export interface WizardContext {
  // Navigation stack - last element is active frame
  stack: WizardContextFrame[];

  // Global state
  isActive: boolean;
  isMinimized: boolean;

  // Parallel builds for counterparts (U1/U2)
  parallelBuild?: {
    enabled: boolean;
    primaryFrame?: WizardContextFrame;
    counterpartFrame?: WizardContextFrame;
  };
}

// ============================================================================
// Serializable Context - for localStorage persistence
// ============================================================================

export interface SerializableContextFrame {
  id: string;
  flowType: WizardFlowType;         // Only store flow type, reconstruct flow from registry
  currentStepIndex: number;
  stepHistory: number[];
  entityData: WizardEntityData;     // Note: File objects will be stripped
  returnCallback?: WizardBranchRequest['returnCallback'];
  startedAt: string;                // ISO date string
  lastUpdatedAt: string;
}

export interface SerializableWizardContext {
  stack: SerializableContextFrame[];
  isActive: boolean;
  isMinimized: boolean;
  parallelBuild?: {
    enabled: boolean;
  };
}

// ============================================================================
// Action Cards - for initial flow selection
// ============================================================================

export interface WizardActionCard {
  flowType: WizardFlowType;
  title: string;
  description: string;
  icon: string;
  disabled?: boolean;
  disabledReason?: string;
}

export const WIZARD_ACTION_CARDS: WizardActionCard[] = [
  {
    flowType: 'build-standard',
    title: 'Build LOTO Standard',
    description: 'Create a new LOTO Standard with guided step-by-step assistance',
    icon: 'playlist_add',
  },
  {
    flowType: 'add-loto-point',
    title: 'Add LOTO Point',
    description: 'Create a new LOTO point with all details',
    icon: 'add_location',
  },
  {
    flowType: 'upload-file',
    title: 'Upload File',
    description: 'Upload a new P&ID, drawing, or document',
    icon: 'upload_file',
  },
  {
    flowType: 'modify-standard',
    title: 'Modify LOTO Standard',
    description: 'Edit an existing LOTO Standard',
    icon: 'edit_note',
  },
];

// ============================================================================
// Helper type for step data emission
// ============================================================================

export interface StepDataPayload {
  field: string;
  value: any;
  entityType?: keyof WizardEntityData;
}
