package com.dk_power.power_plant_java.sevice.automation;

import org.sikuli.script.Pattern;

import java.nio.file.Paths;

/**
 * SikuliX {@link Pattern} constants for the Red Tag automation, held apart from
 * {@link RedTagAutomationService} on purpose.
 *
 * <p>Constructing a SikuliX {@code Pattern} boots the whole SikuliX runtime: {@code Pattern}
 * has an instance field {@code private Mat patternMask = Finder.Finder2.getNewMat()}, and
 * {@code Finder}'s static initialiser calls {@code System.load(...opencv_java430.dll)}.
 * While these constants lived on {@code RedTagAutomationService} — a {@code @Service} injected
 * into five eager singletons — that happened during Spring context startup on EVERY desktop,
 * including the many that never run an automation. It also meant 312 blocking probes against
 * {@code BASE_PATH} on the J: share, which is unreachable on off-network machines.
 *
 * <p>A separate class is initialised only on first active use (JLS 12.4), so moving them here
 * defers the SikuliX/opencv load until an automation actually touches a pattern. The service
 * static-imports these, so no call site changed.
 *
 * <p>NOTE: this does NOT cover {@code new Screen(0)} in the RedTagAutomationService
 * constructor — that still initialises AWT at startup (it does not load opencv).
 */
final class RedTagPatterns {

    private RedTagPatterns() {
    }

    static final String BASE_PATH = "J:/Jackson Generation P&IDs/Manager App/managed_apps/RedTagIntegration/images/";


    static final Pattern BLUE_EXCLAMATION = new Pattern(BASE_PATH + "BLUE_EXCLAMATION.png");
    static final Pattern YELLOW_EXCLAMATION = new Pattern(BASE_PATH + "YELLOW_EXCLAMATION.png");
    static final Pattern ERROR_RECORD_IN_USE = new Pattern(BASE_PATH + "ERROR_RECORD_IN_USE.png");
    static final Pattern ERROR_PROCEDURE_WAS_MODIFIED_PRIOR = new Pattern(BASE_PATH + "ERROR_PROCEDURE_WAS_MODIFIED_PRIOR.png");
    static final Pattern ERROR_ENTER_QUERY = new Pattern(BASE_PATH + "ERROR_ENTER_QUERY.png");


