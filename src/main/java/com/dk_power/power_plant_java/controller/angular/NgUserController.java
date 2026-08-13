package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.users.UserDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * User management controller for Angular frontend.
 * Admin-only (secured in SecurityFilterChain).
 */
@RestController
@RequestMapping("/ng/users")
@RequiredArgsConstructor
@Slf4j
public class NgUserController {

    private final UserRepo userRepo;
    private final UniversalMapper mapper;
    private final PasswordEncoder passwordEncoder;
    private final NgUserService ngUserService;
    private final EntityManager entityManager;
    private final com.dk_power.power_plant_java.sevice.auth.SyncAtLoginService syncAtLoginService;

    /**
     * Lightweight directory of active users with an email address — used by the SDS gap-report
     * email dialog (and any future "pick a recipient" UX) for a typeahead. Not admin-only since
     * it discloses nothing beyond what's already visible across the app (people's names + their
     * work emails); sensitive fields (password hash, PIN, roles, etc.) are deliberately omitted.
     */
    @GetMapping("/email-directory")
    public ResponseEntity<NgApiResponse<List<Map<String, String>>>> getEmailDirectory() {
        try {
            List<Map<String, String>> directory = new ArrayList<>();
            for (User u : userRepo.findByIsActiveTrue()) {
                String email = u.getEmail();
                if (email == null || email.isBlank()) continue;
                String name = u.getName();
                if (name == null || name.isBlank()) {
                    String first = u.getFirstName(); String last = u.getLastName();
                    name = ((first != null ? first : "") + " " + (last != null ? last : "")).trim();
                }
                if (name == null || name.isBlank()) name = u.getUsername();
                directory.add(Map.of("name", name != null ? name : email, "email", email));
            }
            directory.sort((a, b) -> a.get("name").compareToIgnoreCase(b.get("name")));
            return ResponseEntity.ok(new NgApiResponse<>(directory, directory.size() + " contact(s)"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<UserDto>>> getPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<User> users = userRepo.findAll(
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.ASC, "name")));
            Page<UserDto> dtos = users.map(u -> {
                UserDto dto = mapper.convert(u, UserDto.class);
                dto.setRoles(u.getRoles());
                return dto;
            });
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Users retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<NgApiResponse<UserDto>> getUser(@PathVariable Long id) {
        return userRepo.findById(id)
            .map(u -> {
                UserDto dto = mapper.convert(u, UserDto.class);
                dto.setRoles(u.getRoles());
                return ResponseEntity.ok(new NgApiResponse<>(dto, "User retrieved"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<NgApiResponse<UserDto>> createUser(@RequestBody CreateUserRequest request) {
        try {
            if (userRepo.existsByEmail(request.email())) {
                return ResponseEntity.badRequest().body(
                    new NgApiResponse<>(null, "Email already exists"));
            }

            String rolesStr = request.roles() != null ? String.join(",", request.roles()) : "";
            User user = User.builder()
                .username(request.username())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .name(request.firstName() + " " + request.lastName())
                .email(request.email())
                .role(rolesStr)
                .password(passwordEncoder.encode(request.password()))
                .passwordUpdatedAt(LocalDateTime.now(ZoneOffset.UTC))
                .isActive(true)
                .windowsUsername(request.windowsUsername())
                .maximoPersonidOverride(request.maximoPersonidOverride())
                .scheduleName(request.scheduleName())
                .phone(request.phone())
                .secondaryPhone(request.secondaryPhone())
                .title(request.title())
                .emergencyContactJson(request.emergencyContactJson())
                .company(request.company())
                .signaturePath(request.signaturePath())
                .build();

            user = userRepo.save(user);
            // Dual-authority: mirror the admin-set password to Supabase (creates the Supabase user if
            // absent; converges LWW since passwordUpdatedAt is set above).
            syncAtLoginService.mirrorPasswordChangeAsync(user.getId(), request.password());
            UserDto dto = mapper.convert(user, UserDto.class);
            dto.setRoles(user.getRoles());
            log.info("User created: {} ({})", user.getEmail(), user.getRole());
            return ResponseEntity.ok(new NgApiResponse<>(dto, "User created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<NgApiResponse<UserDto>> updateUser(@PathVariable Long id,
                                                              @RequestBody UpdateUserRequest request) {
        return userRepo.findById(id)
            .map(user -> {
                if (request.firstName() != null) user.setFirstName(request.firstName());
                if (request.lastName() != null) user.setLastName(request.lastName());
                if (request.firstName() != null || request.lastName() != null) {
                    user.setName((user.getFirstName() != null ? user.getFirstName() : "") + " " +
                                 (user.getLastName() != null ? user.getLastName() : ""));
                }
                if (request.username() != null) user.setUsername(request.username());
                if (request.email() != null) user.setEmail(request.email());
                if (request.roles() != null) user.setRoles(request.roles());
                if (request.isActive() != null) user.setIsActive(request.isActive());
                if (request.windowsUsername() != null) user.setWindowsUsername(request.windowsUsername());
                // Empty string is a valid value here: it clears the override so the personid
                // falls back to the derived windowsUsername (see User.getMaximoPersonid()).
                if (request.maximoPersonidOverride() != null) user.setMaximoPersonidOverride(request.maximoPersonidOverride());
                if (request.scheduleName() != null) user.setScheduleName(request.scheduleName());
                boolean passwordChanged = request.password() != null && !request.password().isBlank();
                if (passwordChanged) {
                    user.setPassword(passwordEncoder.encode(request.password()));
                    user.setPasswordUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
                }
                if (request.permissionLevel() != null) user.setPermissionLevel(request.permissionLevel());
                if (request.phone() != null) user.setPhone(request.phone());
                if (request.secondaryPhone() != null) user.setSecondaryPhone(request.secondaryPhone());
                if (request.title() != null) user.setTitle(request.title());
                if (request.emergencyContactJson() != null) user.setEmergencyContactJson(request.emergencyContactJson());
                if (request.company() != null) user.setCompany(request.company());
                if (request.signaturePath() != null) user.setSignaturePath(request.signaturePath());

                user = userRepo.save(user);
                if (passwordChanged) {
                    // Dual-authority: mirror the admin-changed password to Supabase (LWW converges).
                    syncAtLoginService.mirrorPasswordChangeAsync(user.getId(), request.password());
                }
                UserDto dto = mapper.convert(user, UserDto.class);
                dto.setRoles(user.getRoles());
                log.info("User updated: {}", user.getEmail());
                return ResponseEntity.ok(new NgApiResponse<>(dto, "User updated successfully"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteUser(@PathVariable Long id) {
        return userRepo.findById(id)
            .map(user -> {
                user.setIsActive(false);
                user.setDeleted(true);
                userRepo.save(user);
                log.info("User deactivated: {}", user.getEmail());
                return ResponseEntity.ok(new NgApiResponse<Void>(null, "User deactivated successfully"));
            })
            .orElse(ResponseEntity.notFound().build());
    }

    @com.dk_power.power_plant_java.config.security.RestrictedAllowed // LOTO off-LAN: user-picker options (read; SecurityConfig keeps rest of /ng/users ADMIN-only)
    @GetMapping("/all-options")
    public ResponseEntity<NgApiResponse<List<UserDto>>> getAllOptions() {
        try {
            List<User> activeUsers = userRepo.findByIsActiveTrue();
            List<UserDto> dtos = activeUsers.stream().map(u -> {
                UserDto dto = mapper.convert(u, UserDto.class);
                dto.setRoles(u.getRoles());
                return dto;
            }).toList();
            return ResponseEntity.ok(new NgApiResponse<>(dtos, "Active users retrieved"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @GetMapping("/roles")
    public ResponseEntity<?> getAvailableRoles() {
        // Two categories returned together (frontend groups them):
        //   - Spring access roles (ROLE_*) — gate web access and admin pages
        //   - LOTO roles (CONTROL_AUTHORITY / LOTO_QUALIFIED / REQUESTOR / MANAGER) —
        //     gate LOTO permit and standard operations. See LotoRole.java.
        return ResponseEntity.ok(Map.of(
            "accessRoles", new String[]{
                "ROLE_ADMIN", "ROLE_EMPLOYEE", "ROLE_CONTRACTOR", "ROLE_PLANT",
                "ROLE_NAES", "ROLE_JPOWER", "ROLE_KIOSK", "ROLE_LOG_DIAGNOSTICS",
                "ROLE_INSTRUMENTATION"
            },
            "lotoRoles", new String[]{
                "CONTROL_AUTHORITY", "LOTO_QUALIFIED", "REQUESTOR", "MANAGER"
            },
            // Combined list for back-compat with the existing /roles consumer.
            "roles", new String[]{
                "ROLE_ADMIN", "ROLE_EMPLOYEE", "ROLE_CONTRACTOR", "ROLE_PLANT", "ROLE_KIOSK",
                "ROLE_NAES", "ROLE_JPOWER", "ROLE_LOG_DIAGNOSTICS", "ROLE_INSTRUMENTATION",
                "CONTROL_AUTHORITY", "LOTO_QUALIFIED", "REQUESTOR", "MANAGER"
            }
        ));
    }

    /**
     * Shared-table-compatible search endpoint. Mirrors {@code NgLotoPointController.searchFiles}
     * — same {@link SearchCriteria} wire shape so the frontend can reuse {@code app-table}.
     */
    @PostMapping("/search")
    public ResponseEntity<NgApiResponse<Page<UserDto>>> search(
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            String sortColumn = criteria.getSortColumn() != null ? criteria.getSortColumn() : "name";
            String sortDirection = criteria.getSortDirection() != null
                    ? criteria.getSortDirection().toLowerCase()
                    : "asc";

            // Column-filter mode uses AND across columns; global mode uses OR-of-fields by default.
            boolean andLogic = criteria.getType() == SearchCriteria.SearchType.COLUMN;

            Page<UserDto> results = ngUserService.complexSearch(
                    criteria, page - 1, pageSize, sortColumn, sortDirection, andLogic);

            Page<UserDto> withRoles = results.map(this::injectRoles);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(withRoles, "Users search completed"));
        } catch (Exception e) {
            log.error("[Users] search failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    @PostMapping("/unique-values/{column}/filtered")
    public ResponseEntity<NgApiResponse<Page<String>>> getFilteredUniqueValuesOfColumn(
            @PathVariable String column,
            @RequestBody SearchCriteria criteria,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize,
            @RequestParam(defaultValue = "true") boolean andLogicEnabled) {
        try {
            Pageable pageable = PageRequest.of(page - 1, pageSize);
            Page<String> values = ngUserService.getFilteredUniqueValuesOfColumn(
                    entityManager, userRepo, User.class, column, criteria, pageable, andLogicEnabled);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new NgApiResponse<>(values, "Filtered unique values retrieved"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            log.error("[Users] unique values failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    /** Echo the parsed CSV {@code role} into the {@code roles} field so the wire shape stays consistent. */
    private UserDto injectRoles(UserDto dto) {
        if (dto != null && dto.getRole() != null && dto.getRoles() == null) {
            dto.setRoles(java.util.Arrays.stream(dto.getRole().split(","))
                    .map(String::trim).filter(s -> !s.isEmpty()).toList());
        }
        return dto;
    }

    @PostMapping("/seed-plant-users")
    public ResponseEntity<NgApiResponse<Map<String, Object>>> seedPlantUsers() {
        try {
            String[][] plantUsers = {
                {"Adam", "Bunker"}, {"Andrew", "Stroud"}, {"Andy", "Gorelik"},
                {"Anthony", "Stein-Rojas"}, {"Austin", "Ouellette"}, {"Brandon", "Barrow"},
                {"Cory", "Fuhrmann"}, {"Danil", "Klokov"}, {"Dustin", "Lelak"},
                {"Dustin", "Sero"}, {"Geovanny", "Martinez"}, {"Heather", "Sincak"},
                {"John", "Noble"}, {"Juan", "Silva"}, {"Justin", "Wandahovich"},
                {"Ken", "Bassett"}, {"Kody", "Ziegler"}, {"Matt", "Wrightsman"},
                {"Rigo", "Garcia"}, {"Ryan", "Sedler"}, {"Scott", "Freese"},
                {"Sherrie", "Geslak"}, {"Sidney", "Bazemore"}, {"Stuart", "Owens"},
                {"Tyler", "Johnson"}, {"William", "Genz"}, {"Yevhen", "Mykhailenko"}
            };

            List<String> created = new ArrayList<>();
            List<String> skipped = new ArrayList<>();

            for (String[] entry : plantUsers) {
                String firstName = entry[0];
                String lastName = entry[1];
                String windowsUsername = (firstName.substring(0, 1) + lastName).toLowerCase();
                String email = windowsUsername + "@jpowerusa.com";

                if (userRepo.existsByEmail(email) || userRepo.existsByWindowsUsername(windowsUsername)) {
                    skipped.add(firstName + " " + lastName);
                    continue;
                }

                User user = User.builder()
                    .username(windowsUsername)
                    .firstName(firstName)
                    .lastName(lastName)
                    .name(firstName + " " + lastName)
                    .email(email)
                    .role("ROLE_PLANT")
                    .password(passwordEncoder.encode("changeme"))
                    .isActive(true)
                    .windowsUsername(windowsUsername)
                    .build();

                userRepo.save(user);
                created.add(firstName + " " + lastName);
            }

            log.info("Plant user seed: created={}, skipped={}", created.size(), skipped.size());
            return ResponseEntity.ok(new NgApiResponse<>(
                Map.of("created", created, "skipped", skipped),
                "Seeded " + created.size() + " users, skipped " + skipped.size() + " existing"
            ));
        } catch (Exception e) {
            log.error("Plant user seed failed", e);
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        }
    }

    public record CreateUserRequest(
        String username, String firstName, String lastName,
        String email, List<String> roles, String password, String windowsUsername,
        String maximoPersonidOverride, String scheduleName, String phone, String secondaryPhone, String title,
        String emergencyContactJson, String company, String signaturePath
    ) {}

    public record UpdateUserRequest(
        String username, String firstName, String lastName,
        String email, List<String> roles, String password, Boolean isActive, String windowsUsername,
        String maximoPersonidOverride, String scheduleName, String permissionLevel, String phone, String secondaryPhone,
        String title, String emergencyContactJson, String company, String signaturePath
    ) {}
}
