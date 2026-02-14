package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.entities.users.AccessGrant;
import com.dk_power.power_plant_java.entities.users.AccessGrant.GrantStatus;
import com.dk_power.power_plant_java.repository.users.AccessGrantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Scheduled cleanup for expired and inactive access grants.
 * Runs every 5 minutes to enforce 24h max and 1h inactivity timeouts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AccessGrantCleanupService {

    private final AccessGrantRepository accessGrantRepository;

    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void cleanupExpiredGrants() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime inactiveThreshold = now.minusHours(1);

        List<AccessGrant> expiredGrants = accessGrantRepository.findExpiredOrInactiveGrants(now, inactiveThreshold);

        if (!expiredGrants.isEmpty()) {
            for (AccessGrant grant : expiredGrants) {
                grant.setStatus(GrantStatus.EXPIRED);
                String reason = (grant.getExpiresAt() != null && now.isAfter(grant.getExpiresAt()))
                    ? "24h max reached"
                    : "1h inactivity";
                log.info("Access grant expired: user={}, reason={}", grant.getUser().getEmail(), reason);
            }
            accessGrantRepository.saveAll(expiredGrants);
        }

        // Delete old resolved grants (>30 days) to prevent table growth
        LocalDateTime cutoff = now.minusDays(30);
        int deleted = accessGrantRepository.deleteOldGrants(cutoff);
        if (deleted > 0) {
            log.info("Cleaned up {} old access grants", deleted);
        }
    }
}
