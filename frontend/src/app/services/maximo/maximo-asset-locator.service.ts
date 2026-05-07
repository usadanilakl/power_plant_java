import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MaximoApiService } from './maximo-api.service';
import { MaximoAsset } from '../../models/maximo/maximo.models';

export type LocatorTier = 'exact' | 'wildcard' | 'partial' | 'none' | 'error';

export interface LocatorResult {
  tier: LocatorTier;
  /** Single best match (when one asset is the obvious answer). */
  asset?: MaximoAsset;
  /** Multiple matches the user must pick from, sorted best-first when tier === 'partial'. */
  candidates?: MaximoAsset[];
  /** When tier === 'partial', the segment(s) that produced hits, joined with comma. */
  partialTerm?: string;
  /** When tier === 'partial', per-candidate scoring info aligned with `candidates`. */
  candidateScores?: ScoredCandidate[];
  /** Original tag the user supplied. */
  tag: string;
  /** Optional human-readable note. */
  note?: string;
  /** When tier === 'error', the message. */
  errorMessage?: string;
}

export interface ScoredCandidate {
  assetnum: string;
  matchedSegments: string[];
  /** Sum of matched-segment character lengths — longer/multiple matches rank higher. */
  score: number;
}

/**
 * Tiered Maximo asset lookup used by both the SR submit form and the API test panel.
 *
 *   1. exact     → MaximoApiService.getAsset(tag)
 *   2. wildcard  → MaximoApiService.searchAssets({ tag })  (sends %tag%)
 *   3. partial   → fuzzy multi-segment search:
 *                    - split tag on -/_, keep segments ≥2 chars containing a letter
 *                    - run a wildcard search per segment in parallel
 *                    - merge and dedupe by assetnum
 *                    - score each candidate by the SUM of matched-segment character
 *                      lengths (so an asset matching on HHS906 + MOV outranks one
 *                      matching on HHS906 alone)
 *                    - return top 20 sorted best-first
 *
 * Returns the first tier that yields hits, with metadata on which segments matched.
 */
@Injectable({ providedIn: 'root' })
export class MaximoAssetLocatorService {
  private api = inject(MaximoApiService);

  /** Per-segment search size; total candidates is ≤ TOP_K after dedupe + ranking. */
  private static readonly PARTIAL_PAGE_SIZE = 50;
  private static readonly TOP_K = 20;

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

      // Tier 3 — fuzzy: gather hits across every meaningful segment, rank by similarity
      const segments = extractSegments(t);
      if (segments.length === 0) {
        return { tier: 'none', tag: t, note: `no segments to search in "${t}"` };
      }

      // Parallel per-segment wildcard searches
      const perSegment = await Promise.all(
        segments.map(async seg => ({
          seg,
          hits: await firstValueFrom(this.api.searchAssets({
            tag: seg,
            pageSize: MaximoAssetLocatorService.PARTIAL_PAGE_SIZE
          }))
        }))
      );

      // Build assetnum → { asset, matchedSegments[] }
      const seen = new Map<string, { asset: MaximoAsset; matched: Set<string> }>();
      for (const { seg, hits } of perSegment) {
        for (const h of hits) {
          if (!h.assetnum) continue;
          const existing = seen.get(h.assetnum);
          if (existing) existing.matched.add(seg);
          else seen.set(h.assetnum, { asset: h, matched: new Set([seg]) });
        }
      }

      if (seen.size === 0) {
        return { tier: 'none', tag: t, note: `no match for "${t}" or any of its segments` };
      }

      // Score = sum of matched-segment character lengths.
      // Tiebreak: more distinct segments matched first, then assetnum alphabetical.
      const scored: ScoredCandidate[] = Array.from(seen.entries()).map(([assetnum, v]) => {
        const matchedSegments = Array.from(v.matched);
        const score = matchedSegments.reduce((s, seg) => s + seg.length, 0);
        return { assetnum, matchedSegments, score };
      }).sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.matchedSegments.length !== a.matchedSegments.length)
          return b.matchedSegments.length - a.matchedSegments.length;
        return a.assetnum.localeCompare(b.assetnum);
      }).slice(0, MaximoAssetLocatorService.TOP_K);

      const candidates: MaximoAsset[] = scored.map(s => seen.get(s.assetnum)!.asset);
      const allMatchedTerms = Array.from(new Set(scored.flatMap(s => s.matchedSegments)));

      if (candidates.length === 1) {
        return {
          tier: 'partial', asset: candidates[0], tag: t,
          partialTerm: scored[0].matchedSegments.join(','),
          candidateScores: scored,
          note: `single fuzzy hit (matched on ${scored[0].matchedSegments.join(', ')})`
        };
      }
      return {
        tier: 'partial', candidates, tag: t,
        partialTerm: allMatchedTerms.join(','),
        candidateScores: scored
      };
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
