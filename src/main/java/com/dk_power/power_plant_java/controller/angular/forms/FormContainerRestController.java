package com.dk_power.power_plant_java.controller.angular.forms;

import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.repository.forms.FormContainerRepo;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ng/form-containers")
@RequiredArgsConstructor
public class FormContainerRestController {
    private final FormContainerRepo formContainerRepo;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<Iterable<FormContainer>>> getAllForms() {
        try {
            Iterable<FormContainer> formContainers = formContainerRepo.findAll();
            return ResponseEntity.ok(new NgApiResponse<>(formContainers, "Successfully retrieved all form containers."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error retrieving form containers: " + e.getMessage()));
        }
    }
    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<FormContainer>> getFormById(@PathVariable String id) {
        try {
            Long formContainerId = Long.parseLong(id);
            return formContainerRepo.findById(formContainerId)
                    .map(formContainer -> ResponseEntity.ok(new NgApiResponse<>(formContainer, "Form container found.")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new NgApiResponse<>(null, "Form container not found with id: " + id)));
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new NgApiResponse<>(null, "Invalid ID format: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error retrieving form container: " + e.getMessage()));
        }
    }
    @PostMapping("/save")
    public ResponseEntity<NgApiResponse<FormContainer>> saveForm(@RequestBody FormContainer formContainer) {
        try {
            FormContainer savedFormContainer = formContainerRepo.save(formContainer);
            return ResponseEntity.ok(new NgApiResponse<>(savedFormContainer, "Form container saved successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error saving form container: " + e.getMessage()));
        }
    }



}