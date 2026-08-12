package com.dk_power.power_plant_java.sevice.users.impl;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

public class CustomUserDetails extends User {
    private final String name;
    private final Long id;
    public CustomUserDetails(com.dk_power.power_plant_java.entities.users.User user, Collection<? extends GrantedAuthority> authorities) {
        // Spring's User constructor asserts the principal name is non-null and non-empty, so an
        // account with no email used to throw here — which is why signing in by username only ever
        // worked for accounts that ALSO had an email. Fall back to the username for those rows.
        super(principalName(user), user.getPassword(), authorities);
        this.name = user.getName();
        this.id = user.getId();
    }

    private static String principalName(com.dk_power.power_plant_java.entities.users.User user) {
        String email = user.getEmail();
        return (email == null || email.isBlank()) ? user.getUsername() : email;
    }
    public String getName() {
        return name;
    }
    public Long getId(){return id;}

}

