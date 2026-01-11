import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  effect,
  inject,
  Renderer2,
} from '@angular/core';
import { ContextualGuideService } from '../../services/guide/contextual-guide.service';

/**
 * Directive to mark elements for contextual guide highlighting
 *
 * Usage:
 * <button appContextualGuide="contextual:build-loto-button">Build LOTO</button>
 */
@Directive({
  selector: '[appContextualGuide]',
  standalone: true,
})
export class ContextualGuideDirective implements OnInit, OnDestroy {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private guideService = inject(ContextualGuideService);

  /** Target identifier in format "contextual:target-name" */
  @Input('appContextualGuide') targetId: string = '';

  /** Optional message to show as tooltip when highlighted */
  @Input() contextualMessage: string = '';

  private highlightClass = 'contextual-guide-highlight';
  private pulseClass = 'contextual-guide-pulse';

  constructor() {
    // Use effect to reactively update highlight state
    effect(() => {
      const shouldHighlight = this.guideService.shouldHighlight(this.targetId);
      this.updateHighlight(shouldHighlight);
    });
  }

  ngOnInit(): void {
    // Add base class for potential styling
    this.renderer.addClass(this.el.nativeElement, 'contextual-guide-target');
  }

  ngOnDestroy(): void {
    this.removeHighlight();
  }

  private updateHighlight(shouldHighlight: boolean): void {
    if (shouldHighlight) {
      this.addHighlight();
    } else {
      this.removeHighlight();
    }
  }

  private addHighlight(): void {
    this.renderer.addClass(this.el.nativeElement, this.highlightClass);
    this.renderer.addClass(this.el.nativeElement, this.pulseClass);

    // Scroll into view if not visible
    const element = this.el.nativeElement as HTMLElement;
    if (!this.isElementInViewport(element)) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  private removeHighlight(): void {
    this.renderer.removeClass(this.el.nativeElement, this.highlightClass);
    this.renderer.removeClass(this.el.nativeElement, this.pulseClass);
  }

  private isElementInViewport(el: HTMLElement): boolean {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }
}
