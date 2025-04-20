package com.dk_power.power_plant_java.sevice.angular;

import com.dk_power.power_plant_java.dto.SearchCriteria;
import com.dk_power.power_plant_java.dto.users.UserDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.mappers.UserMapper;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.angular.base.NgCrudService;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.hibernate.SessionFactory;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
@RequiredArgsConstructor
public class NgUserService implements NgCrudService<User, UserDto, UserRepo, UserMapper> {
    private final UserMapper mapper;
    private final UserRepo repo;
    private final EntityManager entityManager;
    private final SessionFactory sessionFactory;
    private final NgValueService ngValueService;

    @Override
    public UserRepo getRepo() {
        return this.repo;
    }

    @Override
    public UserMapper getMapper() {
        return this.mapper;
    }

    @Override
    public SessionFactory getSessionFactory() {
        return this.sessionFactory;
    }

    @Override
    public UserDto getDto() {
        return new UserDto();
    }

    @Override
    public User getEntity() {
        return new User();
    }

    @Override
    public EntityManager getEntityManager() {
        return this.entityManager;
    }

    @Override
    public Class<User> getEntityClass() {
        return User.class;
    }

    public Optional<User> findById(Long id) {
        return this.repo.findById(id);
    }

    public Optional<UserDto> findDtoById(Long id) {
        return this.findById(id).map(this::toDto);
    }

    public Page<UserDto> complexSearch(String searchString, int page, int size) {
        Map<String, String> searchCriteria = new HashMap<>();
        searchCriteria.put("username", searchString);
        searchCriteria.put("email", searchString);
        searchCriteria.put("firstName", searchString);
        searchCriteria.put("lastName", searchString);
        SearchCriteria sc = new SearchCriteria();
        sc.setFilters(searchCriteria);
        return complexSearch(sc, page, size, "username", "asc", false);
    }

    @Override
    public User toEntity(UserDto dto) {
        return mapper.convertToEntity(dto);
    }

    @Override
    public UserDto toDto(User entity) {
        return mapper.convertToDto(entity);
    }

    // Add any additional methods specific to User here
    public UserDto findByUsername(String username) {
        User user = repo.findByUsername(username);
        return user != null ? toDto(user) : null;
    }

    public UserDto findByEmail(String email) {
        User user = repo.findByEmail(email);
        return user != null ? toDto(user) : null;
    }

    public boolean existsByUsername(String username) {
        return repo.existsByUsername(username);
    }

    public boolean existsByEmail(String email) {
        return repo.existsByEmail(email);
    }
}