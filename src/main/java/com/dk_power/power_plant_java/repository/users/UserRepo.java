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

    /** Case-insensitive email existence excluding a given user id — used by the reconciliation pull guard. */
    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    User findFirstByWindowsUsernameOrderByIdAsc(String windowsUsername);

    /**
     * Case-insensitive windowsUsername lookup — used by desktop auto-auth. Windows has been observed
     * reporting the same account with different casing between logons, and the rest of the stack already
     * treats this field case-insensitively (see {@code DedupKeyResolver} natural keys and
     * {@code UserMergeService}), so the OS-name match must not be case-sensitive either.
     */
    User findFirstByWindowsUsernameIgnoreCaseOrderByIdAsc(String windowsUsername);

    User findFirstByRoleAndIsActiveTrue(String role);

    User findFirstByPwaUserUuidOrderByIdAsc(String pwaUserUuid);

    // ── Dual-authority auth (Hub + Supabase) ──

    User findFirstBySupabaseUuidOrderByIdAsc(String supabaseUuid);

    /**
     * Active users not yet mirrored into Supabase, restricted to those with a REAL email (an '@' and a
     * dotted domain via {@code like '%@%.%'}) — this excludes internal desktop-SSO accounts such as
     * {@code name@localhost}, which authenticate via Windows and would only be junk in Supabase. This is
     * the provisioning work-list: pass a capped {@code PageRequest} for the 60s self-heal, or
     * {@code Pageable.unpaged()} for the one-shot bulk job.
     */
    @org.springframework.data.jpa.repository.Query(
            "select u from User u where u.isActive = true and u.supabaseUuid is null "
            + "and u.email like '%@%.%' order by u.id asc")
    java.util.List<User> findSupabaseMirrorCandidates(org.springframework.data.domain.Pageable pageable);

    /** Users touched since the last reconciliation checkpoint (metadata sync delta walk). */
    java.util.List<User> findByDateModifiedAfterOrderByDateModifiedAsc(LocalDateTime checkpoint);

    User findFirstByOnLocationMemberIdOrderByIdAsc(String onLocationMemberId);

    java.util.List<User> findByOnLocationMemberIdIsNotNull();

    boolean existsByWindowsUsername(String windowsUsername);

    java.util.List<User> findByIsActiveTrue();

    /** Find candidates for PIN step-up by signing initials prefix (case-insensitive). */
    java.util.List<User> findBySigningInitialsIgnoreCase(String signingInitials);

    boolean existsBySigningInitialsIgnoreCaseAndIdNot(String signingInitials, Long id);
}
