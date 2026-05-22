package com.dk_power.power_plant_java.controller.qr;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;

@Controller
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
