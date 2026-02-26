/**
 * Configuration model for InteractiveImageComponent
 * Defines what users can do in different contexts
 */
export interface InteractiveImageConfig {
  // === Interaction Capabilities ===

  /** Allow panning the image */
  canPan: boolean;

  /** Allow zooming the image */
  canZoom: boolean;

  /** Allow selecting shapes by clicking */
  canSelectShapes: boolean;

  /** Allow multi-selection with Ctrl/Cmd */
  canMultiSelect: boolean;

  /** Allow drawing new shapes */
  canDrawShapes: boolean;

  /** Allow editing existing shapes */
  canEditShapes: boolean;

  /** Allow deleting shapes */
  canDeleteShapes: boolean;

  /** Allow dragging shapes to move them */
  canDragShapes: boolean;

  /** Allow resizing shapes */
  canResizeShapes: boolean;

  /** Allow rotating shapes */
  canRotateShapes: boolean;

  // === Shape Restrictions ===

  /**
   * If provided, only these shape IDs can be edited/selected
   * If undefined, all shapes are available
   */
  editableShapeIds?: number[];

  /**
   * If provided, only these shape IDs can be selected
   * If undefined, all shapes can be selected
   */
  selectableShapeIds?: number[];

  // === Drawing Configuration ===

  /**
   * Drawing mode:
   * - 'single': Auto-close after drawing one shape (equipment drawer)
   * - 'multiple': Allow drawing multiple shapes (file editor)
   * - undefined: No drawing allowed
   */
  drawingMode?: 'single' | 'multiple';

  /**
   * Which shape types can be drawn
   * If undefined, all types allowed
   */
  allowedShapeTypes?: ('rectangle' | 'symbol')[];

  // === UI Configuration ===

  /** Show the toolbar */
  showToolbar: boolean;

  /**
   * Toolbar position
   * Default: 'top'
   */
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right';

  /**
   * Which tools to show in toolbar
   * If undefined, show all available tools based on capabilities
   */
  enabledTools?: ToolbarTool[];

  /** Show the symbol palette panel */
  showSymbolPalette: boolean;

  /** Show context menu on right-click */
  showContextMenu: boolean;

  /**
   * Which context menu actions to show
   * If undefined, show all available actions based on capabilities
   */
  contextMenuActions?: ContextMenuActionType[];

  // === Behavioral Configuration ===

  /** Auto-deselect shapes when clicking empty space */
  autoDeselectOnEmptyClick: boolean;

  /** Show resize handles on selected shapes */
  showResizeHandles: boolean;

  /** Show rotation handle on selected shapes */
  showRotationHandle: boolean;

  /** Enforce aspect ratio when resizing symbols */
  enforceAspectRatio: boolean;
}

/**
 * Available toolbar tools
 */
export type ToolbarTool =
  | 'select'           // Selection tool
  | 'draw-rectangle'   // Draw rectangle
  | 'place-symbol'     // Place symbol from palette
  | 'delete'           // Delete selected shapes
  | 'duplicate'        // Duplicate selected shapes
  | 'bring-to-front'   // Z-order: bring to front
  | 'send-to-back'     // Z-order: send to back
  | 'zoom-in'          // Zoom in
  | 'zoom-out'         // Zoom out
  | 'zoom-fit'         // Fit to screen
  | 'reset-view'       // Reset zoom and pan
  | 'toggle-symbols';  // Toggle symbol palette

/**
 * Available context menu action types
 */
export type ContextMenuActionType =
  | 'convert-to-image'
  | 'change-image'
  | 'convert-to-rectangle'
  | 'bring-to-front'
  | 'send-to-back'
  | 'duplicate'
  | 'delete';

/**
 * Preset configurations for common use cases
 */
