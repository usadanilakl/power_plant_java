package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities.users.AccessGrant;
import com.dk_power.power_plant_java.entities.users.AccessGrant.GrantStatus;
import com.dk_power.power_plant_java.entities.users.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AccessGrantRepository extends JpaRepository<AccessGrant, Long> {

    Optional<AccessGrant> findByAccessToken(String accessToken);

    List<AccessGrant> findByStatus(GrantStatus status);

    List<AccessGrant> findByUserAndStatus(User user, GrantStatus status);

    Optional<AccessGrant> findFirstByUserAndStatusOrderByRequestedAtDesc(User user, GrantStatus status);

    @Query("SELECT g FROM AccessGrant g WHERE g.status = 'APPROVED' AND (g.expiresAt < :now OR g.lastActiveAt < :inactiveThreshold)")
    List<AccessGrant> findExpiredOrInactiveGrants(LocalDateTime now, LocalDateTime inactiveThreshold);

    @Modifying
    @Query("DELETE FROM AccessGrant g WHERE g.status IN ('EXPIRED', 'REVOKED', 'DENIED') AND g.requestedAt < :cutoff")
    int deleteOldGrants(LocalDateTime cutoff);

    List<AccessGrant> findByUserOrderByRequestedAtDesc(User user);

    List<AccessGrant> findAllByOrderByRequestedAtDesc();
}
