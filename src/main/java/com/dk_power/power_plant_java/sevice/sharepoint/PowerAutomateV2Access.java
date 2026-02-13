package com.dk_power.power_plant_java.sevice.sharepoint;

import com.dk_power.power_plant_java.clients.PowerAutomateV2Client;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Thin wrapper around PowerAutomateV2Client for availability checks.
 * Entity-specific operations have been moved to adapters
 * (WorkRequestSharePointAdapter, JhaSharePointAdapter).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PowerAutomateV2Access implements SharePointAccess {

    private final PowerAutomateV2Client v2Client;

    @Override
    public boolean isAvailable() {
        return v2Client.isWorkRequestConfigured();
    }

    @Override
    public String getName() {
        return "Power Automate V2 (List-based)";
    }
}
