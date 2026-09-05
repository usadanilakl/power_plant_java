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

    // ---- LOTO Procedures list — status-grouped tabs & column drag targets ----
    // Used by the state-sync flow to pull Active/Canceled/Closed/Inactive LOTOs
    // back into the local system. Each status has two crops:
    //   *_COLLAPSED — tab strip with a "+" glyph on the left (row group hidden)
    //   *_EXPANDED  — tab strip with a "-" glyph on the left (row group visible)
    // Presence of the "expanded" variant is how the flow confirms an expand click
    // landed; the "collapsed" variant is the anchor for the click itself
    // (a fixed negative dx offset lands on the "+" at the left edge).
    LIST_STATUS_ACTIVE_COLLAPSED("loto-list/status-active-collapsed.png",
            "'Status : ACTIVE' tab strip, collapsed (+ glyph on left)", 0.85),
    LIST_STATUS_ACTIVE_EXPANDED("loto-list/status-active-expanded.png",
            "'Status : ACTIVE' tab strip, expanded (- glyph on left)", 0.85),
    LIST_STATUS_CANCELED_COLLAPSED("loto-list/status-canceled-collapsed.png",
            "'Status : CANCELED' tab strip, collapsed", 0.85),
    LIST_STATUS_CANCELED_EXPANDED("loto-list/status-canceled-expanded.png",
            "'Status : CANCELED' tab strip, expanded", 0.85),
    LIST_STATUS_CLOSED_COLLAPSED("loto-list/status-closed-collapsed.png",
            "'Status : CLOSED' tab strip, collapsed", 0.85),
    LIST_STATUS_CLOSED_EXPANDED("loto-list/status-closed-expanded.png",
            "'Status : CLOSED' tab strip, expanded", 0.85),
    LIST_STATUS_INACTIVE_COLLAPSED("loto-list/status-inactive-collapsed.png",
            "'Status : INACTIVE' tab strip, collapsed", 0.85),
    LIST_STATUS_INACTIVE_EXPANDED("loto-list/status-inactive-expanded.png",
            "'Status : INACTIVE' tab strip, expanded", 0.85),
    // The plain 'Status' column header, shown when Status is in the column strip
    // (NOT grouped). Anchor for the drag-into-yellow-band grouping trick and
    // the reset "drag out then back" trick when a target tab is buried.
    LIST_STATUS_COLUMN_HEADER("loto-list/status-column-header.png",
            "The 'Status' column header in the LOTO Procedures grid (drag anchor)", 0.85),
    // The empty grouping band — shown when no column is grouped. Presence of
    // this pattern means we are NOT grouped by anything and need to drag the
    // Status column into it.
    LIST_GROUPING_BAND_EMPTY("loto-list/grouping-yellow-band-empty.png",
            "Empty yellow grouping band: 'Drag a column header here to group by that column'", 0.80),

    // ---- LOTO Procedures list — column headers (X-anchors for cell OCR) ----
    // The state-sync scrape locates each of these once at open-list time and
    // uses their x/width to slice the row area into vertical strips per column.
    // OCR'ing each strip separately produces one line per row per column, which
    // then zip into RedTagRow — far more reliable than OCR'ing whole-row text
    // and hoping the columns can be split by whitespace.
    LIST_COL_LOTO_NUMBER("loto-list/col-loto-number.png",
            "'LOTO Number' column header — anchor for column-1 strip OCR", 0.85),
    LIST_COL_JOB_DESCRIPTION("loto-list/col-job-description.png",
            "'Job Description' column header — anchor for column-2 strip OCR", 0.85),
    LIST_COL_LOCK_BOX_DESCRIPTION("loto-list/col-lock-box-description.png",
            "'Lock Box Description' column header — anchor for column-3 strip OCR", 0.85),
    LIST_COL_OWNER_PHOTOS("loto-list/col-owner-photos.png",
            "'Owner Photos' column header (holds owner/requestor name) — anchor for column-4 strip OCR", 0.85),

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

    // ---- Hot Work permit (2026-08-27 form revision) -------------------------
    // NEW PERMIT / Issue-with-NO-Template / Save / permit-# column are shared
    // toolbar/list elements — reuse the SW_* patterns. Only these are HW-specific.
    //
    // The form was reissued on 2026-08-27: the old 12-row Y/NA checklist became 9 rows, and
    // Initial Air Test, continuous-monitoring, Fire Watch duration and issuer-approval blocks
    // were added. Every pattern below is cropped from the 2026-09-03 capture of that revision.
    HW_TAB("hot-work/tab.png", "The 'Hot Work' tab in the top bar", 0.70, true),
    HW_CHECKLIST_HEADER("hot-work/checklist-header.png",
            "The 'HOT WORK PERMIT CHECKLIST' section bar (scroll/region anchor)"),
    HW_SECTION_HEADER("hot-work/section-header.png",
            "The 'HOT WORK REQUIREMENTS AND APPROVAL SECTION' bar (scroll/region anchor)"),
    HW_INITIAL_AIR_TEST_HEADER("hot-work/initial-air-test-header.png",
            "The 'INITIAL AIR TEST' section bar (scroll/region anchor)"),
    HW_LOCATION_LABEL("hot-work/location-label.png", "The 'Location:' label and its field"),
    HW_DATE_LABEL("hot-work/date-label.png", "The 'Date' label and its field in the Hot Work header"),
    HW_WORK_TYPE_ROW("hot-work/work-type-row.png",
            "The 'Work Type:' row — Welding / Griding / Cutting / Brazing boxes plus the Other field"),
    HW_FIRE_PROTECTION_ROW("hot-work/fire-protection-row.png",
            "The 'Fire Protection System in service' / 'NOT in service' bars with their boxes and Date/Time"),
    HW_METER_MODEL_LABEL("hot-work/meter-model-label.png", "Initial Air Test 'Model:' label and field"),
    HW_SERIAL_LABEL("hot-work/serial-label.png", "Initial Air Test 'Serial #' label and field"),
    HW_CAL_DATE_LABEL("hot-work/cal-date-label.png", "Initial Air Test 'Cal Date' label and field"),
    HW_INITIAL_TEST_TIME_LABEL("hot-work/initial-test-time-label.png",
            "Initial Air Test 'Time:' label and field"),
    HW_INITIAL_TEST_INITIALS_LABEL("hot-work/initial-test-initials-label.png",
            "Initial Air Test 'Initials:' label and field"),
    HW_INITIAL_TEST_LEL_LABEL("hot-work/initial-test-lel-label.png",
            "Initial Air Test 'LEL (under 10%)' label and field"),
    HW_CONT_MODEL_LABEL("hot-work/cont-model-label.png",
            "Continuous-monitoring 'Model:' column header and field"),
    HW_CONT_SERIAL_LABEL("hot-work/cont-serial-label.png",
            "Continuous-monitoring 'Serial #' column header and field"),
    HW_CONT_CAL_DATE_LABEL("hot-work/cont-cal-date-label.png",
            "Continuous-monitoring 'Cal Date' column header and field"),
    HW_LOGGED_ON_CONF_SPACE("hot-work/logged-on-conf-space.png",
            "The 'Logged On Conf. Space Perm.' column header and its checkbox"),
    HW_FIRE_WATCH_ROW("hot-work/fire-watch-row.png",
            "The 'Fire Watch' 1 Hour / 30 Min / Not Required header block with its three boxes"),
    HW_PERSON_PERFORMING_LABEL("hot-work/person-performing-label.png",
            "The 'Person Performing Work:' label and its field"),
    HW_FIRE_WATCH_NAME_LABEL("hot-work/fire-watch-name-label.png",
            "The 'Fire Watch Name' label and its field"),
    HW_SPECIAL_INSTRUCTIONS_LABEL("hot-work/special-instructions-label.png",
            "The 'Special Instructions:' label and its field on the Hot Work form"),
    HW_ISSUER_SIGNATURE_LABEL("hot-work/issuer-signature-label.png",
            "The 'Hot Work Permit Approved (Issuer Signature):' label and its field"),
    HW_APPROVED_DATE_LABEL("hot-work/approved-date-label.png",
            "The issuer-approval 'Date:' label and its field"),
    HW_APPROVED_TIME_LABEL("hot-work/approved-time-label.png",
            "The issuer-approval 'Time:' label and its field"),

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

    /**
     * The patterns that live <b>inside a permit form</b>, as opposed to the application's own
     * chrome (tabs, toolbar buttons, dialogs, grid headers).
     *
     * <p>The distinction matters because only form content is zoomable: the Red Tag form is a
     * document view whose scale follows the window, the monitor DPI and the last Ctrl+wheel,
     * while the surrounding buttons stay at the OS widget scale. So
     * {@code PatternCatalog.setScale} must rescale these and leave everything else alone —
     * scaling the Save button by the form's zoom is how you end up clicking empty toolbar.
     *
     * <p>Label crops under {@code <permit>/labels/} are all form content and are handled
     * directly by the catalogue; they never appear in this enum.
     */
    private static final java.util.Set<RedTagPattern> FORM_CONTENT = java.util.EnumSet.of(
            SW_HAZARDS_HEADER, SW_PERMITS_HEADER, SW_PPE_HEADER,
            SW_DATE_ISSUED_LABEL, SW_LOCATION_LABEL, SW_DESCRIPTION_LABEL,
            SW_SPECIAL_INSTRUCTIONS_LABEL, SW_REQUESTOR_LABEL,
            HW_CHECKLIST_HEADER, HW_SECTION_HEADER, HW_INITIAL_AIR_TEST_HEADER,
            HW_LOCATION_LABEL, HW_DATE_LABEL, HW_WORK_TYPE_ROW, HW_FIRE_PROTECTION_ROW,
            HW_METER_MODEL_LABEL, HW_SERIAL_LABEL, HW_CAL_DATE_LABEL,
            HW_INITIAL_TEST_TIME_LABEL, HW_INITIAL_TEST_INITIALS_LABEL, HW_INITIAL_TEST_LEL_LABEL,
            HW_CONT_MODEL_LABEL, HW_CONT_SERIAL_LABEL, HW_CONT_CAL_DATE_LABEL,
            HW_LOGGED_ON_CONF_SPACE, HW_FIRE_WATCH_ROW,
            HW_PERSON_PERFORMING_LABEL, HW_FIRE_WATCH_NAME_LABEL, HW_SPECIAL_INSTRUCTIONS_LABEL,
            HW_ISSUER_SIGNATURE_LABEL, HW_APPROVED_DATE_LABEL, HW_APPROVED_TIME_LABEL,
            CS_SECTION_HEADER_GENERAL, CS_SECTION_HEADER_HAZARDS,
            CS_SECTION_HEADER_PRECAUTIONS, CS_SECTION_HEADER_PPE,
            CS_SPACE_LABEL, CS_DATE_LABEL, CS_PURPOSE_LABEL, CS_START_TIME_LABEL,
            CS_ISSUED_TO_LABEL, CS_DURATION_LABEL,
            CS_PREC_LOCKOUT_TAGOUT_LABEL, CS_PREC_HOT_WORK_PERMIT_LABEL);

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

    /** @see #FORM_CONTENT */
    public boolean isFormContent() {
        return FORM_CONTENT.contains(this);
    }
}
