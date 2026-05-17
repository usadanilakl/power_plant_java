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
    private String permissionLevel;
    private String phone;
    private String company;
    private String signaturePath;

    // PIN authentication (read-only on the wire; password-equivalents are not exposed)
    private String signingInitials;
    private LocalDateTime pinSetAt;
    private LocalDateTime pinLockedUntil;
    private LocalDateTime trainingCompletedAt;
    private LocalDateTime trainingExpiresAt;
}
