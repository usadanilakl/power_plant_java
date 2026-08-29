package com.dk_power.power_plant_java.sevice.sharepoint;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;
import java.util.function.Supplier;

/**
 * Thin facade providing certificate-first / PA-V2-fallback execution.
 * Entity-specific operations have been moved to adapters
 * (WorkRequestSharePointAdapter, JhaSharePointAdapter).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SharepointAccessService {

    @Getter
    private final SharePointCertificateAccess certificateAccess;

    /**
     * Execute an operation with certificate access first, falling back to Power Automate V2.
     */
    public <T> T executeWithFallback(Supplier<T> primary, Supplier<T> fallback, String operationName) {
        Exception primaryFailure = null;
        if (certificateAccess.isAvailable()) {
            try {
                T result = primary.get();
                log.debug("{} succeeded via {}", operationName, certificateAccess.getName());
                return result;
            } catch (Exception e) {
                primaryFailure = e;
                log.warn("{} failed via {}: {}. Falling back to V2",
                        operationName, certificateAccess.getName(), e.getMessage(), e);
            }
        } else {
            log.debug("{} skipping {} (not available), using V2",
                    operationName, certificateAccess.getName());
        }

        try {
            T result = fallback.get();
            log.debug("{} succeeded via V2", operationName);
            return result;
        } catch (Exception e) {
            log.error("{} failed via BOTH access methods. Last error: {}", operationName, e.getMessage(), e);
            RuntimeException failure = new RuntimeException("SharePoint access failed for " + operationName +
                    " via both certificate and Power Automate V2", e);
            // The certificate attempt usually carries the precise reason (e.g. 404 "Item does not
            // exist"), while the V2 fallback tends to collapse everything into a flat 500. Attach it
            // so callers can branch on the real cause instead of retrying a doomed operation forever.
            if (primaryFailure != null) failure.addSuppressed(primaryFailure);
            throw failure;
        }
    }

    /**
     * True when {@code failure} was caused by the SharePoint list item no longer existing —
     * a 404 anywhere in its cause/suppressed chain, or SharePoint's
     * {@code "Item does not exist. It may have been deleted by another user."} message.
     * <p>
     * Callers should treat this as terminal for the given {@code sharepointId}: the item will
     * never come back, so retrying the same operation only produces an endless error loop.
     */
    public static boolean isItemGone(Throwable failure) {
        return isItemGone(failure, Collections.newSetFromMap(new IdentityHashMap<>()));
    }

    // `seen` guards against a cause/suppressed cycle, the same way Throwable.printStackTrace does.
    private static boolean isItemGone(Throwable failure, Set<Throwable> seen) {
        for (Throwable t = failure; t != null && seen.add(t); t = t.getCause()) {
            if (t instanceof HttpClientErrorException httpError
                    && httpError.getStatusCode().value() == 404) {
                return true;
            }
            String message = t.getMessage();
            if (message != null && message.contains("Item does not exist")) {
                return true;
            }
            for (Throwable suppressed : t.getSuppressed()) {
                if (isItemGone(suppressed, seen)) return true;
            }
        }
        return false;
    }
}