export const INTERACTIVE_IMAGE_PRESETS: Record<string, InteractiveImageConfig> = {
  /**
   * File Editor Context
   * Full editing capabilities: add, modify, delete shapes
   */
  FILE_EDITOR: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: true,
    canDrawShapes: true,
    canEditShapes: true,
    canDeleteShapes: true,
    canDragShapes: true,
    canResizeShapes: true,
    canRotateShapes: true,
    drawingMode: 'multiple',
    allowedShapeTypes: ['rectangle', 'symbol'],
    showToolbar: true,
    toolbarPosition: 'top',
    showSymbolPalette: true,
    showContextMenu: true,
    autoDeselectOnEmptyClick: true,
    showResizeHandles: true,
    showRotationHandle: true,
    enforceAspectRatio: true,
  },

  /**
   * Equipment Editor Context
   * Selective editing: only specific equipment can be modified
   * No creation or deletion, but can edit existing equipment
   */
  EQUIPMENT_EDITOR: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: false,
    canEditShapes: true,
    canDeleteShapes: false,
    canDragShapes: true,
    canResizeShapes: true,
    canRotateShapes: true,
    // editableShapeIds: [] // Set dynamically by parent component
    showToolbar: true,
    toolbarPosition: 'top',
    enabledTools: ['select', 'zoom-in', 'zoom-out', 'zoom-fit', 'reset-view'],
    showSymbolPalette: false,
    showContextMenu: true,
    contextMenuActions: ['duplicate', 'bring-to-front', 'send-to-back'],
    autoDeselectOnEmptyClick: true,
    showResizeHandles: true,
    showRotationHandle: true,
    enforceAspectRatio: true,
  },

  /**
   * Equipment Shape Drawer Context
   * Drawing mode: create ONE new equipment shape
   * Auto-closes after drawing one rectangle or symbol
   */
  EQUIPMENT_DRAWER: {
    canPan: true,
    canZoom: true,
    canSelectShapes: false,
    canMultiSelect: false,
    canDrawShapes: true,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    drawingMode: 'single',
    allowedShapeTypes: ['rectangle', 'symbol'],
    showToolbar: true,
    toolbarPosition: 'top',
    enabledTools: ['draw-rectangle', 'place-symbol', 'toggle-symbols', 'zoom-in', 'zoom-out', 'zoom-fit', 'reset-view'],
    showSymbolPalette: true,
    showContextMenu: false,
    autoDeselectOnEmptyClick: false,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false,
  },

  /**
   * Equipment Browser Context
   * View and select only: click to select equipment
   * No editing, just selection for browsing
   */
  EQUIPMENT_BROWSER: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: false,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    showToolbar: true,
    toolbarPosition: 'top',
    enabledTools: ['zoom-in', 'zoom-out', 'zoom-fit', 'reset-view'],
    showSymbolPalette: false,
    showContextMenu: false,
    autoDeselectOnEmptyClick: true,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false,
  },

  /**
   * Equipment Unified Context
   * Combined browse and draw: left-click to select existing, right-click drag to draw new
   * Used in the unified equipment dialog for LOTO point forms
   * Supports both rectangles and symbols
   */
  EQUIPMENT_UNIFIED: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: true,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    drawingMode: 'single',
    allowedShapeTypes: ['rectangle', 'symbol'],
    showToolbar: true,
    toolbarPosition: 'top',
    enabledTools: ['select', 'draw-rectangle', 'place-symbol', 'toggle-symbols', 'zoom-in', 'zoom-out', 'zoom-fit', 'reset-view'],
    showSymbolPalette: true,
    showContextMenu: false,
    autoDeselectOnEmptyClick: true,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false,
  },

  /**
   * Work Area Editor (Dev Mode)
   * Full editing: draw, move, resize, delete work area shapes on plant map
   */
  WORK_AREA_EDITOR: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: true,
    canEditShapes: true,
    canDeleteShapes: true,
    canDragShapes: true,
    canResizeShapes: true,
    canRotateShapes: false,
    drawingMode: 'multiple',
    allowedShapeTypes: ['rectangle'],
    showToolbar: true,
    toolbarPosition: 'top',
    enabledTools: ['select', 'draw-rectangle', 'delete', 'zoom-in', 'zoom-out', 'zoom-fit', 'reset-view'],
    showSymbolPalette: false,
    showContextMenu: true,
    contextMenuActions: ['duplicate', 'delete'],
    autoDeselectOnEmptyClick: true,
    showResizeHandles: true,
    showRotationHandle: false,
    enforceAspectRatio: false,
  },

  /**
   * Work Area Selector (Operator Mode)
   * Select only: click shapes to select work areas for permits
   */
  WORK_AREA_SELECTOR: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: false,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    showToolbar: true,
    toolbarPosition: 'top',
    enabledTools: ['zoom-in', 'zoom-out', 'zoom-fit', 'reset-view'],
    showSymbolPalette: false,
    showContextMenu: false,
    autoDeselectOnEmptyClick: true,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false,
  },

  /**
   * Work Area Overview
   * View with hover: see active permit counts per area shape
   */
  WORK_AREA_OVERVIEW: {
    canPan: true,
    canZoom: true,
    canSelectShapes: true,
    canMultiSelect: false,
    canDrawShapes: false,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    showToolbar: true,
    toolbarPosition: 'top',
    enabledTools: ['zoom-in', 'zoom-out', 'zoom-fit', 'reset-view'],
    showSymbolPalette: false,
    showContextMenu: false,
    autoDeselectOnEmptyClick: true,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false,
  },

  /**
   * View Only Context
   * Pure viewing: pan and zoom only, no interaction with shapes
   */
  VIEW_ONLY: {
    canPan: true,
    canZoom: true,
    canSelectShapes: false,
    canMultiSelect: false,
    canDrawShapes: false,
    canEditShapes: false,
    canDeleteShapes: false,
    canDragShapes: false,
    canResizeShapes: false,
    canRotateShapes: false,
    showToolbar: true,
    toolbarPosition: 'top',
    enabledTools: ['zoom-in', 'zoom-out', 'zoom-fit', 'reset-view'],
    showSymbolPalette: false,
    showContextMenu: false,
    autoDeselectOnEmptyClick: false,
    showResizeHandles: false,
    showRotationHandle: false,
    enforceAspectRatio: false,
  },
};

/**
 * Helper function to merge custom config with preset
 */
export function mergeConfig(
  preset: InteractiveImageConfig,
  overrides?: Partial<InteractiveImageConfig>
): InteractiveImageConfig {
  return {
    ...preset,
    ...overrides,
  };
}

/**
 * Helper function to get preset by name
 */
export function getPreset(presetName: keyof typeof INTERACTIVE_IMAGE_PRESETS): InteractiveImageConfig {
  return INTERACTIVE_IMAGE_PRESETS[presetName];
}
