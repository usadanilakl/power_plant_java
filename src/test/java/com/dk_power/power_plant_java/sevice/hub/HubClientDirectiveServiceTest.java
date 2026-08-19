package com.dk_power.power_plant_java.sevice.hub;

import com.dk_power.power_plant_java.entities.hub.HubClientInfo;
import com.dk_power.power_plant_java.repository.hub.HubClientInfoRepository;
import com.dk_power.power_plant_java.sevice.hub.HubJarUpdateService.UpdatePolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

/**
 * Unit tests for the per-client next-boot directive idempotency + validation logic. Uses a single mutable
 * HubClientInfo returned by the mocked repo so set → effective → markApplied → re-set exercises the real
 * directiveId / lastAppliedDirectiveId state machine.
 */
@ExtendWith(MockitoExtension.class)
class HubClientDirectiveServiceTest {

    @Mock
    private HubClientInfoRepository clientRepo;

    private HubClientDirectiveService service;
    private HubClientInfo client; // the "M1" row, mutated in place by the service

    @BeforeEach
    void setUp() {
        service = new HubClientDirectiveService(clientRepo);
        client = new HubClientInfo("M1", "Desktop-1", "10.0.0.5");
    }

    private void clientExists() {
        lenient().when(clientRepo.findById("M1")).thenReturn(Optional.of(client));
    }

    @Test
    void setDirective_unknownClient_throws() {
        when(clientRepo.findById("ghost")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.setDirective("ghost", List.of("jar"), false, "x"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void setDirective_noValidActions_throws() {
        clientExists();
        assertThatThrownBy(() -> service.setDirective("M1", List.of("bogus", "  ", ""), false, "x"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void setDirective_thenEffective_returnsNormalizedPolicy() {
        clientExists();
        // mixed case + a dup + an invalid action: normalized to the allowed, de-duplicated, lower-cased set.
        String id = service.setDirective("M1", List.of("JAR", "jar", "db", "nope"), true, "Update now");
        assertThat(id).startsWith("dir-");

        Optional<UpdatePolicy> policy = service.effectiveDirectiveFor("M1");
        assertThat(policy).isPresent();
        assertThat(policy.get().id()).isEqualTo(id);
        assertThat(policy.get().actions()).containsExactly("jar", "db");
        assertThat(policy.get().mandatory()).isTrue();
        assertThat(policy.get().message()).isEqualTo("Update now");
    }

    @Test
    void markApplied_matchingId_clearsOutstanding() {
        clientExists();
        String id = service.setDirective("M1", List.of("jar", "electron"), false, null);
        assertThat(service.effectiveDirectiveFor("M1")).isPresent();

        assertThat(service.markApplied("M1", id)).isTrue();
        // Once the client acks the current id, the directive is no longer outstanding.
        assertThat(service.effectiveDirectiveFor("M1")).isEmpty();
    }

    @Test
    void markApplied_staleId_returnsFalse_andKeepsOutstanding() {
        clientExists();
        service.setDirective("M1", List.of("db"), false, null);

        assertThat(service.markApplied("M1", "dir-superseded")).isFalse();
        // A stale ack must NOT mark the current directive done.
        assertThat(service.effectiveDirectiveFor("M1")).isPresent();
    }

    @Test
    void markApplied_unknownOrNull_returnsFalse() {
        when(clientRepo.findById("ghost")).thenReturn(Optional.empty());
        assertThat(service.markApplied("ghost", "dir-1")).isFalse();
        assertThat(service.markApplied(null, "dir-1")).isFalse();
        assertThat(service.markApplied("M1", null)).isFalse();
    }

    @Test
    void reSet_mintsNewId_makesItOutstandingAgain() {
        clientExists();
        String id1 = service.setDirective("M1", List.of("jar"), false, null);
        assertThat(service.markApplied("M1", id1)).isTrue();
        assertThat(service.effectiveDirectiveFor("M1")).isEmpty();

        String id2 = service.setDirective("M1", List.of("db", "files"), false, null);
        assertThat(id2).isNotEqualTo(id1);
        // A brand-new directive id (!= lastApplied) is outstanding again.
        assertThat(service.effectiveDirectiveFor("M1")).isPresent();
        assertThat(service.effectiveDirectiveFor("M1").get().id()).isEqualTo(id2);
    }

    @Test
    void effectiveDirectiveFor_blankMachineId_isEmpty() {
        assertThat(service.effectiveDirectiveFor(null)).isEmpty();
        assertThat(service.effectiveDirectiveFor("  ")).isEmpty();
    }

    @Test
    void clearDirective_removesOutstanding() {
        clientExists();
        service.setDirective("M1", List.of("jar"), true, "x");
        assertThat(service.effectiveDirectiveFor("M1")).isPresent();

        service.clearDirective("M1");
        assertThat(service.effectiveDirectiveFor("M1")).isEmpty();
    }

    // ==================== Immediate commands ====================

    @Test
    void issueCommand_unknownClient_throws() {
        when(clientRepo.findById("ghost")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.issueCommand("ghost", "SHUTDOWN"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void issueCommand_invalidCommand_throws() {
        clientExists();
        assertThatThrownBy(() -> service.issueCommand("M1", "SELF_DESTRUCT"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void issueCommand_thenPending_returnsIt() {
        clientExists();
        String id = service.issueCommand("M1", "restart"); // case-insensitive
        assertThat(id).startsWith("cmd-");
        var cmd = service.pendingCommandFor("M1");
        assertThat(cmd).isPresent();
        assertThat(cmd.get().id()).isEqualTo(id);
        assertThat(cmd.get().command()).isEqualTo("RESTART");
    }

    @Test
    void markCommandApplied_matching_clears_stale_isNoop() {
        clientExists();
        String id = service.issueCommand("M1", "SHUTDOWN");
        assertThat(service.markCommandApplied("M1", "cmd-stale")).isFalse();
        assertThat(service.pendingCommandFor("M1")).isPresent(); // stale ack didn't clear it

        assertThat(service.markCommandApplied("M1", id)).isTrue();
        assertThat(service.pendingCommandFor("M1")).isEmpty();   // real ack cleared it
    }

    @Test
    void clearCommand_removesOutstanding() {
        clientExists();
        service.issueCommand("M1", "SHUTDOWN");
        assertThat(service.pendingCommandFor("M1")).isPresent();
        service.clearCommand("M1");
        assertThat(service.pendingCommandFor("M1")).isEmpty();
    }

    @Test
    void pendingCommandFor_blankMachineId_isEmpty() {
        assertThat(service.pendingCommandFor(null)).isEmpty();
        assertThat(service.pendingCommandFor("  ")).isEmpty();
    }
}