    static final Pattern POINT_MENU = new Pattern(BASE_PATH + "pointMenu.png");
    static final Pattern ADD_DEVICE_MANUALLY_BTN = new Pattern(BASE_PATH + "addDeviceManuallyBtn.png");
    static final Pattern NEW_POINT_WINDOW = new Pattern(BASE_PATH + "newPointWindow.png");
    static final Pattern OK_BTN = new Pattern(BASE_PATH + "okBtn.png");
    static final Pattern LOTO_PROCEDURES_TAB = new Pattern(BASE_PATH + "lotoProceduresTab.png");
    static final Pattern LOG_IN_BUTTON = new Pattern(BASE_PATH + "loginButton.png");
    static final Pattern LOG_IN_INPUT_FIELD = new Pattern(BASE_PATH + "userNameInputField.png");
    static final Pattern PASSWORD_INPUT_FIELD = new Pattern(BASE_PATH + "passwordInputField.png");
    static final Pattern LOGIN_MENU = new Pattern(BASE_PATH + "loginMenu.png");
    static final Pattern LOGIN_BUTTON_IN_LOGIN_MENU = new Pattern(BASE_PATH + "loginButtonInLoginMenu.png");
    static final Pattern LOGOUT_BUTTON = new Pattern(BASE_PATH + "logoutButton.png");
    static final Pattern FAILED_LOGIN_POPUP = new Pattern(BASE_PATH + "failedLoginPopup.png");
    static final Pattern FAILED_LOGIN_POPUP_YES_BUTTON = new Pattern(BASE_PATH + "failedLoginPopupYesButton.png");
    static final Pattern MAIN_MENU = new Pattern(BASE_PATH + "mainMenu.png");
    static final Pattern TOOLBAR = new Pattern(BASE_PATH + "toolBar.png");
    static final Pattern MAIN_MENU_NEW_ISO_BUTTON = new Pattern(BASE_PATH + "mainMenuNewIsoButton.png");
    static final Pattern NEW_ISO_LOTO_TYPE_DROPDOWN = new Pattern(BASE_PATH + "newIsolationLotoTypeDropdown.png");
    static final Pattern ISSUE_LOTO_WITH_NO_STANDARD_BUTTON = new Pattern(BASE_PATH + "issueLotoWithNoStandardButton.png");
    static final Pattern LOTO_BUILDER_LOTO_TYPE_DROPDOWN = new Pattern(BASE_PATH + "lotoBuilderLotoTypeDropdown.png");
    static final Pattern LOTO_BUILDER_EQUIPMENT_DESCRIPTION = new Pattern(BASE_PATH + "lotoBuilderEquipmentDescriptionField.png");
    static final Pattern LOTO_BUILDER_EQUIPMENT_TAG_NUMBER = new Pattern(BASE_PATH + "lotoBuilderEquipmentTagNumber.png");
    static final Pattern RED_TAG_LOGO_IN_TITLE_BAR = new Pattern(BASE_PATH + "redTagLogoInTitleBar.png");
    static final Pattern LOTO_BUILDER_CONTINUE_BUTTON = new Pattern(BASE_PATH + "lotoBuilderContinueButton.png");
    static final Pattern LOTO_BUILDER_INFORMATION_FORM = new Pattern(BASE_PATH + "lotoInformationForm.png");
    static final Pattern INFORMATION_FORM_LOCK_BOX_DROPDOWN = new Pattern(BASE_PATH + "infoFormLockBoxDropdown.png");
    static final Pattern NO_ONE_LOGGED_ID = new Pattern(BASE_PATH + "noOneLoggedIn.png");
    static final Pattern LOTO_TAB = new Pattern(BASE_PATH + "lotoTab.png");
    static final Pattern LOTO_REQUESTOR = new Pattern(BASE_PATH + "LOTO_REQUESTOR.png");
    static final Pattern LOTO_REQUESTED_BY = new Pattern(BASE_PATH + "LOTO_REQUESTED_BY.png");
    static final Pattern LOTO_WORK_SCOPE = new Pattern(BASE_PATH + "LOTO_WORK_SCOPE.png");
    static final Pattern LOTO_MENU_OK_BUTTON = new Pattern(BASE_PATH + "LOTO_MENU_OK_BUTTON.png");

