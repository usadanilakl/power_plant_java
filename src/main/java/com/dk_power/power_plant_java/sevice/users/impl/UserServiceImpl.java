package com.dk_power.power_plant_java.sevice.users.impl;

import com.dk_power.power_plant_java.dto.users.UserDto;
import com.dk_power.power_plant_java.model.users.User;
import com.dk_power.power_plant_java.repository.users.UserDao;
import com.dk_power.power_plant_java.sevice.users.UserService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class UserServiceImpl implements UserService {
    private final UserDao userDao;
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

    @Override
    public User addNewUser(User user) {
        userDao.save(user);
        return user;
    }

    @Override
    public List<User> showAllUsers() {
        return (List)userDao.findAll();
    }

    @Override
    public User getUserById(Long id) {
        return userDao.findById(id).get();
    }
}
