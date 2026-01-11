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
import { ReactiveGuideService } from '../../services/guide/reactive-guide.service';

/**
 * Directive to mark elements for reactive guide highlighting.
 *
 * Usage:
 * <button appReactiveGuide="loto-builder-full:click-build-loto"
 *         reactiveGuideMessage="Click this button to start building LOTO">
 *   Build LOTO
 * </button>
 *
 * The appReactiveGuide value format is: "guideId:stepId:targetId"
 * - guideId: The reactive guide this target belongs to
 * - stepId: The step ID (used for matching)
 * - targetId: Optional specific target ID within a step
 *
 * Full target string is matched against step.highlightTargets array.
 */
@Directive({
  selector: '[appReactiveGuide]',
  standalone: true,
  host: {
    '[class.reactive-guide-active]': 'isActive()',
    '[class.reactive-guide-pulse]': 'isActive()',
  },
})
export class ReactiveGuideDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  private guideService = inject(ReactiveGuideService);
  private renderer = inject(Renderer2);

  /** Guide target identifier - matched against step.highlightTargets */
  appReactiveGuide = input.required<string>();

  /** Message to show in tooltip on hover */
  reactiveGuideMessage = input<string>('');

  /** Optional title for the tooltip */
  reactiveGuideTitle = input<string>();

  /** If true, only show tooltip without highlight effect */
  reactiveGuideTooltipOnly = input<boolean>(false);

  /** Whether this element is currently active/highlighted */
  isActive = computed(() => {
    const target = this.appReactiveGuide();
    if (!target) return false;
    return this.guideService.shouldHighlight(target);
  });

  /** Whether to show highlight effect (not tooltip-only) */
  isActiveWithHighlight = computed(() => {
    return this.isActive() && !this.reactiveGuideTooltipOnly();
  });

  private tooltip: HTMLElement | null = null;
  private tooltipContainer: HTMLElement | null = null;
  private isTooltipVisible = false;

  constructor() {
    // React to active state changes
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
    // Could register with service if needed for discovery
  }

  ngOnDestroy(): void {
    this.hideTooltip();
    this.removeHighlightStyles();
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.isActive() && this.reactiveGuideMessage()) {
      this.showTooltip();
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.hideTooltip();
  }

  @HostListener('click')
  onClick(): void {
    // Hide tooltip immediately on click
    this.hideTooltip();

    // Trigger state check in case this click completes a step
    if (this.isActive()) {
      // Small delay to let the click action complete first
      setTimeout(() => {
        this.guideService.triggerStateCheck();
      }, 100);
    }
  }

  private addHighlightStyles(): void {
    if (this.reactiveGuideTooltipOnly()) return;

    const el = this.elementRef.nativeElement;
    this.renderer.addClass(el, 'reactive-guide-highlight');
  }

  private removeHighlightStyles(): void {
    const el = this.elementRef.nativeElement;
    this.renderer.removeClass(el, 'reactive-guide-highlight');
  }

  private showTooltip(): void {
    if (this.isTooltipVisible || !this.reactiveGuideMessage()) return;

    const message = this.reactiveGuideMessage();
    const title = this.reactiveGuideTitle();

    // Create tooltip element
    this.tooltip = this.renderer.createElement('div');
    this.renderer.addClass(this.tooltip, 'reactive-guide-tooltip');

    // Add title if present
    if (title) {
      const titleEl = this.renderer.createElement('div');
      this.renderer.addClass(titleEl, 'reactive-guide-tooltip-title');
      titleEl.textContent = title;
      this.renderer.appendChild(this.tooltip, titleEl);
    }

    // Add message
    const messageEl = this.renderer.createElement('div');
    this.renderer.addClass(messageEl, 'reactive-guide-tooltip-message');
    messageEl.textContent = message;
    this.renderer.appendChild(this.tooltip, messageEl);

    // Add arrow
    const arrow = this.renderer.createElement('div');
    this.renderer.addClass(arrow, 'reactive-guide-tooltip-arrow');
    this.renderer.appendChild(this.tooltip, arrow);

    // Find container and calculate z-index
    this.tooltipContainer = this.findTooltipContainer();
    const zIndex = this.calculateZIndex();
    this.renderer.setStyle(this.tooltip, 'z-index', zIndex.toString());

    // Append and position
    this.renderer.appendChild(this.tooltipContainer, this.tooltip);
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

  private findTooltipContainer(): HTMLElement {
    let element: HTMLElement | null = this.elementRef.nativeElement;

    while (element) {
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

  private calculateZIndex(): number {
    let element: HTMLElement | null = this.elementRef.nativeElement;
    let maxZIndex = 0;

    while (element && element !== document.body) {
      const style = window.getComputedStyle(element);
      const zIndex = parseInt(style.zIndex, 10);

      if (!isNaN(zIndex) && zIndex > maxZIndex) {
        maxZIndex = zIndex;
      }
      element = element.parentElement;
    }

    return Math.max(maxZIndex + 1, 1000);
  }

  private positionTooltip(): void {
    if (!this.tooltip) return;

    const elementRect = this.elementRef.nativeElement.getBoundingClientRect();
    const tooltipRect = this.tooltip.getBoundingClientRect();

    // Default: position above
    let top = elementRect.top - tooltipRect.height - 10;
    let left = elementRect.left + (elementRect.width - tooltipRect.width) / 2;

    // If above viewport, position below
    if (top < 10) {
      top = elementRect.bottom + 10;
      this.renderer.addClass(this.tooltip, 'reactive-guide-tooltip-below');
    }

    // Keep within horizontal bounds
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > window.innerWidth - 10) {
      left = window.innerWidth - tooltipRect.width - 10;
    }

    this.renderer.setStyle(this.tooltip, 'top', `${top}px`);
    this.renderer.setStyle(this.tooltip, 'left', `${left}px`);
  }
}
