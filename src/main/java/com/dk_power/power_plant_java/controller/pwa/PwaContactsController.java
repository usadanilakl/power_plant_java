package com.dk_power.power_plant_java.controller.pwa;

import com.dk_power.power_plant_java.entities.users.User;
import com.dk_power.power_plant_java.repository.users.UserRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * PWA-facing read-only contact directory. Returns plant personnel with their contact fields —
 * used by the PWA "Contacts" screen. Emergency contact info is parsed from the JSON blob on
 * {@code User.emergencyContactJson} so PWA doesn't have to know the shape.
 *
 * See {@code project/features/users/communication/pwa-step-5-wiring.md}.
 */
@RestController
@RequestMapping("/api/pwa/secured/contacts")
@RequiredArgsConstructor
@Slf4j
public class PwaContactsController {

    private final UserRepo userRepo;
    private final ObjectMapper objectMapper;

    @GetMapping
public ResponseEntity<List<ContactDto>> all() {
        List<ContactDto> contacts = userRepo.findByIsActiveTrue().stream()
                .map(this::toContactDto)
                .sorted(Comparator.comparing(c -> c.name == null ? "" : c.name.toLowerCase()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(contacts);
    }

    /** Filtered to users who have an emergency contact configured. */
    @GetMapping("/emergency")
public ResponseEntity<List<ContactDto>> emergency() {
        List<ContactDto> contacts = userRepo.findByIsActiveTrue().stream()
                .map(this::toContactDto)
                .filter(c -> c.emergencyContact != null && !c.emergencyContact.isBlank())
                .sorted(Comparator.comparing(c -> c.name == null ? "" : c.name.toLowerCase()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(contacts);
    }

    private ContactDto toContactDto(User u) {
        ContactDto c = new ContactDto();
        c.id = u.getId();
        c.name = u.getName() != null ? u.getName()
                : ((u.getFirstName() != null ? u.getFirstName() : "") + " "
                    + (u.getLastName() != null ? u.getLastName() : "")).trim();
        c.title = u.getTitle();
        c.phone = u.getPhone();
        c.secondaryPhone = u.getSecondaryPhone();
        c.company = u.getCompany();
        c.email = u.getEmail();
        parseEmergencyContact(u.getEmergencyContactJson(), c);
        return c;
    }

    private void parseEmergencyContact(String json, ContactDto c) {
        if (json == null || json.isBlank()) return;
        try {
            JsonNode node = objectMapper.readTree(json);
            c.emergencyContact = optText(node, "name");
            c.emergencyPhone = optText(node, "phone");
            c.emergencyRelation = optText(node, "relationship");
        } catch (Exception e) {
            log.debug("[PwaContacts] Failed to parse emergency contact JSON for user id={}: {}",
                    c.id, e.getMessage());
        }
    }

    private String optText(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return (v == null || v.isNull()) ? null : v.asText(null);
    }

    /** Public wire shape — deliberately flat + PWA-friendly (no nested emergency contact object). */
    public static class ContactDto {
        public Long id;
        public String name;
        public String title;
        public String phone;
        public String secondaryPhone;
        public String company;
        public String email;
        public String emergencyContact;
        public String emergencyPhone;
        public String emergencyRelation;
    }
}