    static final String SAFE_WORK_PATH = Paths.get(BASE_PATH+"safework").toString();
    static final Pattern SAFEWORK_TAB = new Pattern(SAFE_WORK_PATH + "/safeWorkTab.png");
    static final Pattern NEW_PERMIT_BUTTON = new Pattern(SAFE_WORK_PATH + "/newPermitButton.png");
    static final Pattern ISSUE_WITH_NO_TEMPLATE_BUTTON = new Pattern(SAFE_WORK_PATH + "/issueWithNoTemplateButton.png");
    static final Pattern SHRINK_BUTTON = new Pattern(SAFE_WORK_PATH + "/shrinkButton.png");
    static final Pattern SW_DATE_ISSUED = new Pattern(SAFE_WORK_PATH + "/swDateIssued.png");
    static final Pattern SW_LOCATION = new Pattern(SAFE_WORK_PATH + "/swLocation.png");
    static final Pattern SW_HIGH_TEMP = new Pattern(SAFE_WORK_PATH + "/swHighTemp.png");
    static final Pattern SW_HIGH_PRESSURE = new Pattern(SAFE_WORK_PATH + "/swHighPressure.png");
    static final Pattern SW_ENERGIZED = new Pattern(SAFE_WORK_PATH + "/swEnergized.png");
    static final Pattern SW_STORED_ENERGY = new Pattern(SAFE_WORK_PATH + "/swStoredEnergy.png");
    static final Pattern SW_EYE_HAZARD = new Pattern(SAFE_WORK_PATH + "/swEyeHazard.png");
    static final Pattern SW_EGRESS_ACCESS = new Pattern(SAFE_WORK_PATH + "/SW_EGRESS_ACCESS.png");
    static final Pattern SW_ERGONOMIC_HAZARD = new Pattern(SAFE_WORK_PATH + "/SW_ERGONOMIC_HAZARD.png");
    static final Pattern SW_FALLING_OBJECT = new Pattern(SAFE_WORK_PATH + "/SW_FALLING_OBJECT.png");
    static final Pattern SW_HIGH_NOISE = new Pattern(SAFE_WORK_PATH + "/SW_HIGH_NOISE.png");
    static final Pattern SW_DUST_PARTICULATE = new Pattern(SAFE_WORK_PATH + "/SW_DUST_PARTICULATE.png");
    static final Pattern SW_COMBUSTABLE_DUST = new Pattern(SAFE_WORK_PATH + "/SW_COMBUSTABLE_DUST.png");
    static final Pattern SW_FIRE_HAZARD = new Pattern(SAFE_WORK_PATH + "/SW_FIRE_HAZARD.png");
    static final Pattern SW_HOT_SURFACE = new Pattern(SAFE_WORK_PATH + "/SW_HOT_SURFACE.png");
    static final Pattern SW_SLIPPERY = new Pattern(SAFE_WORK_PATH + "/SW_SLIPPERY.png");
    static final Pattern SW_VENTILATION_REQUIRED = new Pattern(SAFE_WORK_PATH + "/SW_VENTILATION_REQUIRED.png");
    static final Pattern SW_LIGHTING_RESTRICTIONS = new Pattern(SAFE_WORK_PATH + "/SW_LIGHTING_RESTRICTIONS.png");
    static final Pattern SW_CHEMICAL_EXPOSURE = new Pattern(SAFE_WORK_PATH + "/SW_CHEMICAL_EXPOSURE.png");
    static final Pattern SW_LIFTING_HAZARD = new Pattern(SAFE_WORK_PATH + "/SW_LIFTING_HAZARD.png");
    static final Pattern SW_HAND_TRAPS = new Pattern(SAFE_WORK_PATH + "/SW_HAND_TRAPS.png");
    static final Pattern SW_HEAT_COLD_STRESS = new Pattern(SAFE_WORK_PATH + "/SW_HEAT_COLD_STRESS.png");
    static final Pattern SW_ELEVATED_SURFACE = new Pattern(SAFE_WORK_PATH + "/SW_ELEVATED_SURFACE.png");
    static final Pattern SW_ENVIRONMENTAL = new Pattern(SAFE_WORK_PATH + "/SW_ENVIRONMENTAL.png");

