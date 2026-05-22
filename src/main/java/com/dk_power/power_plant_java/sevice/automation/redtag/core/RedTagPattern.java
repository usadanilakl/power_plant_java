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
            "The 'OK' button that commits the Add Device dialog"),

    // ---- LOTO information form (shown after Continue) -----------------------
    LOTO_DETAILS_DIALOG_TITLE("loto-details/dialog-title.png",
            "The 'LOTO information form' dialog title bar"),
    LOTO_DETAILS_LOCK_BOX_LABEL("loto-details/lock-box-label.png",
            "The 'Lock Box Number:' label on the LOTO information form"),
    LOTO_DETAILS_OWNER_LABEL("loto-details/owner-label.png",
            "The 'Primary Authorized Employee, or Owner of LOTO:' label"),
    LOTO_DETAILS_WHY_LABEL("loto-details/why-label.png",
            "The 'Why is this job being performed?' label"),
    LOTO_DETAILS_REQUESTED_BY_HEADER("loto-details/requested-by-header.png",
            "The 'Requested By:' section header on the LOTO information form"),
    LOTO_DETAILS_OK_BUTTON("loto-details/ok-button.png",
            "The 'OK' button that submits the LOTO information form"),
    LOTO_SUBMISSION_WARNING_OK("loto-details/submission-warning-ok.png",
            "The 'OK' on the post-save 'procedure was modified' warning dialog"),

    // ---- Safe Work permit --------------------------------------------------
    SW_TAB("safe-work/tab.png", "The 'Safe Work' tab in the top bar"),
    SW_NEW_PERMIT_BUTTON("safe-work/new-permit-button.png",
            "The 'NEW PERMIT' button in the left menu"),
    SW_ISSUE_NO_TEMPLATE_BUTTON("safe-work/issue-no-template-button.png",
            "The 'Issue Permit with NO Template' button"),
    SW_ZOOM_OUT_BUTTON("safe-work/zoom-out-button.png",
            "The zoom-out magnifier button on the permit form toolbar"),
    SW_SAVE_BUTTON("safe-work/save-button.png",
            "The save (floppy disk) button on the permit form toolbar"),
    SW_ERROR_RECORD_IN_USE("safe-work/error-record-in-use.png",
            "The 'record in use' error dialog shown when saving"),
    SW_PERMIT_NUMBER_COLUMN("safe-work/permit-number-column.png",
            "The 'Permit #' column header in the Safe Work list"),
    SW_HAZARDS_HEADER("safe-work/hazards-header.png",
            "The 'IDENTIFY SAFETY HAZARDS' section header (checkbox-grid anchor)"),
    SW_PERMITS_HEADER("safe-work/permits-header.png",
            "The 'REQUIRED PERMITS/TESTS/ACTIONS' section header (checkbox-grid anchor)"),
    SW_PPE_HEADER("safe-work/ppe-header.png",
            "The 'PROTECTIVE EQUIPMENT REQUIRED' section header (checkbox-grid anchor)"),
    SW_DATE_ISSUED_LABEL("safe-work/date-issued-label.png", "The 'Date Issued:' label"),
    SW_LOCATION_LABEL("safe-work/location-label.png",
            "The 'Specific Location of Work:' label"),
    SW_DESCRIPTION_LABEL("safe-work/description-label.png",
            "The 'Description Of Work to be Performed:' label"),
    SW_SPECIAL_INSTRUCTIONS_LABEL("safe-work/special-instructions-label.png",
            "The 'Special Instructions:' label"),
    SW_REQUESTOR_LABEL("safe-work/requestor-label.png",
            "The 'Requestor' label in the signature row");

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
