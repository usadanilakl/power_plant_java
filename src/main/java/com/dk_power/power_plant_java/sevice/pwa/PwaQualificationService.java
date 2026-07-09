package com.dk_power.power_plant_java.sevice.pwa;

import com.dk_power.power_plant_java.dto.pwa.PwaQualificationDefinitionDto;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationDto;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationPersonDto;
import com.dk_power.power_plant_java.dto.pwa.PwaQualificationSeedResult;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.sharepoint.SharePointListProvisioner;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.QualificationDefinitionSharePointAdapter;
import com.dk_power.power_plant_java.sevice.sharepoint.adapters.UserQualificationSharePointAdapter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PwaQualificationService {

    private static final String PLANT_ROLE_DEFINITION_ID = "qualification-plant-role";
    private static final String PLANT_ROLE_CODE = "PLANT-ROLE";

    private final UserQualificationSharePointAdapter assignmentAdapter;
    private final QualificationDefinitionSharePointAdapter definitionAdapter;
    private final UserRepo userRepo;
    private final SharePointListProvisioner provisioner;

    public List<PwaQualificationDto> getAllQualifications() {
        return assignmentAdapter.getAll().stream()
                .sorted(qualificationComparator())
                .toList();
    }

    public List<PwaQualificationDefinitionDto> getQualificationDefinitions() {
        return definitionAdapter.getAll().stream()
                .sorted(definitionComparator())
                .toList();
    }

    public List<PwaQualificationPersonDto> getPlantQualificationPeople() {
        List<PwaQualificationDto> allQualifications = getAllQualifications();
        Map<String, List<PwaQualificationDto>> byUserId = allQualifications.stream()
                .filter(q -> hasText(q.getUserId()))
                .collect(Collectors.groupingBy(
                        PwaQualificationDto::getUserId,
                        LinkedHashMap::new,
                        Collectors.toList()));

        Map<String, PwaQualificationPersonDto> people = new LinkedHashMap<>();
        for (User user : plantUsers()) {
            String userId = String.valueOf(user.getId());
            people.put(userId, buildPerson(user, byUserId.getOrDefault(userId, List.of())));
        }

        for (Map.Entry<String, List<PwaQualificationDto>> entry : byUserId.entrySet()) {
            people.computeIfAbsent(entry.getKey(), userId -> buildPerson(entry.getValue()));
        }

        return people.values().stream()
                .sorted(Comparator.comparing(PwaQualificationPersonDto::getUserName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    public PwaQualificationPersonDto getPersonQualifications(String userId) {
        List<PwaQualificationDto> qualifications = assignmentAdapter.getByUserId(userId).stream()
                .sorted(qualificationComparator())
                .toList();
        User user = findUser(userId);
        if (user == null && qualifications.isEmpty()) {
            return null;
        }
        if (user != null) {
            return buildPerson(user, qualifications);
        }
        return buildPerson(qualifications);
    }

    public PwaQualificationDto create(PwaQualificationDto dto) {
        normalizeForSave(dto);
        String sharepointId = assignmentAdapter.create(dto);
        dto.setSharepointId(sharepointId);
        return dto;
    }

    public PwaQualificationDto update(String sharepointId, PwaQualificationDto dto) {
        normalizeForSave(dto);
        dto.setSharepointId(sharepointId);
        assignmentAdapter.update(sharepointId, dto);
        return dto;
    }

    public void delete(String sharepointId) {
        assignmentAdapter.delete(sharepointId);
    }

    public PwaQualificationDefinitionDto createDefinition(PwaQualificationDefinitionDto dto) {
        normalizeDefinition(dto);
        String sharepointId = definitionAdapter.create(dto);
        dto.setSharepointId(sharepointId);
        return dto;
    }

    public PwaQualificationDefinitionDto updateDefinition(String sharepointId, PwaQualificationDefinitionDto dto) {
        normalizeDefinition(dto);
        dto.setSharepointId(sharepointId);
        definitionAdapter.update(sharepointId, dto);
        syncAssignmentsForDefinition(dto);
        return dto;
    }

    public void deleteDefinition(String sharepointId) {
        PwaQualificationDefinitionDto definition = getDefinitionBySharepointId(sharepointId);
        if (definition != null && hasText(definition.getLocalUuid())) {
            List<PwaQualificationDto> assignments = assignmentAdapter.getByQualificationId(definition.getLocalUuid());
            if (!assignments.isEmpty()) {
                throw new IllegalStateException("Qualification is assigned to " + assignments.size()
                        + " user row(s). Mark it inactive or remove those assignments first.");
            }
        }
        definitionAdapter.delete(sharepointId);
    }

    public Map<String, Object> provisionQualificationLists() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put(QualificationDefinitionSharePointAdapter.LIST_TITLE,
                provisioner.provisionSingle(QualificationDefinitionSharePointAdapter.LIST_TITLE));
        result.put(UserQualificationSharePointAdapter.LIST_TITLE,
                provisioner.provisionSingle(UserQualificationSharePointAdapter.LIST_TITLE));
        return result;
    }

    public PwaQualificationSeedResult seedPlantUsers() {
        provisionQualificationLists();
        PwaQualificationDefinitionDto plantRoleDefinition = ensurePlantRoleDefinition();

        int created = 0;
        int skipped = 0;
        int failed = 0;
        List<User> users = plantUsers();

        for (User user : users) {
            String pwaId = seedPwaId(user);
            try {
                if (assignmentAdapter.getByPwaId(pwaId) != null) {
                    skipped++;
                    continue;
                }
                PwaQualificationDto dto = baselineQualification(user, pwaId, plantRoleDefinition);
                String sharepointId = assignmentAdapter.create(dto);
                dto.setSharepointId(sharepointId);
                created++;
            } catch (Exception e) {
                failed++;
                log.warn("[PWA Qualifications] Failed to seed user id={} email={}: {}",
                        user.getId(), user.getEmail(), e.getMessage());
            }
        }

        return new PwaQualificationSeedResult(users.size(), created, skipped, failed);
    }

    private PwaQualificationDefinitionDto ensurePlantRoleDefinition() {
        PwaQualificationDefinitionDto existing = definitionAdapter.getByPwaId(PLANT_ROLE_DEFINITION_ID);
        if (existing != null) {
            return existing;
        }

        PwaQualificationDefinitionDto dto = new PwaQualificationDefinitionDto();
        dto.setLocalUuid(PLANT_ROLE_DEFINITION_ID);
        dto.setQualificationCode(PLANT_ROLE_CODE);
        dto.setQualificationName("Plant Role");
        dto.setQualificationType("Role");
        dto.setDescription("Baseline qualification assigned to active local users with a Plant role.");
        dto.setRequiresExpiration(false);
        dto.setActive(true);
        dto.setSortOrder("0");
        String sharepointId = definitionAdapter.create(dto);
        dto.setSharepointId(sharepointId);
        return dto;
    }

    private List<User> plantUsers() {
        return userRepo.findByIsActiveTrue().stream()
                .filter(PwaQualificationService::hasPlantRole)
                .sorted(Comparator.comparing(PwaQualificationService::displayName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
    }

    private PwaQualificationPersonDto buildPerson(User user, List<PwaQualificationDto> qualifications) {
        PwaQualificationPersonDto dto = new PwaQualificationPersonDto();
        dto.setUserId(String.valueOf(user.getId()));
        dto.setUserName(displayName(user));
        dto.setUserEmail(user.getEmail());
        dto.setWindowsUsername(user.getWindowsUsername());
        dto.setRole(user.getRole());
        dto.setQualifications(qualifications);
        dto.setQualificationCount(qualifications.size());
        return dto;
    }

    private PwaQualificationPersonDto buildPerson(List<PwaQualificationDto> qualifications) {
        PwaQualificationDto first = qualifications.getFirst();
        PwaQualificationPersonDto dto = new PwaQualificationPersonDto();
        dto.setUserId(first.getUserId());
        dto.setUserName(first.getUserName());
        dto.setUserEmail(first.getUserEmail());
        dto.setWindowsUsername(first.getWindowsUsername());
        dto.setRole(first.getRole());
        dto.setQualifications(qualifications);
        dto.setQualificationCount(qualifications.size());
        return dto;
    }

    private PwaQualificationDto baselineQualification(
            User user,
            String pwaId,
            PwaQualificationDefinitionDto plantRoleDefinition) {
        PwaQualificationDto dto = new PwaQualificationDto();
        dto.setLocalUuid(pwaId);
        dto.setUserId(String.valueOf(user.getId()));
        dto.setUserName(displayName(user));
        dto.setUserEmail(user.getEmail());
        dto.setWindowsUsername(user.getWindowsUsername());
        dto.setRole(user.getRole());
        applyDefinition(dto, plantRoleDefinition);
        dto.setStatus("Active");
        dto.setIssuedDate(LocalDate.now().toString());
        dto.setNotes("Seeded from active local users with a Plant role.");
        return dto;
    }

    private void normalizeForSave(PwaQualificationDto dto) {
        if (!hasText(dto.getLocalUuid())) {
            dto.setLocalUuid(UUID.randomUUID().toString());
        }
        User user = findUser(dto.getUserId());
        if (user != null) {
            if (!hasText(dto.getUserName())) dto.setUserName(displayName(user));
            if (!hasText(dto.getUserEmail())) dto.setUserEmail(user.getEmail());
            if (!hasText(dto.getWindowsUsername())) dto.setWindowsUsername(user.getWindowsUsername());
            if (!hasText(dto.getRole())) dto.setRole(user.getRole());
        }
        PwaQualificationDefinitionDto definition = findDefinitionForAssignment(dto);
        if (definition != null) {
            applyDefinition(dto, definition);
        }
        if (!hasText(dto.getStatus())) {
            dto.setStatus("Active");
        }
    }

    private void normalizeDefinition(PwaQualificationDefinitionDto dto) {
        if (!hasText(dto.getLocalUuid())) {
            dto.setLocalUuid(UUID.randomUUID().toString());
        }
        if (!hasText(dto.getQualificationCode())) {
            dto.setQualificationCode(codeFromName(dto.getQualificationName()));
        }
        if (dto.getRequiresExpiration() == null) {
            dto.setRequiresExpiration(false);
        }
        if (dto.getActive() == null) {
            dto.setActive(true);
        }
    }

    private PwaQualificationDefinitionDto findDefinitionForAssignment(PwaQualificationDto dto) {
        if (hasText(dto.getQualificationId())) {
            PwaQualificationDefinitionDto byId = definitionAdapter.getByPwaId(dto.getQualificationId());
            if (byId != null) return byId;
        }
        if (!hasText(dto.getQualificationName())) {
            return null;
        }
        return getQualificationDefinitions().stream()
                .filter(def -> dto.getQualificationName().equalsIgnoreCase(def.getQualificationName()))
                .findFirst()
                .orElse(null);
    }

    private PwaQualificationDefinitionDto getDefinitionBySharepointId(String sharepointId) {
        if (!hasText(sharepointId)) return null;
        return getQualificationDefinitions().stream()
                .filter(def -> sharepointId.equals(def.getSharepointId()))
                .findFirst()
                .orElse(null);
    }

    private void applyDefinition(PwaQualificationDto dto, PwaQualificationDefinitionDto definition) {
        dto.setQualificationId(definition.getLocalUuid());
        dto.setQualificationCode(definition.getQualificationCode());
        dto.setQualificationName(definition.getQualificationName());
        dto.setQualificationType(definition.getQualificationType());
    }

    private void syncAssignmentsForDefinition(PwaQualificationDefinitionDto definition) {
        if (!hasText(definition.getLocalUuid())) {
            return;
        }
        List<PwaQualificationDto> assignments = assignmentAdapter.getByQualificationId(definition.getLocalUuid());
        for (PwaQualificationDto assignment : assignments) {
            if (!hasText(assignment.getSharepointId())) {
                continue;
            }
            applyDefinition(assignment, definition);
            assignmentAdapter.update(assignment.getSharepointId(), assignment);
        }
    }

    private User findUser(String userId) {
        if (!hasText(userId)) return null;
        try {
            return userRepo.findById(Long.parseLong(userId.trim())).orElse(null);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private static Comparator<PwaQualificationDto> qualificationComparator() {
        return Comparator
                .comparing(PwaQualificationDto::getUserName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER))
                .thenComparing(PwaQualificationDto::getQualificationName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
    }

    private static Comparator<PwaQualificationDefinitionDto> definitionComparator() {
        return Comparator
                .comparingInt((PwaQualificationDefinitionDto dto) -> sortValue(dto.getSortOrder()))
                .thenComparing(PwaQualificationDefinitionDto::getQualificationName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER));
    }

    private static int sortValue(String sortOrder) {
        if (!hasText(sortOrder)) return Integer.MAX_VALUE;
        try {
            return Integer.parseInt(sortOrder.trim());
        } catch (NumberFormatException e) {
            return Integer.MAX_VALUE;
        }
    }

    private static boolean hasPlantRole(User user) {
        return user != null && user.getRoles().stream()
                .map(role -> role == null ? "" : role.toUpperCase(Locale.ROOT))
                .anyMatch(role -> role.contains("PLANT"));
    }

    private static String seedPwaId(User user) {
        return "plant-user-" + user.getId();
    }

    private static String displayName(User user) {
        if (hasText(user.getName())) return user.getName();
        String combined = ((user.getFirstName() != null ? user.getFirstName() : "") + " "
                + (user.getLastName() != null ? user.getLastName() : "")).trim();
        if (hasText(combined)) return combined;
        if (hasText(user.getUsername())) return user.getUsername();
        return user.getEmail();
    }

    private static String codeFromName(String name) {
        if (!hasText(name)) return "";
        String code = name.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
        return code.length() > 40 ? code.substring(0, 40) : code;
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
