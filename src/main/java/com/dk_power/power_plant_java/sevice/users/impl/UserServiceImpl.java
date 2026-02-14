package com.dk_power.power_plant_java.sevice.users.impl;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.UserService;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@AllArgsConstructor
@Service
@Transactional
public class UserServiceImpl implements UserService {
    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    public User addNewUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        userRepo.save(user);
        return user;
    }

    @Override
    public List<User> showAllUsers() {
        return (List) userRepo.findAll();
    }

    @Override
    public User getUserById(Long id) {
        return userRepo.findById(id).get();
    }

    @Override
    public String getNameOfCurrentlyLoggedInUser() {
        return null;
    }
}
