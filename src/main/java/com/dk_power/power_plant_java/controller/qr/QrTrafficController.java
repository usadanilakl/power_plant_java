package com.dk_power.power_plant_java.controller.qr;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;

/**
 * Public QR short-link entry points. These are hit by a phone's browser BEFORE the Angular app
 * loads, so they must be reachable by restricted (logged-in, no full-access grant) external users
 * — otherwise {@link com.dk_power.power_plant_java.config.security.AccessGrantFilter} bounces the
 * page navigation to /app/access-request. {@code @RestrictedAllowed} whitelists them (same pattern
 * as the Maximo controllers). The redirect targets are themselves gated: /app/** loads the SPA, and
 * the equipment data endpoint (/ng/qr/**) is also @RestrictedAllowed.
 */
@Controller
@RestrictedAllowed
public class QrTrafficController {

    @Value("${pwa.public.url:https://jacksongeneration.github.io/permits}")
    private String pwaPublicUrl;

    @GetMapping("/qr/{tagNumber}")
    public String redirectToAngularQr(@PathVariable String tagNumber) {
        return "redirect:/app/qr/equipment/" + tagNumber;
    }

    /**
     * Inventory QR deep link. QR codes on inventory items encode
     * https://<hub>/qr/inv/{token}. Scanning with a phone's native camera lands
     * here; we forward to the PWA inventory scan flow so the field worker can
     * check the item out / in.
     */
    @GetMapping("/qr/inv/{token}")
    public String redirectToInventoryScan(@PathVariable String token) {
        String safeToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return "redirect:" + pwaPublicUrl + "/inventory/form?scan=" + safeToken;
    }
}
