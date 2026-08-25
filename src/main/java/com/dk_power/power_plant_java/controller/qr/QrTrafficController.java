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
 * as the Maximo controllers).
 *
 * <p>Both links now hand off to the PWA, which owns the sign-in the crew actually uses; the gate is on
 * the PWA's own endpoints ({@code /api/pwa/secured/**}), not on this hop. Keeping the hop itself open is
 * deliberate — a phone camera follows the URL before any app is involved, so anything stricter here just
 * produces a browser error instead of a login screen.</p>
 */
@Controller
@RestrictedAllowed
public class QrTrafficController {

    @Value("${pwa.public.url:https://jacksongeneration.github.io/permits}")
    private String pwaPublicUrl;

    /**
     * LOTO / equipment tag deep link — the URL every printed and engraved label encodes
     * ({@code https://<hub>/qr/{tag}}, see {@code EngraverService.QR_BASE_URL}).
     *
     * <p>Forwards to the PWA rather than the hub-hosted desktop SPA. The old target
     * ({@code /app/qr/equipment/{tag}}) put a hub sign-in in front of every scan — an authority nobody
     * uses for anything else — while the crew is already signed into the PWA for permits, LOTO and
     * everything else. The PWA route resolves the same tag through {@code PwaQrController} and, when the
     * phone has no session, bounces through its own login with a {@code returnUrl} so the scan resumes
     * on the drawing.</p>
     *
     * <p>The desktop viewer is intentionally left in place and still reachable at
     * {@code /app/qr/equipment/{tag}}; it renders more than the phone does (equipment detail panels,
     * click-through shapes), it is just no longer where a scanned label lands.</p>
     *
     * <p>Encoding: {@link URLEncoder} is form encoding, where a space becomes {@code +} — which stays a
     * literal {@code +} in a path segment. Tag numbers do contain spaces, so those are re-escaped to
     * {@code %20} to survive the hop.</p>
     */
    @GetMapping("/qr/{tagNumber}")
    public String redirectToTagView(@PathVariable String tagNumber) {
        String safeTag = URLEncoder.encode(tagNumber, StandardCharsets.UTF_8).replace("+", "%20");
        return "redirect:" + pwaPublicUrl + "/qr/" + safeTag;
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
