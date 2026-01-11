import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  computed,
  effect,
  Renderer2,
  HostListener,
} from '@angular/core';
import { GuideService } from '../../services/guide/guide.service';
import { GuideId } from '../../services/guide/guide.model';

/**
 * Directive to mark elements as part of a guide flow.
 *
 * Usage:
 * <button appGuide="create-loto-point:create-button"
 *         guideMessage="Click here to create a new LOTO point">
 *   Create New
 * </button>
 *
 * The appGuide value format is: "guideId:stepId" or just "guideId"
 */
@Directive({
  selector: '[appGuide]',
  standalone: true,
  host: {
    '[class.guide-active]': 'isActiveWithHighlight()',
    '[class.guide-pulse]': 'isActiveWithHighlight()',
  },
})
export class GuideDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private guideService = inject(GuideService);
  private renderer = inject(Renderer2);

  /** Guide identifier in format "guideId" or "guideId:stepId" */
  appGuide = input.required<string>();

  /** Message to show when hovering over this element */
  guideMessage = input<string>('');

  /** Optional title for the tooltip */
  guideTitle = input<string>();

  /** If true, only show tooltip on hover without highlight/pulse effect */
  guideTooltipOnly = input<boolean>(false);

  /** Whether the directive has a valid guide ID */
  private hasValidGuide = computed(() => {
    const value = this.appGuide();
    return value && value.trim().length > 0;
  });

  /** Parsed guide ID */
  private guideId = computed(() => {
    const value = this.appGuide();
    if (!value) return '' as GuideId;
    return value.split(':')[0] as GuideId;
  });

  /** Parsed step ID (defaults to 'default' if not provided) */
  private stepId = computed(() => {
    const value = this.appGuide();
    if (!value) return 'default';
    const parts = value.split(':');
    return parts[1] || 'default';
  });

  /** Whether this element should be highlighted */
  isActive = computed(() => {
    if (!this.hasValidGuide()) return false;
    // Access ALL reactive signals directly for proper dependency tracking
    const isPaused = this.guideService.isPaused();
    const activeGuide = this.guideService.activeGuide();
    const currentRoute = this.guideService.currentRoute();

    if (isPaused || !activeGuide || activeGuide !== this.guideId()) {
      return false;
    }
    // Use the service method for route checking logic (currentRoute already tracked above)
    return this.guideService.shouldHighlight(this.guideId(), this.stepId());
  });

  /** Whether this element should show highlight effect (not tooltip-only) */
  isActiveWithHighlight = computed(() => {
    return this.isActive() && !this.guideTooltipOnly();
  });

  private tooltip: HTMLElement | null = null;
  private tooltipContainer: HTMLElement | null = null;
  private isTooltipVisible = false;

  constructor() {
    // React to active state changes - use afterRenderEffect pattern for DOM manipulation
    effect(() => {
      const active = this.isActive();
      if (active) {
        this.addHighlightStyles();
      } else {
        this.removeHighlightStyles();
        this.hideTooltip();
      }
    });
  }

  ngOnInit(): void {
    // Only register if there's a valid guide ID
    if (this.hasValidGuide()) {
      this.guideService.registerElement(
        this.guideId(),
        this.stepId(),
        this.elementRef.nativeElement,
        this.guideMessage(),
        this.guideTitle()
      );
    }
  }

  ngOnDestroy(): void {
    if (this.hasValidGuide()) {
      this.guideService.unregisterElement(this.guideId(), this.stepId());
    }
    this.hideTooltip();
    this.removeHighlightStyles();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.isActive() && this.guideMessage()) {
      this.showTooltip();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hideTooltip();
  }

  @HostListener('click')
  onClick(): void {
    // Hide tooltip immediately on click to prevent it from overlaying dialogs
    this.hideTooltip();

    if (this.isActive()) {
      // Mark step as completed when clicked
      this.guideService.markStepCompleted(this.guideId(), this.stepId());
    }
  }

  private addHighlightStyles(): void {
    const el = this.elementRef.nativeElement;
    this.renderer.addClass(el, 'guide-highlight');
  }

  private removeHighlightStyles(): void {
    const el = this.elementRef.nativeElement;
    this.renderer.removeClass(el, 'guide-highlight');
  }

  private showTooltip(): void {
    if (this.isTooltipVisible || !this.guideMessage()) return;

    const message = this.guideMessage();
    const title = this.guideTitle();

    // Create tooltip element
    this.tooltip = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltip, 'guide-tooltip');

    // Add title if present
    if (title) {
      const titleEl = this.renderer.createElement('div');
      this.renderer.addClass(titleEl, 'guide-tooltip-title');
      titleEl.textContent = title;
      this.renderer.appendChild(this.tooltip, titleEl);
    }

    // Add message
    const messageEl = this.renderer.createElement('div');
    this.renderer.addClass(messageEl, 'guide-tooltip-message');
    messageEl.textContent = message;
    this.renderer.appendChild(this.tooltip, messageEl);

    // Add arrow
    const arrow = this.renderer.createElement('div');
    this.renderer.addClass(arrow, 'guide-tooltip-arrow');
    this.renderer.appendChild(this.tooltip, arrow);

    // Find the appropriate container and z-index for the tooltip
    this.tooltipContainer = this.findTooltipContainer();
    const zIndex = this.calculateZIndex();
    this.renderer.setStyle(this.tooltip, 'z-index', zIndex.toString());

    // Append to the container
    this.renderer.appendChild(this.tooltipContainer, this.tooltip);

    // Position the tooltip
    this.positionTooltip();
    this.isTooltipVisible = true;
  }

  private hideTooltip(): void {
    if (this.tooltip && this.isTooltipVisible && this.tooltipContainer) {
      this.renderer.removeChild(this.tooltipContainer, this.tooltip);
      this.tooltip = null;
      this.tooltipContainer = null;
      this.isTooltipVisible = false;
    }
  }

  /**
   * Find the appropriate container for the tooltip.
   * Looks for the nearest overlay/dialog container, falls back to body.
   */
  private findTooltipContainer(): HTMLElement {
    let element: HTMLElement | null = this.elementRef.nativeElement;

    while (element) {
      // Check for common dialog/overlay containers
      if (
        element.classList.contains('cdk-overlay-container') ||
        element.classList.contains('cdk-overlay-pane') ||
        element.classList.contains('mat-mdc-dialog-container') ||
        element.classList.contains('popup-container') ||
        element.classList.contains('popup-projection-container') ||
        element.classList.contains('dialog-container') ||
        element.hasAttribute('data-guide-container')
      ) {
        return element;
      }
      element = element.parentElement;
    }

    return document.body;
  }

  /**
   * Calculate the appropriate z-index for the tooltip based on its container.
   * Ensures tooltip appears above sibling elements but respects dialog stacking.
   */
  private calculateZIndex(): number {
    let element: HTMLElement | null = this.elementRef.nativeElement;
    let maxZIndex = 0;

    // Walk up the DOM tree and find the highest z-index in the stacking context
    while (element && element !== document.body) {
      const style = window.getComputedStyle(element);
      const zIndex = parseInt(style.zIndex, 10);

      if (!isNaN(zIndex) && zIndex > maxZIndex) {
        maxZIndex = zIndex;
      }
      element = element.parentElement;
    }

    // Return a z-index slightly higher than the highest found, with a minimum
    return Math.max(maxZIndex + 1, 1000);
  }

  private positionTooltip(): void {
    if (!this.tooltip) return;

    const elementRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Default position: above the element
    let top = elementRect.top - tooltipRect.height - 10;
    let left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;

    // If tooltip would go above viewport, position below
    if (top < 10) {
      top = elementRect.bottom + 10;
      this.renderer.addClass(this.tooltip, 'guide-tooltip-below');
    }

    // Keep tooltip within horizontal bounds
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    this.renderer.setStyle(this.tooltip, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }
}
