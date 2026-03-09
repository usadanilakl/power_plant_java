package com.dk_power.power_plant_java.dto.instrumentation;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;

@Data
public class BulkUploadResult {
    private int created;
    private int updated;
    private int failed;
    private int total;
    private List<String> errors = new ArrayList<>();

    public void incrementCreated() { created++; }
    public void incrementUpdated() { updated++; }
    public void incrementFailed() { failed++; }
    public void addError(String error) { errors.add(error); }
}
