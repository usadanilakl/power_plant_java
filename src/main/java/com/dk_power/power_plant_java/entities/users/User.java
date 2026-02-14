package com.dk_power.power_plant_java.entities.users;

import com.dk_power.power_plant_java.entities.base_entities.BaseAuditEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.envers.Audited;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Audited
public class User extends BaseAuditEntity {

    @Column(name = "username")
    private String username;

    @Column(name = "first_name")
    private String firstName;

    @Column(name = "last_name")
    private String lastName;

    @Column(name = "name")
    private String name;

    @Column(name = "email", nullable = false, unique = true)
    private String email;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "is_active")
    private Boolean isActive;

    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

    @Column(name = "windows_username")
    private String windowsUsername;
}