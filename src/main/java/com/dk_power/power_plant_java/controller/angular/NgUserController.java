package com.dk_power.power_plant_java.controller.angular;

import com.dk_power.power_plant_java.dto.users.UserDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.UniversalMapper;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/paginated")
    public ResponseEntity<NgApiResponse<Page<UserDto>>> getPaginated(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "50") int pageSize) {
        try {
            Page<User> users = userRepo.findAll(
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.ASC, "name")));
            Page<UserDto> dtos = users.map(u -> mapper.convert(u, UserDto.class));
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

            User user = User.builder()
                .username(request.username())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .name(request.firstName() + " " + request.lastName())
                .email(request.email())
                .role(request.role())
                .password(passwordEncoder.encode(request.password()))
                .isActive(true)
                .windowsUsername(request.windowsUsername())
                .build();

            user = userRepo.save(user);
            UserDto dto = mapper.convert(user, UserDto.class);
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
                if (request.role() != null) user.setRole(request.role());
                if (request.isActive() != null) user.setIsActive(request.isActive());
                if (request.windowsUsername() != null) user.setWindowsUsername(request.windowsUsername());
                if (request.password() != null && !request.password().isBlank()) {
                    user.setPassword(passwordEncoder.encode(request.password()));
                }

                user = userRepo.save(user);
                UserDto dto = mapper.convert(user, UserDto.class);
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

    @GetMapping("/roles")
    public ResponseEntity<?> getAvailableRoles() {
        return ResponseEntity.ok(Map.of(
            "roles", new String[]{"ROLE_ADMIN", "ROLE_EMPLOYEE", "ROLE_CONTRACTOR"}
        ));
    }

    public record CreateUserRequest(
        String username, String firstName, String lastName,
        String email, String role, String password, String windowsUsername
    ) {}

    public record UpdateUserRequest(
        String username, String firstName, String lastName,
        String email, String role, String password, Boolean isActive, String windowsUsername
    ) {}
}
