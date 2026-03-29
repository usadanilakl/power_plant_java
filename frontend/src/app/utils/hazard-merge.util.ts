import { SwHazards } from '../models/permits/safe-work.model';
import { HotWorkMeasures } from '../models/permits/hot-work.model';
import { ConfinedSpaceHazards } from '../models/permits/confined-space.model';

/**
 * OR-union merge for hazard POJOs.
 * Any `true` from any source = `true` in result.
 * String description fields are concatenated with "; ".
 */
export function mergeSwHazards(...sources: (SwHazards | null | undefined)[]): SwHazards {
  const result = new SwHazards();
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(result) as (keyof SwHazards)[]) {
      const val = source[key];
      if (typeof val === 'boolean' && val === true) {
        (result as any)[key] = true;
      } else if (typeof val === 'string' && val.trim()) {
        const existing = (result as any)[key] as string;
        (result as any)[key] = existing ? existing + '; ' + val.trim() : val.trim();
      }
    }
  }
  return result;
}

export function mergeHotWorkMeasures(...sources: (HotWorkMeasures | null | undefined)[]): HotWorkMeasures {
  const result = new HotWorkMeasures();
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(result) as (keyof HotWorkMeasures)[]) {
      const val = source[key];
      if (typeof val === 'boolean' && val === true) {
        (result as any)[key] = true;
      }
    }
  }
  return result;
}

export function mergeConfinedSpaceHazards(...sources: (ConfinedSpaceHazards | null | undefined)[]): ConfinedSpaceHazards {
  const result = new ConfinedSpaceHazards();
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(result) as (keyof ConfinedSpaceHazards)[]) {
      const val = source[key];
      if (typeof val === 'boolean' && val === true) {
        (result as any)[key] = true;
      } else if (typeof val === 'string' && val.trim()) {
        const existing = (result as any)[key] as string;
        (result as any)[key] = existing ? existing + '; ' + val.trim() : val.trim();
      }
    }
  }
  return result;
}
