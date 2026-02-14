package com.dk_power.power_plant_java.entities.users;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "access_grants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessGrant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "access_token", unique = true)
    private String accessToken;

    @Column(name = "device_info")
    private String deviceInfo;

    @Column(name = "request_ip")
    private String requestIp;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GrantStatus status;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "last_active_at")
    private LocalDateTime lastActiveAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by_id")
    private User approvedBy;

    public enum GrantStatus {
        PENDING, APPROVED, DENIED, EXPIRED, REVOKED
    }
}
