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
            "The 'LOTO Procedures' tab in the top bar", 0.70),
    NEW_ISOLATION_BUTTON("shell/new-isolation-button.png",
            "The 'NEW ISOLATION' button in the left menu"),
    LOGIN_BUTTON("shell/login-button.png",
            "The 'LOG IN' button in the left menu", 0.70),
    STATUS_NO_ONE_LOGGED_IN("shell/status-no-one-logged-in.png",
            "The 'No one Logged In' text in the bottom-left status bar (login-state probe)", 0.70),

    // ---- Login dialog -------------------------------------------------------
    LOGIN_DIALOG_TITLE("login/login-dialog-title.png",
            "The 'Authentication' heading of the login dialog", 0.75),
    LOGIN_USERNAME_LABEL("login/username-label.png",
            "The 'User Name:' label in the login dialog", 0.75),
    LOGIN_PASSWORD_LABEL("login/password-label.png",
            "The 'Password:' label in the login dialog", 0.75),
    LOGIN_SUBMIT_BUTTON("login/login-submit-button.png",
            "The 'Login' button inside the login dialog", 0.75),
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
    SW_TAB("safe-work/tab.png", "The 'Safe Work' tab in the top bar", 0.70),
    SW_NEW_PERMIT_BUTTON("safe-work/new-permit-button.png",
            "The 'NEW PERMIT' button in the left menu"),
    SW_ISSUE_NO_TEMPLATE_BUTTON("safe-work/issue-no-template-button.png",
            "The 'Issue Permit with NO Template' button", 0.70),
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
            "The 'Requestor' label in the signature row"),

    // ---- Safe Work — Associate permits flow --------------------------------
    SW_MODIFY_BUTTON("safe-work/modify-button.png",
            "The 'Modify' button in the left menu (shown when a permit row is selected)", true),
    SW_ASSOCIATE_BUTTON("safe-work/associate-button.png",
            "The 'Associate' button on the modify-mode form toolbar"),
    SW_ASSOCIATE_DIALOG_TITLE("safe-work/associate-dialog-title.png",
            "The 'NewAssociatePermitsForm' associate-dialog title bar"),
    SW_ASSOCIATE_SEARCH_BUTTON("safe-work/associate-search-button.png",
            "The 'Search' button in the associate dialog"),
    SW_ASSOCIATE_CLEAR_BUTTON("safe-work/associate-clear-button.png",
            "The 'Clear' button in the associate dialog"),
    SW_ASSOCIATE_ISSUED_LOTOS_TAB("safe-work/associate-issued-lotos-tab.png",
            "The 'Issued LOTOs' tab at the bottom of the associate dialog"),
    SW_ASSOCIATE_ISSUED_PERMITS_TAB("safe-work/associate-issued-permits-tab.png",
            "The 'Issued Permits' tab at the bottom of the associate dialog"),

    // ---- Hot Work permit ----------------------------------------------------
    // NEW PERMIT / Issue-with-NO-Template / Save / permit-# column are shared
    // toolbar/list elements — reuse the SW_* patterns. Only these are HW-specific.
    HW_TAB("hot-work/tab.png", "The 'Hot Work' tab in the top bar", 0.70, true),
    HW_SECTION_HEADER("hot-work/section-header.png",
            "The 'HOT WORK PERMIT CHECKLIST AND APPROVAL SECTION' header (scroll/region anchor)"),
    HW_LOCATION_LABEL("hot-work/location-label.png", "The 'Location of Hot Work:' label"),
    HW_DATE_LABEL("hot-work/date-label.png", "The 'Date' label in the Hot Work header"),
    HW_FOREMAN_LABEL("hot-work/foreman-label.png", "The '(Person Performing Work):' label"),
    HW_FIRE_WATCH_NAME_LABEL("hot-work/fire-watch-name-label.png", "The 'Name of Fire Watch:' label"),
    HW_METER_MODEL_LABEL("hot-work/meter-model-label.png", "The 'Test Equipment Model #:' label"),
    HW_SERIAL_LABEL("hot-work/serial-label.png", "The 'Serial #:' label"),
    HW_CAL_DATE_LABEL("hot-work/cal-date-label.png", "The 'Cal Date:' label"),
    HW_FIRE_WATCH_REQUIRED("hot-work/fire-watch-required.png",
            "The 'Fire Watch Required' row with its Y/N checkboxes"),
    HW_SPECIAL_INSTRUCTIONS_LABEL("hot-work/special-instructions-label.png",
            "The 'Special Instructions:' label on the Hot Work form"),

    // ---- Confined Space permit ---------------------------------------------
    // Two tab variants (one per ConfinedSpaceType). NEW PERMIT / Issue-with-NO-
    // Template / Save / permit-# column are shared with SW.
    CS_TAB_PERMIT_REQUIRED("confined-space/tab-permit-required.png",
            "The 'Confined Space - Permit Required' tab in the top bar", 0.70, true),
    CS_TAB_RECLASSIFIED("confined-space/tab-reclassified.png",
            "The 'Confined Space - Reclassified' tab in the top bar", 0.70, true),
    CS_SECTION_HEADER_GENERAL("confined-space/section-header-general.png",
            "The '1. GENERAL INFORMATION' section header"),
    CS_SECTION_HEADER_HAZARDS("confined-space/section-header-hazards.png",
            "The '2. HAZARDS' section header"),
    CS_SECTION_HEADER_PRECAUTIONS("confined-space/section-header-precautions.png",
            "The '3. REQUIRED PRECAUTIONS' section header"),
    CS_SECTION_HEADER_PPE("confined-space/section-header-ppe.png",
            "The '4. REQUIRED PPE AND EQUIP.' section header"),
    CS_SPACE_LABEL("confined-space/space-label.png", "The 'Space to be Entered:' label"),
    CS_DATE_LABEL("confined-space/date-label.png", "The 'Date of Entry:' label"),
    CS_PURPOSE_LABEL("confined-space/purpose-label.png", "The 'Purpose for Entry:' label"),
    CS_START_TIME_LABEL("confined-space/start-time-label.png", "The 'Start Time:' label"),
    CS_ISSUED_TO_LABEL("confined-space/issued-to-label.png", "The 'Issued to:' label"),
    CS_DURATION_LABEL("confined-space/duration-label.png", "The 'Authorized Duration:' label"),
    CS_PREC_LOCKOUT_TAGOUT_LABEL("confined-space/prec-lockout-tagout-label.png",
            "The 'Lockout/Tagout (#' precautions label + number field"),
    CS_PREC_HOT_WORK_PERMIT_LABEL("confined-space/prec-hot-work-permit-label.png",
            "The 'Hot Work Permit (#' precautions label + number field");

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
