package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.entities.permits.WorkRequest;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.permits.WorkRequestRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PwaPermitService {

    private final WorkRequestRepo workRequestRepo;

    public List<Map<String, Object>> getPermitsForUser(User user) {
        return workRequestRepo.findAll().stream()
                .filter(wr -> user.getEmail().equalsIgnoreCase(wr.getSubmitterEmail()))
                .map(this::toPermitSummary)
                .toList();
    }

    public Map<String, Object> getPermitDetail(Long id, User user) {
        WorkRequest wr = workRequestRepo.findById(id).orElse(null);
        if (wr == null) return null;
        if (!user.getEmail().equalsIgnoreCase(wr.getSubmitterEmail())) return null;
        return toPermitDetail(wr);
    }

    public Map<String, Object> signOn(Long permitId, User user) {
        WorkRequest wr = workRequestRepo.findById(permitId).orElse(null);
        if (wr == null) return Map.of("error", "NOT_FOUND", "message", "Permit not found");

        wr.setSignedOnBy(user);
        wr.setSignedOnAt(Instant.now());
        workRequestRepo.save(wr);

        log.info("[PWA Permit] Sign-on: permitId={}, user={}", permitId, user.getEmail());
        return Map.of("success", true, "message", "Signed on to permit");
    }

    public Map<String, Object> signOff(Long permitId, User user) {
        WorkRequest wr = workRequestRepo.findById(permitId).orElse(null);
        if (wr == null) return Map.of("error", "NOT_FOUND", "message", "Permit not found");

        wr.setSignedOffBy(user);
        wr.setSignedOffAt(Instant.now());
        workRequestRepo.save(wr);

        log.info("[PWA Permit] Sign-off: permitId={}, user={}", permitId, user.getEmail());
        return Map.of("success", true, "message", "Signed off permit");
    }

    private Map<String, Object> toPermitSummary(WorkRequest wr) {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("id", wr.getId());
        info.put("permitNumber", wr.getPermitNumber());
        info.put("dateOfWork", wr.getDateOfWorkToBePerformed());
        info.put("location", wr.getLocation());
        info.put("workScope", wr.getWorkScope());
        info.put("permitStatus", wr.getPermitStatus() != null ? wr.getPermitStatus().getName() : null);
        info.put("timeSubmitted", wr.getTimeSubmitted());
        info.put("signedOnBy", wr.getSignedOnBy() != null ? wr.getSignedOnBy().getName() : null);
        info.put("signedOffBy", wr.getSignedOffBy() != null ? wr.getSignedOffBy().getName() : null);
        return info;
    }

    private Map<String, Object> toPermitDetail(WorkRequest wr) {
        Map<String, Object> info = toPermitSummary(wr);
        info.put("company", wr.getCompany());
        info.put("requestedBy", wr.getRequestedBy());
        info.put("affectedEquipment", wr.getAffectedEquipment());
        info.put("isLotoRequired", wr.getIsLotoRequired());
        info.put("isHotWorkRequired", wr.getIsHotWorkRequired());
        info.put("isConfinedSpaceEntryRequired", wr.getIsConfinedSpaceEntryRequired());
        info.put("foreman", wr.getForeman());
        info.put("fireWatch", wr.getFireWatch());
        info.put("submitterName", wr.getSubmitterName());
        info.put("submitterEmail", wr.getSubmitterEmail());
        info.put("signedOnAt", wr.getSignedOnAt() != null ? wr.getSignedOnAt().toString() : null);
        info.put("signedOffAt", wr.getSignedOffAt() != null ? wr.getSignedOffAt().toString() : null);
        return info;
    }
}
