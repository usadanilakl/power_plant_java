/**
 * Seeding a new permit's hazard block from everything already known about the job.
 *
 * Extracted from the daily-permit-package builder so it is a pure function that can be exercised on
 * its own. It decides what an operator sees pre-ticked on a Safe Work / Hot Work / Confined Space
 * permit, which makes it the highest-consequence piece of client-side logic in the work request
 * flow — worth being able to test without driving the UI.
 */

/**
 * Merge hazard sources into the block a brand-new permit should start from.
 *
 * Two kinds of source, both of which the operator would otherwise re-enter by hand:
 *  - the work area's CONSTANT hazards — what is always true of that place;
 *  - what each requester DECLARED on their own work request — what they can see today.
 *
 * Ticks are OR-ed: a hazard flagged by any source lands on the permit. Nothing here can UNtick
 * anything, so this only ever adds to what the operator sees and they remain free to correct it.
 *
 * Free-text companions (weather / voltage / other descriptions) ACCUMULATE, joined with "; " and
 * deduped by content. A blank can never wipe wording an earlier source supplied, and no source's
 * wording is lost to an earlier one.
 *
 * @param current  what the permit already has (a fresh permit's empty block, normally)
 * @param sources  area constants first, then one entry per work request in the package
 */
export function mergeHazardSources<T extends object>(
  current: T | null | undefined,
  ...sources: Array<Partial<T> | null | undefined>
): Partial<T> {
  const merged: any = { ...(current ?? {}) };

  for (const source of sources) {
    if (!source) continue;
    for (const [key, value] of Object.entries(source)) {
      if (value === true) {
        merged[key] = true;
      } else if (typeof value === 'string' && value.trim()) {
        // Free text ACCUMULATES. Taking only the first non-empty value silently dropped wording
        // from every later source — and the requester's own description is the last source, so a
        // work-area constant like "watch for ice" would suppress "scaffold is iced over" written
        // by the person who is actually there. The util this replaced concatenated, and losing that
        // when the two merged into one was a real regression.
        //
        // Deduped by content, because the same wording legitimately arrives twice: the PWA seeds a
        // request from the same area profile the operator merges in here.
        const existing = String(merged[key] ?? '').trim();
        const incoming = value.trim();
        if (!existing) {
          merged[key] = incoming;
        } else if (!existing.split('; ').some((part: string) => part.trim() === incoming)) {
          merged[key] = existing + '; ' + incoming;
        }
      }
    }
  }
  return merged as Partial<T>;
}
