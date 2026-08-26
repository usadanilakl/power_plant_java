package com.dk_power.power_plant_java.controller.qr;

import com.dk_power.power_plant_java.config.security.RestrictedAllowed;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;

import java.nio.charset.StandardCharsets;
import java.net.URLEncoder;

/**
 * Public QR short-link entry points. These are hit by a phone's browser BEFORE the Angular app
 * loads, so they must be reachable by restricted (logged-in, no full-access grant) external users
 * — otherwise {@link com.dk_power.power_plant_java.config.security.AccessGrantFilter} bounces the
 * page navigation to /app/access-request. {@code @RestrictedAllowed} whitelists them (same pattern
 * as the Maximo controllers).
 *
 * <p>Both links hand off to the PWA, which owns the sign-in the crew actually uses; the gate is on
 * the PWA's own endpoints ({@code /api/pwa/secured/**}), not on this hop. Keeping the hop itself open is
 * deliberate — a phone camera follows the URL before any app is involved, so anything stricter here just
 * produces a browser error instead of a login screen.</p>
 *
 * <p><b>Why these hand off with an HTML page instead of a 302.</b> The hub sits behind IIS/ARR, whose
 * "Reverse rewrite host in response headers" setting (on by default) rewrites the host of any absolute
 * {@code Location} header to the host the client asked for. A 302 to
 * {@code https://jacksongeneration.github.io/permits/...} therefore reached phones as
 * {@code https://jgportal.jpowerusa.com/permits/...} — a path this app does not serve, so Spring answered
 * 401 and IIS decorated it with a Negotiate/NTLM challenge, popping a Windows credential box on a
 * scanned label. (Same decoration described in {@code FieldSyncController}.) Confirmed against
 * production on both QR routes, including the inventory link, which predates the LOTO one.</p>
 *
 * <p>A client-side redirect carries the target in the response BODY, which ARR's header rewriting cannot
 * touch, so the hand-off works whatever the proxy is configured to do. The trade is one extra render;
 * {@code location.replace} keeps it out of session history, so Back still leaves the app rather than
 * bouncing through this page. Turning the ARR setting off is the cleaner fix and would let this go back
 * to a plain 302 — but it is a server-wide IIS change, and a printed label should not depend on it.</p>
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
     * <p>Hands off to the PWA rather than the hub-hosted desktop SPA. The old target
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
    @ResponseBody
    public ResponseEntity<String> redirectToTagView(@PathVariable String tagNumber) {
        String safeTag = URLEncoder.encode(tagNumber, StandardCharsets.UTF_8).replace("+", "%20");
        return handOff(pwaPublicUrl + "/qr/" + safeTag, "tag " + tagNumber);
    }

    /**
     * Inventory QR deep link. QR codes on inventory items encode
     * https://<hub>/qr/inv/{token}. Scanning with a phone's native camera lands
     * here; we forward to the PWA inventory scan flow so the field worker can
     * check the item out / in.
     */
    @GetMapping("/qr/inv/{token}")
    @ResponseBody
    public ResponseEntity<String> redirectToInventoryScan(@PathVariable String token) {
        String safeToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return handOff(pwaPublicUrl + "/inventory/form?scan=" + safeToken, "inventory item");
    }

    /**
     * The hand-off page: meta refresh + {@code location.replace} + a plain link, in that order of
     * preference, so it works with scripting on, scripting off, and in the odd in-app browser that
     * honours neither. Never cached — the target embeds a scanned identifier.
     *
     * <p>{@code target} is safe to interpolate: it is a configured base plus a percent-encoded segment,
     * and {@link URLEncoder} leaves nothing HTML- or JS-significant unescaped. {@code label} is caller
     * text shown to the user, so it goes through {@link #escapeHtml}.</p>
     */
    private ResponseEntity<String> handOff(String target, String label) {
        String html = """
                <!doctype html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <meta name="robots" content="noindex">
                  <meta http-equiv="refresh" content="0; url=%s">
                  <title>Opening…</title>
                  <style>
                    body { font-family: system-ui, -apple-system, sans-serif; background: #1e1e1e; color: #eee;
                           display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                    .box { text-align: center; padding: 1.5rem; }
                    a { color: #4da3ff; font-weight: 700; }
                  </style>
                </head>
                <body>
                  <div class="box">
                    <p>Opening %s…</p>
                    <p><a href="%s">Continue</a></p>
                  </div>
                  <script>location.replace(%s);</script>
                </body>
                </html>
                """.formatted(target, escapeHtml(label), target, toJsString(target));

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(html);
    }

    private String escapeHtml(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                .replace("\"", "&quot;").replace("'", "&#39;");
    }

    /** Quote a URL for a JS string literal. Belt-and-braces: the target is already percent-encoded. */
    private String toJsString(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("<", "\\u003c").replace(">", "\\u003e") + "\"";
    }
}
