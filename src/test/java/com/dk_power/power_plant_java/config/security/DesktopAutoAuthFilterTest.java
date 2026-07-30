package com.dk_power.power_plant_java.config.security;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Desktop auto-auth must survive Windows reporting the OS account name with different casing between
 * logons (observed in the field: a username flipping between lower-case and mixed-case and back). The
 * lookup is therefore case-insensitive, and the resolve cache is keyed on the case-folded name.
 */
class DesktopAutoAuthFilterTest {

    private static final String OS_USER_PROPERTY = "user.name";

    private final UserRepo userRepo = mock(UserRepo.class);
    private final DesktopAutoAuthFilter filter = new DesktopAutoAuthFilter(userRepo);

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /** A plant user complete enough to pass the filter's data/role gates. */
    private User plantUser(String windowsUsername) {
        User u = User.builder()
                .name("Jane Plant")
                .email("jplant@jpowerusa.com")
                .password("{noop}irrelevant")
                .role("ROLE_PLANT")
                .isActive(true)
                .windowsUsername(windowsUsername)
                .build();
        u.setId(7L);
        return u;
    }

    /** Runs one loopback request with {@code user.name} set to the given value, restoring it afterwards. */
    private void requestAs(String osUserName) throws Exception {
        String previous = System.getProperty(OS_USER_PROPERTY);
        System.setProperty(OS_USER_PROPERTY, osUserName);
        try {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/ng/feed/recent");
            request.setRemoteAddr("127.0.0.1");
            filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        } finally {
            if (previous == null) System.clearProperty(OS_USER_PROPERTY);
            else System.setProperty(OS_USER_PROPERTY, previous);
        }
    }

    @Test
    void authenticatesWhenWindowsFlipsTheCasingOfTheOsUsername() throws Exception {
        // Stored as lower-case; Windows hands us mixed case this logon.
        when(userRepo.findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc("JPlant"))
                .thenReturn(plantUser("jplant"));

        requestAs("JPlant");

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().isAuthenticated()).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName())
                .isEqualTo("jplant@jpowerusa.com");
    }

    @Test
    void trimsSurroundingWhitespaceFromTheOsUsername() throws Exception {
        when(userRepo.findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc("jplant"))
                .thenReturn(plantUser("jplant"));

        requestAs("  jplant  ");

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    @Test
    void aCasingFlipDoesNotForceASecondLookupWithinTheCacheTtl() throws Exception {
        when(userRepo.findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc(anyString()))
                .thenReturn(plantUser("jplant"));

        requestAs("jplant");
        SecurityContextHolder.clearContext();
        requestAs("JPLANT");

        // Second request authenticates off the case-folded cache key — no re-query.
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        verify(userRepo).findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc("jplant");
        verify(userRepo, never()).findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc("JPLANT");
    }

    @Test
    void leavesRequestUnauthenticatedWhenNoUserMatchesAnyCasing() throws Exception {
        when(userRepo.findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc(anyString())).thenReturn(null);

        requestAs("nobody");

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    void doesNotAutoAuthNonLoopbackRequests() throws Exception {
        String previous = System.getProperty(OS_USER_PROPERTY);
        System.setProperty(OS_USER_PROPERTY, "jplant");
        try {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/ng/feed/recent");
            request.setRemoteAddr("10.10.190.50");
            filter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());
        } finally {
            if (previous == null) System.clearProperty(OS_USER_PROPERTY);
            else System.setProperty(OS_USER_PROPERTY, previous);
        }

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userRepo, never()).findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc(anyString());
    }
}
