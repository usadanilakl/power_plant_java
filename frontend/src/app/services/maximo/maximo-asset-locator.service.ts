import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MaximoApiService } from './maximo-api.service';
import { MaximoAsset } from '../../models/maximo/maximo.models';

export type LocatorTier = 'exact' | 'wildcard' | 'partial' | 'none' | 'error';

export interface LocatorResult {
  tier: LocatorTier;
  /** Single best match (when one asset is the obvious answer). */
  asset?: MaximoAsset;
  /** Multiple matches the user must pick from. */
  candidates?: MaximoAsset[];
  /** When tier === 'partial', the segment that produced the hit. */
  partialTerm?: string;
  /** Original tag the user supplied. */
  tag: string;
  /** Optional human-readable note. */
  note?: string;
  /** When tier === 'error', the message. */
  errorMessage?: string;
}

/**
 * Tiered Maximo asset lookup used by both the SR submit form and the API test panel.
 *
 *   1. exact     → MaximoApiService.getAsset(tag)
 *   2. wildcard  → MaximoApiService.searchAssets({ tag })  (sends %tag%)
 *   3. partial   → split tag on -/_/space, try LIKE %segment% on each segment
 *                  (≥2 chars, must contain a letter) longest first, stop at first hit
 *
 * Returns the FIRST non-empty result with the tier that produced it, so the UI can
 * label the suggestion ("exact match", "matched on segment 'CEM'", etc.) instead of
 * silently returning ambiguous candidates.
 */
@Injectable({ providedIn: 'root' })
export class MaximoAssetLocatorService {
  private api = inject(MaximoApiService);

  async locate(tag: string): Promise<LocatorResult> {
    const t = (tag ?? '').trim();
    if (!t) return { tier: 'none', tag: t, note: 'empty tag' };

    try {
      // Tier 1 — exact assetnum match
      const exact = await firstValueFrom(this.api.getAsset(t));
      if (exact) return { tier: 'exact', asset: exact, tag: t };

      // Tier 2 — wildcard %tag% on assetnum
      const wildcard = await firstValueFrom(this.api.searchAssets({ tag: t, pageSize: 10 }));
      if (wildcard.length === 1) {
        return { tier: 'wildcard', asset: wildcard[0], tag: t, note: 'single wildcard hit' };
      }
      if (wildcard.length > 1) {
        return { tier: 'wildcard', candidates: wildcard, tag: t };
      }

      // Tier 3 — partial: try each meaningful segment of the tag
      for (const seg of extractSegments(t)) {
        const partial = await firstValueFrom(this.api.searchAssets({ tag: seg, pageSize: 10 }));
        if (partial.length === 0) continue;
        if (partial.length === 1) {
          return { tier: 'partial', asset: partial[0], tag: t, partialTerm: seg, note: 'single hit on segment' };
        }
        return { tier: 'partial', candidates: partial, tag: t, partialTerm: seg };
      }

      return { tier: 'none', tag: t, note: `no match for "${t}" or any of its segments` };
    } catch (e: any) {
      return { tier: 'error', tag: t, errorMessage: e?.error?.message ?? e?.message ?? String(e) };
    }
  }
}

/** Split a tag like "-1-CEM-SS" into searchable segments, longest first. */
export function extractSegments(tag: string): string[] {
  return tag
    .split(/[-_/]+/)
    .filter(s => s.length >= 2 && /[a-zA-Z]/.test(s))
    .sort((a, b) => b.length - a.length);
}