    static final Pattern SW_LOTO_REQUIRED = new Pattern(SAFE_WORK_PATH + "/SW_LOTO_REQUIRED.png");
    static final Pattern SW_CONFINED_SPACE_RECLASSIFIED = new Pattern(SAFE_WORK_PATH + "/SW_CONFINED_SPACE_RECLASSIFIED.png");
    static final Pattern SW_CONFINED_SPACE_PERMIT_REQUIRED = new Pattern(SAFE_WORK_PATH + "/SW_CONFINED_SPACE_PERMIT_REQUIRED.png");
    static final Pattern SW_HOT_WORK = new Pattern(SAFE_WORK_PATH + "/SW_HOT_WORK.png");
    static final Pattern SW_VENTING_PURGING = new Pattern(SAFE_WORK_PATH + "/SW_VENTING_PURGING.png");
    static final Pattern SW_JHA = new Pattern(SAFE_WORK_PATH + "/SW_JHA.png");
    static final Pattern SW_GAS_TESTING = new Pattern(SAFE_WORK_PATH + "/SW_GAS_TESTING.png");
    static final Pattern SW_EXCAVATION_PERMIT = new Pattern(SAFE_WORK_PATH + "/SW_EXCAVATION_PERMIT.png");
    static final Pattern SW_ENERGIZED_PERMIT = new Pattern(SAFE_WORK_PATH + "/SW_ENERGIZED_PERMIT.png");
    static final Pattern SW_HARDHAT = new Pattern(SAFE_WORK_PATH + "/SW_HARDHAT.png");
    static final Pattern SW_SAFETY_GLASSES = new Pattern(SAFE_WORK_PATH + "/SW_SAFETY_GLASSES.png");
    static final Pattern SW_HEARING_PROTECTION = new Pattern(SAFE_WORK_PATH + "/SW_HEARING_PROTECTION.png");
    static final Pattern SW_BOOTS = new Pattern(SAFE_WORK_PATH + "/SW_BOOTS.png");
    static final Pattern SW_FALL_PROTECTION = new Pattern(SAFE_WORK_PATH + "/SW_FALL_PROTECTION.png");
    static final Pattern SW_GFI = new Pattern(SAFE_WORK_PATH + "/SW_GFI.png");
    static final Pattern SW_RESPIRATOR = new Pattern(SAFE_WORK_PATH + "/SW_RESPIRATOR.png");
    static final Pattern SW_DUST_MASK = new Pattern(SAFE_WORK_PATH + "/SW_DUST_MASK.png");
    static final Pattern SW_GLOVES = new Pattern(SAFE_WORK_PATH + "/SW_GLOVES.png");
    static final Pattern SW_ICE_CLEATS = new Pattern(SAFE_WORK_PATH + "/SW_ICE_CLEATS.png");
    static final Pattern SW_ACID_SUIT = new Pattern(SAFE_WORK_PATH + "/SW_ACID_SUIT.png");
    static final Pattern SW_BARRICADE = new Pattern(SAFE_WORK_PATH + "/SW_BARRICADE.png");
    static final Pattern SW_FACE_SHIELD = new Pattern(SAFE_WORK_PATH + "/SW_FACE_SHIELD.png");
    static final Pattern SW_GAS_MONITOR = new Pattern(SAFE_WORK_PATH + "/SW_GAS_MONITOR.png");
    static final Pattern SW_ARC_FLASH_PPE = new Pattern(SAFE_WORK_PATH + "/SW_ARC_FLASH_PPE.png");
    static final Pattern SW_WELDING_JACKET = new Pattern(SAFE_WORK_PATH + "/SW_WELDING_JACKET.png");
    static final Pattern SW_WELDING_SHIELD = new Pattern(SAFE_WORK_PATH + "/SW_WELDING_SHIELD.png");
    static final Pattern SW_WELDING_GLOVES = new Pattern(SAFE_WORK_PATH + "/SW_WELDING_GLOVES.png");
    static final Pattern SW_PURGIN_VENTILATION = new Pattern(SAFE_WORK_PATH + "/SW_PURGIN_VENTILATION.png");
    static final Pattern SW_SPECIAL_INSTRUCTIONS = new Pattern(SAFE_WORK_PATH + "/SW_SPECIAL_INSTRUCTIONS.png");
    static final Pattern SW_REQUESTOR = new Pattern(SAFE_WORK_PATH + "/SW_REQUESTOR.png");
    static final Pattern SW_SAVE_BUTTON = new Pattern(SAFE_WORK_PATH + "/SW_SAVE_BUTTON.png");


    static final Pattern SW_VIEW_BUTTON = new Pattern(SAFE_WORK_PATH + "/SW_VIEW_BUTTON.png");
    static final Pattern SW_VIEW_MENU = new Pattern(SAFE_WORK_PATH + "/SW_VIEW_MENU.png");
    static final Pattern SW_VIEW_MENU_ACT_INACT = new Pattern(SAFE_WORK_PATH + "/SW_VIEW_MENU_ACT_INACT.png");
    static final Pattern VIEW_MENU_ACT_INACT = new Pattern(BASE_PATH + "/VIEW_MENU_ACT_INACT.png");
    static final Pattern SW_DRAD_COLUMN = new Pattern(SAFE_WORK_PATH + "/SW_DRAD_COLUMN.png");
    static final Pattern SW_ACTIVE_TAB = new Pattern(SAFE_WORK_PATH + "/SW_ACTIVE_TAB.png");
    static final Pattern SW_INACTIVE_TAB = new Pattern(SAFE_WORK_PATH + "/SW_INACTIVE_TAB.png");
    static final Pattern SW_PERMIT_NUMBER_COLUMN = new Pattern(SAFE_WORK_PATH + "/SW_PERMIT_NUMBER_COLUMN.png");
    static final Pattern SW_STATUS_COLUMN = new Pattern(SAFE_WORK_PATH + "/SW_STATUS_COLUMN.png");
    static final Pattern SW_STATUS_COLUMN_GROUPED = new Pattern(SAFE_WORK_PATH + "/SW_STATUS_COLUMN_GROUPED.png");


