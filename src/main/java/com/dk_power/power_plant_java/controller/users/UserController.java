package com.dk_power.power_plant_java.controller.users;

import com.dk_power.power_plant_java.model.users.User;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/users")
public class UserController {
    @GetMapping("/create")
    public String createUser(Model model){
        model.addAttribute("user", new User());
        return "users/new-user-form";
    }
}
