/**
 * One place that decides what a work-request status looks like.
 *
 * <p>There were two copies of this, in `rf-work-request-mapper.service.ts` and in
 * `work-request.model.ts`, and BOTH only styled Active / Expired / Closed / Archived. So the two
 * statuses that mean "the requester changed something under you" — `Revoked` and `Updated` — were
 * rendered exactly like an untouched row. An operator had no way to notice.
 *
 * <p>They stay two call sites because their `conditionalStyling` signatures differ (`(item)` vs
 * `(item, column)`) and they read the status off different accessors; what they share is this map.
 *
 * <p>`Closed` and `Archived` are deliberately kept. They are not phantoms: `Closed` is written
 * locally by `NgWorkRequestService` and by the SharePoint syncable, and `Archived` round-trips in
 * from SharePoint and is copied into `permitStatus` verbatim with no allowlist.
 */
export type WrStatusStyle = { 'background-color': string; color: string };

const NEUTRAL: WrStatusStyle = { 'background-color': '', color: '' };

const TEXT = 'var(--primary-text)';

export const WR_STATUS_STYLE: Record<string, WrStatusStyle> = {
  // Normal, in flight.
  Active: { 'background-color': 'var(--status-complete)', color: TEXT },
  Processed: { 'background-color': 'var(--status-complete)', color: TEXT },

  // The requester acted. These are the ones an operator must not miss.
  Updated: { 'background-color': 'var(--status-incomplete)', color: TEXT },
  Revoked: { 'background-color': 'var(--status-attention)', color: TEXT },
  Cancelled: { 'background-color': 'var(--status-attention)', color: TEXT },

  // Waiting on the requester.
  'Pending More Info': { 'background-color': 'var(--status-incomplete)', color: TEXT },

  // Terminal states.
  Expired: { 'background-color': 'var(--status-attention)', color: TEXT },
  Closed: { 'background-color': 'var(--status-not-processed)', color: TEXT },
  Archived: { 'background-color': 'var(--status-incomplete)', color: TEXT },
};

/** Style for a status name. Unknown or missing statuses render unstyled rather than guessing. */
export function wrStatusStyle(name?: string | null): WrStatusStyle {
  if (!name) return NEUTRAL;
  return WR_STATUS_STYLE[name] ?? NEUTRAL;
}

/**
 * Statuses that mean the requester changed something after submitting, so the operator needs to
 * look again. Used for row highlighting and the app-wide notice.
 */
export const WR_NEEDS_ATTENTION = ['Revoked', 'Updated', 'Cancelled'] as const;

export function wrNeedsAttention(name?: string | null): boolean {
  return !!name && (WR_NEEDS_ATTENTION as readonly string[]).includes(name);
}