    static final Pattern SW_MODIFY_BUTTON = new Pattern(SAFE_WORK_PATH + "/SW_MODIFY_BUTTON.png");
    static final Pattern SW_ASSOCIATE_BUTTON = new Pattern(SAFE_WORK_PATH + "/SW_ASSOCIATE_BUTTON.png");
    static final Pattern SW_ISSUED_PERMITS = new Pattern(SAFE_WORK_PATH + "/SW_ISSUED_PERMITS.png");
    static final Pattern SW_SEARCH_BUTTON = new Pattern(SAFE_WORK_PATH + "/SW_SEARCH_BUTTON.png");
    static final Pattern SW_CONTINUE_BUTTON = new Pattern(SAFE_WORK_PATH + "/SW_CONTINUE_BUTTON.png");
    static final Pattern SW_ASSOCIATE_PERMITS_TOP_BAR = new Pattern(SAFE_WORK_PATH + "/SW_ASSOCIATE_PERMITS_TOP_BAR.png");
    static final Pattern SW_ASSOCIATE_WINDOW_CONTROLS = new Pattern(SAFE_WORK_PATH + "/SW_ASSOCIATE_WINDOW_CONTROLS.png");
    static final Pattern SW_ASSOCIATE_PERMIT_NUMBER_COLUMN = new Pattern(SAFE_WORK_PATH + "/SW_ASSOCIATE_PERMIT_NUMBER_COLUMN.png");
    static final Pattern SW_ASSOCIATE_ISSUED_LOTOS = new Pattern(SAFE_WORK_PATH + "/SW_ASSOCIATE_ISSUED_LOTOS.png");
    static final Pattern SW_ASSOCIATE_PERMIT_TABS = new Pattern(SAFE_WORK_PATH + "/SW_ASSOCIATE_PERMIT_TABS.png");
    static final Pattern SW_ASSOCIATE_ISSUED_SIDE = new Pattern(SAFE_WORK_PATH + "/SW_ASSOCIATE_ISSUED_SIDE.png");
    static final Pattern SW_ASSOCIATED_LOTO_NUM_COLUMN = new Pattern(SAFE_WORK_PATH + "/SW_ASSOCIATED_LOTO_NUM_COLUMN.png");




