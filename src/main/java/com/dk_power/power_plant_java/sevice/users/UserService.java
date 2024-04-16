package com.dk_power.power_plant_java.sevice.users;

import com.dk_power.power_plant_java.model.users.User;

public interface UserService {
    User login(String username, String password);
    User createNewUser(String name, String email, String role,String password);
}
