/**
 * Page Guides Index
 *
 * Exports all page guide factory functions.
 * These factories must be called within an injection context.
 */

import { createLotoBuilderPageGuide } from './loto-builder.page-guide';
import { createHomePageGuide } from './home.page-guide';
import { PageGuideFactory } from '../contextual-guide.model';

// Re-export factory functions
export { createLotoBuilderPageGuide };
export { createHomePageGuide };

/**
 * All page guide factories.
 * Call these within runInInjectionContext() to create guides.
 */
export const PAGE_GUIDE_FACTORIES: PageGuideFactory[] = [
  createLotoBuilderPageGuide,
  createHomePageGuide,
];