    static final String CS_PATH = Paths.get(BASE_PATH+"confined-space").toString();
    static final Pattern CS_TAB_RECLASSIFIED = new Pattern(CS_PATH + "/CS_TAB_RECLASSIFIED.png");
    static final Pattern CS_TAB_PERMIT_REQUIRED = new Pattern(CS_PATH + "/CS_TAB_PERMIT_REQUIRED.png");
    static final Pattern CS_SPACE = new Pattern(CS_PATH + "/CS_SPACE.png");
    static final Pattern CS_PURPOSE = new Pattern(CS_PATH + "/CS_PURPOSE.png");
    static final Pattern CS_ISSUED_TO = new Pattern(CS_PATH + "/CS_ISSUED_TO.png");
    static final Pattern CS_ENTRY_DATE = new Pattern(CS_PATH + "/CS_ENTRY_DATE.png");
    static final Pattern CS_START_TIME = new Pattern(CS_PATH + "/CS_START_TIME.png");
    static final Pattern CS_DURATION = new Pattern(CS_PATH + "/CS_DURATION.png");
    static final Pattern CS_OXIGEN_DEFF = new Pattern(CS_PATH + "/CS_OXIGEN_DEFF.png");
    static final Pattern CS_FLAMEBLE_GAS = new Pattern(CS_PATH + "/CS_FLAMEBLE_GAS.png");
    static final Pattern CS_COMBUSTIBLE_DUST = new Pattern(CS_PATH + "/CS_COMBUSTIBLE_DUST.png");
    static final Pattern CS_TOXIC_GAS = new Pattern(CS_PATH + "/CS_TOXIC_GAS.png");
    static final Pattern CS_ROTATING_EQ = new Pattern(CS_PATH + "/CS_ROTATING_EQ.png");
    static final Pattern CS_ELECTRICAL_SHOCK = new Pattern(CS_PATH + "/CS_ELECTRICAL_SHOCK.png");
    static final Pattern CS_ENTRAPMENT = new Pattern(CS_PATH + "/CS_ENTRAPMENT.png");
    static final Pattern CS_ENGULFMENT = new Pattern(CS_PATH + "/CS_ENGULFMENT.png");
    static final Pattern CS_HEAT_STRESS = new Pattern(CS_PATH + "/CS_HEAT_STRESS.png");
    static final Pattern CS_LOTO = new Pattern(CS_PATH + "/CS_LOTO.png");
    static final Pattern CS_HOT_WORK = new Pattern(CS_PATH + "/CS_HOT_WORK.png");
    static final Pattern CS_VENTILATION = new Pattern(CS_PATH + "/CS_VENTILATION.png");
    static final Pattern CS_BLANK_FLANGED = new Pattern(CS_PATH + "/CS_BLANK_FLANGED.png");
    static final Pattern CS_W_BLOCK = new Pattern(CS_PATH + "/CS_W_BLOCK.png");


    static final Pattern CS_FACE_SHIELD = new Pattern(CS_PATH + "/CS_FACE_SHIELD.png");
    static final Pattern CS_GFCI = new Pattern(CS_PATH + "/CS_GFCI.png");
    static final Pattern CS_LOW_VOLTAGE_TOOLS = new Pattern(CS_PATH + "/CS_LOW_VOLTAGE_TOOLS.png");
    static final Pattern CS_EXPLOSIONPROOF_TOOLS = new Pattern(CS_PATH + "/CS_EXPLOSIONPROOF_TOOLS.png");
    static final Pattern CS_NONSPARKING_TOOLS = new Pattern(CS_PATH + "/CS_NONSPARKING_TOOLS.png");
    static final Pattern CS_FALL_PROTECTION = new Pattern(CS_PATH + "/CS_FALL_PROTECTION.png");
    static final Pattern CS_RETRIVAL_SYSTEM = new Pattern(CS_PATH + "/CS_RETRIVAL_SYSTEM.png");
    static final Pattern CS_LIFE_LINE = new Pattern(CS_PATH + "/CS_LIFE_LINE.png");
    static final Pattern CS_ATM_METER = new Pattern(CS_PATH + "/CS_ATM_METER.png");
    static final Pattern CS_TRIPOD = new Pattern(CS_PATH + "/CS_TRIPOD.png");
    static final Pattern CS_METER_DATA = new Pattern(CS_PATH + "/CS_METER_DATA.png");




    static final String HW_PATH = Paths.get(BASE_PATH+"hot-work").toString();
    static final Pattern HW_TAB = new Pattern(HW_PATH + "/HW_TAB.png");
    static final Pattern HW_LOCATION = new Pattern(HW_PATH + "/HW_LOCATION.png");
    static final Pattern HW_METER_MODEL = new Pattern(HW_PATH + "/HW_METER_MODEL.png");
    static final Pattern HW_FIRE_WATCH_REQUIRED = new Pattern(HW_PATH + "/HW_FIRE_WATCH_REQUIRED.png");
    static final Pattern HW_MEASURES_TAKEN_CKECKBOXES = new Pattern(HW_PATH + "/HW_MEASURES_TAKEN_CKECKBOXES.png");
    static final Pattern HW_SPECIAL_INSTRUCTIONS = new Pattern(HW_PATH + "/HW_SPECIAL_INSTRUCTIONS.png");
}
