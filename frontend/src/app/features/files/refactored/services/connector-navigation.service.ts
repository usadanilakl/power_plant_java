import { Injectable, signal } from '@angular/core';

/**
 * Cross-component signal for "after I click a connector, highlight its
 * counterpart on the destination file." The click handler sets
 * {@link pendingHighlightConnectorId} to the source connector's
 * {@code counterpartConnectorId}; the destination viewer's connector mapper
 * checks each rendered shape and marks {@code isSelected=true} when the id
 * matches. The signal then clears so the highlight only fires once per click.
 *
 * <p>Service is provided in root so a single shared signal works across the
 * loto-builder (where the click happens) and the destination file's render
 * pipeline (which may be the same component re-renders or a different one).
 */
@Injectable({ providedIn: 'root' })
export class ConnectorNavigationService {
  /**
   * Id of the connector to highlight on next render. Set by the click
   * handler in the source file; consumed (and cleared) by the connector
   * mapper when it spots a matching shape on the target file.
   */
  pendingHighlightConnectorId = signal<number | null>(null);

  /**
   * Arm the highlight before navigating to the target file. Auto-clears after
   * {@link AUTO_CLEAR_MS} so a click that lands on a file with no matching
   * counterpart doesn't leave the signal armed indefinitely (would spuriously
   * highlight on the user's next unrelated navigation).
   *
   * <p>The cleanup is guarded by an id check — if a newer click overwrote the
   * signal in the meantime, we don't stomp the newer arm.
   */
  flagPendingHighlight(connectorId: number | null): void {
    this.pendingHighlightConnectorId.set(connectorId);
    if (connectorId != null) {
      setTimeout(() => {
        if (this.pendingHighlightConnectorId() === connectorId) {
          this.pendingHighlightConnectorId.set(null);
        }
      }, AUTO_CLEAR_MS);
    }
  }

  /** Hard-clear (e.g. navigation failed before the highlight could land). */
  clearPendingHighlight(): void {
    this.pendingHighlightConnectorId.set(null);
  }
}

/** How long the highlight stays armed before auto-clearing (ms). */
const AUTO_CLEAR_MS = 5000;
