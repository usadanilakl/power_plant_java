/**
 * OS-clipboard helpers (NOT the in-memory ClipboardService / shared clipboard store — those are copy/paste
 * buffers, not OS-clipboard writers). Writes to the real system clipboard using the async Clipboard API with a
 * textarea + execCommand('copy') fallback for older Electron renderers that ship a stripped-down
 * navigator.clipboard. Mirrors the robust copy pattern in loto-builder-right-panel.
 */

/** Copy text to the OS clipboard. Resolves true on success, false on failure. No-op (false) for empty text. */
export function copyToOsClipboard(text: string): Promise<boolean> {
  if (!text) return Promise.resolve(false);
  if (navigator?.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => fallbackCopy(text));
  }
  return Promise.resolve(fallbackCopy(text));
}

function fallbackCopy(text: string): boolean {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  } finally {
    document.body.removeChild(ta);
  }
  return ok;
}

/** The default GenSuit phrase, seeded when a PM's GenSuit is enabled with no phrase yet. */
export const DEFAULT_GEN_SUIT_PHRASE = '{PM} was completed see WO# {WO}';

/**
 * Substitute the GenSuit placeholder tokens: {WO} → work-order number, {PM} → PM name/description.
 * A single shared helper so the substitution is identical in every GS host.
 */
export function fillGenSuit(phrase: string | null | undefined,
                           wonum: string | null | undefined,
                           pmName: string | null | undefined): string {
  return (phrase ?? '')
    .replace(/\{WO\}/g, wonum ?? '')
    .replace(/\{PM\}/g, pmName ?? '');
}
