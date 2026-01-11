/**
 * Contextual Guide System Models
 *
 * A context-aware assistant that detects the current application state
 * and offers relevant actions/guidance based on what's visible.
 */

/**
 * Represents a detected context in the application
 */
export interface AppContext {
  /** Current route */
  route: string;
  /** Route category (e.g., 'loto-builder', 'files', 'home') */
  routeCategory: string;
  /** Active dialogs/popups */
  openDialogs: string[];
  /** Currently selected/focused elements */
  activeElements: string[];
  /** Custom state flags from services */
  stateFlags: Record<string, boolean>;
}

/**
 * An action that can be suggested based on context
 */
export interface ContextualAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  /** Condition to show this action */
  isAvailable: (context: AppContext) => boolean;
  /** Priority for ordering (higher = more prominent) */
  priority: number;
  /** Highlight targets when this action is selected */
  highlightTargets?: string[];
  /** Hint message to show */
  hint?: string;
  /** Auto-execute callback (optional) */
  execute?: () => void;
}

/**
 * A group of related actions (used within subsections)
 */
export interface ActionGroup {
  id: string;
  title: string;
  icon: string;
  /** Condition to show this group */
  isRelevant: (context: AppContext) => boolean;
  /** Actions in this group */
  actions: ContextualAction[];
}

/**
 * A subsection within a main section (e.g., "Create", "Edit", "Delete")
 */
export interface GuideSubsection {
  id: string;
  title: string;
  icon: string;
  /** Condition to show this subsection */
  isRelevant: (context: AppContext) => boolean;
  /** Actions in this subsection */
  actions: ContextualAction[];
}

/**
 * A main section in the guide (e.g., "File Management", "LOTO Point Management")
 * Sections are collapsible and contain subsections or direct actions
 */
export interface GuideSection {
  id: string;
  title: string;
  icon: string;
  /** Condition to show this section */
  isRelevant: (context: AppContext) => boolean;
  /** Optional subsections (for further grouping like Create/Edit/Delete) */
  subsections?: GuideSubsection[];
  /** Direct actions (if no subsections) */
  actions?: ContextualAction[];
  /** Whether this section is expanded by default */
  defaultExpanded?: boolean;
}

/**
 * Page-specific guide configuration
 */
export interface PageGuide {
  /** Route pattern to match (can use wildcards like '/loto-builder*') */
  routePattern: string | RegExp;
  /** Display name for this page */
  pageName: string;
  /** Icon for this page */
  icon: string;
  /** Main sections for the guide (new hierarchical structure) */
  sections?: GuideSection[];
  /** Action groups available on this page (legacy, for backwards compatibility) */
  actionGroups?: ActionGroup[];
}

/**
 * State for the contextual guide
 */
export interface ContextualGuideState {
  /** Whether the guide is enabled */
  isEnabled: boolean;
  /** Currently selected action (for highlighting) */
  selectedActionId: string | null;
  /** Whether the panel is expanded or minimized */
  isExpanded: boolean;
}

/**
 * Factory function type for creating page guides
 */
export type PageGuideFactory = () => PageGuide;
