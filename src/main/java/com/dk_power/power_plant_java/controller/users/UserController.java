package com.dk_power.power_plant_java.controller.users;

import com.dk_power.power_plant_java.entities2.users.User;
import com.dk_power.power_plant_java.sevice.users.UserService;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Controller
@RequestMapping("/users")
@AllArgsConstructor
public class UserController {
    private final UserService userService;
    @GetMapping("/")
    public String allUsers(Model model){
        List<User> allUsers= userService.showAllUsers();
        model.addAttribute("users",allUsers);
        return "users/show-all-users";
    }
    @GetMapping("/create")
    public String createUser(Model model){
        model.addAttribute("user", new User());
        return "users/new-user-form";
    }
    @PostMapping("/create")
    public String createUserPost(@ModelAttribute User user){
       userService.addNewUser(user);
       return "redirect:/users/";
    }

    @GetMapping("/edit/{id}")
    public String editUserGet(Model model, @PathVariable("id") String id){
        model.addAttribute("user",userService.getUserById(Long.parseLong(id)));
        return "users/new-user-form";
    }
}
