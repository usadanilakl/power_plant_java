package com.dk_power.power_plant_java.sevice.sharepoint;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

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
        if (certificateAccess.isAvailable()) {
            try {
                T result = primary.get();
                log.debug("{} succeeded via {}", operationName, certificateAccess.getName());
                return result;
            } catch (Exception e) {
                log.warn("{} failed via {}: {}. Falling back to V2",
                        operationName, certificateAccess.getName(), e.getMessage());
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
            log.error("{} failed via BOTH access methods. Last error: {}", operationName, e.getMessage());
            throw new RuntimeException("SharePoint access failed for " + operationName +
                    " via both certificate and Power Automate V2", e);
        }
    }
}
