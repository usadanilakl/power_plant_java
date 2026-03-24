package com.dk_power.power_plant_java.sevice.messaging;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.impl.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class MessagingUserContextService {

    private final UserRepo userRepo;

    public User getCurrentUserRequired() {
        User user = getCurrentUser();
        if (user == null) {
            throw new IllegalStateException("Authenticated user is required");
        }
        return user;
    }

    public Long getCurrentUserIdRequired() {
        return getCurrentUserRequired().getId();
    }

    public Long getCurrentUserId() {
        User user = getCurrentUser();
        return user != null ? user.getId() : null;
    }

    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails details) {
            return userRepo.findById(details.getId()).orElse(null);
        }
        return null;
    }

    public void requireAdmin() {
        User user = getCurrentUserRequired();
        String role = user.getRole();
        if (role == null || (!"ROLE_ADMIN".equalsIgnoreCase(role) && !"ADMIN".equalsIgnoreCase(role))) {
            throw new SecurityException("Admin access is required");
        }
    }
}
