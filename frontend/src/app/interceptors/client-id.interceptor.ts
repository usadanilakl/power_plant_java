import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { SyncUpdateService } from '../services/sync/sync-update.service';

/**
 * Stamps every non-GET/HEAD request with an {@code X-Client-Id} header
 * carrying this browser tab's unique id. The backend's
 * {@code ClientIdRequestFilter} stashes the value on a request-scoped
 * ThreadLocal, {@code FieldChangeTracker} captures it into the
 * {@code ChangesDetectedEvent}, and {@code LocalChangeSseBroadcaster} echoes
 * it back to SSE clients. The tab that made the write then filters its own
 * event out of {@code SyncUpdateService.getEntityTypeUpdates$} — no
 * redundant refetch immediately after a successful save.
 * <p>
 * GET / HEAD are skipped: they don't emit sync events, and adding a header
 * would defeat any HTTP GET caching further down the stack.
 */
export const clientIdInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return next(req);
  const syncUpdate = inject(SyncUpdateService);
  return next(req.clone({
    setHeaders: { 'X-Client-Id': syncUpdate.clientId },
  }));
};
