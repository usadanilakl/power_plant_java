/**
 * Reactive Guides Index
 *
 * Exports all reactive guide factory functions.
 * These factories must be called within an injection context.
 */

import { createLotoBuilderFullGuide } from './loto-builder-full.guide';
import { ReactiveGuideFactory } from '../reactive-guide.model';

// Re-export the factory function
export { createLotoBuilderFullGuide };

/**
 * All reactive guide factories.
 * Call these within runInInjectionContext() to create guides.
 */
export const REACTIVE_GUIDE_FACTORIES: ReactiveGuideFactory[] = [
  createLotoBuilderFullGuide,
];
