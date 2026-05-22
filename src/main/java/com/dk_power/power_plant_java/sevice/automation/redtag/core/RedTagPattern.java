package com.dk_power.power_plant_java.sevice.automation.redtag.core;

/**
 * The complete catalogue of SikuliX image patterns the LOTO automation needs.
 *
 * <p>This enum is the single source of truth for "which screenshots exist". In the
 * legacy service there were ~200 loose {@code static final Pattern} fields scattered
 * with hard-coded {@code J:/} paths; here every image has exactly one logical name,
 * a relative path inside the pattern folder, a human description, and an optional
 * per-pattern similarity override.
 *
 * <p>Patterns flagged {@link #needsCapture()} cannot be cropped from the screenshots
 * supplied so far and must be captured manually from the running Red Tag app — see
 * {@code project/features/red-tag-automation/PATTERN_MANIFEST.md}.
 */
public enum RedTagPattern {

    // ---- Application shell (home page, top bar, left menu) -------------------
    LOTO_PROCEDURES_TAB("shell/loto-procedures-tab.png",
            "The 'LOTO Procedures' tab in the top bar"),
    NEW_ISOLATION_BUTTON("shell/new-isolation-button.png",
            "The 'NEW ISOLATION' button in the left menu"),
    LOGIN_BUTTON("shell/login-button.png",
            "The 'LOG IN' button in the left menu"),
    STATUS_NO_ONE_LOGGED_IN("shell/status-no-one-logged-in.png",
            "The 'No one Logged In' text in the bottom-left status bar (login-state probe)"),

    // ---- Login dialog -------------------------------------------------------
    LOGIN_DIALOG_TITLE("login/login-dialog-title.png",
            "The 'Authentication' heading of the login dialog"),
    LOGIN_USERNAME_LABEL("login/username-label.png",
            "The 'User Name:' label in the login dialog"),
    LOGIN_PASSWORD_LABEL("login/password-label.png",
            "The 'Password:' label in the login dialog"),
    LOGIN_SUBMIT_BUTTON("login/login-submit-button.png",
            "The 'Login' button inside the login dialog"),
    LOGIN_SIGNED_ON_OK("login/signed-on-ok-button.png",
            "The 'OK' button on the 'you are now Signed ON' confirmation dialog"),
    LOGIN_FAILED_DIALOG("login/login-failed-dialog.png",
            "The 'Login Failed. Try Again?' confirmation dialog"),
    LOGIN_FAILED_YES("login/login-failed-yes-button.png",
            "The 'Yes' button on the failed-login dialog"),

    // ---- New LOTO selection -------------------------------------------------
    NEW_ISO_LOTO_OPTION("loto/new-iso-loto-option.png",
            "The 'LOTO' entry in the side-dropdown shown after NEW ISOLATION", true),
    ISSUE_LOTO_NO_STANDARD_BUTTON("loto/issue-loto-no-standard-button.png",
            "The 'Issue LOTO with NO Standard Procedure' button on the device list"),

    // ---- LOTO builder page ('ISSUE New LOTO') -------------------------------
    LOTO_BUILDER_TITLE("loto/builder-title.png",
            "The 'ISSUE New LOTO' window title bar"),
    LOTO_BUILDER_CONTINUE_BUTTON("loto/builder-continue-button.png",
            "The large 'Continue' button on the LOTO builder"),
    LOTO_BUILDER_LOTO_TYPE_LABEL("loto/builder-loto-type-label.png",
            "The 'LOTO Type:' label on the LOTO builder"),
    LOTO_BUILDER_JOB_DESCRIPTION_LABEL("loto/builder-job-description-label.png",
            "The 'Job Description:' label on the LOTO builder"),
    LOTO_BUILDER_EQUIPMENT_DESCRIPTION_LABEL("loto/builder-equipment-description-label.png",
            "The 'Equipment Description:' label on the LOTO builder"),
    LOTO_BUILDER_ADD_DEVICE_MANUALLY_BUTTON("loto/builder-add-device-manually-button.png",
            "The 'Add a Device Manually' button on the LOTO builder"),
    LOTO_NUMBER_COLUMN_HEADER("loto/loto-number-column-header.png",
            "The 'LOTO Number' column header in the procedures list (permit-number probe)"),

    // ---- 'Add Device' dialog ------------------------------------------------
    ADD_DEVICE_TITLE("add-device/title.png",
            "The 'Add Device' dialog title bar"),
    ADD_DEVICE_DESCRIPTION_LABEL("add-device/description-label.png",
            "The 'Isolation Device Description:' label"),
    ADD_DEVICE_LARGE_DESCRIPTION_LABEL("add-device/large-description-label.png",
            "The 'Isolation Device Large Description:' label"),
    ADD_DEVICE_PNID_LABEL("add-device/pnid-label.png",
            "The 'Isolation Device PNID:' label"),
    ADD_DEVICE_LOCATION_LABEL("add-device/location-label.png",
            "The 'Isolation Device Location:' label"),
    ADD_DEVICE_ISOLATED_POSITION_LABEL("add-device/isolated-position-label.png",
            "The 'Isolated Position:' label"),
    ADD_DEVICE_NORMAL_POSITION_LABEL("add-device/normal-position-label.png",
            "The 'Normal Position:' label"),
    ADD_DEVICE_OK_BUTTON("add-device/ok-button.png",
            "The 'OK' button that commits the Add Device dialog");

    private final String relativePath;
    private final String description;
    /** {@code null} → use {@code RedTagAutomationProperties.defaultSimilarity}. */
    private final Double similarity;
    /** {@code true} → image not yet available; must be captured from the live app. */
    private final boolean needsCapture;

    RedTagPattern(String relativePath, String description) {
        this(relativePath, description, null, false);
    }

    RedTagPattern(String relativePath, String description, boolean needsCapture) {
        this(relativePath, description, null, needsCapture);
    }

    RedTagPattern(String relativePath, String description, double similarity) {
        this(relativePath, description, similarity, false);
    }

    RedTagPattern(String relativePath, String description, Double similarity, boolean needsCapture) {
        this.relativePath = relativePath;
        this.description = description;
        this.similarity = similarity;
        this.needsCapture = needsCapture;
    }

    public String getRelativePath() {
        return relativePath;
    }

    public String getDescription() {
        return description;
    }

    public Double getSimilarity() {
        return similarity;
    }

    public boolean needsCapture() {
        return needsCapture;
    }
}
