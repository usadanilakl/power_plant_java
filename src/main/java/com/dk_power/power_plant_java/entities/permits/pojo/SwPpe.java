package com.dk_power.power_plant_java.entities.permits.pojo;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

/**
 * "Protective Equipment Required" section of the Safe Work Permit (SW SMP-17).
 *
 * <p>The current Red Tag SW form merges several legacy items:
 * {@code respirator} + {@code dustMask} -> {@link #respiratorDustMask};
 * {@code weldingJacket}/{@code weldingShield}/{@code weldingGloves} -> {@link #weldingPpe}.
 * {@code iceCleats} was removed. Several entries gained free-text companions.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SwPpe {

    // Default true to match the Angular DTO. They disagreed, so a Java-created permit and a
    // UI-created one rendered different tick states for the same blank form.
    private boolean hardhat = true;
    private boolean safetyGlasses = true;
    private boolean hearingProtection = true;
    private boolean boots = true;                  // Protective Footwear
    private boolean weldingPpe;             // Welding PPE (was jacket + shield + gloves)

    private boolean respiratorDustMask;     // Respirator/Dust Mask (was respirator + dustMask)
    private String respiratorType;          // "Type" text beside Respirator/Dust Mask
    private boolean gloves = true;                 // Protective Gloves
    private String glovesType;              // "Type" text beside Protective Gloves
    private boolean gasMonitor;             // Air Monitor
    private boolean tyvekSuit;              // Tyvek Suit                          (new)

    private boolean acidSuit;               // Acid Suit/Rainsuit
    private boolean barricade;              // Barricade/Rope Off
    private boolean faceShield;             // Face Shield/Goggles
    private boolean arcFlashPpe;            // Arc Flash/Shock PPE
    private String classCalRating;          // "Class/Cal Rating" text beside Arc Flash/Shock PPE
    private boolean gfi;                    // GFCI

    private boolean purgingVentilation;     // Purging/Ventilation
    private boolean fallProtection;         // Fall Protection (Restraint/Lanyard/SRL)
    private String fallClearance;           // "Fall Clearance" text beside Fall Protection

    private boolean other;
    private String otherDescription;
}
