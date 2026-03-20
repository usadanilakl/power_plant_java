package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

@Data
public class PwaRegistrationResult {
    private boolean success;
    private String status;   // "created", "already_exists", "email_taken", "error"
    private String message;
    private boolean isActive;

    public static PwaRegistrationResult success() {
        PwaRegistrationResult result = new PwaRegistrationResult();
        result.setSuccess(true);
        result.setStatus("created");
        result.setMessage("User registered successfully. Awaiting admin approval.");
        return result;
    }

    public static PwaRegistrationResult alreadyExists(boolean isActive) {
        PwaRegistrationResult result = new PwaRegistrationResult();
        result.setSuccess(true);
        result.setStatus("already_exists");
        result.setActive(isActive);
        result.setMessage("User already registered.");
        return result;
    }

    public static PwaRegistrationResult emailTaken() {
        PwaRegistrationResult result = new PwaRegistrationResult();
        result.setSuccess(false);
        result.setStatus("email_taken");
        result.setMessage("This email is already associated with an account.");
        return result;
    }

    public static PwaRegistrationResult error(String message) {
        PwaRegistrationResult result = new PwaRegistrationResult();
        result.setSuccess(false);
        result.setStatus("error");
        result.setMessage(message);
        return result;
    }
}
