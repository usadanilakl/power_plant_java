package com.dk_power.power_plant_java.controller.angular.forms;

import com.dk_power.power_plant_java.config.PermitFormSeeder;
import com.dk_power.power_plant_java.controller.angular.NgApiResponse;
import com.dk_power.power_plant_java.entities.forms.FormContainer;
import com.dk_power.power_plant_java.entities.forms.PrintableForm;
import com.dk_power.power_plant_java.repository.forms.FormContainerRepo;
import com.dk_power.power_plant_java.repository.forms.PrintableFormRepo;
import com.dk_power.power_plant_java.sevice.forms.FormContainerService;
import com.dk_power.power_plant_java.sevice.forms.PrintableFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/ng/forms")
@RequiredArgsConstructor
public class PrintableFormRestController {
    private final PrintableFormRepo printableFormRepo;
    private final FormContainerRepo formContainerRepo;
    private final FormContainerService formContainerService;
    private final PrintableFormService printableFormService;
    private final PermitFormSeeder permitFormSeeder;

    @GetMapping("/get-all")
    public ResponseEntity<NgApiResponse<Iterable<PrintableForm>>> getAllForms() {
        try {
            Iterable<PrintableForm> forms = printableFormRepo.findAll();
            return ResponseEntity.ok(new NgApiResponse<>(forms, "Successfully retrieved all forms."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error retrieving forms: " + e.getMessage()));
        }
    }
    @GetMapping("/get-by-id/{id}")
    public ResponseEntity<NgApiResponse<PrintableForm>> getFormById(@PathVariable String id) {
        try {
            Long formId = Long.parseLong(id);
            return printableFormRepo.findById(formId)
                    .map(form -> ResponseEntity.ok(new NgApiResponse<>(form, "Form found.")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(new NgApiResponse<>(null, "Form not found with id: " + id)));
        } catch (NumberFormatException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new NgApiResponse<>(null, "Invalid ID format: " + id));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error retrieving form: " + e.getMessage()));
        }
    }
    @PostMapping("/save")
    public ResponseEntity<NgApiResponse<PrintableForm>> saveForm(@RequestBody PrintableForm form) {
        try {
            PrintableForm savedForm = printableFormService.save(form);
            return ResponseEntity.ok(new NgApiResponse<>(savedForm, "Form saved successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error saving form: " + e.getMessage()));
        }
    }

    @PostMapping("/add/{containerId}/to/{formId}")
    public ResponseEntity<NgApiResponse<PrintableForm>> addContainerToForm(@PathVariable Long formId, @PathVariable Long containerId) {
        try {
            PrintableForm form = printableFormRepo.findById(formId)
                    .orElse(null);
            if (form == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new NgApiResponse<>(null, "PrintableForm not found with id: " + formId));
            }

            FormContainer container = formContainerRepo.findById(containerId)
                    .orElse(null);
            if (container == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new NgApiResponse<>(null, "FormContainer not found with id: " + containerId));
            }

            form.addFormContainer(container);
            PrintableForm updatedForm = printableFormRepo.save(form);

            return ResponseEntity.ok(new NgApiResponse<>(updatedForm, "Container added to form successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error adding container to form: " + e.getMessage()));
        }
    }

    @PostMapping("/add-all/{id}")
    public ResponseEntity<NgApiResponse<PrintableForm>> addAllContainersToForm(@PathVariable Long id, @RequestBody List<FormContainer> containers) {
        try {
            PrintableForm form = printableFormRepo.findById(id)
                    .orElse(null);
            if (form == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new NgApiResponse<>(null, "PrintableForm not found with id: " + id));
            }

            for (FormContainer container : containers) {
                form.addFormContainer(container);
            }
            PrintableForm updatedForm = printableFormRepo.save(form);

            return ResponseEntity.ok(new NgApiResponse<>(updatedForm, "Containers added to form successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error adding containers to form: " + e.getMessage()));
        }
    }

    @PostMapping("/copy/{formId}")
    public ResponseEntity<NgApiResponse<PrintableForm>> copyForm(@PathVariable Long formId) {
        try {
            PrintableForm originalForm = printableFormRepo.findById(formId)
                    .orElse(null);
            if (originalForm == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new NgApiResponse<>(null, "PrintableForm not found with id: " + formId));
            }

            PrintableForm newForm = new PrintableForm();
            newForm.setName(originalForm.getName() + " (Copy)");
            newForm.setFormContainers(originalForm.getFormContainers().stream().map(formContainerService::copy).collect(Collectors.toSet()));
            newForm.setSize(originalForm.getSize());
            newForm.setFormType(originalForm.getFormType());

            PrintableForm savedForm = printableFormRepo.save(newForm);
            return ResponseEntity.ok(new NgApiResponse<>(savedForm, "Form copied successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error copying form: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<NgApiResponse<Void>> deleteForm(@PathVariable Long id) {
        try {
            printableFormService.deleteById(id);
            return ResponseEntity.ok(new NgApiResponse<>(null, "Form deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new NgApiResponse<>(null, "Error deleting form: " + e.getMessage()));
        }
    }

    @GetMapping("/get-primary-form-by-type/{permitType}")
    public ResponseEntity<NgApiResponse<PrintableForm>> getPrimaryFormByType(@PathVariable String permitType) {
        try {
            Optional<PrintableForm> form = printableFormRepo.findByFormTypeAndIsPrimary(permitType, true);
            return form.map(printableForm -> ResponseEntity.ok(new NgApiResponse<>(printableForm, "Primary form found.")))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(new NgApiResponse<>(null, "Primary form not found for type: " + permitType)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(new NgApiResponse<>(null, "Invalid permit type: " + permitType));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Error retrieving primary form: " + e.getMessage()));
        }
    }

    @GetMapping("/seed-types")
    public ResponseEntity<NgApiResponse<Map<String, String>>> getAvailableSeedTypes() {
        return ResponseEntity.ok(new NgApiResponse<>(permitFormSeeder.getAvailableSeedTypes(), "Available seed types."));
    }

    @PostMapping("/seed")
    public ResponseEntity<NgApiResponse<PrintableForm>> seedForm(@RequestBody Map<String, String> request) {
        try {
            String formType = request.get("formType");
            String formName = request.get("formName");
            if (formType == null || formType.isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "formType is required"));
            }
            if (formName == null || formName.isBlank()) {
                return ResponseEntity.badRequest().body(new NgApiResponse<>(null, "formName is required"));
            }
            PrintableForm form = permitFormSeeder.seedForm(formType, formName);
            return ResponseEntity.ok(new NgApiResponse<>(form, "Form seeded successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new NgApiResponse<>(null, e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new NgApiResponse<>(null, "Error seeding form: " + e.getMessage()));
        }
    }

}
