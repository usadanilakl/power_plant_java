package com.dk_power.power_plant_java.mappers;

import com.dk_power.power_plant_java.dto.users.UserDto;
import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.sevice.angular.NgUserService;
import com.dk_power.power_plant_java.sevice.categories.ValueService;
import com.dk_power.power_plant_java.sevice.users.UserService;
import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

@Component
public class UserMapper implements BaseMapper {
    private final ModelMapper modelMapper;
    private final ValueService valueService;
    private final NgUserService userService;

    public UserMapper(ModelMapper modelMapper, ValueService valueService, @Lazy NgUserService userService) {
        this.modelMapper = modelMapper;
        this.valueService = valueService;
        this.userService = userService;
    }

    public UserDto convertToDto(User entity) {
        if (entity == null) {
            return null;
        }
        UserDto dto = new UserDto();
        if (entity.getId() != null) dto.setId(entity.getId());
        if (entity.getUsername() != null) dto.setUsername(entity.getUsername());
        if (entity.getEmail() != null) dto.setEmail(entity.getEmail());
        if (entity.getFirstName() != null) dto.setFirstName(entity.getFirstName());
        if (entity.getLastName() != null) dto.setLastName(entity.getLastName());
        if (entity.getRole() != null) dto.setRole(entity.getRole());
        dto.setRoles(entity.getRoles());
        if (entity.getIsActive() != null) dto.setIsActive(entity.getIsActive());
        if (entity.getLastLoginDate() != null) dto.setLastLoginDate(entity.getLastLoginDate());
//        if (entity.getDateCreated() != null) dto.setCreatedAt(entity.getCreatedAt());
//        if (entity.getDateModified() != null) dto.setUpdatedAt(entity.getUpdatedAt());
        // Don't include password in DTO for security reasons
        return dto;
    }

    public User convertToEntity(UserDto dto) {
        if (dto == null) {
            return null;
        }
        User entity;
        if (dto.getId() == null) {
            entity = new User();
        } else {
            entity = userService.findById(dto.getId()).orElse(new User());
        }
        if (dto.getUsername() != null) entity.setUsername(dto.getUsername());
        if (dto.getEmail() != null) entity.setEmail(dto.getEmail());
        if (dto.getFirstName() != null) entity.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) entity.setLastName(dto.getLastName());
        if (dto.getRole() != null) entity.setRole(dto.getRole());
        if (dto.getIsActive() != null) entity.setIsActive(dto.getIsActive());
        if (dto.getLastLoginDate() != null) entity.setLastLoginDate(dto.getLastLoginDate());
        // Don't set password from DTO for security reasons
        return entity;
    }

    @Override
    public ModelMapper getMapper() {
        return modelMapper;
    }
}