package com.dk_power.power_plant_java.dto.users;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Wire shape pushed by the Electron renderer after parsing the SharePoint
 * Emergency Contact Excel. One row per plant person.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ContactsImportRequest {
    private String source;
    private List<ContactRow> contacts;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ContactRow {
        private String name;
        private String title;
        private String phone;
        private String secondaryPhone;
        private String emergencyContact;
        private String emergencyPhone;
        private String emergencyRelation;
    }
}
