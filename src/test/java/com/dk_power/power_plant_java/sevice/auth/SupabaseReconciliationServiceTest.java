package com.dk_power.power_plant_java.sevice.auth;

import com.dk_power.power_plant_java.entities.auth.SupabaseSyncCheckpoint;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.auth.SupabaseSyncCheckpointRepository;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient.SupabaseLink;
import com.dk_power.power_plant_java.sevice.auth.SupabaseAdminClient.SupabaseUser;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * Unit tests for the 60s metadata reconciliation job (both directions), mocking both stores.
 */
class SupabaseReconciliationServiceTest {

    private SupabaseAdminClient supabase;
    private UserRepo userRepo;
    private SupabaseSyncCheckpointRepository checkpointRepo;
    private SupabaseReconciliationService svc;

    private static final LocalDateTime T0 = LocalDateTime.of(2026, 1, 1, 0, 0);
    private static final LocalDateTime T1 = LocalDateTime.of(2026, 1, 2, 0, 0);

    @BeforeEach
    void setup() {
        supabase = mock(SupabaseAdminClient.class);
        userRepo = mock(UserRepo.class);
        checkpointRepo = mock(SupabaseSyncCheckpointRepository.class);
        svc = new SupabaseReconciliationService(supabase, userRepo, checkpointRepo,
                mock(com.dk_power.power_plant_java.config.SyncConfig.class),
                mock(org.springframework.core.env.Environment.class));
    }

    @Test
    void pushBootstrapsWhenNoCheckpoint() {
        when(checkpointRepo.findById(SupabaseReconciliationService.CP_HUB_TO_SB)).thenReturn(Optional.empty());

        svc.pushHubMetadataToSupabase();

        verify(checkpointRepo).save(any(SupabaseSyncCheckpoint.class));
        verify(userRepo, never()).findByDateModifiedAfterOrderByDateModifiedAsc(any());
        verify(supabase, never()).updateUserMetadata(anyString(), any());
    }

    @Test
    void pushSendsMetadataForChangedMirroredUser() {
        when(checkpointRepo.findById(SupabaseReconciliationService.CP_HUB_TO_SB))
                .thenReturn(Optional.of(new SupabaseSyncCheckpoint(SupabaseReconciliationService.CP_HUB_TO_SB, T0)));
        User u = User.builder().email("a@p.com").supabaseUuid("u1").permissionLevel("NONE").build();
        u.setId(1L);
        u.setDateModified(T1);
        when(userRepo.findByDateModifiedAfterOrderByDateModifiedAsc(T0)).thenReturn(List.of(u));

        svc.pushHubMetadataToSupabase();

        verify(supabase).updateUserMetadata(eq("u1"), any());
        verify(supabase).updateUserEmail("u1", "a@p.com");
        verify(checkpointRepo).save(any(SupabaseSyncCheckpoint.class));
    }

    @Test
    void pullUpdatesHubNameFromSupabase() {
        when(checkpointRepo.findById(SupabaseReconciliationService.CP_SB_TO_HUB))
                .thenReturn(Optional.of(new SupabaseSyncCheckpoint(SupabaseReconciliationService.CP_SB_TO_HUB, T0)));
        when(supabase.listLinksModifiedSince(T0))
                .thenReturn(List.of(new SupabaseLink("u1", "a@p.com", T1)));
        User hub = User.builder().email("a@p.com").name("Old Name").permissionLevel("NONE").build();
        hub.setId(1L);
        when(userRepo.findFirstBySupabaseUuidOrderByIdAsc("u1")).thenReturn(hub);
        when(supabase.getUserByUuid("u1"))
                .thenReturn(new SupabaseUser("u1", "a@p.com", null, null, java.util.Map.of("name", "New Name")));

        svc.pullSupabaseMetadataToHub();

        verify(userRepo).save(hub);
    }

    @Test
    void autoProvisionCreatesMissingActiveUsers() {
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "autoProvisionMissing", true);
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "autoProvisionBatch", 50);
        User u = User.builder().email("new@p.com").isActive(true).permissionLevel("NONE").build();
        u.setId(7L);
        when(userRepo.findSupabaseMirrorCandidates(any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(List.of(u));
        when(supabase.createUser(eq("new@p.com"), anyString(), any())).thenReturn("u-new");

        svc.provisionMissingUsers();

        verify(supabase).createUser(eq("new@p.com"), anyString(), any());
        verify(userRepo).save(u);
        verify(supabase).linkHubUser("u-new", 7L, "new@p.com");
        verify(supabase).setLinkPasswordUpdatedAt(eq("u-new"), any());
    }

    @Test
    void autoProvisionIsOffWhenDisabled() {
        org.springframework.test.util.ReflectionTestUtils.setField(svc, "autoProvisionMissing", false);

        svc.provisionMissingUsers();

        verify(supabase, never()).createUser(anyString(), anyString(), any());
    }

    @Test
    void pullIsNoOpWhenNothingDiffers() {
        when(checkpointRepo.findById(SupabaseReconciliationService.CP_SB_TO_HUB))
                .thenReturn(Optional.of(new SupabaseSyncCheckpoint(SupabaseReconciliationService.CP_SB_TO_HUB, T0)));
        when(supabase.listLinksModifiedSince(T0))
                .thenReturn(List.of(new SupabaseLink("u1", "a@p.com", T1)));
        User hub = User.builder().email("a@p.com").name("Same Name").permissionLevel("NONE").build();
        hub.setId(1L);
        when(userRepo.findFirstBySupabaseUuidOrderByIdAsc("u1")).thenReturn(hub);
        when(supabase.getUserByUuid("u1"))
                .thenReturn(new SupabaseUser("u1", "a@p.com", null, null, java.util.Map.of("name", "Same Name")));

        svc.pullSupabaseMetadataToHub();

        verify(userRepo, never()).save(any());
    }
}
