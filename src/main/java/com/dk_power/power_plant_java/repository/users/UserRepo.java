package com.dk_power.power_plant_java.repository.users;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.transfer_to_data_service_project.DS_FileElementMapper;
import com.dk_power.power_plant_java.repository.base_repositories.BaseRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

public interface UserRepo extends BaseRepository<User> {

    @Modifying
    @Transactional
    @Query(value = "UPDATE users SET last_login_date = :date WHERE email = :email", nativeQuery = true)
    void updateLastLoginDate(@Param("date") LocalDateTime date, @Param("email") String email);

    @Modifying
    @Transactional
    @Query(value = "UPDATE users SET last_login_date = :date WHERE id = :id", nativeQuery = true)
    void updateLastLoginById(@Param("date") LocalDateTime date, @Param("id") Long id);

    User findFirstByEmailOrderByIdAsc(String email);

    User findFirstByEmailIgnoreCaseOrderByIdAsc(String email);

    User findFirstByUsernameOrderByIdAsc(String username);

    User findFirstByUsernameIgnoreCaseOrderByIdAsc(String username);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);

    User findFirstByWindowsUsernameOrderByIdAsc(String windowsUsername);

    User findFirstByRoleAndIsActiveTrue(String role);

    User findFirstByPwaUserUuidOrderByIdAsc(String pwaUserUuid);

    boolean existsByWindowsUsername(String windowsUsername);

    java.util.List<User> findByIsActiveTrue();
}
