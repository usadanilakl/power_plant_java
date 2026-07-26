package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient.SupabaseUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the sync-at-login reconciliation, mocking BOTH stores (Supabase admin client and
 * the hub repository). Covers the LWW direction rules that the whole design hinges on.
 */
class SyncAtLoginServiceTest {

    private SupabaseAdminClient supabase;
    private UserRepo userRepo;
    private PasswordEncoder encoder;
    private SyncAtLoginService svc;

    private static final LocalDateTime OLD = LocalDateTime.of(2026, 1, 1, 0, 0);
    private static final LocalDateTime NEW = LocalDateTime.of(2026, 2, 1, 0, 0);

    @BeforeEach
    void setup() {
        supabase = mock(SupabaseAdminClient.class);
        userRepo = mock(UserRepo.class);
        encoder = mock(PasswordEncoder.class);
        when(supabase.isEnabled()).thenReturn(true);
        when(encoder.encode(anyString())).thenReturn("BCRYPT");
        svc = new SyncAtLoginService(supabase, userRepo, encoder);
    }

    private User hubUser(long id, String email, LocalDateTime pwdAt) {
        User u = User.builder().email(email).passwordUpdatedAt(pwdAt).permissionLevel("NONE").build();
        u.setId(id);
        return u;
    }

    // ── Hub-accepted reconciliation ──

    @Test
    void createsSupabaseUserWhenAbsent() {
        User u = hubUser(1L, "a@p.com", NEW);
        when(userRepo.findById(1L)).thenReturn(Optional.of(u));
        when(supabase.getUserByEmail("a@p.com")).thenReturn(null);
        when(supabase.createUser(eq("a@p.com"), eq("pw"), any())).thenReturn("uuid-1");

        svc.reconcileAfterHubLogin(1L, "pw");

        verify(supabase).createUser(eq("a@p.com"), eq("pw"), any());
        verify(supabase).linkHubUser("uuid-1", 1L, "a@p.com");
        verify(supabase, never()).updateUserPassword(anyString(), anyString());
    }

    @Test
    void pushesHubPasswordWhenHubNewer() {
        User u = hubUser(2L, "b@p.com", NEW);
        when(userRepo.findById(2L)).thenReturn(Optional.of(u));
        when(supabase.getUserByEmail("b@p.com"))
                .thenReturn(new SupabaseUser("uuid-2", "b@p.com", OLD, OLD, null));

        svc.reconcileAfterHubLogin(2L, "pw");

        verify(supabase).updateUserPassword("uuid-2", "pw");
    }

    @Test
    void doesNotClobberWhenSupabaseNewer() {
        User u = hubUser(3L, "c@p.com", OLD);
        when(userRepo.findById(3L)).thenReturn(Optional.of(u));
        when(supabase.getUserByEmail("c@p.com"))
                .thenReturn(new SupabaseUser("uuid-3", "c@p.com", NEW, NEW, null));

        svc.reconcileAfterHubLogin(3L, "pw");

        verify(supabase, never()).updateUserPassword(anyString(), anyString());
    }

    // ── Supabase-accepted reconciliation ──

    @Test
    void overwritesHubPasswordWhenSupabaseNewer() {
        User u = hubUser(5L, "d@p.com", OLD);
        when(supabase.getUserByEmail("d@p.com"))
                .thenReturn(new SupabaseUser("uuid-5", "d@p.com", NEW, NEW, null));
        when(userRepo.findFirstByEmailOrderByIdAsc("d@p.com")).thenReturn(u);

        var result = svc.reconcileAfterSupabaseLogin("d@p.com", "newpw");

        assertThat(result.hubPasswordUpdated()).isTrue();
        assertThat(u.getPassword()).isEqualTo("BCRYPT");
        verify(userRepo).save(u);
    }

    @Test
    void provisionsHubUserWhenMissing() {
        when(supabase.getUserByEmail("e@p.com"))
                .thenReturn(new SupabaseUser("uuid-6", "e@p.com", NEW, NEW,
                        java.util.Map.of("name", "Eve Jones")));
        when(userRepo.findFirstByEmailOrderByIdAsc("e@p.com")).thenReturn(null);

        var result = svc.reconcileAfterSupabaseLogin("e@p.com", "pw");

        assertThat(result.hubUserProvisioned()).isTrue();
        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepo).save(cap.capture());
        User created = cap.getValue();
        assertThat(created.getIsActive()).isFalse();
        assertThat(created.getRole()).isEqualTo("");
        assertThat(created.getEmail()).isEqualTo("e@p.com");
        assertThat(created.getSupabaseUuid()).isEqualTo("uuid-6");
    }
}
