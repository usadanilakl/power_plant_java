package com.dk_power.power_plant_java.dto.pwa;

import lombok.Data;

@Data
public class PwaRegistrationResult {
    private boolean success;
    private String status;   // "created", "already_exists", "email_taken", "error"
    private String message;
    private boolean isActive;
    /**
     * The uuid the server actually stored. It differs from the one the client sent when that one was
     * already taken (another account registered from the same device, or a soft-deleted row still
     * owns it), so the client must persist this value — its signature upload and status polling key
     * on it.
     */
    private String pwaUserUuid;

    public static PwaRegistrationResult success(String pwaUserUuid) {
        PwaRegistrationResult result = new PwaRegistrationResult();
        result.setSuccess(true);
        result.setStatus("created");
        result.setPwaUserUuid(pwaUserUuid);
        result.setMessage("User registered successfully. Awaiting admin approval.");
        return result;
    }

    public static PwaRegistrationResult alreadyExists(boolean isActive, String pwaUserUuid) {
        PwaRegistrationResult result = new PwaRegistrationResult();
        result.setSuccess(true);
        result.setStatus("already_exists");
        result.setActive(isActive);
        result.setPwaUserUuid(pwaUserUuid);
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

    /**
     * Same wire status as {@link #emailTaken()} so existing clients keep working, but a message that
     * explains why retrying can't fix it: the address belongs to a closed account and the UNIQUE
     * index still holds it. The message deliberately does NOT offer "ask an admin to restore it" —
     * no restore path exists for User (nothing anywhere sets deleted=false on a user row), so the
     * only thing that actually works today is a different address.
     */
    public static PwaRegistrationResult emailHeldByDeletedAccount() {
        PwaRegistrationResult result = new PwaRegistrationResult();
        result.setSuccess(false);
        result.setStatus("email_taken");
        result.setMessage("This email belongs to a closed account and can't be reused. "
                + "Please register with a different address.");
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
