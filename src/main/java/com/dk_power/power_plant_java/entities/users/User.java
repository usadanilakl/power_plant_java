package com.dk_power.power_plant_java.entities.users;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@BatchSize(size = 50)
@Where(clause = "deleted IS NOT TRUE")
public class User extends BaseAuditEntity {

    @Column(name = "username")
    private String username;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "name")
    private String name;

    @Column(name = "email", unique = true)
    private String email;

    @Column(name = "role")
    private String role;

    @Column(name = "password")
    private String password;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    @Column(name = "windows_username")
    private String windowsUsername;

    @Column(name = "phone")
    private String phone;

    @Column(name = "company")
    private String company;

    @Column(name = "pwa_user_uuid", unique = true)
    private String pwaUserUuid;

    @Column(name = "permission_level")
    private String permissionLevel;

    @Column(name = "signature_path")
    private String signaturePath;

    @Column(name = "last_notification_check")
    private LocalDateTime lastNotificationCheck;

    /** Returns roles as a list (comma-separated storage in `role` column). */
    public List<String> getRoles() {
        if (role == null || role.isBlank()) return Collections.emptyList();
        return Arrays.stream(role.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /** Sets roles from a list (stored comma-separated). */
    public void setRoles(List<String> roles) {
        if (roles == null || roles.isEmpty()) {
            this.role = "";
        } else {
            this.role = String.join(",", roles);
        }
    }

    /** Check if user has a specific role. */
    public boolean hasRole(String roleName) {
        if (role == null || roleName == null) return false;
        return getRoles().stream().anyMatch(r -> r.equalsIgnoreCase(roleName));
    }

    /** Add a role (no duplicates). */
    public void addRole(String roleName) {
        List<String> current = new java.util.ArrayList<>(getRoles());
        if (current.stream().noneMatch(r -> r.equalsIgnoreCase(roleName))) {
            current.add(roleName);
            setRoles(current);
        }
    }
}