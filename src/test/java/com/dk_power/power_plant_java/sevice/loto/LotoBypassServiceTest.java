package com.dk_power.power_plant_java.sevice.loto;

import com.dk_power.power_plant_java.entities.categories.Value;
import com.dk_power.power_plant_java.entities.loto.Loto;
import com.dk_power.power_plant_java.entities.loto.LotoBox;
import com.dk_power.power_plant_java.entities.loto.LotoBypassAudit;
import com.dk_power.power_plant_java.entities.users.LotoRole;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.loto.LotoBypassAuditRepo;
import com.dk_power.power_plant_java.repository.loto.LotoRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.NgValueService;
import com.dk_power.power_plant_java.sevice.angular.loto.NgLotoBoxService;
import com.dk_power.power_plant_java.sevice.loto.LotoBypassService.BypassRequest;
import com.dk_power.power_plant_java.sevice.loto.loto_box.LotoAssignmentService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.same;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class LotoBypassServiceTest {

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void combinedStatusAndBoxBypassMovesRelationshipBeforeFinalPaint() {
        LotoRepo lotoRepo = mock(LotoRepo.class);
        LotoBypassAuditRepo auditRepo = mock(LotoBypassAuditRepo.class);
        NgValueService valueService = mock(NgValueService.class);
        UserRepo userRepo = mock(UserRepo.class);
        NgLotoBoxService boxService = mock(NgLotoBoxService.class);
        LotoAssignmentService assignmentService = mock(LotoAssignmentService.class);
        LotoBypassService service = new LotoBypassService(
                lotoRepo, auditRepo, valueService, userRepo, boxService, assignmentService);

        User ca = new User();
        ca.setRole(LotoRole.CONTROL_AUTHORITY.roleName());
        when(userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc("ca")).thenReturn(ca);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("ca", "n/a", List.of()));

        Value active = new Value();
        active.setName("Active");
        Value closed = new Value();
        closed.setName("Closed");
        LotoBox oldBox = new LotoBox();
        oldBox.setNumber(1);
        LotoBox newBox = new LotoBox();
        newBox.setNumber(2);
        Loto loto = new Loto();
        loto.setId(41L);
        loto.setPermitNumber("LOTO-41");
        loto.setPermitStatus(active);
        loto.setBoxNumber(1);
        loto.setLotoBox(oldBox);

        when(lotoRepo.findById(41L)).thenReturn(Optional.of(loto));
        when(valueService.createValue("Permit Status", "Closed")).thenReturn(closed);
        when(lotoRepo.save(loto)).thenReturn(loto);
        doAnswer(invocation -> {
            // The scalar must not be patched ahead of the physical move, and
            // changeBox must see the target status so it paints the new box.
            assertThat(loto.getBoxNumber()).isEqualTo(1);
            assertThat(loto.getPermitStatus().getName()).isEqualTo("Closed");
            loto.setLotoBox(newBox);
            loto.setBoxNumber(2);
            return newBox;
        }).when(boxService).changeBox(same(assignmentService), same(loto), eq(2));

        service.bypass(new BypassRequest(
                41L, "Closed", null, null, 2, null, "Red Tag is authoritative", "MANUAL"));

        verify(boxService).changeBox(same(assignmentService), same(loto), eq(2));
        verify(boxService).updateBoxColorForStatus(same(newBox), eq("Closed"));
        verify(boxService, never()).updateBoxColorForStatus(same(oldBox), any());
        assertThat(loto.getLotoBox()).isSameAs(newBox);
        assertThat(loto.getBoxNumber()).isEqualTo(2);

        ArgumentCaptor<LotoBypassAudit> auditCaptor = ArgumentCaptor.forClass(LotoBypassAudit.class);
        verify(auditRepo).save(auditCaptor.capture());
        assertThat(auditCaptor.getValue().getChangedFields())
                .contains("permitStatus")
                .contains("boxNumber");
    }
}
