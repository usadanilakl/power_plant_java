package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.dto.users.ContactsImportRequest;
import com.dk_power.power_plant_java.dto.users.EmergencyContactInfo;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

/**
 * Applies the SharePoint Emergency Contact list onto local User rows. Matched
 * rows update {@code phone / secondaryPhone / title / emergencyContactJson};
 * unmatched rows return in the report for admin triage (no User row is created
 * — that decision belongs to the admin).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ContactSyncService {

    private final UserRepo userRepo;
    private final UserMatchService matchService;
    private final ObjectMapper objectMapper;

    @Data
    public static class ImportReport {
        private int matched;
        private int unmatched;
        private final List<UnmatchedContact> unresolved = new ArrayList<>();
    }

    @Data
    public static class UnmatchedContact {
        private final String name;
        private final String title;
        private final String phone;
        private final String secondaryPhone;
        private final String emergencyContact;
        private final String emergencyPhone;
        private final String emergencyRelation;
    }

    public ImportReport importContacts(ContactsImportRequest request) {
        ImportReport report = new ImportReport();
        if (request == null || request.getContacts() == null) return report;

        List<User> candidates = userRepo.findByIsActiveTrue();

        for (ContactsImportRequest.ContactRow row : request.getContacts()) {
            if (row == null || row.getName() == null || row.getName().isBlank()) continue;

            UserMatchService.Match m = matchService.match(row.getName(), candidates);
            if (m == null) {
                report.unmatched++;
                report.unresolved.add(new UnmatchedContact(
                        row.getName(), row.getTitle(), row.getPhone(), row.getSecondaryPhone(),
                        row.getEmergencyContact(), row.getEmergencyPhone(), row.getEmergencyRelation()));
                continue;
            }
            applyContact(m.user, row);
            report.matched++;
        }
        userRepo.flush();
        log.info("[Contacts] Imported {} matched, {} unmatched from source={}",
                report.matched, report.unmatched, request.getSource());
        return report;
    }

    private void applyContact(User user, ContactsImportRequest.ContactRow row) {
        if (row.getTitle() != null && !row.getTitle().isBlank()) user.setTitle(row.getTitle());
        if (row.getPhone() != null && !row.getPhone().isBlank()) user.setPhone(row.getPhone());
        if (row.getSecondaryPhone() != null && !row.getSecondaryPhone().isBlank()) {
            user.setSecondaryPhone(row.getSecondaryPhone());
        }
        if (row.getEmergencyContact() != null && !row.getEmergencyContact().isBlank()) {
            EmergencyContactInfo info = EmergencyContactInfo.builder()
                    .name(row.getEmergencyContact())
                    .relationship(row.getEmergencyRelation())
                    .phone(row.getEmergencyPhone())
                    .build();
            try {
                user.setEmergencyContactJson(objectMapper.writeValueAsString(info));
            } catch (Exception e) {
                log.warn("[Contacts] Failed to serialize emergency contact for user {}: {}",
                        user.getId(), e.getMessage());
            }
        }
    }
}
