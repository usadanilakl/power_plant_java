package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Resolves the account behind whatever a person typed into an "Email or Username" field.
 *
 * <p>One place on purpose: sign-in, the PWA's account lookup and forgot-password each used to carry
 * their own copy of this, so they could disagree about which identifiers are accepted — and a
 * credential that the lookup step rejects never even reaches sign-in.
 *
 * <p>Order runs most- to least-specific:
 * <ol>
 *   <li>{@code email} — the only one of the three with a UNIQUE constraint.</li>
 *   <li>{@code username}.</li>
 *   <li>{@code windowsUsername} — the name plant staff actually know as their username. It is stored
 *       separately from {@code username}, which several paths overwrite with the email address
 *       ({@code PwaUserService}, {@code SyncAtLoginService}, {@code PwaSecuredController#updateProfile}),
 *       so for many accounts it is the ONLY column holding a real username.</li>
 * </ol>
 *
 * <p>Neither username column is unique, so a duplicate makes the lowest id win. That cannot be used
 * to impersonate anyone on the sign-in path — the password is still verified against whichever row
 * is returned — and it is a weaker trust than {@code DesktopAutoAuthFilter}, which already accepts
 * {@code windowsUsername} with no password at all.
 */
@Service
@RequiredArgsConstructor
public class LoginIdentifierResolver {

    private final UserRepo userRepo;

    /** @return the matching account, or null. */
    public User resolve(String credential) {
        if (credential == null) return null;
        String trimmed = credential.trim();
        if (trimmed.isEmpty()) return null;

        User user = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(trimmed);
        if (user == null) user = userRepo.findFirstByUsernameIgnoreCaseOrderByIdAsc(trimmed);
        if (user == null) user = userRepo.findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc(trimmed);
        return user;
    }
}
