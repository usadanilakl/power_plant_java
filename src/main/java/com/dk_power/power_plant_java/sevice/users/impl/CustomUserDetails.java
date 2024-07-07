package com.dk_power.power_plant_java.sevice.users.impl;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

public class CustomUserDetails extends User {
    private final String name;
    private final Long id;
    public CustomUserDetails(com.dk_power.power_plant_java.entities2.users.User user, Collection<? extends GrantedAuthority> authorities) {
        super(user.getEmail(), user.getPassword(), authorities);
        this.name = user.getName();
        this.id = user.getId();
    }
    public String getName() {
        return name;
    }
    public Long getId(){return id;}

}

