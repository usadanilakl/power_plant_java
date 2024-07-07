package com.dk_power.power_plant_java.sevice.users.impl;

import com.dk_power.power_plant_java.entities2.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.dk_power.power_plant_java.sevice.users.UserService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@AllArgsConstructor
@Service
public class UserServiceImpl implements UserService {
    private final UserRepo userRepo;

    @Override
    public User addNewUser(User user) {
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
