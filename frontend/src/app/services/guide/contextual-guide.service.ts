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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, merge } from 'rxjs';
import { LocalStorageService } from '../refactored/local-storage.service';
import {
  AppContext,
  ContextualAction,
  ActionGroup,
  PageGuide,
  ContextualGuideState,
  PageGuideFactory,
  GuideSection,
  GuideSubsection,
} from './contextual-guide.model';

const CONTEXTUAL_GUIDE_STORAGE_KEY = 'app_contextual_guide_enabled';

@Injectable({
  providedIn: 'root',
})
export class ContextualGuideService {
  private platformId = inject(PLATFORM_ID);
  private localStorageService = inject(LocalStorageService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  /** Registered page guides */
  private pageGuides: PageGuide[] = [];

  /** Context providers (services that contribute to context) */
  private contextProviders: Array<() => Partial<AppContext>> = [];

  /** Manual refresh trigger */
  private refreshTrigger = new Subject<void>();

  /** Current route */
  private _currentRoute = signal<string>('');

  /** Whether guide is enabled */
  private _isEnabled = signal(false);

  /** Whether panel is expanded */
  private _isExpanded = signal(true);

  /** Currently selected action for highlighting */
  private _selectedActionId = signal<string | null>(null);

  /** Open dialogs tracked by the system */
  private _openDialogs = signal<string[]>([]);

  /** Active elements tracked by the system */
  private _activeElements = signal<string[]>([]);

  /** Custom state flags from various services */
  private _stateFlags = signal<Record<string, boolean>>({});

  /** Expanded state for sections (section id -> expanded) */
  private _expandedSections = signal<Record<string, boolean>>({});

  /** Expanded state for subsections (subsection id -> expanded) */
  private _expandedSubsections = signal<Record<string, boolean>>({});

  // ========== Public Signals ==========

  /** Whether guide is enabled */
  isEnabled = computed(() => this._isEnabled());

  /** Whether panel is expanded */
  isExpanded = computed(() => this._isExpanded());

  /** Currently selected action */
  selectedActionId = computed(() => this._selectedActionId());

  /** Current application context */
  currentContext = computed<AppContext>(() => {
    // Collect context from all providers
    let mergedContext: Partial<AppContext> = {};
    for (const provider of this.contextProviders) {
      try {
        const provided = provider();
        mergedContext = { ...mergedContext, ...provided };
      } catch (e) {
        console.warn('Context provider error:', e);
      }
    }

    return {
      route: this._currentRoute(),
      routeCategory: this.getRouteCategory(this._currentRoute()),
      openDialogs: mergedContext.openDialogs ?? this._openDialogs(),
      activeElements: mergedContext.activeElements ?? this._activeElements(),
      stateFlags: { ...this._stateFlags(), ...(mergedContext.stateFlags ?? {}) },
    };
  });

  /** Current page guide based on route */
  currentPageGuide = computed<PageGuide | null>(() => {
    const route = this._currentRoute();
    for (const guide of this.pageGuides) {
      if (this.matchesRoute(route, guide.routePattern)) {
        return guide;
      }
    }
    return null;
  });

  /** Available sections for current context (new hierarchical structure) */
  availableSections = computed<GuideSection[]>(() => {
    if (!this._isEnabled()) return [];

    const pageGuide = this.currentPageGuide();
    if (!pageGuide?.sections) return [];

    const context = this.currentContext();
    return pageGuide.sections.filter(section => section.isRelevant(context));
  });

  /** Check if using new section-based structure */
  useSections = computed<boolean>(() => {
    const pageGuide = this.currentPageGuide();
    return !!pageGuide?.sections && pageGuide.sections.length > 0;
  });

  /** Available action groups for current context (legacy support) */
  availableActionGroups = computed<ActionGroup[]>(() => {
    if (!this._isEnabled()) return [];

    const pageGuide = this.currentPageGuide();
    if (!pageGuide?.actionGroups) return [];

    const context = this.currentContext();
    return pageGuide.actionGroups.filter(group => group.isRelevant(context));
  });

  /** All available actions for current context (flattened and sorted) */
  availableActions = computed<ContextualAction[]>(() => {
    const groups = this.availableActionGroups();
    const context = this.currentContext();

    const allActions: ContextualAction[] = [];
    for (const group of groups) {
      for (const action of group.actions) {
        if (action.isAvailable(context)) {
          allActions.push(action);
        }
      }
    }

    // Sort by priority (highest first)
    return allActions.sort((a, b) => b.priority - a.priority);
  });

  /** Highlight targets for selected action */
  currentHighlightTargets = computed<string[]>(() => {
    const selectedId = this._selectedActionId();
    if (!selectedId) return [];

    // First, search in sections (new hierarchical structure)
    const sections = this.availableSections();
    for (const section of sections) {
      // Check section's direct actions
      if (section.actions) {
        const action = section.actions.find(a => a.id === selectedId);
        if (action?.highlightTargets) return action.highlightTargets;
      }
      // Check subsection actions
      if (section.subsections) {
        for (const subsection of section.subsections) {
          const action = subsection.actions.find(a => a.id === selectedId);
          if (action?.highlightTargets) return action.highlightTargets;
        }
      }
    }

    // Fallback to legacy availableActions
    const action = this.availableActions().find(a => a.id === selectedId);
    return action?.highlightTargets ?? [];
  });

  /** Page name for current route */
  currentPageName = computed<string>(() => {
    return this.currentPageGuide()?.pageName ?? 'Unknown Page';
  });

  /** Page icon for current route */
  currentPageIcon = computed<string>(() => {
    return this.currentPageGuide()?.icon ?? 'help_outline';
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Track route changes
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          takeUntilDestroyed(this.destroyRef)
        )
        .subscribe(event => {
          this._currentRoute.set((event as NavigationEnd).urlAfterRedirects);
          // Clear selection on route change
          this._selectedActionId.set(null);
        });

      // Set initial route
      this._currentRoute.set(this.router.url);

      // Restore enabled state
      this.restoreState();

      // Setup refresh listener
      this.refreshTrigger
        .pipe(debounceTime(50), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          // Force recomputation by touching signals
          this._stateFlags.update(flags => ({ ...flags }));
        });
    }
  }

  // ========== Public Methods ==========

  /**
   * Toggle the guide on/off
   */
  toggle(): void {
    this._isEnabled.update(v => !v);
    this.saveState();
    if (!this._isEnabled()) {
      this._selectedActionId.set(null);
    }
  }

  /**
   * Enable the guide
   */
  enable(): void {
    this._isEnabled.set(true);
    this.saveState();
  }

  /**
   * Disable the guide
   */
  disable(): void {
    this._isEnabled.set(false);
    this._selectedActionId.set(null);
    this.saveState();
  }

  /**
   * Toggle panel expanded/minimized
   */
  toggleExpanded(): void {
    this._isExpanded.update(v => !v);
  }

  /**
   * Check if a section is expanded
   */
  isSectionExpanded(sectionId: string): boolean {
    const expanded = this._expandedSections();
    // Check explicit state, or fall back to section's default
    if (sectionId in expanded) {
      return expanded[sectionId];
    }
    // Find the section and check defaultExpanded
    const sections = this.availableSections();
    const section = sections.find(s => s.id === sectionId);
    return section?.defaultExpanded ?? false;
  }

  /**
   * Toggle a section expanded/collapsed
   */
  toggleSection(sectionId: string): void {
    this._expandedSections.update(expanded => ({
      ...expanded,
      [sectionId]: !this.isSectionExpanded(sectionId),
    }));
  }

  /**
   * Check if a subsection is expanded
   */
  isSubsectionExpanded(subsectionId: string): boolean {
    const expanded = this._expandedSubsections();
    // Default to collapsed for subsections
    return expanded[subsectionId] ?? false;
  }

  /**
   * Toggle a subsection expanded/collapsed
   */
  toggleSubsection(subsectionId: string): void {
    this._expandedSubsections.update(expanded => ({
      ...expanded,
      [subsectionId]: !this.isSubsectionExpanded(subsectionId),
    }));
  }

  /**
   * Get available subsections for a section based on current context
   */
  getAvailableSubsections(section: GuideSection): GuideSubsection[] {
    if (!section.subsections) return [];
    const context = this.currentContext();
    return section.subsections.filter(sub => sub.isRelevant(context));
  }

  /**
   * Get available actions for a section (when no subsections)
   */
  getSectionActions(section: GuideSection): ContextualAction[] {
    if (!section.actions) return [];
    const context = this.currentContext();
    return section.actions
      .filter(action => action.isAvailable(context))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get available actions for a subsection
   */
  getSubsectionActions(subsection: GuideSubsection): ContextualAction[] {
    const context = this.currentContext();
    return subsection.actions
      .filter(action => action.isAvailable(context))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Select an action (highlights its targets)
   */
  selectAction(actionId: string | null): void {
    this._selectedActionId.set(actionId);
  }

  /**
   * Execute an action
   */
  executeAction(action: ContextualAction): void {
    if (action.execute) {
      action.execute();
    }
    // Clear selection after execution
    this._selectedActionId.set(null);
  }

  /**
   * Register a page guide
   */
  registerPageGuide(guide: PageGuide): void {
    this.pageGuides.push(guide);
  }

  /**
   * Register multiple page guides
   */
  registerPageGuides(guides: PageGuide[]): void {
    this.pageGuides.push(...guides);
  }

  /**
   * Register a context provider function
   */
  registerContextProvider(provider: () => Partial<AppContext>): void {
    this.contextProviders.push(provider);
  }

  /**
   * Update a state flag
   */
  setStateFlag(key: string, value: boolean): void {
    this._stateFlags.update(flags => ({ ...flags, [key]: value }));
  }

  /**
   * Update multiple state flags
   */
  setStateFlags(flags: Record<string, boolean>): void {
    this._stateFlags.update(current => ({ ...current, ...flags }));
  }

  /**
   * Register an open dialog
   */
  registerDialog(dialogId: string): void {
    this._openDialogs.update(dialogs => {
      if (!dialogs.includes(dialogId)) {
        return [...dialogs, dialogId];
      }
      return dialogs;
    });
  }

  /**
   * Unregister a closed dialog
   */
  unregisterDialog(dialogId: string): void {
    this._openDialogs.update(dialogs => dialogs.filter(d => d !== dialogId));
  }

  /**
   * Register an active element
   */
  registerActiveElement(elementId: string): void {
    this._activeElements.update(elements => {
      if (!elements.includes(elementId)) {
        return [...elements, elementId];
      }
      return elements;
    });
  }

  /**
   * Unregister an inactive element
   */
  unregisterActiveElement(elementId: string): void {
    this._activeElements.update(elements => elements.filter(e => e !== elementId));
  }

  /**
   * Trigger a manual refresh of context
   */
  refresh(): void {
    this.refreshTrigger.next();
  }

  /**
   * Check if an element should be highlighted
   */
  shouldHighlight(target: string): boolean {
    if (!this._isEnabled()) return false;
    return this.currentHighlightTargets().includes(target);
  }

  // ========== Private Methods ==========

  private getRouteCategory(route: string): string {
    if (route.startsWith('/loto-builder')) return 'loto-builder';
    if (route.startsWith('/loto-standard')) return 'loto-standard';
    if (route.startsWith('/loto-points')) return 'loto-points';
    if (route.startsWith('/loto')) return 'loto';
    if (route.startsWith('/file')) return 'files';
    if (route.startsWith('/equipment')) return 'equipment';
    if (route.startsWith('/permit')) return 'permits';
    if (route === '/' || route === '/home') return 'home';
    return 'other';
  }

  private matchesRoute(route: string, pattern: string | RegExp): boolean {
    if (pattern instanceof RegExp) {
      return pattern.test(route);
    }
    // Simple wildcard matching
    if (pattern.endsWith('*')) {
      return route.startsWith(pattern.slice(0, -1));
    }
    return route === pattern || route.startsWith(pattern + '/');
  }

  private saveState(): void {
    this.localStorageService.setItem(CONTEXTUAL_GUIDE_STORAGE_KEY, this._isEnabled());
  }

  private restoreState(): void {
    const saved = this.localStorageService.getItem<boolean>(CONTEXTUAL_GUIDE_STORAGE_KEY);
    if (saved !== null) {
      this._isEnabled.set(saved);
    }
  }
}
