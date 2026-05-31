package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.dto.users.ContractorChangeReportDto;
import com.dk_power.power_plant_java.dto.users.ContractorDto;
import com.dk_power.power_plant_java.dto.users.ContractorsImportRequest;
import com.dk_power.power_plant_java.entities.users.ContractorChangeReport;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.ContractorChangeReportRepo;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Contractor data plane. Two entry points:
 *
 * <ul>
 *   <li>{@link #importFromElectron(ContractorsImportRequest)} — silent upsert
 *       of User rows from a live Electron push. Matches the "non-invasive
 *       persistence" pattern used for schedule/contacts.</li>
 *   <li>{@link #buildReport(List, String)} — diff a freshly pulled OnLocation
 *       roster against the local Contractor User rows and persist a
 *       {@link ContractorChangeReport} in PENDING for admin review.</li>
 * </ul>
 *
 * Why both: the live push keeps every desktop's local DB current with no
 * admin friction. The report flow surfaces drift (new hires, departures,
 * company changes) so the admin can decide whether to accept them as
 * authoritative changes to the User table.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ContractorSyncService {

    private static final String CONTRACTOR_ROLE = "ROLE_CONTRACTOR";
    private static final TypeReference<List<ContractorDto>> CONTRACTOR_LIST = new TypeReference<>() {};
    private static final TypeReference<List<ContractorChangeReportDto.ContractorChange>> CHANGE_LIST = new TypeReference<>() {};

    private final UserRepo userRepo;
    private final ContractorChangeReportRepo reportRepo;
    private final ObjectMapper objectMapper;

    @Data
    public static class ImportSummary {
        private int created;
        private int linked;
        private int updated;
        private int unchanged;
    }

    public ImportSummary importFromElectron(ContractorsImportRequest request) {
        ImportSummary summary = new ImportSummary();
        if (request == null || request.getContractors() == null) return summary;

        for (ContractorDto incoming : request.getContractors()) {
            if (incoming == null || incoming.getOnLocationMemberId() == null) continue;
            switch (upsertContractor(incoming)) {
                case CREATED -> summary.created++;
                case LINKED -> summary.linked++;
                case UPDATED -> summary.updated++;
                case UNCHANGED -> summary.unchanged++;
            }
        }
        log.info("[Contractors] Imported from Electron: created={}, linked={}, updated={}, unchanged={}, source={}",
                summary.created, summary.linked, summary.updated, summary.unchanged, request.getSource());
        return summary;
    }

    private enum UpsertResult { CREATED, LINKED, UPDATED, UNCHANGED }

    /**
     * Upsert one contractor with email-fallback linking. Order of precedence:
     * <ol>
     *   <li>Match by {@code onLocationMemberId} — existing contractor row, full overwrite.</li>
     *   <li>Match by email — likely a plant user already in the system. Link the OnLocation
     *       id, apply OnLocation-canonical fields (training dates, status, role) but leave
     *       plant-owned fields (name, phone, company, title) untouched.</li>
     *   <li>No match — create a new contractor row.</li>
     * </ol>
     * Without the email fallback the unique constraint on {@code users.email} causes 4xx
     * the moment a plant employee also exists in OnLocation.
     */
    private UpsertResult upsertContractor(ContractorDto incoming) {
        User existing = userRepo.findFirstByOnLocationMemberIdOrderByIdAsc(incoming.getOnLocationMemberId());
        boolean isLink = false;

        if (existing == null && incoming.getEmail() != null && !incoming.getEmail().isBlank()) {
            User byEmail = userRepo.findFirstByEmailIgnoreCaseOrderByIdAsc(incoming.getEmail());
            if (byEmail != null) {
                existing = byEmail;
                existing.setOnLocationMemberId(incoming.getOnLocationMemberId());
                isLink = true;
            }
        }

        if (existing == null) {
            userRepo.save(createContractorUser(incoming));
            return UpsertResult.CREATED;
        }

        boolean changed = applyChanges(existing, incoming, isLink);
        if (isLink || changed) {
            userRepo.save(existing);
            return isLink ? UpsertResult.LINKED : UpsertResult.UPDATED;
        }
        return UpsertResult.UNCHANGED;
    }

    /**
     * Diff the OnLocation snapshot against locally-tagged contractor User rows
     * and persist a PENDING report. Does NOT mutate User rows — that happens
     * only on accept.
     */
    public ContractorChangeReport buildReport(List<ContractorDto> liveRoster, String source) {
        Map<String, ContractorDto> liveById = new LinkedHashMap<>();
        for (ContractorDto c : liveRoster) {
            if (c.getOnLocationMemberId() != null) liveById.put(c.getOnLocationMemberId(), c);
        }

        Map<String, User> localById = new LinkedHashMap<>();
        for (User u : userRepo.findByOnLocationMemberIdIsNotNull()) {
            if (Boolean.FALSE.equals(u.getIsActive())) continue;
            localById.put(u.getOnLocationMemberId(), u);
        }

        List<ContractorDto> added = new ArrayList<>();
        List<ContractorDto> removed = new ArrayList<>();
        List<ContractorChangeReportDto.ContractorChange> changed = new ArrayList<>();

        for (Map.Entry<String, ContractorDto> e : liveById.entrySet()) {
            User local = localById.get(e.getKey());
            if (local == null) {
                added.add(e.getValue());
                continue;
            }
            ContractorDto before = toDto(local);
            ContractorDto after = e.getValue();
            if (differs(before, after)) {
                changed.add(ContractorChangeReportDto.ContractorChange.builder()
                        .onLocationMemberId(e.getKey())
                        .before(before)
                        .after(after)
                        .build());
            }
        }
        for (Map.Entry<String, User> e : localById.entrySet()) {
            if (!liveById.containsKey(e.getKey())) removed.add(toDto(e.getValue()));
        }

        ContractorChangeReport report = ContractorChangeReport.builder()
                .runAt(LocalDateTime.now())
                .status(ContractorChangeReport.Status.PENDING)
                .source(source)
                .addedJson(writeJson(added))
                .removedJson(writeJson(removed))
                .changedJson(writeJson(changed))
                .summary(String.format("added=%d removed=%d changed=%d",
                        added.size(), removed.size(), changed.size()))
                .build();
        return reportRepo.save(report);
    }

    public ContractorChangeReport accept(Long reportId, String acceptedBy) {
        ContractorChangeReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
        if (report.getStatus() != ContractorChangeReport.Status.PENDING) {
            throw new IllegalStateException("Report is not pending: " + reportId);
        }

        List<ContractorDto> added = readContractorList(report.getAddedJson());
        List<ContractorDto> removed = readContractorList(report.getRemovedJson());
        List<ContractorChangeReportDto.ContractorChange> changed = readChangeList(report.getChangedJson());

        for (ContractorDto c : added) {
            upsertContractor(c);
        }
        for (ContractorChangeReportDto.ContractorChange ch : changed) {
            User local = userRepo.findFirstByOnLocationMemberIdOrderByIdAsc(ch.getOnLocationMemberId());
            if (local != null && applyChanges(local, ch.getAfter(), false)) userRepo.save(local);
        }
        for (ContractorDto c : removed) {
            User local = userRepo.findFirstByOnLocationMemberIdOrderByIdAsc(c.getOnLocationMemberId());
            // Deactivate, don't hard-delete — leaves audit trail and lets sync propagate.
            if (local != null) {
                local.setIsActive(false);
                userRepo.save(local);
            }
        }

        report.setStatus(ContractorChangeReport.Status.ACCEPTED);
        report.setAcceptedAt(LocalDateTime.now());
        report.setAcceptedBy(acceptedBy);
        return reportRepo.save(report);
    }

    public ContractorChangeReport reject(Long reportId, String rejectedBy) {
        ContractorChangeReport report = reportRepo.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + reportId));
        if (report.getStatus() != ContractorChangeReport.Status.PENDING) {
            throw new IllegalStateException("Report is not pending: " + reportId);
        }
        report.setStatus(ContractorChangeReport.Status.REJECTED);
        report.setAcceptedAt(LocalDateTime.now());
        report.setAcceptedBy(rejectedBy);
        return reportRepo.save(report);
    }

    @Transactional(readOnly = true)
    public List<ContractorDto> listContractors() {
        List<ContractorDto> out = new ArrayList<>();
        for (User u : userRepo.findByOnLocationMemberIdIsNotNull()) {
            if (Boolean.FALSE.equals(u.getIsActive())) continue;
            out.add(toDto(u));
        }
        return out;
    }

    @Transactional(readOnly = true)
    public List<ContractorChangeReport> listReports(ContractorChangeReport.Status status) {
        return status == null
                ? reportRepo.findTop50ByOrderByRunAtDesc()
                : reportRepo.findByStatusOrderByRunAtDesc(status);
    }

    public ContractorChangeReportDto toDto(ContractorChangeReport entity) {
        return ContractorChangeReportDto.builder()
                .id(entity.getId())
                .runAt(entity.getRunAt())
                .status(entity.getStatus().name())
                .source(entity.getSource())
                .summary(entity.getSummary())
                .acceptedAt(entity.getAcceptedAt())
                .acceptedBy(entity.getAcceptedBy())
                .added(readContractorList(entity.getAddedJson()))
                .removed(readContractorList(entity.getRemovedJson()))
                .changed(readChangeList(entity.getChangedJson()))
                .build();
    }

    private User createContractorUser(ContractorDto dto) {
        User u = User.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .company(dto.getCompany())
                .title(dto.getTitle())
                .onLocationMemberId(dto.getOnLocationMemberId())
                .role(CONTRACTOR_ROLE)
                .isActive(!"inactive".equalsIgnoreCase(dto.getStatus()))
                .trainingCompletedAt(parseDateAtStart(dto.getValidFrom()))
                .trainingExpiresAt(parseDateAtStart(dto.getValidTo()))
                .build();
        // Split a "First Last" name into parts when possible — matching/auto-auth code expects them.
        if (dto.getName() != null) {
            String[] parts = dto.getName().trim().split("\\s+", 2);
            u.setFirstName(parts[0]);
            if (parts.length > 1) u.setLastName(parts[1]);
        }
        return u;
    }

    /**
     * @param isLink when true, this User existed already (likely a plant user matched by
     *               email). Plant-owned fields (name/email/phone/company/title) are left
     *               alone; only OnLocation-canonical state (training dates, contractor role,
     *               active flag) is applied.
     */
    private boolean applyChanges(User user, ContractorDto incoming, boolean isLink) {
        boolean changed = false;

        // Plant-owned fields — only overwrite when this row's source of truth is OnLocation.
        if (!isLink) {
            if (incoming.getName() != null && !Objects.equals(user.getName(), incoming.getName())) {
                user.setName(incoming.getName());
                String[] parts = incoming.getName().trim().split("\\s+", 2);
                user.setFirstName(parts[0]);
                user.setLastName(parts.length > 1 ? parts[1] : null);
                changed = true;
            }
            if (incoming.getEmail() != null && !Objects.equals(user.getEmail(), incoming.getEmail())) {
                user.setEmail(incoming.getEmail());
                changed = true;
            }
            if (incoming.getPhone() != null && !Objects.equals(user.getPhone(), incoming.getPhone())) {
                user.setPhone(incoming.getPhone());
                changed = true;
            }
            if (incoming.getCompany() != null && !Objects.equals(user.getCompany(), incoming.getCompany())) {
                user.setCompany(incoming.getCompany());
                changed = true;
            }
            if (incoming.getTitle() != null && !Objects.equals(user.getTitle(), incoming.getTitle())) {
                user.setTitle(incoming.getTitle());
                changed = true;
            }
        }

        // OnLocation-canonical fields — always apply.
        LocalDateTime newFrom = parseDateAtStart(incoming.getValidFrom());
        if (newFrom != null && !Objects.equals(user.getTrainingCompletedAt(), newFrom)) {
            user.setTrainingCompletedAt(newFrom);
            changed = true;
        }
        LocalDateTime newTo = parseDateAtStart(incoming.getValidTo());
        if (newTo != null && !Objects.equals(user.getTrainingExpiresAt(), newTo)) {
            user.setTrainingExpiresAt(newTo);
            changed = true;
        }
        boolean shouldBeActive = !"inactive".equalsIgnoreCase(incoming.getStatus());
        if (!Objects.equals(user.getIsActive(), shouldBeActive)) {
            user.setIsActive(shouldBeActive);
            changed = true;
        }
        if (!user.hasRole(CONTRACTOR_ROLE)) {
            user.addRole(CONTRACTOR_ROLE);
            changed = true;
        }
        return changed;
    }

    private boolean differs(ContractorDto a, ContractorDto b) {
        return !Objects.equals(a.getName(), b.getName())
                || !Objects.equals(a.getEmail(), b.getEmail())
                || !Objects.equals(a.getPhone(), b.getPhone())
                || !Objects.equals(a.getCompany(), b.getCompany())
                || !Objects.equals(a.getTitle(), b.getTitle())
                || !Objects.equals(a.getValidFrom(), b.getValidFrom())
                || !Objects.equals(a.getValidTo(), b.getValidTo())
                || !Objects.equals(a.getStatus(), b.getStatus());
    }

    private ContractorDto toDto(User u) {
        return ContractorDto.builder()
                .userId(u.getId())
                .onLocationMemberId(u.getOnLocationMemberId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .company(u.getCompany())
                .title(u.getTitle())
                .validFrom(u.getTrainingCompletedAt() != null ? u.getTrainingCompletedAt().toLocalDate().toString() : null)
                .validTo(u.getTrainingExpiresAt() != null ? u.getTrainingExpiresAt().toLocalDate().toString() : null)
                .status(Boolean.FALSE.equals(u.getIsActive()) ? "inactive" : "active")
                .build();
    }

    private LocalDateTime parseDateAtStart(String iso) {
        if (iso == null || iso.isBlank()) return null;
        try {
            return LocalDate.parse(iso).atStartOfDay();
        } catch (Exception e) {
            log.warn("[Contractors] Could not parse date '{}': {}", iso, e.getMessage());
            return null;
        }
    }

    private String writeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            log.error("[Contractors] JSON serialize failed: {}", e.getMessage());
            return null;
        }
    }

    private List<ContractorDto> readContractorList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, CONTRACTOR_LIST);
        } catch (Exception e) {
            log.warn("[Contractors] Failed to parse contractor list JSON: {}", e.getMessage());
            return List.of();
        }
    }

    private List<ContractorChangeReportDto.ContractorChange> readChangeList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, CHANGE_LIST);
        } catch (Exception e) {
            log.warn("[Contractors] Failed to parse contractor change list JSON: {}", e.getMessage());
            return List.of();
        }
    }
}
