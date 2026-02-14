package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.transfer_to_data_service_project.DS_FileElementMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepo extends BaseRepository<User> {
    User findByEmail(String email);

    User findByUsername(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    User findByWindowsUsername(String windowsUsername);

    User findFirstByRoleAndIsActiveTrue(String role);
}
