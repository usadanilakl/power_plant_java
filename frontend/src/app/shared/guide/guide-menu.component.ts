import {
  Component,
  inject,
  OnInit,
  Injector,
  runInInjectionContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContextualGuideService } from '../../services/guide/contextual-guide.service';
import { PAGE_GUIDE_FACTORIES } from '../../services/guide/page-guides';
import { ContextualGuidePanelComponent } from './contextual-guide-panel/contextual-guide-panel.component';

/**
 * Guide Menu Component
 *
 * This component initializes the contextual guide system and renders
 * the contextual guide panel. The panel provides a toggle-based smart
 * helper that detects the current page and state, offering relevant
 * actions and highlighting.
 */
@Component({
  selector: 'app-guide-menu',
  standalone: true,
  imports: [CommonModule, ContextualGuidePanelComponent],
  template: `<app-contextual-guide-panel></app-contextual-guide-panel>`,
})
export class GuideMenuComponent implements OnInit {
  private contextualGuideService = inject(ContextualGuideService);
  private injector = inject(Injector);

  ngOnInit(): void {
    this.registerPageGuides();
  }

  private registerPageGuides(): void {
    // Create page guides within injection context
    runInInjectionContext(this.injector, () => {
      PAGE_GUIDE_FACTORIES.forEach((factory) => {
        try {
          const pageGuide = factory();
          this.contextualGuideService.registerPageGuide(pageGuide);
        } catch (error) {
          console.error('Failed to create page guide:', error);
        }
      });
    });
  }
}
