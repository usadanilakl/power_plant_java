package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.entities.users.User;

import java.util.List;


public interface UserService {
    User addNewUser(User user);
    List<User> showAllUsers();
    User getUserById(Long id);
}
