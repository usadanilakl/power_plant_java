package com.dk_power.power_plant_java.sevice.users.impl;

import com.dk_power.power_plant_java.dto.users.UserDto;
import com.dk_power.power_plant_java.model.users.User;
import com.dk_power.power_plant_java.repository.users.UserDao;
import com.dk_power.power_plant_java.sevice.users.UserService;
import lombok.AllArgsConstructor;

@AllArgsConstructor
public class UserServiceImpl implements UserService {
    private final UserDao userDao;
    private final UserDto userDto;
    @Override
    public User login(String username, String password) {
        User user = userDao.findByEmail(username);
        if (user != null && user.getPassword().equals(password)) {
            return user;
        }

        return null;
    }

    @Override
    public User createNewUser(String name, String email, String role, String password) {
        User user = User.builder()
                .email(email)
                .password(password)
                .name(name)
                .build();
        return user;
    }
}
