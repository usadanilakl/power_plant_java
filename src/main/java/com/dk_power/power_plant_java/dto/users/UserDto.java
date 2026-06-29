package com.dk_power.power_plant_java.dto.users;

import com.dk_power.power_plant_java.dto.base_dtos.BaseDto;
import jakarta.persistence.Column;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto extends BaseDto {

    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private List<String> roles;
    private Boolean isActive;
    private LocalDateTime lastLoginDate;
    private String windowsUsername;
    /** Explicit Maximo personid override; blank = derived from windowsUsername. */
    private String maximoPersonidOverride;
    /** Exact name as in the Ops Schedule (for PM auto-assignment resolution). */
    private String scheduleName;
    private String permissionLevel;
    private String onLocationMemberId;
    private String phone;
    private String secondaryPhone;
    private String title;
    private String emergencyContactJson;
    private String company;
    private String signaturePath;

    // PIN authentication (read-only on the wire; password-equivalents are not exposed)
    private String signingInitials;
    private LocalDateTime pinSetAt;
    private LocalDateTime pinLockedUntil;
    /** Set when user has clicked Forgot PIN; cleared by admin reset. */
    private LocalDateTime pinResetRequestedAt;
    /** True when admin generated the current PIN; cleared on user-initiated change. */
    private Boolean pinMustChange;
    private LocalDateTime trainingCompletedAt;
    private LocalDateTime trainingExpiresAt;
}
